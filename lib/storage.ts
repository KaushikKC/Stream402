import fs from "fs-extra";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const THUMB_DIR = path.join(process.cwd(), "uploads", "thumbs");

// Check if we're in a serverless environment (Vercel, AWS Lambda, etc.)
const isServerless =
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.NEXT_RUNTIME === "nodejs";

// Ensure directories exist (only in non-serverless environments)
// In serverless, we use Supabase/IPFS for storage
if (!isServerless) {
  try {
    fs.ensureDirSync(UPLOAD_DIR);
    fs.ensureDirSync(THUMB_DIR);
  } catch (error) {
    // Silently fail in serverless environments
    console.warn(
      "Could not create upload directories (serverless environment):",
      error
    );
  }
}

export interface AssetMetadata {
  id: string;
  title: string;
  price: number; // in smallest unit (e.g., 10000 = 0.01 USDC with 6 decimals)
  decimals: number;
  currency: string;
  mint: string;
  recipient: string;
  filename?: string; // Optional: not needed in serverless (IPFS-only) environments
  thumbFilename?: string;
  ipfsCid?: string; // IPFS Content Identifier
  ipfsUrl?: string; // IPFS URL for the image
  tags?: string[]; // Tags for search functionality
  createdAt: number;
}

const ASSETS_FILE = path.join(process.cwd(), "data", "assets.json");
const PAYMENTS_FILE = path.join(process.cwd(), "data", "payments.json");

// Ensure data directory exists (only in non-serverless environments)
if (!isServerless) {
  try {
    fs.ensureDirSync(path.join(process.cwd(), "data"));
  } catch (error) {
    // Silently fail in serverless environments
    console.warn(
      "Could not create data directory (serverless environment):",
      error
    );
  }
}

function readAssets(): AssetMetadata[] {
  try {
    if (fs.existsSync(ASSETS_FILE)) {
      return fs.readJsonSync(ASSETS_FILE);
    }
  } catch (error) {
    console.error("Error reading assets:", error);
  }
  return [];
}

function writeAssets(assets: AssetMetadata[]): void {
  try {
    fs.writeJsonSync(ASSETS_FILE, assets, { spaces: 2 });
  } catch (error) {
    console.error("Error writing assets:", error);
  }
}

export async function saveAsset(metadata: AssetMetadata): Promise<void> {
  // Try database first, fallback to local storage
  try {
    const { saveAssetToDB } = await import("./storage-db");
    await saveAssetToDB(metadata);
    return;
  } catch (error) {
    console.warn("Database save failed, using local storage:", error);
  }

  // Fallback to local storage
  const assets = readAssets();
  assets.push(metadata);
  writeAssets(assets);
}

export async function getAsset(id: string): Promise<AssetMetadata | null> {
  // Try database first, fallback to local storage
  try {
    const { getAssetFromDB } = await import("./storage-db");
    return await getAssetFromDB(id);
  } catch (error) {
    console.warn("Database get failed, using local storage:", error);
  }

  // Fallback to local storage
  const assets = readAssets();
  return assets.find((a) => a.id === id) || null;
}

export async function getAllAssets(): Promise<AssetMetadata[]> {
  // Try database first, fallback to local storage
  try {
    const { getAllAssetsFromDB } = await import("./storage-db");
    return await getAllAssetsFromDB();
  } catch (error) {
    console.warn("Database get failed, using local storage:", error);
  }

  // Fallback to local storage
  return readAssets();
}

export interface PaymentRecord {
  assetId: string;
  signature: string;
  payer: string;
  amount: number;
  timestamp: number;
  paymentRequestToken: string;
}

export function readPayments(): PaymentRecord[] {
  try {
    if (fs.existsSync(PAYMENTS_FILE)) {
      return fs.readJsonSync(PAYMENTS_FILE);
    }
  } catch (error) {
    console.error("Error reading payments:", error);
  }
  return [];
}

function writePayments(payments: PaymentRecord[]): void {
  try {
    fs.writeJsonSync(PAYMENTS_FILE, payments, { spaces: 2 });
  } catch (error) {
    console.error("Error writing payments:", error);
  }
}

export async function savePayment(payment: PaymentRecord): Promise<void> {
  // Try database first, fallback to local storage
  try {
    const { savePaymentToDB } = await import("./storage-db");
    await savePaymentToDB(payment);
    return;
  } catch (error) {
    console.warn("Database save failed, using local storage:", error);
  }

  // Fallback to local storage
  const payments = readPayments();
  payments.push(payment);
  writePayments(payments);
}

export async function getPaymentBySignature(
  signature: string
): Promise<PaymentRecord | null> {
  // Try database first, fallback to local storage
  try {
    const { getAllPaymentsFromDB } = await import("./storage-db");
    const payments = await getAllPaymentsFromDB();
    return payments.find((p) => p.signature === signature) || null;
  } catch (error) {
    console.warn("Database get failed, using local storage:", error);
  }

  // Fallback to local storage
  const payments = readPayments();
  return payments.find((p) => p.signature === signature) || null;
}

export async function getPaymentByAssetId(
  assetId: string
): Promise<PaymentRecord | null> {
  // Try database first, fallback to local storage
  try {
    const { getAllPaymentsFromDB } = await import("./storage-db");
    const payments = await getAllPaymentsFromDB();
    return payments.find((p) => p.assetId === assetId) || null;
  } catch (error) {
    console.warn("Database get failed, using local storage:", error);
  }

  // Fallback to local storage
  const payments = readPayments();
  return payments.find((p) => p.assetId === assetId) || null;
}

export { UPLOAD_DIR, THUMB_DIR };
