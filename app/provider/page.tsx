"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import { ReputationBadge } from "@/components/reputation-badge";

interface ProviderStats {
  totalEarnings: number;
  totalEarningsFormatted: string;
  totalAssets: number;
  totalPayments: number;
  totalDownloads: number;
  assets: Array<{
    id: string;
    title: string;
    price: number;
    priceFormatted: string;
    payments: number;
    earnings: number;
    earningsFormatted: string;
    downloads: number;
    createdAt: number;
  }>;
  payments: Array<{
    assetId: string;
    assetTitle: string;
    signature: string;
    payer: string;
    amount: number;
    amountFormatted: string;
    timestamp: number;
  }>;
}

interface ReputationNFT {
  mint: string;
  score: number;
  level: string;
  timestamp: number;
  transactionSignature?: string;
  explorerUrl?: string;
  nftUrl: string;
}

function ReputationNFTsSection({ wallet }: { wallet: string }) {
  const [nfts, setNfts] = useState<ReputationNFT[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!wallet) {
      setLoading(false);
      return;
    }

    const fetchNFTs = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/reputation/${wallet}`);
        if (response.ok) {
          const data = await response.json();
          setNfts(data.nfts || []);
        }
      } catch (error) {
        console.error("Error fetching NFTs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNFTs();
    const interval = setInterval(fetchNFTs, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [wallet]);

  return (
    <div className="bg-black/80 backdrop-blur-md rounded-lg shadow-lg border border-[#1dd79b]/20 mb-8">
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-xl font-semibold text-gray-200">Reputation NFTs</h2>
        <p className="text-sm text-gray-400 mt-1">
          NFTs minted for your reputation milestones
        </p>
      </div>
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-2 border-gray-600 border-t-[#1dd79b] rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-400">Loading NFTs...</span>
          </div>
        ) : nfts.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gradient-to-br from-[#1dd79b] to-[#14966c] rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="text-gray-500 mb-2">No reputation NFTs yet</p>
            <p className="text-sm text-gray-400">
              NFTs are automatically minted when you reach reputation milestones
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nfts.map((nft, index) => (
              <div
                key={nft.mint}
                className="bg-black/80 backdrop-blur-md rounded-xl p-6 border border-[#1dd79b]/20 hover:shadow-lg hover:shadow-[0_0_20px_rgba(29,215,155,0.3)] transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-200">{nft.level}</h3>
                      <p className="text-xs text-gray-400">
                        Score: {nft.score}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="text-xs text-gray-500">
                    Minted: {new Date(nft.timestamp).toLocaleDateString()}
                  </div>
                  <div className="text-xs font-mono text-gray-400 break-all">
                    {nft.mint.slice(0, 8)}...{nft.mint.slice(-8)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <a
                    href={nft.nftUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-[#1dd79b] to-[#14966c] text-black text-sm font-semibold rounded-lg hover:from-[#14966c] hover:to-[#0d6b4f] transition-all duration-200 text-center shadow-lg hover:shadow-[0_0_20px_rgba(29,215,155,0.5)]"
                  >
                    View NFT
                  </a>
                  {nft.explorerUrl && (
                    <a
                      href={nft.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-black/70 border border-gray-700 text-gray-300 text-sm font-semibold rounded-lg hover:bg-black/70 transition-all duration-200"
                    >
                      TX
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProviderDashboard() {
  const { publicKey, connected } = useWallet();
  const [stats, setStats] = useState<ProviderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const walletAddress = useMemo(() => publicKey?.toBase58() ?? "", [publicKey]);

  useEffect(() => {
    if (!connected || !walletAddress) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/provider/stats?recipient=${encodeURIComponent(walletAddress)}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch stats: ${response.statusText}`);
        }

        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error("Error fetching provider stats:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [connected, walletAddress]);

  if (!connected) {
    return (
      <main className="min-h-screen relative py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="bg-black/80 backdrop-blur-md rounded-2xl shadow-xl border border-[#1dd79b]/20 p-10 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-[#1dd79b] to-[#14966c] rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold gradient-text mb-4">
              Provider Dashboard
            </h1>
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-6 max-w-md mx-auto">
              <p className="text-amber-800 font-medium mb-2">
                Please connect your wallet
              </p>
              <p className="text-sm text-amber-700">
                Connect your wallet from the navbar above to view your provider
                dashboard.
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen relative py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="bg-black/80 backdrop-blur-md rounded-2xl shadow-xl border border-[#1dd79b]/20 p-10 text-center">
            <svg
              className="animate-spin h-12 w-12 text-[#1dd79b] mx-auto mb-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <p className="text-gray-400 text-lg">Loading dashboard...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen relative py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="bg-black/80 backdrop-blur-md rounded-2xl shadow-xl border border-[#1dd79b]/20 p-10">
            <h1 className="text-3xl font-bold gradient-text mb-6">
              Provider Dashboard
            </h1>
            <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <svg
                  className="w-5 h-5 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <p className="text-red-800 font-semibold">Error</p>
              </div>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!stats) {
    return (
      <main className="min-h-screen relative py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="bg-black/80 backdrop-blur-md rounded-2xl shadow-xl border border-[#1dd79b]/20 p-10 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-[#1dd79b] to-[#14966c] rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold gradient-text mb-4">
              Provider Dashboard
            </h1>
            <p className="text-gray-400">No data available</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen relative py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-3">
            Provider Dashboard
          </h1>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#1dd79b] rounded-full animate-pulse shadow-[0_0_10px_rgba(29,215,155,0.8)]"></div>
              <p className="text-gray-400 font-mono text-sm">
                {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
              </p>
            </div>
            <ReputationBadge wallet={walletAddress} />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-black/80 backdrop-blur-md rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-[#1dd79b]/20 p-6 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Total Earnings
              </h3>
              <div className="w-10 h-10 bg-gradient-to-br from-[#1dd79b] to-[#14966c] rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(29,215,155,0.5)]">
                <svg
                  className="w-5 h-5 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold bg-gradient-to-r from-[#1dd79b] to-[#14966c] bg-clip-text text-transparent">
              {stats.totalEarningsFormatted} USDC
            </p>
          </div>

          <div className="bg-black/80 backdrop-blur-md rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-[#1dd79b]/20 p-6 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Total Assets
              </h3>
              <div className="w-10 h-10 bg-gradient-to-br from-[#1dd79b] to-[#14966c] rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-200">
              {stats.totalAssets}
            </p>
          </div>

          <div className="bg-black/80 backdrop-blur-md rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-[#1dd79b]/20 p-6 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Total Payments
              </h3>
              <div className="w-10 h-10 bg-gradient-to-br from-[#1dd79b] to-[#14966c] rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-200">
              {stats.totalPayments}
            </p>
          </div>

          <div className="bg-black/80 backdrop-blur-md rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-[#1dd79b]/20 p-6 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Total Downloads
              </h3>
              <div className="w-10 h-10 bg-gradient-to-br from-[#1dd79b] to-[#14966c] rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-200">
              {stats.totalDownloads}
            </p>
          </div>
        </div>

        {/* Assets Table */}
        <div className="bg-black/80 backdrop-blur-md rounded-lg shadow-lg border border-[#1dd79b]/20 mb-8">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-gray-200">Your Assets</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/70">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payments
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Earnings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Downloads
                  </th>
                </tr>
              </thead>
              <tbody className="bg-black/70 divide-y divide-gray-700">
                {stats.assets.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No assets yet.{" "}
                      <Link
                        href="/upload"
                        className="text-[#1dd79b] hover:underline hover:text-[#4de6b4]"
                      >
                        Upload your first asset
                      </Link>
                    </td>
                  </tr>
                ) : (
                  stats.assets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-black/70">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-200">
                          {asset.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {asset.id.slice(0, 8)}...
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                        {asset.priceFormatted} USDC
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                        {asset.payments}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#1dd79b]">
                        {asset.earningsFormatted} USDC
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                        {asset.downloads}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Reputation NFTs */}
        <ReputationNFTsSection wallet={walletAddress} />

        {/* Recent Payments */}
        <div className="bg-black/80 backdrop-blur-md rounded-lg shadow-lg border border-[#1dd79b]/20">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-gray-200">
              Recent Payments
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/70">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Asset
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction
                  </th>
                </tr>
              </thead>
              <tbody className="bg-black/70 divide-y divide-gray-700">
                {stats.payments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No payments yet
                    </td>
                  </tr>
                ) : (
                  stats.payments.map((payment) => (
                    <tr key={payment.signature} className="hover:bg-black/70">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-200">
                          {payment.assetTitle}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-200">
                          {payment.payer.slice(0, 8)}...
                          {payment.payer.slice(-8)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#1dd79b]">
                        {payment.amountFormatted} USDC
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(payment.timestamp).toLocaleDateString()}{" "}
                        {new Date(payment.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <a
                          href={`https://explorer.solana.com/tx/${payment.signature}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#1dd79b] hover:underline hover:text-[#4de6b4] text-sm"
                        >
                          View
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
