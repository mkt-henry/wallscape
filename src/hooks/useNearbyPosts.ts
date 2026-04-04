'use client'

import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { NearbyPost } from '@/types'

// MapLibre zoom level → approximate visible radius in meters
// Zoom levels: 0 (world) ~ 22 (building level)
// We add 1.5x buffer so edge markers don't vanish on small pans
function getRadiusForZoom(zoom: number): number {
  const base: Record<number, number> = {
    18: 300,
    17: 500,
    16: 1000,
    15: 2000,
    14: 3000,
    13: 6000,
    12: 12000,
    11: 25000,
    10: 50000,
    9: 100000,
    8: 200000,
    7: 400000,
    6: 800000,
    5: 1500000,
    4: 3000000,
    3: 4000000,
  }
  // Find closest match
  const closest = Object.keys(base)
    .map(Number)
    .sort((a, b) => Math.abs(a - zoom) - Math.abs(b - zoom))[0]
  const radius = base[closest] ?? 6000
  return Math.round(radius * 1.5)
}

// Round coordinates based on zoom — zoomed out = coarser rounding
function roundCoord(v: number, zoom: number): number {
  // zoom 16+: ~10m, zoom 12-15: ~100m, zoom <12: ~1km
  const decimals = zoom >= 16 ? 4 : zoom >= 12 ? 3 : 2
  const f = 10 ** decimals
  return Math.round(v * f) / f
}

export function useNearbyPosts(lat: number, lng: number, zoom: number = 13) {
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
    placeholderData: keepPreviousData,
  })
}
