import {
  Connection,
  PublicKey,
  ParsedTransactionWithMeta,
} from "@solana/web3.js";
import { solanaConfig } from "./solana-config";

const connection = new Connection(solanaConfig.endpoint, "confirmed");

export interface PaymentProof {
  signature: string;
  payerPubkey: string;
  network: string;
  amount?: number;
}

export async function verifyPayment(
  signature: string,
  recipient: string,
  requiredAmount: bigint,
  assetId: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    // Get transaction with full details
    const tx = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });

    if (!tx) {
      return { valid: false, error: "Transaction not found" };
    }

    if (!tx.meta) {
      return { valid: false, error: "Transaction metadata missing" };
    }

    if (tx.meta.err) {
      return {
        valid: false,
        error: `Transaction failed: ${JSON.stringify(tx.meta.err)}`,
      };
    }

    // Debug: Log transaction details
    console.log("Verifying payment:", {
      signature,
      recipient,
      requiredAmount: requiredAmount.toString(),
      postTokenBalances: tx.meta.postTokenBalances?.length || 0,
      preTokenBalances: tx.meta.preTokenBalances?.length || 0,
    });

    const recipientPubkey = new PublicKey(recipient);

    // Get the asset mint from config to verify we're checking the right token
    const expectedMint = solanaConfig.mint;

    // Find all token balances for the recipient
    const recipientPostBalances =
      tx.meta.postTokenBalances?.filter(
        (b) => b.owner === recipientPubkey.toBase58()
      ) || [];

    const recipientPreBalances =
      tx.meta.preTokenBalances?.filter(
        (b) => b.owner === recipientPubkey.toBase58()
      ) || [];

    if (recipientPostBalances.length === 0) {
      return {
        valid: false,
        error: "No token balance found for recipient in transaction",
      };
    }

    // Find the token account that matches our expected mint
    // Check both by mint and by account index
    let transferAmount = BigInt(0);
    let foundTransfer = false;

    for (const postBalance of recipientPostBalances) {
      // Skip if mint doesn't match (if we have a specific mint to check)
      if (expectedMint && postBalance.mint !== expectedMint) {
        continue;
      }

      // Find corresponding pre-balance by account index
      const preBalance = recipientPreBalances.find(
        (b) => b.accountIndex === postBalance.accountIndex
      );

      const preAmountRaw = preBalance
        ? BigInt(preBalance.uiTokenAmount.amount || "0")
        : BigInt(0);
      const postAmountRaw = BigInt(postBalance.uiTokenAmount.amount || "0");
      const diff = postAmountRaw - preAmountRaw;

      // If this account received tokens, use it
      if (diff > 0) {
        transferAmount = diff;
        foundTransfer = true;
        break;
      }
    }

    // If we didn't find a transfer by comparing balances, check if a new account was created
    // A new account would have a post balance but no pre balance
    if (!foundTransfer) {
      for (const postBalance of recipientPostBalances) {
        if (expectedMint && postBalance.mint !== expectedMint) {
          continue;
        }

        const preBalance = recipientPreBalances.find(
          (b) => b.accountIndex === postBalance.accountIndex
        );

        // If no pre-balance exists, this is a new account
        // The entire post balance is the transfer amount
        if (!preBalance) {
          const postAmountRaw = BigInt(postBalance.uiTokenAmount.amount || "0");
          if (postAmountRaw > 0) {
            transferAmount = postAmountRaw;
            foundTransfer = true;
            break;
          }
        }
      }
    }

    if (!foundTransfer || transferAmount === BigInt(0)) {
      // Debug: Log what we found
      console.log("Payment verification failed - no transfer found:", {
        recipientPostBalances: recipientPostBalances.map((b) => ({
          mint: b.mint,
          owner: b.owner,
          amount: b.uiTokenAmount.amount,
          accountIndex: b.accountIndex,
        })),
        recipientPreBalances: recipientPreBalances.map((b) => ({
          mint: b.mint,
          owner: b.owner,
          amount: b.uiTokenAmount.amount,
          accountIndex: b.accountIndex,
        })),
        expectedMint,
      });
      return {
        valid: false,
        error: "No token transfer to recipient found in transaction",
      };
    }

    // Debug: Log successful transfer detection
    console.log("Transfer amount detected:", {
      transferAmount: transferAmount.toString(),
      requiredAmount: requiredAmount.toString(),
      match: transferAmount >= requiredAmount,
    });

    if (transferAmount < requiredAmount) {
      return {
        valid: false,
        error: `Insufficient payment: received ${transferAmount}, required ${requiredAmount}`,
      };
    }

    // Check memo if present (optional - for binding to assetId)
    // Note: Memo checking is optional for MVP - we verify by amount and recipient
    // In production, you might want to add memo verification for additional security

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error:
        error instanceof Error
          ? error.message
          : "Unknown error during verification",
    };
  }
}
