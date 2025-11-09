import { NextRequest, NextResponse } from "next/server";
import { verifyPayment } from "@/lib/payment-verification";
import { getAsset, savePayment, getPaymentBySignature } from "@/lib/storage";
import { signJwt } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { signature, paymentRequestToken, imageId } = body;

    if (!signature || !paymentRequestToken || !imageId) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: signature, paymentRequestToken, imageId",
        },
        { status: 400 }
      );
    }

    // Check if payment already processed
    const existingPayment = getPaymentBySignature(signature);
    if (existingPayment) {
      // Payment already verified, return access token
      const accessToken = signJwt({ assetId: imageId }, "4m");
      return NextResponse.json({ accessToken });
    }

    // Get asset to verify payment amount
    const asset = getAsset(imageId);
    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // Verify payment on-chain
    const verification = await verifyPayment(
      signature,
      asset.recipient,
      BigInt(asset.price),
      imageId
    );

    if (!verification.valid) {
      return NextResponse.json(
        { error: verification.error || "Payment verification failed" },
        { status: 400 }
      );
    }

    // Save payment record
    savePayment({
      assetId: imageId,
      signature,
      payer: "", // Will be extracted from transaction if needed
      amount: asset.price,
      timestamp: Date.now(),
      paymentRequestToken,
    });

    // Generate access token
    const accessToken = signJwt({ assetId: imageId }, "4m");

    return NextResponse.json({ accessToken });
  } catch (error) {
    console.error("Receipt error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Receipt processing failed",
      },
      { status: 500 }
    );
  }
}
