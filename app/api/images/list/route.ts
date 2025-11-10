import { NextResponse } from "next/server";
import { getAllAssets } from "@/lib/storage";

export async function GET() {
  try {
    const assets = getAllAssets();
    console.log("Found assets:", assets.length);
    const images = assets.map((asset) => ({
      id: asset.id,
      title: asset.title,
      // Always use thumbnail API route for low-res previews (not IPFS URL)
      // IPFS URL would be full resolution, we want thumbnails for preview
      thumb: `/api/thumb/${asset.id}`,
      ipfsUrl: asset.ipfsUrl, // Full resolution IPFS URL (for after payment)
      tags: asset.tags || [],
    }));

    console.log("Returning images:", images);
    return NextResponse.json({ images });
  } catch (error) {
    console.error("Error listing images:", error);
    return NextResponse.json({ images: [] });
  }
}
