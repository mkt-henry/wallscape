'use client'

import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/useAuthStore'
import type { BoardPostWithUser, BoardCommentWithUser, BoardCategory } from '@/types'

const BOARD_POST_SELECT = `
  id, user_id, title, content, category, image_url,
  like_count, comment_count, view_count, is_pinned,
  created_at, updated_at,
  profiles(id, username, display_name, avatar_url)
`

export const communityKeys = {
  all: ['community'] as const,
  posts: (category?: string) => ['community', 'posts', category] as const,
  detail: (id: string) => ['community', 'detail', id] as const,
  comments: (postId: string) => ['community', 'comments', postId] as const,
}

export function useBoardPosts(category?: BoardCategory) {
  return useInfiniteQuery({
    queryKey: communityKeys.posts(category),
    queryFn: async ({ pageParam = 0 }) => {
      const supabase = getSupabaseClient()
      const limit = 20
      let query = supabase
        .from('board_posts')
        .select(BOARD_POST_SELECT)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .range(pageParam, pageParam + limit - 1)

      if (category) {
        query = query.eq('category', category)
      }

      const { data, error } = await query
      if (error) throw error
      return {
        data: (data ?? []) as unknown as BoardPostWithUser[],
        nextCursor: data && data.length === limit ? pageParam + limit : null,
      }
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })
}

export function useBoardPost(id: string) {
  return useQuery({
    queryKey: communityKeys.detail(id),
    queryFn: async () => {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('board_posts')
        .select(BOARD_POST_SELECT)
        .eq('id', id)
        .single()
      if (error) throw error
      return data as unknown as BoardPostWithUser
    },
    enabled: !!id,
  })
}

export function useBoardComments(postId: string) {
  return useQuery({
    queryKey: communityKeys.comments(postId),
    queryFn: async () => {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('board_comments')
        .select('*, profiles(id, username, display_name, avatar_url)')
        .eq('board_post_id', postId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as unknown as BoardCommentWithUser[]
    },
    enabled: !!postId,
  })
}

export function useCreateBoardPost() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async (input: { title: string; content: string; category: BoardCategory; image_url?: string | null }) => {
      if (!user) throw new Error('로그인이 필요합니다')
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('board_posts')
        .insert({ user_id: user.id, ...input })
        .select(BOARD_POST_SELECT)
        .single()
      if (error) throw error
      return data as unknown as BoardPostWithUser
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.all })
    },
  })
}

export function useAddBoardComment() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async (input: { boardPostId: string; content: string }) => {
      if (!user) throw new Error('로그인이 필요합니다')
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('board_comments')
        .insert({ board_post_id: input.boardPostId, user_id: user.id, content: input.content })
        .select('*, profiles(id, username, display_name, avatar_url)')
        .single()
      if (error) throw error

      // Increment comment count
      try {
        await supabase.rpc('increment_field', {
          table_name: 'board_posts',
          row_id: input.boardPostId,
          field_name: 'comment_count',
          amount: 1,
        })
      } catch {
        // rpc may not exist yet — ignore
      }

      return data as unknown as BoardCommentWithUser
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: communityKeys.comments(variables.boardPostId) })
      queryClient.invalidateQueries({ queryKey: communityKeys.detail(variables.boardPostId) })
      queryClient.invalidateQueries({ queryKey: communityKeys.posts() })
    },
  })
}

export function useDeleteBoardPost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (postId: string) => {
      const supabase = getSupabaseClient()
      const { error } = await supabase.from('board_posts').delete().eq('id', postId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.all })
    },
  })
}
