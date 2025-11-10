import fs from "fs-extra";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const THUMB_DIR = path.join(process.cwd(), "uploads", "thumbs");

// Ensure directories exist
fs.ensureDirSync(UPLOAD_DIR);
fs.ensureDirSync(THUMB_DIR);

export interface AssetMetadata {
  id: string;
  title: string;
  price: number; // in smallest unit (e.g., 10000 = 0.01 USDC with 6 decimals)
  decimals: number;
  currency: string;
  mint: string;
  recipient: string;
  filename: string;
  thumbFilename?: string;
  ipfsCid?: string; // IPFS Content Identifier
  ipfsUrl?: string; // IPFS URL for the image
  tags?: string[]; // Tags for search functionality
  createdAt: number;
}

const ASSETS_FILE = path.join(process.cwd(), "data", "assets.json");
const PAYMENTS_FILE = path.join(process.cwd(), "data", "payments.json");

fs.ensureDirSync(path.join(process.cwd(), "data"));

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

export function saveAsset(metadata: AssetMetadata): void {
  const assets = readAssets();
  assets.push(metadata);
  writeAssets(assets);
}

export function getAsset(id: string): AssetMetadata | null {
  const assets = readAssets();
  return assets.find((a) => a.id === id) || null;
}

export function getAllAssets(): AssetMetadata[] {
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

export function savePayment(payment: PaymentRecord): void {
  const payments = readPayments();
  payments.push(payment);
  writePayments(payments);
}

export function getPaymentBySignature(signature: string): PaymentRecord | null {
  const payments = readPayments();
  return payments.find((p) => p.signature === signature) || null;
}

export function getPaymentByAssetId(assetId: string): PaymentRecord | null {
  const payments = readPayments();
  return payments.find((p) => p.assetId === assetId) || null;
}

export { UPLOAD_DIR, THUMB_DIR };
