export const solanaConfig = {
  network: process.env.SOLANA_NETWORK || "devnet",
  endpoint: process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com",
  recipient: process.env.SOLANA_RECIPIENT || "",
  mint:
    process.env.SOLANA_USDC_MINT ||
    "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU", // USDC devnet mint
};
