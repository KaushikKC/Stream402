"use client";

import { useEffect, useState } from "react";
import {
  ReputationScore,
  getReputationLevelColor,
  formatReputationScore,
} from "@/lib/reputation";

interface ReputationBadgeProps {
  wallet: string;
  className?: string;
}

interface ReputationData {
  wallet: string;
  score: number;
  level: string;
  formattedScore: string;
  totalPayments: number;
  totalDownloads: number;
  totalEarnings: number;
  lastUpdated: number;
  nfts: Array<{
    mint: string;
    score: number;
    level: string;
    timestamp: number;
    transactionSignature?: string;
    explorerUrl?: string;
    nftUrl: string;
  }>;
}

export function ReputationBadge({
  wallet,
  className = "",
}: ReputationBadgeProps) {
  const [reputation, setReputation] = useState<ReputationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!wallet) {
      setLoading(false);
      return;
    }

    const fetchReputation = async () => {
      try {
        const response = await fetch(`/api/reputation/${wallet}`);
        if (response.ok) {
          const data = await response.json();
          setReputation(data);
        }
      } catch (error) {
        console.error("Error fetching reputation:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReputation();
    const interval = setInterval(fetchReputation, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [wallet]);

  if (loading) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  if (!reputation) {
    return null;
  }

  const levelColor = getReputationLevelColor(reputation.level);

  return (
    <div className={`relative group ${className}`}>
      <div className="inline-flex items-center gap-2">
        <div
          className={`px-3 py-1 rounded-full bg-gradient-to-r ${levelColor} text-white text-xs font-semibold shadow-md`}
        >
          {reputation.level}
        </div>
        <span className="text-sm text-gray-600 font-medium">
          Score: {reputation.formattedScore}
        </span>
        {reputation.nfts && reputation.nfts.length > 0 && (
          <span className="text-xs text-gray-500">
            🎨 {reputation.nfts.length} NFT
            {reputation.nfts.length > 1 ? "s" : ""}
          </span>
        )}
      </div>
      {/* Tooltip with NFT details */}
      {reputation.nfts && reputation.nfts.length > 0 && (
        <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-80 bg-white p-4 rounded-lg shadow-xl border border-gray-200 opacity-0 group-hover:opacity-100 group-hover:translate-y-2 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto z-50">
          <h4 className="text-sm font-bold text-gray-900 mb-2">
            Reputation NFTs
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {reputation.nfts.map((nft, index) => (
              <div
                key={index}
                className="text-xs border-b border-gray-100 pb-2 last:border-0"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-800">
                    {nft.level}
                  </span>
                  <span className="text-gray-600">Score: {nft.score}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <a
                    href={nft.nftUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-xs"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View NFT
                  </a>
                  {nft.explorerUrl && (
                    <>
                      <span className="text-gray-300">•</span>
                      <a
                        href={nft.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View TX
                      </a>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
