/**
 * Agent service for natural language asset requests
 * Handles query parsing, asset discovery, and automatic payment
 */

import { getAllAssets, AssetMetadata } from "./storage";

export interface AgentRequest {
  query: string;
  walletAddress?: string;
}

export interface AgentResponse {
  success: boolean;
  message: string;
  assetId?: string;
  assetUrl?: string;
  downloadUrl?: string;
  price?: number;
  requiresPayment?: boolean;
  paymentChallenge?: any;
}

/**
 * Parse natural language query and extract keywords
 */
export function parseQuery(query: string): string[] {
  // Remove common words and extract meaningful keywords
  const stopWords = new Set([
    "i",
    "want",
    "a",
    "an",
    "the",
    "to",
    "get",
    "find",
    "show",
    "me",
    "please",
    "can",
    "you",
    "image",
    "picture",
    "photo",
    "logo",
  ]);

  const words = query
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));

  return words;
}

/**
 * Search assets by keywords extracted from query
 */
export async function searchAssetsByQuery(query: string): Promise<
  Array<{
    id: string;
    title: string;
    tags: string[];
    price: number;
    recipient: string;
    matchScore: number;
  }>
> {
  const keywords = parseQuery(query);
  const assets = await getAllAssets();

  const results = assets
    .map((asset: AssetMetadata) => {
      const titleLower = asset.title.toLowerCase();
      const tagsLower = asset.tags?.map((t: string) => t.toLowerCase()) || [];
      const allText = [titleLower, ...tagsLower].join(" ");

      // Calculate match score
      let matchScore = 0;
      keywords.forEach((keyword) => {
        if (titleLower.includes(keyword)) {
          matchScore += 3; // Title matches are more important
        }
        if (tagsLower.some((tag: string) => tag.includes(keyword))) {
          matchScore += 2; // Tag matches
        }
        if (allText.includes(keyword)) {
          matchScore += 1; // General text match
        }
      });

      return {
        id: asset.id,
        title: asset.title,
        tags: asset.tags || [],
        price: asset.price || 0,
        recipient: asset.recipient,
        matchScore,
      };
    })
    .filter((asset: { matchScore: number }) => asset.matchScore > 0)
    .sort(
      (a: { matchScore: number }, b: { matchScore: number }) =>
        b.matchScore - a.matchScore
    );

  return results;
}

/**
 * Find the best matching asset for a query
 */
export async function findBestMatch(query: string): Promise<{
  id: string;
  title: string;
  tags: string[];
  price: number;
  recipient: string;
  matchScore: number;
} | null> {
  const results = await searchAssetsByQuery(query);
  return results.length > 0 ? results[0] : null;
}
