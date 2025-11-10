/**
 * Database storage layer using Supabase
 * Production-ready storage for assets and payments
 */

import { supabase, TABLES, shouldUseLocalStorage } from "./supabase";
import { AssetMetadata, PaymentRecord } from "./storage";
import { ReputationScore } from "./reputation";
import { ReputationNFTRecord } from "./nft-mint";

// Check Supabase configuration dynamically (not cached at module load)
function checkUseLocalStorage(): boolean {
  return shouldUseLocalStorage();
}

/**
 * Get all assets from database
 */
export async function getAllAssetsFromDB(): Promise<AssetMetadata[]> {
  if (checkUseLocalStorage()) {
    console.log("⚠️ Using local storage fallback - Supabase not configured");
    // Fallback to local storage
    const { getAllAssets } = await import("./storage");
    return getAllAssets();
  }

  console.log("✅ Using Supabase database");

  try {
    const { data, error } = await supabase!.from(TABLES.ASSETS).select("*");

    if (error) {
      console.error("Error fetching assets from database:", error);
      // Fallback to local storage
      const { getAllAssets } = await import("./storage");
      return getAllAssets();
    }

    return (data || []).map((row) => ({
      id: row.id,
      title: row.title,
      price: row.price,
      decimals: row.decimals,
      currency: row.currency,
      mint: row.mint,
      recipient: row.recipient,
      filename: row.filename,
      thumbFilename: row.thumb_filename,
      ipfsCid: row.ipfs_cid,
      ipfsUrl: row.ipfs_url,
      tags: row.tags || [],
      createdAt: row.created_at,
    }));
  } catch (error) {
    console.error("Error in getAllAssetsFromDB:", error);
    // Fallback to local storage
    const { getAllAssets } = await import("./storage");
    return getAllAssets();
  }
}

/**
 * Get a single asset by ID
 */
export async function getAssetFromDB(
  id: string
): Promise<AssetMetadata | null> {
  if (checkUseLocalStorage()) {
    const { getAsset } = await import("./storage");
    return getAsset(id);
  }

  try {
    const { data, error } = await supabase!
      .from(TABLES.ASSETS)
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      title: data.title,
      price: data.price,
      decimals: data.decimals,
      currency: data.currency,
      mint: data.mint,
      recipient: data.recipient,
      filename: data.filename,
      thumbFilename: data.thumb_filename,
      ipfsCid: data.ipfs_cid,
      ipfsUrl: data.ipfs_url,
      tags: data.tags || [],
      createdAt: data.created_at,
    };
  } catch (error) {
    console.error("Error in getAssetFromDB:", error);
    const { getAsset } = await import("./storage");
    return getAsset(id);
  }
}

/**
 * Save asset to database
 */
export async function saveAssetToDB(metadata: AssetMetadata): Promise<void> {
  if (checkUseLocalStorage()) {
    console.log("⚠️ Saving to local storage - Supabase not configured");
    const { saveAsset } = await import("./storage");
    return saveAsset(metadata);
  }

  console.log("✅ Saving to Supabase database:", metadata.id);

  try {
    const { error } = await supabase!.from(TABLES.ASSETS).upsert({
      id: metadata.id,
      title: metadata.title,
      price: metadata.price,
      decimals: metadata.decimals,
      currency: metadata.currency,
      mint: metadata.mint,
      recipient: metadata.recipient,
      filename: metadata.filename,
      thumb_filename: metadata.thumbFilename,
      ipfs_cid: metadata.ipfsCid,
      ipfs_url: metadata.ipfsUrl,
      tags: metadata.tags || [],
      created_at: metadata.createdAt,
    });

    if (error) {
      console.error("Error saving asset to database:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in saveAssetToDB:", error);
    // Fallback to local storage
    const { saveAsset } = await import("./storage");
    return saveAsset(metadata);
  }
}

/**
 * Get all payments from database
 */
export async function getAllPaymentsFromDB(): Promise<PaymentRecord[]> {
  if (checkUseLocalStorage()) {
    const { readPayments } = await import("./storage");
    return readPayments();
  }

  try {
    const { data, error } = await supabase!.from(TABLES.PAYMENTS).select("*");

    if (error) {
      console.error("Error fetching payments from database:", error);
      const { readPayments } = await import("./storage");
      return readPayments();
    }

    return (data || []).map((row) => ({
      assetId: row.asset_id,
      signature: row.signature,
      payer: row.payer,
      amount: row.amount,
      timestamp: row.timestamp,
      paymentRequestToken: row.payment_request_token,
    }));
  } catch (error) {
    console.error("Error in getAllPaymentsFromDB:", error);
    const { readPayments } = await import("./storage");
    return readPayments();
  }
}

/**
 * Save payment to database
 */
export async function savePaymentToDB(payment: PaymentRecord): Promise<void> {
  if (checkUseLocalStorage()) {
    console.log("⚠️ Saving payment to local storage - Supabase not configured");
    const { savePayment } = await import("./storage");
    return savePayment(payment);
  }

  console.log("✅ Saving payment to Supabase database:", payment.signature);

  try {
    const { error } = await supabase!.from(TABLES.PAYMENTS).insert({
      asset_id: payment.assetId,
      signature: payment.signature,
      payer: payment.payer,
      amount: payment.amount,
      timestamp: payment.timestamp,
      payment_request_token: payment.paymentRequestToken,
    });

    if (error) {
      console.error("Error saving payment to database:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in savePaymentToDB:", error);
    // Fallback to local storage
    const { savePayment } = await import("./storage");
    return savePayment(payment);
  }
}

/**
 * Get reputation from database
 */
export async function getReputationFromDB(
  wallet: string
): Promise<ReputationScore | null> {
  if (checkUseLocalStorage()) {
    const { getReputation } = await import("./reputation-storage");
    return getReputation(wallet);
  }

  try {
    const { data, error } = await supabase!
      .from(TABLES.REPUTATION)
      .select("*")
      .eq("wallet", wallet.toLowerCase())
      .single();

    if (error || !data) {
      return null;
    }

    return {
      wallet: data.wallet,
      score: data.score,
      level: data.level,
      totalPayments: data.total_payments,
      totalDownloads: data.total_downloads,
      totalEarnings: data.total_earnings,
      lastUpdated: data.last_updated,
    };
  } catch (error) {
    console.error("Error in getReputationFromDB:", error);
    const { getReputation } = await import("./reputation-storage");
    return getReputation(wallet);
  }
}

/**
 * Save reputation to database
 */
export async function saveReputationToDB(
  reputation: ReputationScore
): Promise<void> {
  if (checkUseLocalStorage()) {
    console.log(
      "⚠️ Saving reputation to local storage - Supabase not configured"
    );
    const { saveReputation } = await import("./reputation-storage");
    return saveReputation(reputation);
  }

  console.log("✅ Saving reputation to Supabase database:", reputation.wallet);

  try {
    const { error } = await supabase!.from(TABLES.REPUTATION).upsert({
      wallet: reputation.wallet.toLowerCase(),
      score: reputation.score,
      level: reputation.level,
      total_payments: reputation.totalPayments,
      total_downloads: reputation.totalDownloads,
      total_earnings: reputation.totalEarnings,
      last_updated: reputation.lastUpdated,
    });

    if (error) {
      console.error("Error saving reputation to database:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in saveReputationToDB:", error);
    // Fallback to local storage
    const { saveReputation } = await import("./reputation-storage");
    return saveReputation(reputation);
  }
}

/**
 * Get reputation NFTs from database
 */
export async function getReputationNFTsFromDB(
  wallet: string
): Promise<ReputationNFTRecord[]> {
  if (checkUseLocalStorage()) {
    const { getReputationNFTs } = await import("./reputation-storage");
    return getReputationNFTs(wallet);
  }

  try {
    const { data, error } = await supabase!
      .from(TABLES.REPUTATION_NFTS)
      .select("*")
      .eq("wallet", wallet.toLowerCase())
      .order("timestamp", { ascending: false });

    if (error) {
      console.error("Error fetching reputation NFTs from database:", error);
      const { getReputationNFTs } = await import("./reputation-storage");
      return getReputationNFTs(wallet);
    }

    return (data || []).map((row) => ({
      wallet: row.wallet,
      mint: row.mint,
      score: row.score,
      level: row.level,
      timestamp: row.timestamp,
      transactionSignature: row.transaction_signature,
      metadata: {
        name: `Reputation ${row.level}`,
        symbol: "REP",
        description: `Reputation NFT for ${row.wallet}`,
        image: "",
        attributes: [
          { trait_type: "Level", value: row.level },
          { trait_type: "Score", value: row.score },
        ],
        properties: {
          category: "reputation",
          files: [],
        },
      },
    }));
  } catch (error) {
    console.error("Error in getReputationNFTsFromDB:", error);
    const { getReputationNFTs } = await import("./reputation-storage");
    return getReputationNFTs(wallet);
  }
}

/**
 * Save reputation NFT to database
 */
export async function saveReputationNFTToDB(
  nft: ReputationNFTRecord
): Promise<void> {
  if (checkUseLocalStorage()) {
    console.log(
      "⚠️ Saving reputation NFT to local storage - Supabase not configured"
    );
    const { saveReputationNFT } = await import("./reputation-storage");
    return saveReputationNFT(nft);
  }

  console.log("✅ Saving reputation NFT to Supabase database:", nft.mint);

  try {
    const { error } = await supabase!.from(TABLES.REPUTATION_NFTS).insert({
      wallet: nft.wallet.toLowerCase(),
      mint: nft.mint,
      score: nft.score,
      level: nft.level,
      timestamp: nft.timestamp,
      transaction_signature: nft.transactionSignature,
    });

    if (error) {
      console.error("Error saving reputation NFT to database:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in saveReputationNFTToDB:", error);
    // Fallback to local storage
    const { saveReputationNFT } = await import("./reputation-storage");
    return saveReputationNFT(nft);
  }
}
