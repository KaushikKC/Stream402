import { PinataSDK } from "pinata";

// Pinata configuration
// Get your JWT token from https://app.pinata.cloud/
// You can use the public gateway or your own dedicated gateway
const PINATA_JWT = process.env.PINATA_JWT || "";
const PINATA_GATEWAY = process.env.PINATA_GATEWAY || "gateway.pinata.cloud";

let pinataClient: PinataSDK | null = null;

/**
 * Initialize Pinata client
 */
function getPinataClient(): PinataSDK {
  if (!pinataClient) {
    if (!PINATA_JWT) {
      throw new Error(
        "PINATA_JWT is not set. Get your JWT token from https://app.pinata.cloud/"
      );
    }
    pinataClient = new PinataSDK({
      pinataJwt: PINATA_JWT,
      pinataGateway: PINATA_GATEWAY,
    });
  }
  return pinataClient;
}

export interface IPFSUploadResult {
  cid: string;
  url: string;
}

/**
 * Upload a file to IPFS using Pinata
 * @param file - File to upload
 * @param filename - Optional filename
 * @returns CID and IPFS URL
 */
export async function uploadToIPFS(
  file: File | Buffer,
  filename?: string
): Promise<IPFSUploadResult> {
  try {
    const pinata = getPinataClient();

    // Convert Buffer to File if needed
    let fileToUpload: File;
    if (Buffer.isBuffer(file)) {
      // Convert Buffer to File
      const uint8Array = new Uint8Array(file);
      fileToUpload = new File([uint8Array], filename || "file", {
        type: "application/octet-stream",
      });
    } else {
      fileToUpload = file;
    }

    // Upload to Pinata (using public network)
    const result = await pinata.upload.public.file(fileToUpload);

    // Get CID from result
    const cid = result.cid;

    // Construct IPFS URL using Pinata gateway
    const url = `https://${PINATA_GATEWAY}/ipfs/${cid}`;

    console.log("Uploaded to IPFS via Pinata:", { cid, url, filename });

    return { cid, url };
  } catch (error) {
    console.error("IPFS upload error:", error);
    throw new Error(
      `Failed to upload to IPFS: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Upload multiple files to IPFS
 * @param files - Array of files to upload
 * @returns Array of CIDs and URLs
 */
export async function uploadMultipleToIPFS(
  files: File[]
): Promise<IPFSUploadResult[]> {
  try {
    const pinata = getPinataClient();

    // Upload directory to Pinata (using public network)
    const result = await pinata.upload.public.fileArray(files);

    // Get CID from result
    const directoryCid = result.cid;

    // For multiple files, Pinata returns a single CID for the directory
    // Each file will be accessible at /filename
    return files.map((file) => ({
      cid: directoryCid,
      url: `https://${PINATA_GATEWAY}/ipfs/${directoryCid}/${file.name}`,
    }));
  } catch (error) {
    console.error("IPFS upload error:", error);
    throw new Error(
      `Failed to upload to IPFS: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
