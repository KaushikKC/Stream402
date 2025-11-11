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

          // If decision is positive, proceed with automatic payment flow
          if (decision.shouldPay) {
            console.log(
              "🤖 Autonomous decision: PAYING automatically",
              decision
            );

            // Fetch the payment challenge
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
            if (data.paymentChallenge && data.requiresPayment && data.assetId) {
              // Update response with payment challenge for display
              setResponse({
                ...data,
                message: `Autonomous payment approved. Processing payment for ${data.assetId}...`,
              });

              // Automatically proceed with payment
              await handlePayAndDownload(data);
            } else if (!data.requiresPayment && data.downloadUrl) {
              // Free asset - already available
              setDownloadedAsset(data.downloadUrl);
            }
            setLoading(false);
            return;
          } else {
            // Decision rejected - show why
            setResponse({
              success: false,
              message: `Autonomous payment rejected: ${decision.reason}`,
            });
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

  const handlePayAndDownload = async (responseData?: AgentResponse) => {
    const dataToUse = responseData || response;
    if (!dataToUse?.paymentChallenge || !publicKey || !sendTransaction) {
      console.error("Cannot pay: missing payment challenge or wallet");
      return;
    }

    setPaying(true);

    try {
      const challenge = dataToUse.paymentChallenge;
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
      const assetId = dataToUse.assetId || challenge.assetId;

      // Get asset details to check for IPFS URL
      // If IPFS URL exists, use it directly (no token needed, IPFS is public)
      // Otherwise, use the full endpoint with token
      let downloadUrl: string;
      try {
        // Get asset list to find IPFS URL
        const assetListRes = await fetch(`/api/images/list`);
        if (assetListRes.ok) {
          const { images } = await assetListRes.json();
          const assetDetails = images.find((img: any) => img.id === assetId);

          // If asset has IPFS URL, use it directly (public, no token needed)
          if (assetDetails?.ipfsUrl) {
            downloadUrl = assetDetails.ipfsUrl;
            console.log("Using IPFS URL directly:", downloadUrl);
          } else {
            // Use full endpoint which will serve the image
            downloadUrl = `/api/full/${assetId}?access=${accessToken}`;
            console.log("Using full endpoint:", downloadUrl);
          }
        } else {
          // Fallback to full endpoint
          downloadUrl = `/api/full/${assetId}?access=${accessToken}`;
        }
      } catch (error) {
        console.error("Error getting asset details:", error);
        // Fallback to full endpoint
        downloadUrl = `/api/full/${assetId}?access=${accessToken}`;
      }

      setDownloadedAsset(downloadUrl);
      setResponse({
        ...dataToUse,
        success: true,
        message: "Payment successful! Asset downloaded automatically.",
        downloadUrl,
        requiresPayment: false,
      });

      // Auto-open download in new tab if autonomous mode
      if (autonomousMode) {
        window.open(downloadUrl, "_blank");
      }
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
    <div className="min-h-screen relative py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold gradient-text mb-4">
            Agent Network
          </h1>
          <p className="text-xl text-gray-300 font-light">
            Ask for any image in natural language. The agent will find it and
            handle payment automatically.
          </p>
        </div>

        {/* Search Interface */}
        <div className="bg-black/80 backdrop-blur-md rounded-2xl shadow-xl border border-[#1dd79b]/20 p-8 mb-8">
          <div className="flex gap-4 mb-6">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              placeholder='Try: "I want a Solana logo" or "Show me a Bitcoin image"'
              className="flex-1 px-6 py-4 text-lg border-2 border-gray-700 rounded-xl focus:outline-none focus:border-[#1dd79b] bg-black/70 text-gray-200 placeholder:text-gray-500"
              disabled={loading}
            />
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="px-8 py-4 bg-gradient-to-r from-[#1dd79b] to-[#14966c] text-black font-semibold rounded-xl hover:from-[#14966c] hover:to-[#0d6b4f] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-[0_0_20px_rgba(29,215,155,0.5)]"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>

          {/* Autonomous Mode Toggle */}
          {connected && (
            <div className="mb-4 flex items-center justify-between bg-[#1dd79b]/10 border border-[#1dd79b]/30 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autonomousMode}
                    onChange={(e) => setAutonomousMode(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#1dd79b]/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-black after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-black after:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-[#1dd79b] peer-checked:to-[#14966c]"></div>
                  <span className="ml-3 text-sm font-medium text-gray-200">
                    Autonomous Mode
                  </span>
                </label>
                {autonomousMode && agentIdentity && (
                  <span className="text-xs px-2 py-1 bg-[#1dd79b]/20 text-[#1dd79b] rounded-full border border-[#1dd79b]/30">
                    {agentIdentity.reputation.level} • Score:{" "}
                    {agentIdentity.reputation.score}
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-400">
                {autonomousMode
                  ? "Agent will auto-pay and download"
                  : "Manual payment required"}
              </div>
            </div>
          )}

          {!connected && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
              <p className="text-yellow-400">
                Connect your wallet to enable automatic payments
              </p>
            </div>
          )}

          {connected && (
            <div className="bg-[#1dd79b]/10 border border-[#1dd79b]/30 rounded-lg p-4">
              <p className="text-[#1dd79b]">
                Wallet connected: {publicKey?.toBase58().slice(0, 8)}...
                {publicKey?.toBase58().slice(-8)}
              </p>
            </div>
          )}
        </div>

        {/* Autonomous Decision Display */}
        {autonomousDecision && (
          <div className="bg-black/80 backdrop-blur-md rounded-2xl shadow-xl border border-[#1dd79b]/20 p-8 mb-6">
            <h3 className="text-lg font-semibold text-[#1dd79b] mb-4">
              Autonomous Decision
            </h3>
            <div
              className={`p-4 rounded-lg ${
                autonomousDecision.shouldPay
                  ? "bg-[#1dd79b]/10 border border-[#1dd79b]/30"
                  : "bg-yellow-500/10 border border-yellow-500/30"
              }`}
            >
              <div className="space-y-2">
                <p
                  className={`font-semibold ${
                    autonomousDecision.shouldPay
                      ? "text-[#1dd79b]"
                      : "text-yellow-400"
                  }`}
                >
                  {autonomousDecision.shouldPay ? "Approved" : "Rejected"}
                </p>
                <p className="text-sm text-gray-300">
                  {autonomousDecision.reason}
                </p>
                <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                  <div>
                    <span className="text-gray-400">Confidence:</span>{" "}
                    <span className="font-semibold text-[#1dd79b]">
                      {autonomousDecision.confidence}%
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Price:</span>{" "}
                    <span className="font-semibold text-[#1dd79b]">
                      {Number(autonomousDecision.price) / 1e6} USDC
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Balance:</span>{" "}
                    <span className="font-semibold text-[#1dd79b]">
                      {Number(autonomousDecision.balance) / 1e6} USDC
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Reputation:</span>{" "}
                    <span className="font-semibold text-[#1dd79b]">
                      {autonomousDecision.reputationCheck ? "Valid" : "Invalid"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Response Display */}
        {response && (
          <div className="bg-black/80 backdrop-blur-md rounded-2xl shadow-xl border border-[#1dd79b]/20 p-8">
            <div
              className={`mb-6 p-4 rounded-lg ${
                response.success
                  ? "bg-[#1dd79b]/10 border border-[#1dd79b]/30"
                  : "bg-red-500/10 border border-red-500/30"
              }`}
            >
              <p
                className={`font-semibold ${
                  response.success ? "text-[#1dd79b]" : "text-red-400"
                }`}
              >
                {response.message}
              </p>
            </div>

            {response.requiresPayment && response.paymentChallenge && (
              <div className="space-y-4">
                <div className="bg-[#1dd79b]/10 border border-[#1dd79b]/30 rounded-lg p-6">
                  <h3 className="font-semibold text-[#1dd79b] mb-2">
                    Payment Required
                  </h3>
                  <p className="text-[#4de6b4] mb-4">
                    Price: {Number(response.paymentChallenge.amount) / 1e6} USDC
                  </p>
                  {connected ? (
                    <button
                      onClick={() => handlePayAndDownload()}
                      disabled={paying}
                      className="px-6 py-3 bg-gradient-to-r from-[#1dd79b] to-[#14966c] text-black font-semibold rounded-lg hover:from-[#14966c] hover:to-[#0d6b4f] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-[0_0_20px_rgba(29,215,155,0.5)]"
                    >
                      {paying ? "Processing Payment..." : "Pay & Download"}
                    </button>
                  ) : (
                    <button
                      onClick={connect}
                      className="px-6 py-3 bg-gradient-to-r from-[#1dd79b] to-[#14966c] text-black font-semibold rounded-lg hover:from-[#14966c] hover:to-[#0d6b4f] transition-all duration-200 shadow-lg hover:shadow-[0_0_20px_rgba(29,215,155,0.5)]"
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
                  className="inline-block px-6 py-3 bg-gradient-to-r from-[#1dd79b] to-[#14966c] text-black font-semibold rounded-lg hover:from-[#14966c] hover:to-[#0d6b4f] transition-all duration-200 shadow-lg hover:shadow-[0_0_20px_rgba(29,215,155,0.5)]"
                >
                  Download Asset
                </a>
              </div>
            )}

            {downloadedAsset && (
              <div className="mt-6">
                <div className="bg-[#1dd79b]/10 border border-[#1dd79b]/30 rounded-lg p-4 mb-4">
                  <p className="text-[#1dd79b] font-semibold mb-2">
                    Payment Successful
                  </p>
                  <a
                    href={downloadedAsset}
                    download
                    className="inline-block px-6 py-3 bg-gradient-to-r from-[#1dd79b] to-[#14966c] text-black font-semibold rounded-lg hover:from-[#14966c] hover:to-[#0d6b4f] transition-all duration-200 shadow-lg hover:shadow-[0_0_20px_rgba(29,215,155,0.5)]"
                  >
                    Download Asset
                  </a>
                </div>
              </div>
            )}

            {response.alternatives && response.alternatives.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-[#1dd79b] mb-3">
                  Other matches:
                </h3>
                <div className="space-y-2">
                  {response.alternatives.map((alt) => (
                    <div
                      key={alt.id}
                      className="bg-black/70 border border-[#1dd79b]/20 rounded-lg p-3"
                    >
                      <p className="text-gray-200 font-medium">{alt.title}</p>
                      <p className="text-sm text-gray-400">
                        Price: {alt.price} USDC | Match: {alt.matchScore}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {response.suggestions && (
              <div className="mt-6">
                <p className="text-gray-400 mb-2">Suggestions:</p>
                <ul className="list-disc list-inside text-gray-300">
                  {response.suggestions.map((suggestion, i) => (
                    <li key={i}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Example Queries */}
        <div className="mt-8 bg-black/80 backdrop-blur-md rounded-2xl shadow-xl border border-[#1dd79b]/20 p-8">
          <h2 className="text-2xl font-bold text-[#1dd79b] mb-4">
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
                className="text-left px-4 py-3 bg-black/70 hover:bg-[#1dd79b]/10 border border-[#1dd79b]/20 rounded-lg transition-colors duration-200 text-gray-300 hover:text-[#1dd79b]"
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
