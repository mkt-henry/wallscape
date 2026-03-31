'use client'

import { useQuery } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

export const artistKeys = {
  all: ['artists'] as const,
  list: () => ['artists', 'list'] as const,
}

export function useProfiles(ids: string[]) {
  return useQuery({
    queryKey: ['profiles', ids],
    queryFn: async (): Promise<Profile[]> => {
      if (ids.length === 0) return []
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('id', ids)
      if (error) throw error
      return data ?? []
    },
    enabled: ids.length > 0,
  })
}

export function useVerifiedArtists() {
  return useQuery({
    queryKey: artistKeys.list(),
    queryFn: async (): Promise<Profile[]> => {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_verified', true)
        .order('follower_count', { ascending: false })

      if (error) throw error
      return data ?? []
    },
  })
}
