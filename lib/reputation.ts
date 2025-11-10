/**
 * Reputation Score System
 * Calculates and manages reputation scores for users based on their activity
 */

export interface ReputationScore {
  wallet: string;
  score: number;
  level: string;
  totalPayments: number;
  totalDownloads: number;
  totalEarnings: number;
  lastUpdated: number;
}

export interface ReputationMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  properties: {
    category: string;
    files: Array<{
      uri: string;
      type: string;
    }>;
  };
}

/**
 * Calculate reputation score based on user activity
 * Formula: (payments * 10) + (downloads * 5) + (earnings / 1000)
 */
export function calculateReputationScore(
  totalPayments: number,
  totalDownloads: number,
  totalEarnings: number
): number {
  const paymentScore = totalPayments * 10;
  const downloadScore = totalDownloads * 5;
  const earningsScore = Math.floor(totalEarnings / 1000); // 1 point per 1000 units (0.001 USDC)

  return paymentScore + downloadScore + earningsScore;
}

/**
 * Get reputation level based on score
 */
export function getReputationLevel(score: number): string {
  if (score >= 1000) return "Legendary";
  if (score >= 500) return "Master";
  if (score >= 250) return "Expert";
  if (score >= 100) return "Advanced";
  if (score >= 50) return "Intermediate";
  if (score >= 10) return "Beginner";
  return "Newcomer";
}

/**
 * Get reputation level color
 */
export function getReputationLevelColor(level: string): string {
  const colors: Record<string, string> = {
    Legendary: "from-purple-600 to-pink-600",
    Master: "from-blue-600 to-indigo-600",
    Expert: "from-green-600 to-emerald-600",
    Advanced: "from-yellow-500 to-orange-500",
    Intermediate: "from-blue-400 to-cyan-400",
    Beginner: "from-gray-400 to-gray-500",
    Newcomer: "from-gray-300 to-gray-400",
  };
  return colors[level] || colors.Newcomer;
}

/**
 * Create NFT metadata for reputation score
 */
export function createReputationMetadata(
  wallet: string,
  score: number,
  level: string,
  totalPayments: number,
  totalDownloads: number,
  totalEarnings: number
): ReputationMetadata {
  return {
    name: `Reputation Score #${score}`,
    symbol: "REP",
    description: `Reputation NFT for ${wallet.slice(0, 8)}...${wallet.slice(
      -8
    )}. Level: ${level}, Score: ${score}`,
    image: generateReputationImage(level, score),
    attributes: [
      {
        trait_type: "Level",
        value: level,
      },
      {
        trait_type: "Score",
        value: score,
      },
      {
        trait_type: "Total Payments",
        value: totalPayments,
      },
      {
        trait_type: "Total Downloads",
        value: totalDownloads,
      },
      {
        trait_type: "Total Earnings",
        value: totalEarnings,
      },
      {
        trait_type: "Wallet",
        value: wallet,
      },
    ],
    properties: {
      category: "Reputation",
      files: [
        {
          uri: generateReputationImage(level, score),
          type: "image/svg+xml",
        },
      ],
    },
  };
}

/**
 * Generate SVG image for reputation NFT (for display purposes)
 * The actual NFT image is generated in nft-mint.ts
 */
function generateReputationImage(level: string, score: number): string {
  const svg = `
    <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#6366f1;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="400" height="400" fill="url(#grad)"/>
      <text x="200" y="180" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white" text-anchor="middle">${level}</text>
      <text x="200" y="240" font-family="Arial, sans-serif" font-size="32" fill="white" text-anchor="middle">Score: ${score}</text>
      <text x="200" y="300" font-family="Arial, sans-serif" font-size="24" fill="white" text-anchor="middle">Reputation NFT</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

/**
 * Format reputation score for display
 */
export function formatReputationScore(score: number): string {
  if (score >= 1000) return `${(score / 1000).toFixed(1)}K`;
  return score.toString();
}
