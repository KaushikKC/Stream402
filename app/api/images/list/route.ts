import { NextResponse } from 'next/server'
import { getAllAssets } from '@/lib/storage'

export async function GET() {
  try {
    const assets = getAllAssets()
    const images = assets.map((asset) => ({
      id: asset.id,
      title: asset.title,
      thumb: `/api/thumb/${asset.id}`, // We'll create a thumb endpoint
    }))

    return NextResponse.json({ images })
  } catch (error) {
    console.error('Error listing images:', error)
    return NextResponse.json({ images: [] })
  }
}

