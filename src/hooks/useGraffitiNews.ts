'use client'

import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/useAuthStore'
import type { GraffitiNews } from '@/types'

const NEWS_SELECT = `
  id, user_id, title, content, thumbnail_url,
  view_count, is_pinned, created_at, updated_at
`

export const newsKeys = {
  all: ['graffiti_news'] as const,
  list: () => ['graffiti_news', 'list'] as const,
  detail: (id: string) => ['graffiti_news', 'detail', id] as const,
}

export function useGraffitiNewsList() {
  return useInfiniteQuery({
    queryKey: newsKeys.list(),
    queryFn: async ({ pageParam = 0 }) => {
      const supabase = getSupabaseClient()
      const limit = 20
      const { data, error } = await supabase
        .from('graffiti_news')
        .select(NEWS_SELECT)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .range(pageParam, pageParam + limit - 1)

      if (error) throw error
      return {
        data: (data ?? []) as unknown as GraffitiNews[],
        nextCursor: data && data.length === limit ? pageParam + limit : null,
      }
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })
}

export function useGraffitiNews(id: string) {
  return useQuery({
    queryKey: newsKeys.detail(id),
    queryFn: async () => {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('graffiti_news')
        .select(NEWS_SELECT)
        .eq('id', id)
        .single()
      if (error) throw error

      // 조회수 증가 (fire-and-forget)
      void supabase.rpc('increment_news_view', { news_id: id })

      return data as unknown as GraffitiNews
    },
    enabled: !!id,
  })
}

export function useCreateGraffitiNews() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async (input: { title: string; content: string; thumbnail_url?: string }) => {
      if (!user) throw new Error('로그인이 필요합니다')
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('graffiti_news')
        .insert({ user_id: user.id, ...input })
        .select(NEWS_SELECT)
        .single()
      if (error) throw error
      return data as unknown as GraffitiNews
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: newsKeys.all })
    },
  })
}

export function useDeleteGraffitiNews() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = getSupabaseClient()
      const { error } = await supabase.from('graffiti_news').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: newsKeys.all })
    },
  })
}
