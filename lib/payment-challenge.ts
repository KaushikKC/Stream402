/**
 * Standardized 402 Payment Challenge format
 * Based on X402 protocol specification
 */

export interface PaymentChallenge {
  // Standard fields
  version: string; // Protocol version
  network: string; // Network identifier (e.g., "solana:devnet")
  currency: string; // Currency code (e.g., "USDC")
  decimals: number; // Token decimals
  amount: number; // Amount in smallest unit
  mint: string; // Token mint address
  recipient: string; // Recipient wallet address
  expiresAt: number; // Unix timestamp (seconds) when challenge expires
  assetId: string; // Asset identifier
  paymentRequestToken: string; // Unique token for this payment request

  // Optional metadata
  description?: string; // Human-readable description
  metadata?: Record<string, unknown>; // Additional metadata
}

/**
 * Create a standardized 402 payment challenge
 */
export function createPaymentChallenge(
  assetId: string,
  amount: number,
  decimals: number,
  currency: string,
  mint: string,
  recipient: string,
  network: string,
  paymentRequestToken: string,
  expiresInSeconds: number = 300 // Default 5 minutes
): PaymentChallenge {
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

  return {
    version: "1.0",
    network,
    currency,
    decimals,
    amount,
    mint,
    recipient,
    expiresAt,
    assetId,
    paymentRequestToken,
  };
}

/**
 * Validate payment challenge expiration
 */
export function isChallengeExpired(challenge: PaymentChallenge): boolean {
  const now = Math.floor(Date.now() / 1000);
  return challenge.expiresAt < now;
}

/**
 * Format payment challenge for 402 response
 */
export function format402Response(challenge: PaymentChallenge) {
  return {
    error: "Payment Required",
    code: "PAYMENT_REQUIRED",
    challenge: {
      version: challenge.version,
      network: challenge.network,
      currency: challenge.currency,
      decimals: challenge.decimals,
      amount: challenge.amount,
      mint: challenge.mint,
      recipient: challenge.recipient,
      expiresAt: challenge.expiresAt,
      assetId: challenge.assetId,
    },
    paymentRequestToken: challenge.paymentRequestToken,
    description: challenge.description,
    metadata: challenge.metadata,
  };
}
