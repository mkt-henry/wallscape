import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  const locale = searchParams.get('locale') || 'ko'

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat, lng required' }, { status: 400 })
  }

  // Primary: Nominatim (works globally)
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=${locale}`,
      { headers: { 'User-Agent': 'Wallscape/1.0 (https://wallscape.bp-studio.com)' } }
    )
    if (res.ok) {
      const data = await res.json()
      const a = data.address
      if (a) {
        const parts = [
          a.province || a.state || a.city,
          a.county || a.city_district || a.suburb,
          a.neighbourhood || a.quarter,
          a.road,
          a.house_number,
        ].filter(Boolean)
        const address = parts.length > 0 ? parts.join(' ') : data.display_name
        const city = a.province || a.state || a.city || a.town || null
        const district = a.county || a.city_district || a.suburb || null
        return NextResponse.json({ address, city, district })
      }
    }
  } catch {
    // fall through to Kakao fallback
  }

  // Fallback: Kakao (Korea only, higher quality for Korean addresses)
  const appKey = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY
  if (appKey) {
    try {
      const res = await fetch(
        `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${lng}&y=${lat}&input_coord=WGS84`,
        {
          headers: {
            Authorization: `KakaoAK ${appKey}`,
            KA: 'sdk/4.0.0 os/javascript origin/https://wallscape.bp-studio.com',
          },
        }
      )
      if (res.ok) {
        const data = await res.json()
        const doc = data.documents?.[0]
        const address =
          doc?.road_address?.address_name ||
          doc?.address?.address_name ||
          null
        const city = doc?.address?.region_1depth_name || null
        const district = doc?.address?.region_2depth_name || null
        if (address) return NextResponse.json({ address, city, district })
      }
    } catch {
      // fall through
    }
  }

  return NextResponse.json({ address: null, city: null, district: null })
}
