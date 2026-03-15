'use client'

import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/useAuthStore'
import type { PostWithUser, FeedParams, PaginatedResponse } from '@/types'

const supabase = getSupabaseClient()

// ---- Query Keys ------------------------------------------------

export const postKeys = {
  all: ['posts'] as const,
  feed: (params: FeedParams) => ['posts', 'feed', params] as const,
  detail: (id: string) => ['posts', 'detail', id] as const,
  userPosts: (userId: string) => ['posts', 'user', userId] as const,
  bookmarks: (userId: string) => ['posts', 'bookmarks', userId] as const,
  nearby: (lat: number, lng: number) => ['posts', 'nearby', lat, lng] as const,
}

// ---- Feed hook -------------------------------------------------

export function useInfiniteFeed(params: FeedParams) {
  const { user } = useAuthStore()
  const LIMIT = params.limit ?? 10

  return useInfiniteQuery({
    queryKey: postKeys.feed(params),
    queryFn: async ({ pageParam }) => {
      // bookmarks는 로그인 사용자만 조회 가능 (RLS)
      const selectFields = user
        ? `*, profiles!posts_user_id_fkey(id, username, display_name, avatar_url), likes(user_id), bookmarks(user_id)`
        : `*, profiles!posts_user_id_fkey(id, username, display_name, avatar_url), likes(user_id)`

      let query = supabase
        .from('posts')
        .select(selectFields)
        .eq('visibility', 'public')
        .limit(LIMIT)

      // Sort
      switch (params.sort) {
        case 'latest':
          query = query.order('created_at', { ascending: false })
          break
        case 'popular':
          query = query.order('like_count', { ascending: false }).order('created_at', { ascending: false })
          break
        case 'following':
          if (user) {
            // Sub-query: get following user IDs
            const { data: follows } = await supabase
              .from('follows')
              .select('following_id')
              .eq('follower_id', user.id)
            const followingIds = follows?.map((f) => f.following_id) ?? []
            if (followingIds.length > 0) {
              query = query
                .in('user_id', followingIds)
                .order('created_at', { ascending: false })
            } else {
              // No follows - return empty
              return { data: [], nextCursor: null, hasMore: false } as PaginatedResponse<PostWithUser>
            }
          }
          break
        case 'nearby':
          // Use RPC for spatial query
          if (params.lat && params.lng) {
            const { data, error } = await supabase.rpc('get_nearby_posts', {
              user_lat: params.lat,
              user_lng: params.lng,
              radius_meters: params.radius ?? 5000,
              post_limit: LIMIT,
              cursor_val: pageParam as string | null ?? null,
            })

            if (error) throw error

            const posts = (data || []).map((p: PostWithUser & { likes: { user_id: string }[]; bookmarks: { user_id: string }[] }) => ({
              ...p,
              is_liked: user ? p.likes?.some((l) => l.user_id === user.id) : false,
              is_bookmarked: user ? p.bookmarks?.some((b) => b.user_id === user.id) : false,
            }))

            const hasMore = posts.length === LIMIT
            const nextCursor = hasMore ? posts[posts.length - 1].id : null

            return { data: posts, nextCursor, hasMore } as PaginatedResponse<PostWithUser>
          }
          query = query.order('created_at', { ascending: false })
          break
      }

      // Cursor pagination
      if (pageParam) {
        query = query.lt('created_at', pageParam as string)
      }

      const { data, error } = await query

      if (error) throw error

      const posts = (data || []).map((p) => ({
        ...p,
        is_liked: user ? (p.likes as { user_id: string }[])?.some((l) => l.user_id === user.id) : false,
        is_bookmarked: user ? (p.bookmarks as { user_id: string }[])?.some((b) => b.user_id === user.id) : false,
      })) as PostWithUser[]

      const hasMore = posts.length === LIMIT
      const nextCursor = hasMore ? posts[posts.length - 1].created_at : null

      return { data: posts, nextCursor, hasMore } as PaginatedResponse<PostWithUser>
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 30_000,
  })
}

// ---- Single post -----------------------------------------------

export function usePost(id: string) {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: postKeys.detail(id),
    queryFn: async () => {
      const selectFields = user
        ? `*, profiles!posts_user_id_fkey(id, username, display_name, avatar_url, bio), likes(user_id), bookmarks(user_id)`
        : `*, profiles!posts_user_id_fkey(id, username, display_name, avatar_url, bio), likes(user_id)`

      const { data, error } = await supabase
        .from('posts')
        .select(selectFields)
        .eq('id', id)
        .single()

      if (error) throw error

      return {
        ...data,
        is_liked: user ? (data.likes as { user_id: string }[])?.some((l) => l.user_id === user.id) : false,
        is_bookmarked: user ? (data.bookmarks as { user_id: string }[])?.some((b) => b.user_id === user.id) : false,
      } as PostWithUser
    },
    enabled: !!id,
  })
}

// ---- User posts ------------------------------------------------

export function useUserPosts(userId: string) {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: postKeys.userPosts(userId),
    queryFn: async () => {
      const selectFields = user
        ? `*, profiles!posts_user_id_fkey(id, username, display_name, avatar_url), likes(user_id), bookmarks(user_id)`
        : `*, profiles!posts_user_id_fkey(id, username, display_name, avatar_url), likes(user_id)`

      const { data, error } = await supabase
        .from('posts')
        .select(selectFields)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data || []).map((p) => ({
        ...p,
        is_liked: user ? (p.likes as { user_id: string }[])?.some((l) => l.user_id === user.id) : false,
        is_bookmarked: user ? (p.bookmarks as { user_id: string }[])?.some((b) => b.user_id === user.id) : false,
      })) as PostWithUser[]
    },
    enabled: !!userId,
  })
}

// ---- Like mutation ---------------------------------------------

interface LikeInput {
  postId: string
  isLiked: boolean
}

export function useLikePost() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async ({ postId, isLiked }: LikeInput) => {
      if (!user) throw new Error('로그인이 필요합니다')

      if (isLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('likes').insert({
          post_id: postId,
          user_id: user.id,
        })
        if (error) throw error
      }

      return { postId, isLiked: !isLiked }
    },
    onMutate: async ({ postId, isLiked }) => {
      // Optimistic update for post detail
      await queryClient.cancelQueries({ queryKey: postKeys.detail(postId) })
      const previous = queryClient.getQueryData<PostWithUser>(postKeys.detail(postId))

      if (previous) {
        queryClient.setQueryData<PostWithUser>(postKeys.detail(postId), {
          ...previous,
          is_liked: !isLiked,
          like_count: isLiked ? previous.like_count - 1 : previous.like_count + 1,
        })
      }

      // Optimistic update for feed
      queryClient.setQueriesData<{
        pages: { data: PostWithUser[] }[]
        pageParams: unknown[]
      }>(
        { queryKey: ['posts', 'feed'], exact: false },
        (old) => {
          if (!old) return old
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.map((p) =>
                p.id === postId
                  ? {
                      ...p,
                      is_liked: !isLiked,
                      like_count: isLiked ? p.like_count - 1 : p.like_count + 1,
                    }
                  : p
              ),
            })),
          }
        }
      )

      return { previous }
    },
    onError: (_, { postId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(postKeys.detail(postId), context.previous)
      }
    },
    onSettled: (_, __, { postId }) => {
      queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) })
    },
  })
}

// ---- Bookmark mutation -----------------------------------------

interface BookmarkInput {
  postId: string
  isBookmarked: boolean
}

export function useBookmarkPost() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async ({ postId, isBookmarked }: BookmarkInput) => {
      if (!user) throw new Error('로그인이 필요합니다')

      if (isBookmarked) {
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('bookmarks').insert({
          post_id: postId,
          user_id: user.id,
        })
        if (error) throw error
      }

      return { postId, isBookmarked: !isBookmarked }
    },
    onMutate: async ({ postId, isBookmarked }) => {
      await queryClient.cancelQueries({ queryKey: postKeys.detail(postId) })
      const previous = queryClient.getQueryData<PostWithUser>(postKeys.detail(postId))

      if (previous) {
        queryClient.setQueryData<PostWithUser>(postKeys.detail(postId), {
          ...previous,
          is_bookmarked: !isBookmarked,
          bookmark_count: isBookmarked ? previous.bookmark_count - 1 : previous.bookmark_count + 1,
        })
      }

      return { previous }
    },
    onError: (_, { postId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(postKeys.detail(postId), context.previous)
      }
    },
    onSettled: (_, __, { postId }) => {
      queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) })
    },
  })
}

// ---- Comments --------------------------------------------------

export function useComments(postId: string) {
  return useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles!comments_user_id_fkey(id, username, display_name, avatar_url)
        `)
        .eq('post_id', postId)
        .is('parent_id', null)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data ?? []
    },
    enabled: !!postId,
  })
}

export function useAddComment() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      if (!user) throw new Error('로그인이 필요합니다')
      const { data, error } = await supabase
        .from('comments')
        .insert({ post_id: postId, user_id: user.id, content })
        .select(`*, profiles!comments_user_id_fkey(id, username, display_name, avatar_url)`)
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
      queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) })
    },
  })
}

// ---- Delete post -----------------------------------------------

export function useDeletePost() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async (postId: string) => {
      if (!user) throw new Error('로그인이 필요합니다')

      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id)

      if (error) throw error
      return postId
    },
    onSuccess: (postId) => {
      queryClient.removeQueries({ queryKey: postKeys.detail(postId) })
      queryClient.invalidateQueries({ queryKey: postKeys.all })
    },
  })
}
