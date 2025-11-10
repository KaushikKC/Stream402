/**
 * NFT Minting for Reputation Scores using Metaplex
 * Mints reputation NFTs after successful payments
 */

import { createProgrammableNft } from "@metaplex-foundation/mpl-token-metadata";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import {
  createGenericFile,
  createSignerFromKeypair,
  generateSigner,
  percentAmount,
  publicKey,
  signerIdentity,
  sol,
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { base58 } from "@metaplex-foundation/umi/serializers";
import {
  fromWeb3JsKeypair,
  fromWeb3JsPublicKey,
} from "@metaplex-foundation/umi-web3js-adapters";
import {
  Keypair,
  Connection,
  PublicKey as Web3JsPublicKey,
} from "@solana/web3.js";
import { solanaConfig } from "./solana-config";
import { ReputationMetadata } from "./reputation";

// Irys uploader for Arweave
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";

export interface ReputationNFTRecord {
  wallet: string;
  mint: string;
  score: number;
  level: string;
  metadata: ReputationMetadata;
  timestamp: number;
  transactionSignature?: string;
}

/**
 * Generate SVG image buffer for reputation NFT
 */
function generateReputationImageBuffer(level: string, score: number): Buffer {
  const svg = `
    <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#6366f1;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="400" height="400" fill="url(#grad)"/>
      <text x="200" y="180" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white" text-anchor="middle">${level}</text>
      <text x="200" y="240" font-family="Arial, sans-serif" font-size="32" fill="white" text-anchor="middle">Score: ${score}</text>
      <text x="200" y="300" font-family="Arial, sans-serif" font-size="24" fill="white" text-anchor="middle">Reputation NFT</text>
    </svg>
  `.trim();

  return Buffer.from(svg);
}

/**
 * Mint a reputation NFT using Metaplex
 * @param wallet - The wallet address of the user
 * @param metadata - The reputation metadata
 * @param serviceKeypair - Optional service keypair for server-side minting
 * @returns The mint address and transaction signature
 */
export async function mintReputationNFT(
  wallet: string,
  metadata: ReputationMetadata,
  serviceKeypair?: Keypair
): Promise<{ mint: string; signature?: string } | null> {
  console.log("🚀 Starting NFT minting process for wallet:", wallet);
  console.log("📋 Metadata:", {
    name: metadata.name,
    level: metadata.attributes[0]?.value,
    score: metadata.attributes[1]?.value,
  });

  try {
    // Get Metaplex API key from environment (optional)
    const metaplexApiKey = process.env.METAPLEX_API_KEY || "";
    const metaplexRpc = metaplexApiKey
      ? `https://devnet-aura.metaplex.com/${metaplexApiKey}`
      : solanaConfig.endpoint;

    // Create UMI instance
    const umi = createUmi(metaplexRpc)
      .use(mplTokenMetadata())
      .use(
        irysUploader({
          address: "https://devnet.irys.xyz",
        })
      );

    // Use service keypair if provided (server-side), otherwise generate a signer
    if (serviceKeypair) {
      // Convert Web3.js keypair to UMI keypair
      const umiKeypair = fromWeb3JsKeypair(serviceKeypair);
      // Create a signer from the keypair - this properly implements the Signer interface
      const umiSigner = createSignerFromKeypair(umi, umiKeypair);
      // Use the signer identity - this sets up the signer for UMI
      umi.use(signerIdentity(umiSigner));
    } else {
      // For server-side minting without a service keypair, we need to generate one
      // In production, you should use a funded service wallet
      // For now, we'll generate a signer (but it won't have funds for fees)
      console.warn(
        "No service keypair provided. Generating a new signer. This may fail if not funded."
      );
      const generatedSigner = generateSigner(umi);
      umi.use(signerIdentity(generatedSigner));

      // Note: In production, you should:
      // 1. Create a service wallet and fund it with SOL
      // 2. Store the keypair securely (e.g., in environment variables)
      // 3. Use that keypair here for server-side minting
    }

    // Generate SVG image buffer
    const imageBuffer = generateReputationImageBuffer(
      metadata.attributes[0].value as string,
      metadata.attributes[1].value as number
    );

    // Create generic file for upload
    const umiImageFile = createGenericFile(imageBuffer, "reputation-nft.svg", {
      tags: [{ name: "Content-Type", value: "image/svg+xml" }],
    });

    // Upload image to Arweave via Irys
    console.log("🔄 Uploading reputation NFT image to Arweave...");
    let imageUris;
    try {
      imageUris = await umi.uploader.upload([umiImageFile]);
      console.log("✅ Image upload completed, received URIs:", imageUris);
    } catch (err) {
      console.error("❌ Error uploading image to Arweave:", err);
      console.error(
        "Error details:",
        err instanceof Error ? err.stack : String(err)
      );
      throw new Error(
        `Failed to upload image: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }

    if (!imageUris || imageUris.length === 0) {
      console.error("❌ No image URIs returned from upload");
      throw new Error("Failed to upload image: No URIs returned");
    }

    const imageUri = imageUris[0];
    console.log("✅ Image uploaded successfully to:", imageUri);

    // Prepare metadata with uploaded image URI
    const nftMetadata = {
      name: metadata.name,
      description: metadata.description,
      image: imageUri,
      external_url: `https://explorer.solana.com/address/${wallet}?cluster=devnet`,
      attributes: metadata.attributes,
      properties: {
        files: [
          {
            uri: imageUri,
            type: "image/svg+xml",
          },
        ],
        category: "image",
      },
    };

    // Upload metadata to Arweave
    console.log("🔄 Uploading reputation NFT metadata to Arweave...");
    let metadataUri;
    try {
      metadataUri = await umi.uploader.uploadJson(nftMetadata);
      console.log("✅ Metadata uploaded successfully to:", metadataUri);
    } catch (err) {
      console.error("❌ Error uploading metadata to Arweave:", err);
      console.error(
        "Error details:",
        err instanceof Error ? err.stack : String(err)
      );
      throw new Error(
        `Failed to upload metadata: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }

    if (!metadataUri) {
      console.error("❌ No metadata URI returned from upload");
      throw new Error("Failed to upload metadata: No URI returned");
    }

    // Generate signer for the NFT mint
    const nftSigner = generateSigner(umi);
    console.log("🔑 Generated NFT signer:", nftSigner.publicKey.toString());

    // Create programmable NFT
    // Metaplex ruleset: publicKey("eBJLFYPxJmMGKuFwpDWkzxZeUrad92kZRC5BJLpzyT9")
    // Compatibility ruleset: publicKey("AdH2Utn6Fus15ZhtenW4hZBQnvtLgM1YCW2MfVp7pYS5")
    const ruleset = null; // Use null for no ruleset, or set a publicKey from above

    console.log("🔄 Creating reputation NFT on-chain...");
    console.log("NFT details:", {
      name: nftMetadata.name,
      metadataUri,
      mint: nftSigner.publicKey.toString(),
    });

    let tx;
    try {
      tx = await createProgrammableNft(umi, {
        mint: nftSigner,
        sellerFeeBasisPoints: percentAmount(0), // No royalty for reputation NFTs
        name: nftMetadata.name,
        uri: metadataUri,
        ruleSet: ruleset,
      }).sendAndConfirm(umi);
      console.log("✅ NFT creation transaction sent and confirmed");
    } catch (err) {
      console.error("❌ Error creating NFT on-chain:", err);
      console.error(
        "Error details:",
        err instanceof Error ? err.stack : String(err)
      );
      throw err;
    }

    // Deserialize the signature
    let signature: string;
    try {
      signature = base58.deserialize(tx.signature)[0];
      console.log("✅ Transaction signature deserialized:", signature);
    } catch (err) {
      console.error("❌ Error deserializing transaction signature:", err);
      throw new Error("Failed to deserialize transaction signature");
    }

    const explorerUrl = `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
    const nftUrl = `https://explorer.solana.com/address/${nftSigner.publicKey}?cluster=devnet`;

    console.log("\n✅ Reputation NFT Created Successfully!");
    console.log("📦 Mint Address:", nftSigner.publicKey.toString());
    console.log("📝 Transaction Signature:", signature);
    console.log("🔗 View Transaction:", explorerUrl);
    console.log("🔗 View NFT:", nftUrl);

    return {
      mint: nftSigner.publicKey.toString(),
      signature,
    };
  } catch (error) {
    console.error("❌ Error minting reputation NFT:", error);
    console.error(
      "Error type:",
      error instanceof Error ? error.constructor.name : typeof error
    );
    console.error(
      "Error message:",
      error instanceof Error ? error.message : String(error)
    );
    if (error instanceof Error && error.stack) {
      console.error("Error stack:", error.stack);
    }
    return null;
  }
}

/**
 * Client-side NFT minting function
 * This should be called from the frontend with the user's wallet adapter
 */
export async function mintReputationNFTClient(
  wallet: string,
  metadata: ReputationMetadata,
  walletAdapter: any // Wallet adapter from @solana/wallet-adapter-react
): Promise<{ mint: string; signature?: string } | null> {
  try {
    if (!walletAdapter || !walletAdapter.publicKey) {
      throw new Error("Wallet not connected");
    }

    // Get Metaplex API key from environment (optional)
    const metaplexApiKey = process.env.NEXT_PUBLIC_METAPLEX_API_KEY || "";
    const metaplexRpc = metaplexApiKey
      ? `https://devnet-aura.metaplex.com/${metaplexApiKey}`
      : solanaConfig.endpoint;

    // Create UMI instance
    const umi = createUmi(metaplexRpc).use(
      irysUploader({
        address: "https://devnet.irys.xyz",
      })
    );

    // Use the user's wallet
    const userPublicKey = fromWeb3JsPublicKey(walletAdapter.publicKey);
    // Note: You'll need to create a signer from the wallet adapter
    // This is a simplified version - in production, you'd properly integrate with the wallet adapter

    // For now, we'll use the server-side function
    // In a full implementation, you'd create a UMI signer from the wallet adapter
    return await mintReputationNFT(wallet, metadata);
  } catch (error) {
    console.error("Error minting reputation NFT client-side:", error);
    return null;
  }
}

/**
 * Create a service keypair from environment variable
 * For server-side NFT minting, you need a funded service wallet
 */
export function getServiceKeypair(): Keypair | null {
  try {
    const serviceWalletPrivateKey = process.env.SERVICE_WALLET_PRIVATE_KEY;
    if (!serviceWalletPrivateKey) {
      console.warn("SERVICE_WALLET_PRIVATE_KEY not set. NFT minting may fail.");
      return null;
    }

    // Parse the private key (can be base58 string or array)
    let privateKey: Uint8Array;
    if (serviceWalletPrivateKey.startsWith("[")) {
      // Array format: [1,2,3,...]
      privateKey = new Uint8Array(JSON.parse(serviceWalletPrivateKey));
    } else {
      // Base58 format - try to decode
      try {
        // Try using bs58 if available
        const bs58 = require("bs58");
        privateKey = bs58.decode(serviceWalletPrivateKey);
      } catch {
        // If bs58 not available, try parsing as comma-separated numbers
        const numbers = serviceWalletPrivateKey
          .split(",")
          .map((n) => parseInt(n.trim(), 10));
        if (numbers.length === 64) {
          privateKey = new Uint8Array(numbers);
        } else {
          throw new Error("Invalid private key format");
        }
      }
    }

    return Keypair.fromSecretKey(privateKey);
  } catch (error) {
    console.error("Error creating service keypair:", error);
    return null;
  }
}
