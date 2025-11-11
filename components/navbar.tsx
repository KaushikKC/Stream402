"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletButton } from "@/components/solana/solana-provider";
import { usePathname } from "next/navigation";
import { ReputationBadge } from "./reputation-badge";

export function Navbar() {
  const { connected, publicKey } = useWallet();
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-[#1dd79b]/20 bg-black/95 backdrop-blur-md shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 bg-gradient-to-br from-[#1dd79b] to-[#14966c] rounded-lg flex items-center justify-center transform group-hover:rotate-6 transition-transform duration-300 shadow-[0_0_15px_rgba(29,215,155,0.5)]">
                <span className="text-black font-bold text-sm">x</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-[#1dd79b] to-[#14966c] bg-clip-text text-transparent">
                Stream402
              </span>
            </Link>
            <div className="ml-10 flex items-center space-x-1">
              <Link
                href="/"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  pathname === "/"
                    ? "bg-[#1dd79b]/20 text-[#1dd79b] shadow-[0_0_10px_rgba(29,215,155,0.3)]"
                    : "text-gray-400 hover:text-[#1dd79b] hover:bg-black/50"
                }`}
              >
                Home
              </Link>
              <Link
                href="/upload"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  pathname === "/upload"
                    ? "bg-[#1dd79b]/20 text-[#1dd79b] shadow-[0_0_10px_rgba(29,215,155,0.3)]"
                    : "text-gray-400 hover:text-[#1dd79b] hover:bg-black/50"
                }`}
              >
                Upload
              </Link>
              <Link
                href="/images"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  pathname === "/images"
                    ? "bg-[#1dd79b]/20 text-[#1dd79b] shadow-[0_0_10px_rgba(29,215,155,0.3)]"
                    : "text-gray-400 hover:text-[#1dd79b] hover:bg-black/50"
                }`}
              >
                Browse
              </Link>
              <Link
                href="/provider"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  pathname === "/provider"
                    ? "bg-[#1dd79b]/20 text-[#1dd79b] shadow-[0_0_10px_rgba(29,215,155,0.3)]"
                    : "text-gray-400 hover:text-[#1dd79b] hover:bg-black/50"
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/agent"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  pathname === "/agent"
                    ? "bg-[#1dd79b]/20 text-[#1dd79b] shadow-[0_0_10px_rgba(29,215,155,0.3)]"
                    : "text-gray-400 hover:text-[#1dd79b] hover:bg-black/50"
                }`}
              >
                Agent
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {connected && publicKey && (
              <>
                <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-[#1dd79b]/10 rounded-lg border border-[#1dd79b]/30">
                  <div className="w-2 h-2 bg-[#1dd79b] rounded-full animate-pulse shadow-[0_0_10px_rgba(29,215,155,0.8)]"></div>
                  <span className="text-sm font-medium text-[#1dd79b]">
                    {publicKey.toBase58().slice(0, 4)}...
                    {publicKey.toBase58().slice(-4)}
                  </span>
                </div>
                <ReputationBadge
                  wallet={publicKey.toBase58()}
                  className="hidden lg:flex"
                />
              </>
            )}
            <WalletButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
