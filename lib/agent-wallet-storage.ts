/**
 * Agent Wallet Storage
 * Manages agent wallet persistence in database
 */

import { supabase, TABLES, shouldUseLocalStorage } from "./supabase";
import { AgentWallet } from "./agent-wallet";
import fs from "fs-extra";
import path from "path";

const AGENT_WALLETS_FILE = path.join(
  process.cwd(),
  "data",
  "agent-wallets.json"
);

// Check if we're in a serverless environment
const isServerless =
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.NEXT_RUNTIME === "nodejs";

// Ensure data directory exists (only in non-serverless environments)
if (!isServerless) {
  try {
    fs.ensureDirSync(path.join(process.cwd(), "data"));
  } catch (error) {
    console.warn("Could not create data directory:", error);
  }
}

/**
 * Save agent wallet to database
 */
export async function saveAgentWallet(agent: AgentWallet): Promise<void> {
  if (shouldUseLocalStorage()) {
    // Fallback to local storage
    try {
      const agents = await readAgentWallets();
      const existingIndex = agents.findIndex((a) => a.id === agent.id);
      if (existingIndex >= 0) {
        agents[existingIndex] = agent;
      } else {
        agents.push(agent);
      }
      fs.writeJsonSync(AGENT_WALLETS_FILE, agents, { spaces: 2 });
    } catch (error) {
      console.error("Error saving agent wallet to local storage:", error);
    }
    return;
  }

  try {
    const { error } = await supabase!.from(TABLES.AGENT_WALLETS).upsert(
      {
        id: agent.id,
        user_id: agent.userId,
        agent_address: agent.agentAddress,
        encrypted_private_key: agent.encryptedPrivateKey,
        created_at: agent.createdAt,
        balance: agent.balance || 0,
        total_spent: agent.totalSpent || 0,
        total_purchases: agent.totalPurchases || 0,
      },
      {
        onConflict: "id",
      }
    );

    if (error) {
      console.error("Error saving agent wallet to database:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in saveAgentWallet:", error);
    // Fallback to local storage
    const agents = await readAgentWallets();
    const existingIndex = agents.findIndex((a) => a.id === agent.id);
    if (existingIndex >= 0) {
      agents[existingIndex] = agent;
    } else {
      agents.push(agent);
    }
    fs.writeJsonSync(AGENT_WALLETS_FILE, agents, { spaces: 2 });
  }
}

/**
 * Get all agent wallets for a user
 */
export async function getUserAgentWallets(
  userId: string
): Promise<AgentWallet[]> {
  if (shouldUseLocalStorage()) {
    const agents = await readAgentWallets();
    return agents.filter(
      (a) => a.userId.toLowerCase() === userId.toLowerCase()
    );
  }

  try {
    const { data, error } = await supabase!
      .from(TABLES.AGENT_WALLETS)
      .select("*")
      .eq("user_id", userId.toLowerCase());

    if (error) {
      console.error("Error fetching agent wallets from database:", error);
      const agents = await readAgentWallets();
      return agents.filter(
        (a) => a.userId.toLowerCase() === userId.toLowerCase()
      );
    }

    return (data || []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      agentAddress: row.agent_address,
      encryptedPrivateKey: row.encrypted_private_key,
      createdAt: row.created_at,
      balance: row.balance || 0,
      totalSpent: row.total_spent || 0,
      totalPurchases: row.total_purchases || 0,
    }));
  } catch (error) {
    console.error("Error in getUserAgentWallets:", error);
    const agents = await readAgentWallets();
    return agents.filter(
      (a) => a.userId.toLowerCase() === userId.toLowerCase()
    );
  }
}

/**
 * Get agent wallet by ID
 */
export async function getAgentWallet(
  agentId: string
): Promise<AgentWallet | null> {
  if (shouldUseLocalStorage()) {
    const agents = await readAgentWallets();
    return agents.find((a) => a.id === agentId) || null;
  }

  try {
    const { data, error } = await supabase!
      .from(TABLES.AGENT_WALLETS)
      .select("*")
      .eq("id", agentId)
      .single();

    if (error || !data) {
      const agents = await readAgentWallets();
      return agents.find((a) => a.id === agentId) || null;
    }

    return {
      id: data.id,
      userId: data.user_id,
      agentAddress: data.agent_address,
      encryptedPrivateKey: data.encrypted_private_key,
      createdAt: data.created_at,
      balance: data.balance || 0,
      totalSpent: data.total_spent || 0,
      totalPurchases: data.total_purchases || 0,
    };
  } catch (error) {
    console.error("Error in getAgentWallet:", error);
    const agents = await readAgentWallets();
    return agents.find((a) => a.id === agentId) || null;
  }
}

/**
 * Read agent wallets from local storage (fallback)
 */
async function readAgentWallets(): Promise<AgentWallet[]> {
  try {
    if (fs.existsSync(AGENT_WALLETS_FILE)) {
      return fs.readJsonSync(AGENT_WALLETS_FILE);
    }
  } catch (error) {
    console.error("Error reading agent wallets:", error);
  }
  return [];
}

/**
 * Delete agent wallet
 */
export async function deleteAgentWallet(
  agentId: string,
  userId: string
): Promise<void> {
  if (shouldUseLocalStorage()) {
    const agents = await readAgentWallets();
    const filtered = agents.filter(
      (a) => a.id !== agentId && a.userId === userId
    );
    fs.writeJsonSync(AGENT_WALLETS_FILE, filtered, { spaces: 2 });
    return;
  }

  try {
    const { error } = await supabase!
      .from(TABLES.AGENT_WALLETS)
      .delete()
      .eq("id", agentId)
      .eq("user_id", userId.toLowerCase());

    if (error) {
      console.error("Error deleting agent wallet from database:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in deleteAgentWallet:", error);
    const agents = await readAgentWallets();
    const filtered = agents.filter(
      (a) => a.id !== agentId && a.userId === userId
    );
    fs.writeJsonSync(AGENT_WALLETS_FILE, filtered, { spaces: 2 });
  }
}
