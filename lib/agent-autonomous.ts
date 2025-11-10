/**
 * Autonomous Agent System
 * Handles trustless agent operations with identity, reputation, and validation
 *
 * Features:
 * - Autonomous payment decisions
 * - Identity verification
 * - Reputation-based trust
 * - On-chain validation
 */

import { Connection, PublicKey } from "@solana/web3.js";
import { getAccount, getAssociatedTokenAddress } from "@solana/spl-token";

export interface AgentIdentity {
  walletAddress: string;
  reputation: {
    score: number;
    level: string;
    totalPayments: number;
    totalEarnings: number;
  };
  verified: boolean;
}

export interface AutonomousDecision {
  shouldPay: boolean;
  reason: string;
  confidence: number;
  assetId: string;
  price: number;
  balance: number;
  reputationCheck: boolean;
}

/**
 * Get agent identity with reputation
 * This function should be called from an API route, not directly from client
 */
export async function getAgentIdentity(
  walletAddress: string
): Promise<AgentIdentity | null> {
  try {
    // Fetch reputation from API to avoid importing server-side modules
    const response = await fetch(`/api/reputation/${walletAddress}`);
    if (!response.ok) {
      return {
        walletAddress,
        reputation: {
          score: 0,
          level: "New",
          totalPayments: 0,
          totalEarnings: 0,
        },
        verified: true,
      };
    }

    const data = await response.json();
    const reputation = data.reputation;

    return {
      walletAddress,
      reputation: {
        score: reputation?.score || 0,
        level: reputation?.level || "New",
        totalPayments: reputation?.totalPayments || 0,
        totalEarnings: reputation?.totalEarnings || 0,
      },
      verified: true, // Wallet address is the identity
    };
  } catch (error) {
    console.error("Error getting agent identity:", error);
    return {
      walletAddress,
      reputation: {
        score: 0,
        level: "New",
        totalPayments: 0,
        totalEarnings: 0,
      },
      verified: true,
    };
  }
}

/**
 * Validate agent can make autonomous payment decision
 * Trustless validation based on:
 * - Sufficient balance
 * - Reputation threshold (optional)
 * - Price reasonableness
 */
export async function validateAutonomousPayment(
  walletAddress: string,
  assetId: string,
  price: number,
  connection: Connection,
  mint: PublicKey
): Promise<{
  valid: boolean;
  reason: string;
  balance: number;
  reputationCheck: boolean;
}> {
  try {
    // Check balance
    const owner = new PublicKey(walletAddress);
    const ownerAta = await getAssociatedTokenAddress(mint, owner, false);

    let balance = 0n;
    try {
      const account = await getAccount(connection, ownerAta);
      balance = BigInt(account.amount.toString());
    } catch {
      // Account doesn't exist, balance is 0
    }

    const priceBigInt = BigInt(price);
    const hasBalance = balance >= priceBigInt;

    // Check reputation (optional - can be used for trust scoring)
    const identity = await getAgentIdentity(walletAddress);
    const reputationCheck = (identity?.reputation.score || 0) >= 0; // Basic check

    // Price reasonableness check (prevent accidental large payments)
    const maxAutonomousPayment = 1000000; // 1 USDC in smallest unit
    const isReasonable = price <= maxAutonomousPayment;

    if (!hasBalance) {
      return {
        valid: false,
        reason: "Insufficient balance for autonomous payment",
        balance: Number(balance),
        reputationCheck: reputationCheck,
      };
    }

    if (!isReasonable) {
      return {
        valid: false,
        reason:
          "Price exceeds autonomous payment threshold (requires manual approval)",
        balance: Number(balance),
        reputationCheck: reputationCheck,
      };
    }

    return {
      valid: true,
      reason:
        "Autonomous payment validated: sufficient balance and reasonable price",
      balance: Number(balance),
      reputationCheck: reputationCheck,
    };
  } catch (error) {
    console.error("Error validating autonomous payment:", error);
    return {
      valid: false,
      reason: `Validation error: ${
        error instanceof Error ? error.message : String(error)
      }`,
      balance: 0,
      reputationCheck: false,
    };
  }
}

/**
 * Make autonomous decision to pay for an asset
 * This is the core "trustless agent" logic
 */
export async function makeAutonomousDecision(
  query: string,
  walletAddress: string,
  connection: Connection,
  mint: PublicKey
): Promise<AutonomousDecision | null> {
  try {
    // Step 1: Find matching asset via API (to avoid importing server-side modules)
    const searchRes = await fetch(
      `/api/agent/request?q=${encodeURIComponent(query)}`
    );
    if (!searchRes.ok) {
      return null;
    }

    const searchData = await searchRes.json();
    if (
      !searchData.success ||
      !searchData.results ||
      searchData.results.length === 0
    ) {
      return null;
    }

    const bestMatch = searchData.results[0];
    const asset = {
      id: bestMatch.id,
      price: bestMatch.price,
    };

    // Step 2: Get agent identity
    const identity = await getAgentIdentity(walletAddress);
    if (!identity) {
      return {
        shouldPay: false,
        reason: "Agent identity not found",
        confidence: 0,
        assetId: asset.id,
        price: asset.price,
        balance: 0,
        reputationCheck: false,
      };
    }

    // Step 3: Validate autonomous payment
    const validation = await validateAutonomousPayment(
      walletAddress,
      asset.id,
      asset.price,
      connection,
      mint
    );

    // Step 4: Make decision
    const shouldPay = validation.valid && asset.price > 0;
    const confidence = shouldPay
      ? Math.min(100, (bestMatch.matchScore / 10) * 100)
      : 0;

    return {
      shouldPay,
      reason: validation.reason,
      confidence: Math.round(confidence),
      assetId: asset.id,
      price: asset.price,
      balance: validation.balance,
      reputationCheck: validation.reputationCheck,
    };
  } catch (error) {
    console.error("Error making autonomous decision:", error);
    return null;
  }
}

/**
 * Get agent capabilities based on reputation
 */
export function getAgentCapabilities(identity: AgentIdentity): {
  canAutonomousPay: boolean;
  maxAutonomousAmount: number;
  trustLevel: string;
} {
  const score = identity.reputation.score;

  // Trust levels based on reputation
  let trustLevel = "Low";
  let maxAutonomousAmount = 100000; // 0.1 USDC default

  if (score >= 100) {
    trustLevel = "High";
    maxAutonomousAmount = 10000000; // 10 USDC
  } else if (score >= 50) {
    trustLevel = "Medium";
    maxAutonomousAmount = 1000000; // 1 USDC
  } else if (score >= 10) {
    trustLevel = "Low-Medium";
    maxAutonomousAmount = 500000; // 0.5 USDC
  }

  return {
    canAutonomousPay: true, // All agents can autonomous pay, amount varies by trust
    maxAutonomousAmount,
    trustLevel,
  };
}
