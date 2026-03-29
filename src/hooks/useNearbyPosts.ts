'use client'

import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { NearbyPost } from '@/types'

// Kakao zoom level → approximate visible radius in meters
// Zoom levels: 1 (closest) ~ 14 (farthest)
// We add 1.5x buffer so edge markers don't vanish on small pans
function getRadiusForZoom(zoom: number): number {
  const base: Record<number, number> = {
    1: 500,
    2: 1000,
    3: 2000,
    4: 4000,
    5: 8000,
    6: 16000,
    7: 32000,
    8: 64000,
    9: 120000,
    10: 250000,
    11: 500000,
    12: 1000000,
    13: 2000000,
    14: 4000000,
  }
  const radius = base[zoom] ?? 8000
  return Math.round(radius * 1.5)
}

// Round coordinates based on zoom — zoomed out = coarser rounding
function roundCoord(v: number, zoom: number): number {
  // zoom 1-3: ~10m, zoom 4-6: ~100m, zoom 7+: ~1km
  const decimals = zoom <= 3 ? 4 : zoom <= 6 ? 3 : 2
  const f = 10 ** decimals
  return Math.round(v * f) / f
}

export function useNearbyPosts(lat: number, lng: number, zoom: number = 5) {
  const supabase = getSupabaseClient()
  const radius = getRadiusForZoom(zoom)
  const roundedLat = roundCoord(lat, zoom)
  const roundedLng = roundCoord(lng, zoom)

  return useQuery({
    queryKey: ['nearby-posts', roundedLat, roundedLng, radius],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_nearby_posts', {
        user_lat: lat,
        user_lng: lng,
        radius_meters: radius,
        post_limit: 200,
      })

      if (error) throw error
      return (data || []) as NearbyPost[]
    },
    staleTime: 30_000,
    // Keep showing previous markers while new data loads on pan
    placeholderData: keepPreviousData,
  })
}
