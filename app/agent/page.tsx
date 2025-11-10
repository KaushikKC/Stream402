"use client";

import React, { useState, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Connection, PublicKey } from "@solana/web3.js";
import {
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import {
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import type { WalletAdapter } from "@solana/wallet-adapter-base";
import {
  makeAutonomousDecision,
  getAgentIdentity,
  getAgentCapabilities,
  type AgentIdentity,
} from "@/lib/agent-autonomous";

interface AgentResponse {
  success: boolean;
  message: string;
  assetId?: string;
  assetUrl?: string;
  downloadUrl?: string;
  price?: number;
  requiresPayment?: boolean;
  paymentChallenge?: any;
  alternatives?: Array<{
    id: string;
    title: string;
    price: number;
    matchScore: number;
  }>;
  suggestions?: string[];
}

export default function AgentPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AgentResponse | null>(null);
  const [paying, setPaying] = useState(false);
  const [downloadedAsset, setDownloadedAsset] = useState<string | null>(null);
  const [autonomousMode, setAutonomousMode] = useState(true);
  const [agentIdentity, setAgentIdentity] = useState<AgentIdentity | null>(
    null
  );
  const [autonomousDecision, setAutonomousDecision] = useState<any>(null);

  const { publicKey, connected, connect, sendTransaction } = useWallet();
  const { connection } = useConnection();

  // Load agent identity when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      loadAgentIdentity();
    }
  }, [connected, publicKey]);

  const loadAgentIdentity = async () => {
    if (!publicKey) return;
    const identity = await getAgentIdentity(publicKey.toBase58());
    setAgentIdentity(identity);
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setResponse(null);
    setDownloadedAsset(null);
    setAutonomousDecision(null);

    try {
      // If autonomous mode and wallet connected, make autonomous decision first
      if (autonomousMode && connected && publicKey) {
        const mint = new PublicKey(
          process.env.NEXT_PUBLIC_USDC_MINT ||
            "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU" // Devnet USDC
        );

        const decision = await makeAutonomousDecision(
          query.trim(),
          publicKey.toBase58(),
          connection,
          mint
        );

        if (decision) {
          setAutonomousDecision(decision);

          // If decision is positive, proceed with payment flow
          if (decision.shouldPay) {
            // Fetch the payment challenge and auto-pay
            const res = await fetch("/api/agent/request", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                query: query.trim(),
                walletAddress: publicKey.toBase58(),
              }),
            });

            const data: AgentResponse = await res.json();
            setResponse(data);

            // Auto-pay if payment challenge is available
            if (data.paymentChallenge && data.requiresPayment) {
              await handlePayAndDownload();
            }
            setLoading(false);
            return;
          }
        }
      }

      // Regular search flow (non-autonomous or decision rejected)
      const res = await fetch("/api/agent/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          walletAddress: publicKey?.toBase58(),
        }),
      });

      const data: AgentResponse = await res.json();
      setResponse(data);
    } catch (error) {
      setResponse({
        success: false,
        message: `Error: ${
          error instanceof Error ? error.message : String(error)
        }`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayAndDownload = async () => {
    if (!response?.paymentChallenge || !publicKey || !sendTransaction) {
      return;
    }

    setPaying(true);

    try {
      const challenge = response.paymentChallenge;
      const mint = new PublicKey(challenge.mint);
      const recipient = new PublicKey(challenge.recipient);
      const owner = publicKey;
      const amountRequired = BigInt(challenge.amount);

      // Get token accounts
      const ownerAta = await getAssociatedTokenAddress(mint, owner, false);
      const recipientAta = await getAssociatedTokenAddress(
        mint,
        recipient,
        false
      );

      // Check balance
      let ownerAccount;
      try {
        ownerAccount = await getAccount(connection, ownerAta);
      } catch {
        ownerAccount = undefined;
      }

      const ownerAmount = ownerAccount
        ? BigInt(ownerAccount.amount.toString())
        : 0n;

      if (ownerAmount < amountRequired) {
        setResponse({
          ...response,
          success: false,
          message: `Insufficient balance. You need ${
            Number(amountRequired) / 1e6
          } USDC.`,
        });
        setPaying(false);
        return;
      }

      // Build transaction
      const instructions: TransactionInstruction[] = [];

      if (!ownerAccount) {
        instructions.push(
          createAssociatedTokenAccountInstruction(owner, ownerAta, owner, mint)
        );
      }

      try {
        await getAccount(connection, recipientAta);
      } catch {
        instructions.push(
          createAssociatedTokenAccountInstruction(
            owner,
            recipientAta,
            recipient,
            mint
          )
        );
      }

      instructions.push(
        createTransferInstruction(ownerAta, recipientAta, owner, amountRequired)
      );

      const { blockhash } = await connection.getLatestBlockhash();
      const messageV0 = new TransactionMessage({
        payerKey: owner,
        recentBlockhash: blockhash,
        instructions,
      }).compileToV0Message();

      const tx = new VersionedTransaction(messageV0);
      const signature = await sendTransaction(tx, connection, {
        maxRetries: 5,
        skipPreflight: true,
      });

      // Wait for confirmation
      await connection.confirmTransaction(signature, "confirmed");

      // Verify payment and get download URL
      const receiptRes = await fetch("/api/receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signature,
          paymentRequestToken: challenge.paymentRequestToken,
          imageId: challenge.assetId,
          challenge: {
            expiresAt: challenge.expiresAt,
          },
        }),
      });

      if (!receiptRes.ok) {
        throw new Error("Payment verification failed");
      }

      const { accessToken } = await receiptRes.json();
      const downloadUrl = `/api/asset/${response.assetId}?token=${accessToken}`;

      setDownloadedAsset(downloadUrl);
      setResponse({
        ...response,
        success: true,
        message: "Payment successful! Asset downloaded.",
        downloadUrl,
      });
    } catch (error) {
      setResponse({
        ...response,
        success: false,
        message: `Payment failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      });
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
            🤖 Agent Network
          </h1>
          <p className="text-xl text-gray-600">
            Ask for any image in natural language. The agent will find it and
            handle payment automatically.
          </p>
        </div>

        {/* Search Interface */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex gap-4 mb-6">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              placeholder='Try: "I want a Solana logo" or "Show me a Bitcoin image"'
              className="flex-1 px-6 py-4 text-lg border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-gray-900 placeholder:text-gray-400"
              disabled={loading}
            />
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>

          {!connected && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-yellow-800">
                Connect your wallet to enable automatic payments
              </p>
            </div>
          )}

          {connected && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800">
                Wallet connected: {publicKey?.toBase58().slice(0, 8)}...
                {publicKey?.toBase58().slice(-8)}
              </p>
            </div>
          )}
        </div>

        {/* Response Display */}
        {response && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div
              className={`mb-6 p-4 rounded-lg ${
                response.success
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <p
                className={`font-semibold ${
                  response.success ? "text-green-800" : "text-red-800"
                }`}
              >
                {response.message}
              </p>
            </div>

            {response.requiresPayment && response.paymentChallenge && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Payment Required
                  </h3>
                  <p className="text-blue-800 mb-4">
                    Price: {Number(response.paymentChallenge.amount) / 1e6} USDC
                  </p>
                  {connected ? (
                    <button
                      onClick={handlePayAndDownload}
                      disabled={paying}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {paying ? "Processing Payment..." : "Pay & Download"}
                    </button>
                  ) : (
                    <button
                      onClick={connect}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
                    >
                      Connect Wallet to Pay
                    </button>
                  )}
                </div>
              </div>
            )}

            {response.downloadUrl && !response.requiresPayment && (
              <div className="mt-6">
                <a
                  href={response.downloadUrl}
                  download
                  className="inline-block px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200"
                >
                  Download Asset
                </a>
              </div>
            )}

            {downloadedAsset && (
              <div className="mt-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <p className="text-green-800 font-semibold mb-2">
                    ✅ Payment Successful!
                  </p>
                  <a
                    href={downloadedAsset}
                    download
                    className="inline-block px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200"
                  >
                    Download Asset
                  </a>
                </div>
              </div>
            )}

            {response.alternatives && response.alternatives.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Other matches:
                </h3>
                <div className="space-y-2">
                  {response.alternatives.map((alt) => (
                    <div
                      key={alt.id}
                      className="bg-gray-50 border border-gray-200 rounded-lg p-3"
                    >
                      <p className="text-gray-900 font-medium">{alt.title}</p>
                      <p className="text-sm text-gray-600">
                        Price: {alt.price} USDC | Match: {alt.matchScore}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {response.suggestions && (
              <div className="mt-6">
                <p className="text-gray-600 mb-2">Suggestions:</p>
                <ul className="list-disc list-inside text-gray-700">
                  {response.suggestions.map((suggestion, i) => (
                    <li key={i}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Example Queries */}
        <div className="mt-8 bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Example Queries
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              "I want a Solana logo",
              "Show me a Bitcoin image",
              "Find an Ethereum logo",
              "Get me a crypto logo",
            ].map((example, i) => (
              <button
                key={i}
                onClick={() => {
                  setQuery(example);
                  setTimeout(() => handleSearch(), 100);
                }}
                className="text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors duration-200 text-gray-700"
              >
                "{example}"
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
