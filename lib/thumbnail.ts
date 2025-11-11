import sharp from "sharp";
import { writeFile } from "fs/promises";
import path from "path";
import { THUMB_DIR } from "./storage";

/**
 * Generate a low-resolution thumbnail from an image
 * @param buffer - Image buffer
 * @param filename - Original filename
 * @param maxWidth - Maximum width for thumbnail (default: 400)
 * @param maxHeight - Maximum height for thumbnail (default: 400)
 * @param quality - JPEG quality (1-100, default: 70)
 * @returns Thumbnail filename
 */
export async function generateThumbnail(
  buffer: Buffer,
  filename: string,
  maxWidth: number = 400,
  maxHeight: number = 400,
  quality: number = 70
): Promise<string> {
  try {
    // Get file extension
    const ext = path.extname(filename).toLowerCase();
    const baseName = path.basename(filename, ext);

    // Generate thumbnail filename
    // For thumbnails, we convert to JPEG, so use .jpg extension
    const thumbExt = ext === ".svg" ? ext : ".jpg"; // Keep SVG as-is, convert others to JPEG
    const thumbFilename = `${baseName}_thumb${thumbExt}`;
    const thumbPath = path.join(THUMB_DIR, thumbFilename);

    // Use sharp to resize and compress the image
    let sharpInstance = sharp(buffer);

    // Get image metadata to determine if it's an image we can process
    const metadata = await sharpInstance.metadata();

    // For SVG files, we can't resize them with sharp, so we'll just copy a smaller version
    if (ext === ".svg") {
      // For SVG, we'll just save a copy (can't resize SVG easily)
      await writeFile(thumbPath, buffer);
      return thumbFilename;
    }

    // Resize image to thumbnail size
    // Maintain aspect ratio, fit within maxWidth x maxHeight
    const thumbnailBuffer = await sharpInstance
      .resize(maxWidth, maxHeight, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality }) // Convert to JPEG for smaller file size
      .toBuffer();

    // Save thumbnail
    await writeFile(thumbPath, thumbnailBuffer);

    console.log("Generated thumbnail:", {
      original: filename,
      thumbnail: thumbFilename,
      originalSize: buffer.length,
      thumbnailSize: thumbnailBuffer.length,
    });

    return thumbFilename;
  } catch (error) {
    console.error("Error generating thumbnail:", error);
    // If thumbnail generation fails, return original filename as fallback
    return filename;
  }
}

/**
 * Generate a low-resolution thumbnail buffer in memory (for serverless environments)
 * @param buffer - Image buffer
 * @param mimeType - Original file MIME type
 * @param maxWidth - Maximum width for thumbnail (default: 400)
 * @param maxHeight - Maximum height for thumbnail (default: 400)
 * @param quality - JPEG quality (1-100, default: 70)
 * @returns Thumbnail buffer
 */
export async function generateThumbnailBuffer(
  buffer: Buffer,
  mimeType: string,
  maxWidth: number = 400,
  maxHeight: number = 400,
  quality: number = 70
): Promise<Buffer> {
  try {
    // For SVG files, we can't resize them with sharp, so return original
    if (mimeType === "image/svg+xml" || mimeType.includes("svg")) {
      return buffer;
    }

    // Use sharp to resize and compress the image
    const sharpInstance = sharp(buffer);

    // Resize image to thumbnail size
    // Maintain aspect ratio, fit within maxWidth x maxHeight
    const thumbnailBuffer = await sharpInstance
      .resize(maxWidth, maxHeight, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality }) // Convert to JPEG for smaller file size
      .toBuffer();

    console.log("Generated thumbnail buffer:", {
      originalSize: buffer.length,
      thumbnailSize: thumbnailBuffer.length,
    });

    return thumbnailBuffer;
  } catch (error) {
    console.error("Error generating thumbnail buffer:", error);
    // If thumbnail generation fails, return original buffer as fallback
    return buffer;
  }
}

