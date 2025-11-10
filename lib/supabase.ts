/**
 * Supabase client for production database storage
 * Replaces local file storage with cloud database
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    "⚠️ Supabase credentials not found. Using local storage fallback."
  );
  console.warn(
    "   NEXT_PUBLIC_SUPABASE_URL:",
    supabaseUrl ? "✅ Set" : "❌ Missing"
  );
  console.warn(
    "   NEXT_PUBLIC_SUPABASE_ANON_KEY:",
    supabaseKey ? "✅ Set" : "❌ Missing"
  );
} else {
  console.log("✅ Supabase configured successfully");
  console.log("   URL:", supabaseUrl);
  console.log("   Key:", supabaseKey.substring(0, 20) + "...");
}

export const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Database table names
export const TABLES = {
  ASSETS: "assets",
  PAYMENTS: "payments",
  REPUTATION: "reputation",
  REPUTATION_NFTS: "reputation_nfts",
} as const;

/**
 * Check if Supabase is configured
 */
export function isSupabaseConfigured(): boolean {
  return supabase !== null;
}

/**
 * Fallback to local storage if Supabase is not configured
 */
export function shouldUseLocalStorage(): boolean {
  return !isSupabaseConfigured();
}
