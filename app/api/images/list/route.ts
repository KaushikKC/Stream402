import { NextResponse } from "next/server";
import { getAllAssets } from "@/lib/storage";

export async function GET() {
  try {
    const assets = getAllAssets();
    console.log("Found assets:", assets.length);
    const images = assets.map((asset) => ({
      id: asset.id,
      title: asset.title,
      thumb: asset.ipfsUrl || `/api/thumb/${asset.id}`, // Use IPFS URL if available, fallback to API route
      ipfsUrl: asset.ipfsUrl,
    }));

    console.log("Returning images:", images);
    return NextResponse.json({ images });
  } catch (error) {
    console.error("Error listing images:", error);
    return NextResponse.json({ images: [] });
  }
}
