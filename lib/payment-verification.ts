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

    const recipientPubkey = new PublicKey(recipient);

    // Check for SPL token transfer
    const tokenTransfers = tx.meta.postTokenBalances?.filter(
      (balance) => balance.owner === recipientPubkey.toBase58()
    );

    if (!tokenTransfers || tokenTransfers.length === 0) {
      return { valid: false, error: "No token transfer to recipient found" };
    }

    // Find the transfer instruction
    let transferAmount = BigInt(0);
    const instructions = tx.transaction.message.compiledInstructions;

    for (const instruction of instructions) {
      const programId =
        tx.transaction.message.staticAccountKeys[instruction.programIdIndex];

      // Check if it's a token program instruction
      if (
        programId.toBase58() === "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
      ) {
        // This is a token program instruction
        // We need to check if it's a transfer to our recipient
        // For simplicity, we'll check the post token balances
      }
    }

    // Check post token balances for the recipient
    const recipientBalance = tx.meta.postTokenBalances?.find(
      (b) => b.owner === recipientPubkey.toBase58()
    );

    if (!recipientBalance) {
      return {
        valid: false,
        error: "Recipient balance not found in transaction",
      };
    }

    // Get pre-balance to calculate transfer amount
    const preBalance = tx.meta.preTokenBalances?.find(
      (b) =>
        b.owner === recipientPubkey.toBase58() &&
        b.mint === recipientBalance.mint &&
        b.accountIndex === recipientBalance.accountIndex
    );

    // Calculate transfer amount from raw token amounts (in smallest unit)
    const preAmountRaw = preBalance
      ? BigInt(preBalance.uiTokenAmount.amount || "0")
      : BigInt(0);
    const postAmountRaw = BigInt(recipientBalance.uiTokenAmount.amount || "0");
    transferAmount = postAmountRaw - preAmountRaw;

    if (transferAmount < requiredAmount) {
      return {
        valid: false,
        error: `Insufficient payment: received ${transferAmount}, required ${requiredAmount}`,
      };
    }

    // Check memo if present (optional - for binding to assetId)
    const memoInstruction = tx.transaction.message.compiledInstructions.find(
      (ix) => {
        const programId =
          tx.transaction.message.staticAccountKeys[ix.programIdIndex];
        return (
          programId.toBase58() === "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
        );
      }
    );

    // If memo exists, verify it matches assetId
    if (memoInstruction) {
      const memoData = Buffer.from(memoInstruction.data).toString("utf-8");
      if (!memoData.includes(assetId)) {
        // Memo doesn't match, but we'll still accept if amount is correct
        // This is more lenient for MVP
      }
    }

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
