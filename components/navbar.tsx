"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletButton } from "@/components/solana/solana-provider";
import { usePathname } from "next/navigation";

export function Navbar() {
  const { connected, publicKey } = useWallet();
  const pathname = usePathname();

  return (
    <nav className="border-b border-gray-200 bg-white dark:bg-black">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                x402 Image Payment
              </span>
            </Link>
            <div className="ml-10 flex items-center space-x-4">
              <Link
                href="/"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === "/"
                    ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                Home
              </Link>
              <Link
                href="/upload"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === "/upload"
                    ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                Upload
              </Link>
              <Link
                href="/images"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === "/images"
                    ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                Browse Images
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {connected && publicKey && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="hidden sm:inline">
                  {publicKey.toBase58().slice(0, 4)}...
                  {publicKey.toBase58().slice(-4)}
                </span>
              </div>
            )}
            <WalletButton />
          </div>
        </div>
      </div>
    </nav>
  );
}

