"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import {
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount,
  getAssociatedTokenAddress,
} from "@solana/spl-token";

type ImageItem = { id: string; title: string; thumb: string; tags?: string[] };

// Component to handle image loading with fallback
function ImageThumbnail({
  src,
  alt,
  onClick,
}: {
  src: string;
  alt: string;
  onClick: () => void;
}) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError(false);
    // Fetch the image and create a blob URL
    fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        setImageSrc(blobUrl);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading image:", src, err);
        setError(true);
        setLoading(false);
      });
  }, [src]);

  useEffect(() => {
    // Cleanup blob URL on unmount
    return () => {
      if (imageSrc && imageSrc.startsWith("blob:")) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [imageSrc]);

  if (error) {
    return (
      <div
        className="w-full h-48 flex items-center justify-center bg-gradient-to-br from-gray-900/60 to-black/60 backdrop-blur-sm rounded-xl mb-3 cursor-pointer hover:from-gray-800/70 hover:to-gray-900/70 transition-all duration-300 border border-gray-700/50"
        onClick={onClick}
      >
        <div className="text-center">
          <svg
            className="w-12 h-12 text-gray-400 mx-auto mb-2"
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
          <p className="text-sm text-gray-500 font-medium">Image not found</p>
        </div>
      </div>
    );
  }

  if (loading || !imageSrc) {
    return (
      <div
        className="w-full h-48 flex items-center justify-center bg-gradient-to-br from-gray-900/60 to-black/60 backdrop-blur-sm rounded-xl mb-3 cursor-pointer border border-gray-700/50 animate-pulse"
        onClick={onClick}
      >
        <div className="text-center">
          <svg
            className="animate-spin h-8 w-8 text-gray-400 mx-auto mb-2"
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
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full h-48 flex items-center justify-center bg-gradient-to-br from-gray-900/60 to-black/60 backdrop-blur-sm rounded-xl mb-3 overflow-hidden cursor-pointer group hover:shadow-lg transition-all duration-300 border border-gray-700/50"
      onClick={onClick}
    >
      <img
        src={imageSrc}
        alt={alt}
        className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105"
        onError={() => {
          console.error("Image render error:", src);
          setError(true);
        }}
      />
    </div>
  );
}

type CardState =
  | { status: "idle" }
  | { status: "checking" }
  | {
      status: "requires_payment";
      paymentRequest: PaymentRequest;
      paymentRequestToken: string;
    }
  | { status: "paying" }
  | { status: "authorized"; url: string; expiresAt: number }
  | { status: "error"; message: string };

type PaymentRequest = {
  version?: string;
  imageId: string;
  assetId: string;
  network: string;
  currency: string;
  decimals: number;
  amount: number;
  mint: string;
  recipient: string;
  expiresAt?: number;
};

export default function ImagesPage() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [card, setCard] = useState<Record<string, CardState>>({});
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const { connection } = useConnection();
  const { publicKey, connected, connect, sendTransaction } = useWallet();
  const walletAddress = useMemo(() => publicKey?.toBase58() ?? "", [publicKey]);
  const [nowTs, setNowTs] = useState<number>(() => Date.now());

  // Fetch images from API
  const fetchImages = useCallback(async (searchTerm?: string) => {
    try {
      setIsSearching(!!searchTerm);
      const url = searchTerm
        ? `/api/images/search?q=${encodeURIComponent(searchTerm)}`
        : "/api/images/list";
      const res = await fetch(url);
      const data = await res.json();
      console.log("Fetched images:", data);
      if (data.images && Array.isArray(data.images)) {
        setImages(data.images);
      } else {
        console.warn("No images found or invalid format:", data);
        setImages([]);
      }
    } catch (err) {
      console.error("Error fetching images:", err);
      setImages([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch - only fetch all images if not searching
    if (!searchQuery.trim()) {
      fetchImages();
    }

    // Only set up auto-refresh if not searching
    if (searchQuery.trim()) {
      // Don't auto-refresh when searching - search results should stay stable
      return;
    }

    // Refresh images every 5 seconds to catch new uploads (only when not searching)
    const interval = setInterval(() => {
      fetchImages();
    }, 5000);
    return () => clearInterval(interval);
  }, [searchQuery, fetchImages]); // Re-run when searchQuery changes

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchImages(searchQuery.trim());
    } else {
      fetchImages();
    }
  };

  useEffect(() => {
    const id = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  function formatUnits(amount: number | bigint, decimals: number): string {
    const bi = typeof amount === "bigint" ? amount : BigInt(amount);
    const base = 10n ** BigInt(decimals);
    const integer = bi / base;
    const fraction = bi % base;
    const fractionStr = fraction
      .toString()
      .padStart(decimals, "0")
      .replace(/0+$/, "");
    return fractionStr
      ? `${integer.toString()}.${fractionStr}`
      : integer.toString();
  }

  async function checkAccess(id: string) {
    setCard((prev) => ({ ...prev, [id]: { status: "checking" } }));

    try {
      const res = await fetch(`/api/asset/${id}`);
      if (res.status === 200) {
        const { url } = (await res.json()) as { url: string };
        const fallbackExpiry = Date.now() + 60 * 1000;
        setCard((prev) => ({
          ...prev,
          [id]: { status: "authorized", url, expiresAt: fallbackExpiry },
        }));
        return;
      }

      if (res.status !== 402) {
        setCard((prev) => ({
          ...prev,
          [id]: { status: "error", message: `Unexpected status ${res.status}` },
        }));
        return;
      }

      const response = (await res.json()) as {
        challenge?: PaymentRequest;
        paymentRequest?: PaymentRequest; // Legacy format
        paymentRequestToken?: string;
        reason?: string;
        missing?: string[];
      };

      // Support both new standardized format and legacy format
      const paymentRequest = response.challenge || response.paymentRequest;
      const paymentRequestToken = response.paymentRequestToken;

      if (!paymentRequest) {
        setCard((prev) => ({
          ...prev,
          [id]: {
            status: "error",
            message: "Invalid payment challenge format",
          },
        }));
        return;
      }

      if (!paymentRequest.mint || !paymentRequest.recipient) {
        setCard((prev) => ({
          ...prev,
          [id]: { status: "error", message: "Server payment details missing" },
        }));
        return;
      }

      if (!paymentRequestToken) {
        const msg = "Server missing paymentRequestToken; cannot bind memo.";
        setCard((prev) => ({
          ...prev,
          [id]: { status: "error", message: msg },
        }));
        return;
      }

      // Check if challenge is expired
      if (paymentRequest.expiresAt) {
        const now = Math.floor(Date.now() / 1000);
        if (paymentRequest.expiresAt < now) {
          setCard((prev) => ({
            ...prev,
            [id]: {
              status: "error",
              message: "Payment challenge expired. Please try again.",
            },
          }));
          return;
        }
      }

      setCard((prev) => ({
        ...prev,
        [id]: {
          status: "requires_payment",
          paymentRequest,
          paymentRequestToken,
        },
      }));
    } catch (e: unknown) {
      setCard((prev) => ({
        ...prev,
        [id]: {
          status: "error",
          message: e instanceof Error ? e.message : String(e),
        },
      }));
    }
  }

  async function pay(id: string) {
    const st = card[id];
    if (!st || st.status !== "requires_payment") return;

    setError(null);
    setCard((prev) => ({ ...prev, [id]: { status: "paying" } }));

    const { paymentRequest, paymentRequestToken } = st;

    try {
      if (!connected) {
        await connect();
      }

      if (!publicKey || !sendTransaction) {
        setCard((prev) => ({
          ...prev,
          [id]: { status: "error", message: "Wallet not connected" },
        }));
        return;
      }

      const mint = new PublicKey(paymentRequest.mint);
      const recipient = new PublicKey(paymentRequest.recipient);
      const owner = publicKey;

      // Note: You can use the same wallet for testing, but for real scenarios,
      // you should use different wallets (one for upload/recipient, one for payment)

      const ownerAta = await getAssociatedTokenAddress(mint, owner, false);
      const recipientAta = await getAssociatedTokenAddress(
        mint,
        recipient,
        false
      );

      // Check balance
      let ownerAccount: Awaited<ReturnType<typeof getAccount>> | undefined;
      try {
        ownerAccount = await getAccount(connection, ownerAta);
      } catch {
        ownerAccount = undefined;
      }

      const amountRequired = BigInt(paymentRequest.amount);
      const ownerAmount = ownerAccount
        ? BigInt(ownerAccount.amount.toString())
        : 0n;

      if (ownerAmount < amountRequired) {
        setCard((prev) => ({
          ...prev,
          [id]: {
            status: "error",
            message: `Not enough USDC. Fund your wallet at https://faucet.circle.com/ (wallet: ${
              walletAddress || "unknown"
            })`,
          },
        }));
        return;
      }

      const instructions: TransactionInstruction[] = [];

      if (!ownerAccount) {
        instructions.push(
          createAssociatedTokenAccountInstruction(owner, ownerAta, owner, mint)
        );
      }

      try {
        await getAccount(connection, recipientAta);
      } catch {
        instructions.push(
          createAssociatedTokenAccountInstruction(
            owner,
            recipientAta,
            recipient,
            mint
          )
        );
      }

      instructions.push(
        createTransferInstruction(ownerAta, recipientAta, owner, amountRequired)
      );

      const { blockhash } = await connection.getLatestBlockhash();
      const messageV0 = new TransactionMessage({
        payerKey: owner,
        recentBlockhash: blockhash,
        instructions,
      }).compileToV0Message();

      const tx = new VersionedTransaction(messageV0);
      const signature = await sendTransaction(tx, connection, {
        maxRetries: 5,
        skipPreflight: true,
      });

      // Confirm before requesting receipt to avoid race conditions
      try {
        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash();
        await connection.confirmTransaction(
          { signature, blockhash, lastValidBlockHeight },
          "confirmed"
        );
      } catch {
        // best-effort; proceed to server which will also validate
      }

      const rec = await fetch("/api/receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signature,
          paymentRequestToken,
          imageId: id,
          challenge: {
            expiresAt: paymentRequest.expiresAt,
          },
        }),
      });

      if (!rec.ok) {
        const j = await rec.json().catch(() => ({}));
        console.log("Receipt failed:", j);
        setCard((prev) => ({
          ...prev,
          [id]: {
            status: "error",
            message: `Receipt failed: ${j.error ?? rec.status}`,
          },
        }));
        return;
      }

      const { accessToken } = (await rec.json()) as { accessToken: string };

      const full = await fetch(`/api/asset/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!full.ok) {
        const j = await full.json().catch(() => ({}));
        setCard((prev) => ({
          ...prev,
          [id]: {
            status: "error",
            message: `Fetch full failed: ${j.error ?? full.status}`,
          },
        }));
        return;
      }

      const { url } = (await full.json()) as { url: string };

      const u = new URL(url, window.location.origin);
      u.searchParams.set("access", accessToken);

      // Derive expiry from JWT exp if present
      const expSec = (() => {
        try {
          const [, p] = accessToken.split(".");
          if (!p) return undefined;
          const json = atob(p.replace(/-/g, "+").replace(/_/g, "/"));
          const payload = JSON.parse(json) as { exp?: number };
          return typeof payload.exp === "number" ? payload.exp : undefined;
        } catch {
          return undefined;
        }
      })();

      const expiresAt = expSec ? expSec * 1000 : Date.now() + 4 * 60 * 1000;

      setCard((prev) => ({
        ...prev,
        [id]: { status: "authorized", url: u.toString(), expiresAt },
      }));
      window.open(u.toString(), "_blank");
    } catch (e: unknown) {
      setCard((prev) => ({
        ...prev,
        [id]: {
          status: "error",
          message: e instanceof Error ? e.message : String(e),
        },
      }));
    }
  }

  return (
    <main className="min-h-screen relative py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold gradient-text mb-3">
            Image Gallery
          </h1>
          <p className="text-gray-300 text-lg font-light">
            Browse and purchase images. Pay with USDC to access full-resolution
            downloads.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or tags (e.g., sunrise, sunset, nature)..."
                className="w-full pl-12 pr-4 py-3 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1dd79b] focus:border-[#1dd79b] transition-all duration-200 bg-black/70 shadow-sm text-gray-200 placeholder:text-gray-500"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-[#14966c] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              {isSearching ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
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
                  Searching...
                </span>
              ) : (
                "Search"
              )}
            </button>
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  fetchImages();
                }}
                className="px-4 py-3 bg-gray-700 text-gray-200 rounded-xl font-semibold hover:bg-gray-600 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
              >
                Clear
              </button>
            )}
          </form>
          {searchQuery && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-gray-400">
                Showing results for:
              </span>
              <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                "{searchQuery}"
              </span>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5"
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
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {images.length === 0 && !isSearching && (
          <div className="text-center py-16">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
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
            <h3 className="text-2xl font-semibold text-gray-300 mb-2">
              No images found
            </h3>
            <p className="text-gray-400 mb-6">
              {searchQuery
                ? "Try a different search term"
                : "Upload your first image to get started"}
            </p>
            {!searchQuery && (
              <Link
                href="/upload"
                className="inline-block px-6 py-3 bg-gradient-to-r from-[#1dd79b] to-[#14966c] text-black rounded-xl font-semibold shadow-lg hover:shadow-[0_0_30px_rgba(29,215,155,0.5)] transform hover:-translate-y-0.5 transition-all duration-300"
              >
                Upload Image
              </Link>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {images.map((img) => {
            const st = card[img.id] ?? ({ status: "idle" } as CardState);
            const remaining =
              st.status === "authorized"
                ? Math.max(0, Math.floor((st.expiresAt - nowTs) / 1000))
                : undefined;

            return (
              <div
                key={img.id}
                className="relative bg-gradient-to-br from-black/30 via-black/20 to-black/30 backdrop-blur-2xl rounded-3xl shadow-2xl hover:shadow-[0_0_40px_rgba(29,215,155,0.5)] transition-all duration-500 border border-[#1dd79b]/40 overflow-hidden group hover:-translate-y-2 hover:scale-[1.02] before:absolute before:inset-0 before:bg-gradient-to-br before:from-[#1dd79b]/5 before:via-transparent before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500"
              >
                <ImageThumbnail
                  src={img.thumb}
                  alt={`thumb-${img.id}`}
                  onClick={() => checkAccess(img.id)}
                />
                <div className="p-5 relative z-10">
                  <h3 className="text-lg font-semibold text-gray-100 mb-3 line-clamp-2 group-hover:text-[#1dd79b] transition-colors duration-300">
                    {img.title}
                  </h3>
                  {img.tags && img.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {img.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2.5 py-1 bg-[#1dd79b]/10 text-[#1dd79b] rounded-full font-medium border border-[#1dd79b]/30"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    {connected && st.status === "idle" && (
                      <button
                        onClick={() => checkAccess(img.id)}
                        className="w-full px-4 py-2.5 bg-gradient-to-r from-[#1dd79b] to-[#14966c] text-black rounded-xl font-semibold shadow-md hover:shadow-lg hover:shadow-[0_0_20px_rgba(29,215,155,0.5)] transform hover:-translate-y-0.5 transition-all duration-300"
                      >
                        Check Access
                      </button>
                    )}
                    {st.status === "checking" && (
                      <div className="w-full px-4 py-2.5 bg-black/70 text-gray-400 rounded-xl font-medium text-center flex items-center justify-center gap-2 border border-gray-700">
                        <svg
                          className="animate-spin h-5 w-5"
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
                        Checking...
                      </div>
                    )}
                    {!connected && st.status !== "authorized" && (
                      <div className="w-full px-4 py-2.5 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-xl text-sm text-center">
                        Connect wallet to check access
                      </div>
                    )}
                    {st.status === "requires_payment" && (
                      <div className="space-y-2">
                        <div className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                          <p className="text-sm font-semibold text-yellow-400 text-center">
                            Payment Required
                          </p>
                        </div>
                        {connected ? (
                          <button
                            onClick={() => pay(img.id)}
                            className="w-full px-4 py-2.5 bg-gradient-to-r from-[#1dd79b] to-[#14966c] text-black rounded-xl font-semibold shadow-md hover:shadow-lg hover:shadow-[0_0_20px_rgba(29,215,155,0.5)] transform hover:-translate-y-0.5 transition-all duration-300"
                          >
                            Pay{" "}
                            {formatUnits(
                              st.paymentRequest.amount,
                              st.paymentRequest.decimals
                            )}{" "}
                            {st.paymentRequest.currency}
                          </button>
                        ) : (
                          <div className="w-full px-4 py-2.5 bg-black/70 text-gray-400 rounded-xl text-sm text-center border border-gray-700">
                            Connect wallet to pay
                          </div>
                        )}
                      </div>
                    )}
                    {st.status === "paying" && (
                      <div className="w-full px-4 py-2.5 bg-blue-100 text-blue-700 rounded-xl font-medium text-center flex items-center justify-center gap-2">
                        <svg
                          className="animate-spin h-5 w-5"
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
                        Processing payment...
                      </div>
                    )}
                    {st.status === "authorized" && (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => window.open(st.url, "_blank")}
                            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#1dd79b] to-[#14966c] text-black rounded-xl font-semibold shadow-md hover:shadow-lg hover:shadow-[0_0_20px_rgba(29,215,155,0.5)] transform hover:-translate-y-0.5 transition-all duration-300"
                          >
                            View Full
                          </button>
                          <a
                            href={st.url}
                            download
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1"
                          >
                            <button className="w-full px-4 py-2.5 bg-gray-700 text-gray-200 rounded-xl font-semibold hover:bg-gray-600 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300">
                              Download
                            </button>
                          </a>
                        </div>
                        <div className="px-4 py-2 bg-[#1dd79b]/10 border border-[#1dd79b]/30 rounded-xl">
                          <p className="text-xs text-[#1dd79b] text-center font-medium">
                            Expires in {remaining}s
                          </p>
                        </div>
                      </div>
                    )}
                    {st.status === "error" && (
                      <div className="space-y-2">
                        <div className="px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-xl">
                          <p className="text-sm text-red-400 text-center font-medium">
                            {st.message}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            setCard((prev) => ({
                              ...prev,
                              [img.id]: { status: "idle" },
                            }))
                          }
                          className="w-full px-4 py-2.5 bg-gray-700 text-gray-200 rounded-xl font-semibold hover:bg-gray-600 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
                        >
                          Try Again
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
