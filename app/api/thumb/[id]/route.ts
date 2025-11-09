import { NextRequest, NextResponse } from 'next/server'
import { getAsset } from '@/lib/storage'
import { readFile } from 'fs/promises'
import path from 'path'
import { UPLOAD_DIR } from '@/lib/storage'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const asset = getAsset(id)
  if (!asset) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
  }

  try {
    // For MVP, serve the original file as thumbnail
    // In production, you'd generate actual thumbnails
    const filepath = path.join(UPLOAD_DIR, asset.filename)
    const fileBuffer = await readFile(filepath)

    const ext = path.extname(asset.filename).toLowerCase()
    const contentType =
      ext === '.png'
        ? 'image/png'
        : ext === '.jpg' || ext === '.jpeg'
          ? 'image/jpeg'
          : ext === '.gif'
            ? 'image/gif'
            : ext === '.webp'
              ? 'image/webp'
              : 'application/octet-stream'

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('Thumbnail read error:', error)
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }
}

