/**
 * Agent Wallet Management
 * Creates and manages dedicated wallets for autonomous agents
 */

import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import crypto from "crypto";

export interface AgentWallet {
  id: string; // Unique agent ID
  userId: string; // Wallet address of the user who created the agent
  agentAddress: string; // Public key of the agent wallet
  encryptedPrivateKey: string; // Encrypted private key (base58)
  createdAt: number;
  balance?: number; // Current USDC balance
  totalSpent?: number; // Total amount spent by agent
  totalPurchases?: number; // Number of assets purchased
}

/**
 * Encrypt private key with a password
 * In production, use a proper encryption library and secure key management
 */
function encryptPrivateKey(privateKey: string, password: string): string {
  const algorithm = "aes-256-cbc";
  const key = crypto.scryptSync(password, "salt", 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  
  let encrypted = cipher.update(privateKey, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  // Return IV + encrypted data
  return iv.toString("hex") + ":" + encrypted;
}

/**
 * Decrypt private key
 */
function decryptPrivateKey(encryptedData: string, password: string): string {
  const algorithm = "aes-256-cbc";
  const key = crypto.scryptSync(password, "salt", 32);
  const [ivHex, encrypted] = encryptedData.split(":");
  const iv = Buffer.from(ivHex, "hex");
  
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  
  return decrypted;
}

/**
 * Create a new agent wallet
 * Returns the agent wallet with encrypted private key
 */
export function createAgentWallet(userId: string, password: string): AgentWallet {
  // Generate new keypair
  const keypair = Keypair.generate();
  const privateKey = bs58.encode(keypair.secretKey);
  
  // Encrypt private key (in production, use proper key management)
  const encryptedPrivateKey = encryptPrivateKey(privateKey, password);
  
  const agent: AgentWallet = {
    id: crypto.randomUUID(),
    userId,
    agentAddress: keypair.publicKey.toBase58(),
    encryptedPrivateKey,
    createdAt: Date.now(),
    balance: 0,
    totalSpent: 0,
    totalPurchases: 0,
  };
  
  return agent;
}

/**
 * Get agent keypair from encrypted private key
 * This is used for server-side signing
 */
export function getAgentKeypair(
  agent: AgentWallet,
  password: string
): Keypair {
  try {
    const decryptedPrivateKey = decryptPrivateKey(agent.encryptedPrivateKey, password);
    const secretKey = bs58.decode(decryptedPrivateKey);
    return Keypair.fromSecretKey(secretKey);
  } catch (error) {
    throw new Error("Failed to decrypt agent private key. Invalid password.");
  }
}

/**
 * Get agent keypair using user's wallet signature as password
 * This allows the user to unlock their agent using their wallet
 */
export async function getAgentKeypairWithWallet(
  agent: AgentWallet,
  userWallet: { signMessage: (message: Uint8Array) => Promise<Uint8Array> },
  message: string = "Unlock agent"
): Promise<Keypair> {
  try {
    // Use wallet signature as password
    const messageBytes = new TextEncoder().encode(message);
    const signature = await userWallet.signMessage(messageBytes);
    const password = bs58.encode(signature);
    
    return getAgentKeypair(agent, password);
  } catch (error) {
    throw new Error("Failed to unlock agent with wallet signature");
  }
}

