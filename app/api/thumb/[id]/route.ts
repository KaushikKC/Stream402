import { NextRequest, NextResponse } from "next/server";
import { getAsset } from "@/lib/storage";
import { readFile, access } from "fs/promises";
import { constants } from "fs";
import path from "path";
import { UPLOAD_DIR } from "@/lib/storage";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const asset = getAsset(id);
  if (!asset) {
    console.error("Asset not found for id:", id);
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  // If IPFS URL is available, redirect to it
  if (asset.ipfsUrl) {
    console.log("Redirecting to IPFS URL:", asset.ipfsUrl);
    return NextResponse.redirect(asset.ipfsUrl, 302);
  }

  // Fallback to local file
  try {
    // For MVP, serve the original file as thumbnail
    // In production, you'd generate actual thumbnails
    // Use resolve to get absolute path
    const filepath = path.resolve(UPLOAD_DIR, asset.filename);
    console.log("Attempting to read thumbnail from local storage:", {
      id,
      filename: asset.filename,
      filepath,
      uploadDir: UPLOAD_DIR,
      cwd: process.cwd(),
    });

    // Check if file exists
    try {
      await access(filepath, constants.F_OK);
    } catch (accessError) {
      console.error("File does not exist at:", filepath);
      console.error("Upload dir:", UPLOAD_DIR);
      console.error("Process cwd:", process.cwd());
      console.error("Access error:", accessError);
      return NextResponse.json(
        { error: "File not found", filepath, uploadDir: UPLOAD_DIR },
        { status: 404 }
      );
    }

    const fileBuffer = await readFile(filepath);

    const ext = path.extname(asset.filename).toLowerCase();
    const contentType =
      ext === ".png"
        ? "image/png"
        : ext === ".jpg" || ext === ".jpeg"
        ? "image/jpeg"
        : ext === ".gif"
        ? "image/gif"
        : ext === ".webp"
        ? "image/webp"
        : ext === ".svg"
        ? "image/svg+xml"
        : "application/octet-stream";

    // Return image with proper headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Thumbnail read error:", error);
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
