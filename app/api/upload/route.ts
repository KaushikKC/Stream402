import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { saveAsset, UPLOAD_DIR, THUMB_DIR, AssetMetadata } from "@/lib/storage";
import { solanaConfig } from "@/lib/solana-config";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const title = (formData.get("title") as string) || "Untitled";
    const price = (formData.get("price") as string) || "0.01";
    const recipient =
      (formData.get("recipient") as string) || solanaConfig.recipient;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!recipient) {
      return NextResponse.json(
        { error: "Recipient wallet address required" },
        { status: 400 }
      );
    }

    const assetId = uuidv4();
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save original file
    const filename = `${assetId}_${file.name}`;
    const filepath = path.join(UPLOAD_DIR, filename);
    await writeFile(filepath, buffer);

    // For MVP, we'll use the same file as thumbnail (in production, generate a thumbnail)
    const thumbFilename = filename;

    const priceNumber = parseFloat(price);
    const priceInSmallestUnit = BigInt(Math.floor(priceNumber * 1_000_000)); // 6 decimals for USDC

    const metadata: AssetMetadata = {
      id: assetId,
      title,
      price: Number(priceInSmallestUnit),
      decimals: 6,
      currency: "USDC",
      mint: solanaConfig.mint,
      recipient,
      filename,
      thumbFilename,
      createdAt: Date.now(),
    };

    saveAsset(metadata);

    return NextResponse.json({
      assetId,
      url: `/api/asset/${assetId}`,
      title,
      price: priceNumber,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
