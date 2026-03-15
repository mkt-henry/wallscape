import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat, lng required' }, { status: 400 })
  }

  const appKey = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY
  if (!appKey) {
    return NextResponse.json({ address: null }, { status: 200 })
  }

  try {
    const res = await fetch(
      `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${lng}&y=${lat}&input_coord=WGS84`,
      { headers: { Authorization: `KakaoAK ${appKey}` } }
    )
    const data = await res.json()
    const doc = data.documents?.[0]
    const address =
      doc?.road_address?.address_name ||
      doc?.address?.address_name ||
      null

    return NextResponse.json({ address })
  } catch {
    return NextResponse.json({ address: null }, { status: 200 })
  }
}
