"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
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
import { WalletButton } from "@/components/solana/solana-provider";

type ImageItem = { id: string; title: string; thumb: string };

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
  imageId: string;
  network: string;
  currency: string;
  decimals: number;
  amount: number;
  mint: string;
  recipient: string;
};

export default function ImagesPage() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [card, setCard] = useState<Record<string, CardState>>({});
  const { connection } = useConnection();
  const { publicKey, connected, connect, sendTransaction } = useWallet();
  const walletAddress = useMemo(() => publicKey?.toBase58() ?? "", [publicKey]);
  const [nowTs, setNowTs] = useState<number>(() => Date.now());

  useEffect(() => {
    // Fetch images from API
    fetch("/api/images/list")
      .then((res) => res.json())
      .then((data) => {
        if (data.images) {
          setImages(data.images);
        }
      })
      .catch((err) => {
        console.error("Error fetching images:", err);
        setImages([]);
      });
  }, []);

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

      const { paymentRequest, paymentRequestToken } = (await res.json()) as {
        paymentRequest: PaymentRequest;
        paymentRequestToken?: string;
        reason?: string;
        missing?: string[];
      };

      if (
        !paymentRequest ||
        !paymentRequest.mint ||
        !paymentRequest.recipient
      ) {
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
        body: JSON.stringify({ signature, paymentRequestToken, imageId: id }),
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
    <main style={{ padding: 24 }}>
      <h1 className="text-2xl font-bold mb-4">
        Pay 0.01 USDC devnet to see the full res image
      </h1>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: 12,
        }}
      >
        {images.map((img) => {
          const st = card[img.id] ?? ({ status: "idle" } as CardState);
          const remaining =
            st.status === "authorized"
              ? Math.max(0, Math.floor((st.expiresAt - nowTs) / 1000))
              : undefined;

          return (
            <div
              key={img.id}
              style={{
                border: "1px solid #e5e7eb",
                padding: 8,
                borderRadius: 6,
              }}
            >
              <img
                src={img.thumb}
                alt={`thumb-${img.id}`}
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                  borderRadius: 4,
                }}
                onClick={() => checkAccess(img.id)}
              />
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginTop: 8,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                {connected && st.status === "idle" && (
                  <button
                    onClick={() => checkAccess(img.id)}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Check access
                  </button>
                )}
                {st.status === "checking" && <span>Checking...</span>}
                {!connected && st.status !== "authorized" && <WalletButton />}
                {st.status === "requires_payment" && (
                  <>
                    <span style={{ color: "#b45309" }}>
                      402 Payment Required
                    </span>
                    {connected ? (
                      <button
                        onClick={() => pay(img.id)}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        Pay{" "}
                        {formatUnits(
                          st.paymentRequest.amount,
                          st.paymentRequest.decimals
                        )}{" "}
                        {st.paymentRequest.currency}
                      </button>
                    ) : (
                      <WalletButton />
                    )}
                  </>
                )}
                {st.status === "paying" && <span>Paying...</span>}
                {st.status === "authorized" && (
                  <>
                    <button
                      onClick={() => window.open(st.url, "_blank")}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Open full
                    </button>
                    <a href={st.url} download target="_blank" rel="noreferrer">
                      <button className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                        Download
                      </button>
                    </a>
                    <span style={{ marginLeft: 8, color: "#2563eb" }}>
                      Expires in {remaining}s
                    </span>
                  </>
                )}
                {st.status === "error" && (
                  <>
                    <span style={{ color: "crimson" }}>{st.message}</span>
                    <button
                      onClick={() =>
                        setCard((prev) => ({
                          ...prev,
                          [img.id]: { status: "idle" },
                        }))
                      }
                      className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                      Try again
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
