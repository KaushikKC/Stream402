import { NextRequest, NextResponse } from "next/server";
import { getAsset } from "@/lib/storage";
import { verifyJwt } from "@/lib/jwt";
import { solanaConfig } from "@/lib/solana-config";
import { v4 as uuidv4 } from "uuid";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Check for authorization token
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";

  if (token) {
    const decoded = verifyJwt<{ assetId: string; exp: number }>(token);
    if (decoded && decoded.assetId === id) {
      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp >= now) {
        // Authorized - return download URL
        const url = `/api/full/${id}`;
        return NextResponse.json({ url });
      }
    }
  }

  // Not authorized - return 402 payment challenge
  const asset = getAsset(id);
  if (!asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  const paymentRequestToken = uuidv4(); // In production, this should be a signed token

  const paymentRequest = {
    imageId: id,
    network: `solana:${solanaConfig.network}`,
    currency: asset.currency,
    decimals: asset.decimals,
    amount: asset.price,
    mint: asset.mint,
    recipient: asset.recipient,
  };

  return new NextResponse(
    JSON.stringify({
      error: "Payment Required",
      paymentRequest,
      paymentRequestToken,
    }),
    {
      status: 402,
      headers: { "Content-Type": "application/json" },
    }
  );
}
