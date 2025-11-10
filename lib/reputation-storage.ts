/**
 * Reputation Storage and NFT Minting
 * Manages reputation scores and mints NFTs
 */

import fs from "fs-extra";
import path from "path";
import { readPayments, getAllAssets, PaymentRecord } from "./storage";
import {
  calculateReputationScore,
  getReputationLevel,
  createReputationMetadata,
  ReputationScore,
} from "./reputation";
import { mintReputationNFT, ReputationNFTRecord } from "./nft-mint";
import { solanaConfig } from "./solana-config";

const REPUTATION_FILE = path.join(process.cwd(), "data", "reputation.json");
const REPUTATION_NFT_FILE = path.join(
  process.cwd(),
  "data",
  "reputation-nfts.json"
);

// Ensure data directory exists
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface ReputationData {
  [wallet: string]: ReputationScore;
}

export function readReputations(): ReputationData {
  try {
    if (fs.existsSync(REPUTATION_FILE)) {
      return fs.readJsonSync(REPUTATION_FILE);
    }
  } catch (error) {
    console.error("Error reading reputations:", error);
  }
  return {};
}

export function saveReputation(reputation: ReputationScore): void {
  try {
    const reputations = readReputations();
    reputations[reputation.wallet] = reputation;
    fs.writeJsonSync(REPUTATION_FILE, reputations, { spaces: 2 });
  } catch (error) {
    console.error("Error saving reputation:", error);
  }
}

export function getReputation(wallet: string): ReputationScore | null {
  const reputations = readReputations();
  return reputations[wallet] || null;
}

export function readReputationNFTs(): ReputationNFTRecord[] {
  try {
    if (fs.existsSync(REPUTATION_NFT_FILE)) {
      return fs.readJsonSync(REPUTATION_NFT_FILE);
    }
  } catch (error) {
    console.error("Error reading reputation NFTs:", error);
  }
  return [];
}

export function saveReputationNFT(nft: ReputationNFTRecord): void {
  try {
    const nfts = readReputationNFTs();
    nfts.push(nft);
    fs.writeJsonSync(REPUTATION_NFT_FILE, nfts, { spaces: 2 });
  } catch (error) {
    console.error("Error saving reputation NFT:", error);
  }
}

export function getReputationNFTs(wallet: string): ReputationNFTRecord[] {
  const nfts = readReputationNFTs();
  return nfts.filter(
    (nft) => nft.wallet.toLowerCase() === wallet.toLowerCase()
  );
}

/**
 * Calculate reputation for a wallet based on all payments
 */
export function calculateWalletReputation(wallet: string): ReputationScore {
  const payments = readPayments();
  const assets = getAllAssets();

  // Filter payments for this wallet (as payer)
  const walletPayments = payments.filter(
    (p: PaymentRecord) => p.payer.toLowerCase() === wallet.toLowerCase()
  );

  // Calculate total downloads (one per payment)
  const totalDownloads = walletPayments.length;

  // Calculate total payments
  const totalPayments = walletPayments.length;

  // Calculate total earnings (as provider)
  const providerAssets = assets.filter(
    (asset) => asset.recipient.toLowerCase() === wallet.toLowerCase()
  );
  const providerPayments = payments.filter((p: PaymentRecord) =>
    providerAssets.some((asset) => asset.id === p.assetId)
  );
  const totalEarnings = providerPayments.reduce(
    (sum: number, p: PaymentRecord) => sum + p.amount,
    0
  );

  // Calculate reputation score
  const score = calculateReputationScore(
    totalPayments,
    totalDownloads,
    totalEarnings
  );

  const level = getReputationLevel(score);

  return {
    wallet,
    score,
    level,
    totalPayments,
    totalDownloads,
    totalEarnings,
    lastUpdated: Date.now(),
  };
}

/**
 * Update reputation and mint NFT after payment
 */
export async function updateReputationAndMintNFT(
  wallet: string,
  paymentAmount: number
): Promise<void> {
  try {
    console.log("🔄 Starting reputation update for wallet:", wallet);

    // IMPORTANT: Get existing reputation BEFORE calculating new one
    // This is needed to compare old vs new for NFT minting
    const existingReputation = getReputation(wallet);
    console.log("📊 Existing reputation:", existingReputation);

    // Calculate updated reputation
    const reputation = calculateWalletReputation(wallet);
    console.log("📊 New reputation:", {
      score: reputation.score,
      level: reputation.level,
      totalPayments: reputation.totalPayments,
      totalDownloads: reputation.totalDownloads,
      totalEarnings: reputation.totalEarnings,
    });

    // Save reputation
    saveReputation(reputation);

    // Check if we should mint a new NFT
    // Mint on first payment, every 10+ point increase, or level change
    const isFirstPayment = !existingReputation;
    const scoreIncrease = existingReputation
      ? reputation.score - existingReputation.score
      : reputation.score;
    const levelChanged = existingReputation
      ? reputation.level !== existingReputation.level
      : true; // First payment always has a level

    const shouldMintNFT =
      isFirstPayment || // First payment - always mint
      scoreIncrease >= 10 || // Score increased by 10+
      levelChanged; // Level changed

    const reason = isFirstPayment
      ? "first_payment"
      : scoreIncrease >= 10
      ? "score_increase"
      : levelChanged
      ? "level_change"
      : "none";

    console.log("🔍 Reputation update check:", {
      wallet,
      existingReputation: existingReputation
        ? {
            score: existingReputation.score,
            level: existingReputation.level,
          }
        : null,
      newReputation: {
        score: reputation.score,
        level: reputation.level,
      },
      isFirstPayment,
      scoreIncrease,
      levelChanged,
      shouldMintNFT,
      reason,
    });

    if (!shouldMintNFT) {
      console.log("⏭️ Skipping NFT minting - conditions not met:", {
        isFirstPayment,
        scoreIncrease,
        levelChanged,
        reason,
      });
      return;
    }

    console.log("🎨 NFT minting conditions met! Starting mint process...", {
      reason,
      score: reputation.score,
      level: reputation.level,
    });

    // Create metadata
    const metadata = createReputationMetadata(
      wallet,
      reputation.score,
      reputation.level,
      reputation.totalPayments,
      reputation.totalDownloads,
      reputation.totalEarnings
    );

    console.log("📝 Created metadata:", {
      name: metadata.name,
      level: metadata.attributes[0].value,
      score: metadata.attributes[1].value,
    });

    // Mint NFT using Metaplex
    // Get service keypair for server-side minting
    const { getServiceKeypair } = await import("./nft-mint");
    const serviceKeypair = getServiceKeypair();

    if (!serviceKeypair) {
      console.error(
        "⚠️ SERVICE_WALLET_PRIVATE_KEY not configured. NFT minting skipped."
      );
      console.error(
        "Please set SERVICE_WALLET_PRIVATE_KEY in .env.local to enable NFT minting."
      );
      return; // Don't throw error, just skip minting
    }

    console.log("🔑 Service keypair loaded successfully");

    console.log("🔄 Starting NFT minting process...", {
      wallet,
      score: reputation.score,
      level: reputation.level,
    });

    const nftResult = await mintReputationNFT(wallet, metadata, serviceKeypair);

    if (nftResult) {
      // Save NFT record
      saveReputationNFT({
        wallet,
        mint: nftResult.mint,
        score: reputation.score,
        level: reputation.level,
        metadata,
        timestamp: Date.now(),
        transactionSignature: nftResult.signature,
      });

      console.log("✅ Reputation NFT minted successfully!", {
        wallet,
        mint: nftResult.mint,
        score: reputation.score,
        level: reputation.level,
        explorerUrl: `https://explorer.solana.com/tx/${nftResult.signature}?cluster=devnet`,
        nftUrl: `https://explorer.solana.com/address/${nftResult.mint}?cluster=devnet`,
      });
    } else {
      console.error(
        "❌ Failed to mint reputation NFT - mintReputationNFT returned null"
      );
    }
  } catch (error) {
    console.error("Error updating reputation and minting NFT:", error);
    throw error;
  }
}
