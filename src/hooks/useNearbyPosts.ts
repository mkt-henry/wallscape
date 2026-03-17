'use client'

import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { NearbyPost } from '@/types'

// Round to ~100m precision to avoid re-fetches on tiny movements
function roundCoord(v: number, decimals = 3): number {
  const f = 10 ** decimals
  return Math.round(v * f) / f
}

export function useNearbyPosts(lat: number, lng: number) {
  const supabase = getSupabaseClient()
  const roundedLat = roundCoord(lat)
  const roundedLng = roundCoord(lng)

  return useQuery({
    queryKey: ['nearby-posts', roundedLat, roundedLng],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_nearby_posts', {
        user_lat: lat,
        user_lng: lng,
        radius_meters: 5000,
        post_limit: 100,
      })

      if (error) throw error
      return (data || []) as NearbyPost[]
    },
    staleTime: 30_000,
    // Keep showing previous markers while new data loads on pan
    placeholderData: keepPreviousData,
  })
}
