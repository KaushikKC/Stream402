"use client";

import React, { useState, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import {
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import Link from "next/link";

interface AgentWallet {
  id: string;
  agentAddress: string;
  userId: string;
  createdAt: number;
  balance: number;
  totalSpent: number;
  totalPurchases: number;
}

export default function AgentManagePage() {
  const [agents, setAgents] = useState<AgentWallet[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [funding, setFunding] = useState<string | null>(null);
  const [fundAmount, setFundAmount] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { publicKey, connected, connect, sendTransaction } = useWallet();
  const { connection } = useConnection();

  // Load agents when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      loadAgents();
    }
  }, [connected, publicKey]);

  const loadAgents = async () => {
    if (!publicKey) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/agent/list?userId=${publicKey.toBase58()}`);
      const data = await res.json();
      if (data.success) {
        setAgents(data.agents || []);
      }
    } catch (error) {
      console.error("Error loading agents:", error);
      setError("Failed to load agents");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAgent = async () => {
    if (!connected || !publicKey) {
      setError("Please connect your wallet first");
      return;
    }

    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setCreating(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/agent/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: publicKey.toBase58(),
          password,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess("Agent created successfully!");
        setPassword("");
        setConfirmPassword("");
        setShowCreateForm(false);
        await loadAgents();
      } else {
        setError(data.message || "Failed to create agent");
      }
    } catch (error) {
      console.error("Error creating agent:", error);
      setError("Failed to create agent");
    } finally {
      setCreating(false);
    }
  };

  const handleFundAgent = async (agentId: string, agentAddress: string) => {
    if (!connected || !publicKey || !sendTransaction) {
      setError("Please connect your wallet first");
      return;
    }

    const amount = parseFloat(fundAmount);
    if (!amount || amount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setFunding(agentId);
    setError(null);
    setSuccess(null);

    try {
      const mint = new PublicKey(
        process.env.NEXT_PUBLIC_USDC_MINT ||
          "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
      );
      const amountRequired = BigInt(Math.floor(amount * 1e6));

      // Get token accounts
      const ownerAta = await getAssociatedTokenAddress(mint, publicKey, false);
      const agentAta = await getAssociatedTokenAddress(
        mint,
        new PublicKey(agentAddress),
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
        setError(`Insufficient balance. You need ${amount} USDC.`);
        setFunding(null);
        return;
      }

      // Build transaction
      const instructions = [];

      if (!ownerAccount) {
        instructions.push(
          createAssociatedTokenAccountInstruction(publicKey, ownerAta, publicKey, mint)
        );
      }

      try {
        await getAccount(connection, agentAta);
      } catch {
        instructions.push(
          createAssociatedTokenAccountInstruction(
            publicKey,
            agentAta,
            new PublicKey(agentAddress),
            mint
          )
        );
      }

      instructions.push(
        createTransferInstruction(ownerAta, agentAta, publicKey, amountRequired)
      );

      const { blockhash } = await connection.getLatestBlockhash();
      const messageV0 = new TransactionMessage({
        payerKey: publicKey,
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

      // Notify backend about funding
      const fundRes = await fetch("/api/agent/fund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          fromWallet: publicKey.toBase58(),
          signature,
        }),
      });

      if (fundRes.ok) {
        setSuccess(`Successfully funded agent with ${amount} USDC`);
        setFundAmount("");
        await loadAgents();
      } else {
        setError("Funding transaction succeeded but failed to update agent balance");
      }
    } catch (error) {
      console.error("Error funding agent:", error);
      setError(
        `Failed to fund agent: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setFunding(null);
    }
  };

  return (
    <div className="min-h-screen relative py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold gradient-text mb-4">
            Manage Your Agents
          </h1>
          <p className="text-xl text-gray-300 font-light">
            Create and fund autonomous agent wallets that can make payments automatically
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-[#1dd79b]/10 border border-[#1dd79b]/30 rounded-lg p-4 mb-6">
            <p className="text-[#1dd79b]">{success}</p>
          </div>
        )}

        {/* Wallet Connection */}
        {!connected && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6 mb-8 text-center">
            <p className="text-yellow-400 mb-4">
              Connect your wallet to create and manage agents
            </p>
            <button
              onClick={connect}
              className="px-6 py-3 bg-gradient-to-r from-[#1dd79b] to-[#14966c] text-black font-semibold rounded-lg hover:from-[#14966c] hover:to-[#0d6b4f] transition-all duration-200 shadow-lg hover:shadow-[0_0_20px_rgba(29,215,155,0.5)]"
            >
              Connect Wallet
            </button>
          </div>
        )}

        {/* Create Agent Form */}
        {connected && (
          <div className="bg-black/80 backdrop-blur-md rounded-2xl shadow-xl border border-[#1dd79b]/20 p-8 mb-8">
            {!showCreateForm ? (
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full px-6 py-4 bg-gradient-to-r from-[#1dd79b] to-[#14966c] text-black font-semibold rounded-lg hover:from-[#14966c] hover:to-[#0d6b4f] transition-all duration-200 shadow-lg hover:shadow-[0_0_20px_rgba(29,215,155,0.5)]"
              >
                + Create New Agent
              </button>
            ) : (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-[#1dd79b] mb-4">
                  Create New Agent
                </h2>
                <div>
                  <label className="block text-gray-300 mb-2">
                    Password (min 8 characters)
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-700 rounded-lg focus:outline-none focus:border-[#1dd79b] bg-black/70 text-gray-200 placeholder:text-gray-500"
                    placeholder="Enter password to encrypt agent wallet"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-700 rounded-lg focus:outline-none focus:border-[#1dd79b] bg-black/70 text-gray-200 placeholder:text-gray-500"
                    placeholder="Confirm password"
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={handleCreateAgent}
                    disabled={creating}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-[#1dd79b] to-[#14966c] text-black font-semibold rounded-lg hover:from-[#14966c] hover:to-[#0d6b4f] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-[0_0_20px_rgba(29,215,155,0.5)]"
                  >
                    {creating ? "Creating..." : "Create Agent"}
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      setPassword("");
                      setConfirmPassword("");
                      setError(null);
                    }}
                    className="px-6 py-3 bg-gray-700 text-gray-200 font-semibold rounded-lg hover:bg-gray-600 transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Agents List */}
        {connected && (
          <div className="bg-black/80 backdrop-blur-md rounded-2xl shadow-xl border border-[#1dd79b]/20 p-8">
            <h2 className="text-2xl font-bold text-[#1dd79b] mb-6">
              Your Agents ({agents.length})
            </h2>

            {loading ? (
              <p className="text-gray-400">Loading agents...</p>
            ) : agents.length === 0 ? (
              <p className="text-gray-400">
                No agents yet. Create your first agent above.
              </p>
            ) : (
              <div className="space-y-4">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    className="bg-black/70 border border-[#1dd79b]/20 rounded-lg p-6"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-[#1dd79b] mb-2">
                          Agent {agent.id.slice(0, 8)}...
                        </h3>
                        <p className="text-sm text-gray-400 font-mono">
                          {agent.agentAddress}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/agent?agentId=${agent.id}`}
                          className="px-4 py-2 bg-[#1dd79b]/20 text-[#1dd79b] rounded-lg hover:bg-[#1dd79b]/30 transition-all border border-[#1dd79b]/30"
                        >
                          Use Agent
                        </Link>
                        <button
                          onClick={() => {
                            // Clear saved password when deleting/clearing agent
                            localStorage.removeItem(`agent_password_${agent.id}`);
                          }}
                          className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all border border-red-500/30 text-xs"
                          title="Clear saved password"
                        >
                          Clear Password
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                      <div>
                        <span className="text-gray-400">Balance:</span>
                        <p className="text-[#1dd79b] font-semibold">
                          {(agent.balance / 1e6).toFixed(2)} USDC
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-400">Total Spent:</span>
                        <p className="text-gray-300 font-semibold">
                          {(agent.totalSpent / 1e6).toFixed(2)} USDC
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-400">Purchases:</span>
                        <p className="text-gray-300 font-semibold">
                          {agent.totalPurchases}
                        </p>
                      </div>
                    </div>

                    {/* Fund Agent */}
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={fundAmount}
                        onChange={(e) => setFundAmount(e.target.value)}
                        placeholder="Amount (USDC)"
                        className="flex-1 px-4 py-2 border-2 border-gray-700 rounded-lg focus:outline-none focus:border-[#1dd79b] bg-black/70 text-gray-200 placeholder:text-gray-500"
                      />
                      <button
                        onClick={() => handleFundAgent(agent.id, agent.agentAddress)}
                        disabled={funding === agent.id || !fundAmount}
                        className="px-6 py-2 bg-gradient-to-r from-[#1dd79b] to-[#14966c] text-black font-semibold rounded-lg hover:from-[#14966c] hover:to-[#0d6b4f] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-[0_0_20px_rgba(29,215,155,0.5)]"
                      >
                        {funding === agent.id ? "Funding..." : "Fund Agent"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Back to Agent Page */}
        <div className="mt-8 text-center">
          <Link
            href="/agent"
            className="inline-block px-6 py-3 bg-gray-700 text-gray-200 font-semibold rounded-lg hover:bg-gray-600 transition-all duration-200"
          >
            ← Back to Agent Network
          </Link>
        </div>
      </div>
    </div>
  );
}

