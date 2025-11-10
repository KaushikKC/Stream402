import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { saveAsset, UPLOAD_DIR, THUMB_DIR, AssetMetadata } from "@/lib/storage";
import { solanaConfig } from "@/lib/solana-config";
import { uploadToIPFS } from "@/lib/ipfs";
import { generateThumbnail } from "@/lib/thumbnail";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const title = (formData.get("title") as string) || "Untitled";
    const price = (formData.get("price") as string) || "0.01";
    const recipient =
      (formData.get("recipient") as string) || solanaConfig.recipient;
    const tagsInput = (formData.get("tags") as string) || "";
    // Parse tags from comma-separated string
    const tags = tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

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

    // Save original file locally (for fallback)
    const filename = `${assetId}_${file.name}`;
    const filepath = path.join(UPLOAD_DIR, filename);
    await writeFile(filepath, buffer);

    // Generate low-resolution thumbnail
    let thumbFilename: string;
    try {
      thumbFilename = await generateThumbnail(buffer, filename, 400, 400, 70);
      console.log("Generated thumbnail:", thumbFilename);
    } catch (thumbError) {
      console.error("Thumbnail generation failed, using original:", thumbError);
      thumbFilename = filename; // Fallback to original
    }

    // Upload to IPFS
    let ipfsCid: string | undefined;
    let ipfsUrl: string | undefined;

    try {
      const fileForIPFS = new File([buffer], file.name, { type: file.type });
      const ipfsResult = await uploadToIPFS(fileForIPFS, filename);
      ipfsCid = ipfsResult.cid;
      ipfsUrl = ipfsResult.url;
      console.log("Uploaded to IPFS:", { cid: ipfsCid, url: ipfsUrl });
    } catch (ipfsError) {
      console.error("IPFS upload failed, using local storage:", ipfsError);
      // Continue with local storage if IPFS fails
    }

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
      ipfsCid,
      ipfsUrl,
      tags: tags.length > 0 ? tags : undefined,
      createdAt: Date.now(),
    };

    saveAsset(metadata);

    return NextResponse.json({
      assetId,
      url: `/api/asset/${assetId}`,
      title,
      price: priceNumber,
      ipfsCid,
      ipfsUrl,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
