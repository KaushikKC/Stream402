/**
 * Reputation Storage and NFT Minting
 * Manages reputation scores and mints NFTs
 */

import fs from "fs-extra";
import path from "path";
import {
  readPayments,
  getAllAssets,
  PaymentRecord,
  AssetMetadata,
} from "./storage";
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

// Check if we're in a serverless environment (Vercel, AWS Lambda, etc.)
const isServerless =
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.NEXT_RUNTIME === "nodejs";

// Ensure data directory exists (only in non-serverless environments)
// In serverless, we use Supabase for storage
const DATA_DIR = path.join(process.cwd(), "data");
if (!isServerless) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (error) {
    // Silently fail in serverless environments
    console.warn(
      "Could not create data directory (serverless environment):",
      error
    );
  }
}

export interface ReputationData {
  [wallet: string]: ReputationScore;
}

export async function readReputations(): Promise<ReputationData> {
  // Fallback to local storage (database doesn't have getAllReputations)
  try {
    if (fs.existsSync(REPUTATION_FILE)) {
      return fs.readJsonSync(REPUTATION_FILE);
    }
  } catch (error) {
    console.error("Error reading reputations:", error);
  }
  return {};
}

export async function saveReputation(
  reputation: ReputationScore
): Promise<void> {
  // Try database first, fallback to local storage
  try {
    const { saveReputationToDB } = await import("./storage-db");
    await saveReputationToDB(reputation);
    return;
  } catch (error) {
    console.warn("Database save failed, using local storage:", error);
  }

  // Fallback to local storage
  try {
    const reputations = await readReputations();
    reputations[reputation.wallet] = reputation;
    fs.writeJsonSync(REPUTATION_FILE, reputations, { spaces: 2 });
  } catch (error) {
    console.error("Error saving reputation:", error);
  }
}

export async function getReputation(
  wallet: string
): Promise<ReputationScore | null> {
  // Try database first, fallback to local storage
  try {
    const { getReputationFromDB } = await import("./storage-db");
    return await getReputationFromDB(wallet);
  } catch (error) {
    console.warn("Database get failed, using local storage:", error);
  }

  // Fallback to local storage
  const reputations = await readReputations();
  return reputations[wallet] || null;
}

export async function readReputationNFTs(): Promise<ReputationNFTRecord[]> {
  // Try database first, fallback to local storage
  try {
    // Database doesn't have getAllReputationNFTs, so we'll use local storage
    // Individual wallet queries use getReputationNFTsFromDB
  } catch (error) {
    console.warn("Database get failed, using local storage:", error);
  }

  // Fallback to local storage
  try {
    if (fs.existsSync(REPUTATION_NFT_FILE)) {
      return fs.readJsonSync(REPUTATION_NFT_FILE);
    }
  } catch (error) {
    console.error("Error reading reputation NFTs:", error);
  }
  return [];
}

export async function saveReputationNFT(
  nft: ReputationNFTRecord
): Promise<void> {
  // Try database first, fallback to local storage
  try {
    const { saveReputationNFTToDB } = await import("./storage-db");
    await saveReputationNFTToDB(nft);
    return;
  } catch (error) {
    console.warn("Database save failed, using local storage:", error);
  }

  // Fallback to local storage
  try {
    const nfts = await readReputationNFTs();
    nfts.push(nft);
    fs.writeJsonSync(REPUTATION_NFT_FILE, nfts, { spaces: 2 });
  } catch (error) {
    console.error("Error saving reputation NFT:", error);
  }
}

export async function getReputationNFTs(
  wallet: string
): Promise<ReputationNFTRecord[]> {
  // Try database first, fallback to local storage
  try {
    const { getReputationNFTsFromDB } = await import("./storage-db");
    return await getReputationNFTsFromDB(wallet);
  } catch (error) {
    console.warn("Database get failed, using local storage:", error);
  }

  // Fallback to local storage
  const nfts = await readReputationNFTs();
  return nfts.filter(
    (nft) => nft.wallet.toLowerCase() === wallet.toLowerCase()
  );
}

/**
 * Calculate reputation for a wallet based on all payments
 */
export async function calculateWalletReputation(
  wallet: string
): Promise<ReputationScore> {
  const payments = await readPayments();
  const assets = await getAllAssets();

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
    (asset: AssetMetadata) =>
      asset.recipient.toLowerCase() === wallet.toLowerCase()
  );
  const providerPayments = payments.filter((p: PaymentRecord) =>
    providerAssets.some((asset: AssetMetadata) => asset.id === p.assetId)
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
    const existingReputation = await getReputation(wallet);
    console.log("📊 Existing reputation:", existingReputation);

    // Calculate updated reputation
    const reputation = await calculateWalletReputation(wallet);
    console.log("📊 New reputation:", {
      score: reputation.score,
      level: reputation.level,
      totalPayments: reputation.totalPayments,
      totalDownloads: reputation.totalDownloads,
      totalEarnings: reputation.totalEarnings,
    });

    // Save reputation
    await saveReputation(reputation);

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
      await saveReputationNFT({
        wallet,
        mint: nftResult.mint,
        score: reputation.score,
        level: reputation.level,
        timestamp: Date.now(),
        transactionSignature: nftResult.signature,
        metadata: metadata, // Include metadata in NFT record
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
