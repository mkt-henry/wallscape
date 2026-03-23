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

const POST_SELECT = `
  id, user_id, image_url, thumbnail_url, title, description, tags,
  lat, lng, address, city, district,
  like_count, comment_count, bookmark_count, view_count,
  visibility, show_in_profile, show_in_feed, show_in_map,
  photo_taken_at, still_there_count, gone_count, last_confirmed_at,
  created_at, updated_at,
  profiles(id, username, display_name, avatar_url),
  likes(user_id),
  bookmarks(user_id)
`

function mapPost(p: Record<string, unknown>, userId?: string): PostWithUser {
  const likes = (p.likes as { user_id: string }[] | undefined) ?? []
  const bookmarks = (p.bookmarks as { user_id: string }[] | undefined) ?? []
  return {
    ...(p as unknown as PostWithUser),
    is_liked: userId ? likes.some((l) => l.user_id === userId) : false,
    is_bookmarked: userId ? bookmarks.some((b) => b.user_id === userId) : false,
  }
}

// ---- Helper: sync count via API route (bypasses RLS) -----------

async function syncCount(postId: string, type: 'like' | 'bookmark' | 'comment') {
  await fetch('/api/sync-counts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ postId, type }),
  })
}

// ---- Query Keys ------------------------------------------------

export const postKeys = {
  all: ['posts'] as const,
  feed: (params: FeedParams) => ['posts', 'feed', params] as const,
  detail: (id: string) => ['posts', 'detail', id] as const,
  userPosts: (userId: string) => ['posts', 'user', userId] as const,
  bookmarks: (userId: string) => ['posts', 'bookmarks', userId] as const,
}

// ---- Feed hook -------------------------------------------------

export function useInfiniteFeed(params: FeedParams) {
  const { user } = useAuthStore()
  const LIMIT = params.limit ?? 10

  return useInfiniteQuery({
    queryKey: postKeys.feed(params),
    queryFn: async ({ pageParam }) => {
      const supabase = getSupabaseClient()

      // 팔로잉 탭: 로그인 필요
      if (params.sort === 'following') {
        if (!user) return { data: [], nextCursor: null, hasMore: false } as PaginatedResponse<PostWithUser>

        const { data: follows } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id)
        const followingIds = follows?.map((f) => f.following_id) ?? []
        if (followingIds.length === 0) return { data: [], nextCursor: null, hasMore: false } as PaginatedResponse<PostWithUser>

        let q = supabase
          .from('posts')
          .select(POST_SELECT)
          .eq('visibility', 'public')
          .eq('show_in_feed', true)
          .in('user_id', followingIds)
          .order('created_at', { ascending: false })
          .limit(LIMIT)
        if (user.id) q = q.eq('likes.user_id', user.id).eq('bookmarks.user_id', user.id)
        if (pageParam) q = q.lt('created_at', pageParam as string)

        const { data, error } = await q
        if (error) throw error
        const posts = ((data ?? []) as Record<string, unknown>[]).map((p) => mapPost(p, user?.id))
        return { data: posts, nextCursor: posts.length === LIMIT ? posts[posts.length - 1].created_at : null, hasMore: posts.length === LIMIT }
      }

      // 내 주변 탭: RPC 사용
      if (params.sort === 'nearby' && params.lat && params.lng) {
        const { data, error } = await supabase.rpc('get_nearby_posts', {
          user_lat: params.lat,
          user_lng: params.lng,
          radius_meters: params.radius ?? 5000,
          post_limit: LIMIT,
          cursor_val: (pageParam as string | null) ?? null,
        })
        if (error) throw error
        const posts = ((data ?? []) as Record<string, unknown>[]).map((p) => mapPost(p, user?.id))
        return { data: posts, nextCursor: posts.length === LIMIT ? (posts[posts.length - 1].id as string) : null, hasMore: posts.length === LIMIT }
      }

      // 최신순 / 인기순 / 내 주변(위치 없을 때)
      let q = supabase
        .from('posts')
        .select(POST_SELECT)
        .eq('visibility', 'public')
        .eq('show_in_feed', true)
        .limit(LIMIT)

      if (user?.id) q = q.eq('likes.user_id', user.id).eq('bookmarks.user_id', user.id)

      if (params.sort === 'popular') {
        q = q.order('like_count', { ascending: false }).order('created_at', { ascending: false })
      } else {
        q = q.order('created_at', { ascending: false })
      }

      if (pageParam) q = q.lt('created_at', pageParam as string)

      const { data, error } = await q
      if (error) throw error

      const posts = ((data ?? []) as Record<string, unknown>[]).map((p) => mapPost(p, user?.id))
      return {
        data: posts,
        nextCursor: posts.length === LIMIT ? posts[posts.length - 1].created_at : null,
        hasMore: posts.length === LIMIT,
      } as PaginatedResponse<PostWithUser>
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    maxPages: 5,       // 최대 50개(5페이지×10) 메모리 유지
    staleTime: 30_000,
  })
}

// ---- Single post -----------------------------------------------

export function usePost(id: string) {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: postKeys.detail(id),
    queryFn: async () => {
      const supabase = getSupabaseClient()
      let q = supabase
        .from('posts')
        .select(`
          id, user_id, image_url, thumbnail_url, title, description, tags,
          lat, lng, address, city, district,
          like_count, comment_count, bookmark_count, view_count,
          visibility, show_in_profile, show_in_feed, show_in_map,
          photo_taken_at, still_there_count, gone_count, last_confirmed_at,
          created_at, updated_at,
          profiles(id, username, display_name, avatar_url, bio),
          likes(user_id),
          bookmarks(user_id)
        `)
        .eq('id', id)
      if (user?.id) q = q.eq('likes.user_id', user.id).eq('bookmarks.user_id', user.id)
      const { data, error } = await q.single()

      if (error) throw error
      return mapPost(data as unknown as Record<string, unknown>, user?.id)
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
      const supabase = getSupabaseClient()
      let q = supabase
        .from('posts')
        .select(POST_SELECT)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      // 타인의 프로필에서는 show_in_profile = true 인 게시물만 노출
      if (user?.id !== userId) q = q.eq('show_in_profile', true)
      if (user?.id) q = q.eq('likes.user_id', user.id).eq('bookmarks.user_id', user.id)

      const { data, error } = await q
      if (error) throw error
      return ((data ?? []) as Record<string, unknown>[]).map((p) => mapPost(p, user?.id))
    },
    enabled: !!userId,
  })
}

// ---- Like mutation ---------------------------------------------

interface LikeInput { postId: string; isLiked: boolean }

export function useLikePost() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async ({ postId, isLiked }: LikeInput) => {
      if (!user) throw new Error('로그인이 필요합니다')
      const supabase = getSupabaseClient()

      if (isLiked) {
        const { error } = await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', user.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('likes').insert({ post_id: postId, user_id: user.id })
        if (error) throw error
      }

      // Sync like_count via API route (bypasses RLS)
      await syncCount(postId, 'like')

      return { postId, isLiked: !isLiked }
    },
    onMutate: async ({ postId, isLiked }) => {
      await queryClient.cancelQueries({ queryKey: postKeys.detail(postId) })
      const previous = queryClient.getQueryData<PostWithUser>(postKeys.detail(postId))
      if (previous) {
        queryClient.setQueryData<PostWithUser>(postKeys.detail(postId), {
          ...previous,
          is_liked: !isLiked,
          like_count: isLiked ? previous.like_count - 1 : previous.like_count + 1,
        })
      }
      queryClient.setQueriesData<{ pages: { data: PostWithUser[] }[]; pageParams: unknown[] }>(
        { queryKey: ['posts', 'feed'], exact: false },
        (old) => {
          if (!old) return old
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.map((p) =>
                p.id === postId ? { ...p, is_liked: !isLiked, like_count: isLiked ? p.like_count - 1 : p.like_count + 1 } : p
              ),
            })),
          }
        }
      )
      return { previous }
    },
    onError: (_, { postId }, context) => {
      if (context?.previous) queryClient.setQueryData(postKeys.detail(postId), context.previous)
    },
    onSettled: (_, __, { postId }) => {
      queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) })
    },
  })
}

// ---- Bookmark mutation -----------------------------------------

interface BookmarkInput { postId: string; isBookmarked: boolean }

export function useBookmarkPost() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async ({ postId, isBookmarked }: BookmarkInput) => {
      if (!user) throw new Error('로그인이 필요합니다')
      const supabase = getSupabaseClient()

      if (isBookmarked) {
        const { error } = await supabase.from('bookmarks').delete().eq('post_id', postId).eq('user_id', user.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('bookmarks').insert({ post_id: postId, user_id: user.id })
        if (error) throw error
      }

      // Sync bookmark_count via API route (bypasses RLS)
      await syncCount(postId, 'bookmark')

      return { postId, isBookmarked: !isBookmarked }
    },
    onMutate: async ({ postId, isBookmarked }) => {
      await queryClient.cancelQueries({ queryKey: postKeys.detail(postId) })

      // Optimistic update — detail cache
      const previous = queryClient.getQueryData<PostWithUser>(postKeys.detail(postId))
      if (previous) {
        queryClient.setQueryData<PostWithUser>(postKeys.detail(postId), {
          ...previous,
          is_bookmarked: !isBookmarked,
          bookmark_count: isBookmarked ? previous.bookmark_count - 1 : previous.bookmark_count + 1,
        })
      }

      // Optimistic update — feed cache
      queryClient.setQueriesData<{ pages: { data: PostWithUser[] }[]; pageParams: unknown[] }>(
        { queryKey: ['posts', 'feed'], exact: false },
        (old) => {
          if (!old) return old
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.map((p) =>
                p.id === postId
                  ? { ...p, is_bookmarked: !isBookmarked, bookmark_count: isBookmarked ? p.bookmark_count - 1 : p.bookmark_count + 1 }
                  : p
              ),
            })),
          }
        }
      )

      return { previous }
    },
    onError: (_, { postId }, context) => {
      if (context?.previous) queryClient.setQueryData(postKeys.detail(postId), context.previous)
    },
    onSettled: (_, __, { postId }) => {
      queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) })
      if (user) queryClient.invalidateQueries({ queryKey: postKeys.bookmarks(user.id) })
    },
  })
}

// ---- Comments --------------------------------------------------

export function useComments(postId: string) {
  return useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('comments')
        .select('*, profiles(id, username, display_name, avatar_url)')
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
  const { user, profile } = useAuthStore()

  return useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      if (!user) throw new Error('로그인이 필요합니다')
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('comments')
        .insert({ post_id: postId, user_id: user.id, content })
        .select('*, profiles(id, username, display_name, avatar_url)')
        .single()
      if (error) throw error
      return data
    },
    onMutate: async ({ postId, content }) => {
      await queryClient.cancelQueries({ queryKey: ['comments', postId] })
      const previous = queryClient.getQueryData(['comments', postId])

      const optimisticComment = {
        id: `optimistic-${Date.now()}`,
        post_id: postId,
        user_id: user?.id ?? '',
        content,
        parent_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        profiles: {
          id: user?.id ?? '',
          username: profile?.username ?? '',
          display_name: profile?.display_name ?? null,
          avatar_url: profile?.avatar_url ?? null,
        },
      }

      queryClient.setQueryData(['comments', postId], (old: unknown[]) => [
        ...(Array.isArray(old) ? old : []),
        optimisticComment,
      ])

      return { previous, postId }
    },
    onError: (_, __, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(['comments', context.postId], context.previous)
      }
    },
    onSuccess: (data, { postId }) => {
      // 실제 데이터로 교체
      queryClient.setQueryData(['comments', postId], (old: unknown[]) =>
        (Array.isArray(old) ? old : []).map((c: unknown) =>
          (c as { id: string }).id.startsWith('optimistic-') ? data : c
        )
      )
      queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) })
      // fire-and-forget (UI 블로킹 안 함)
      syncCount(postId, 'comment')
    },
  })
}

// ---- Bookmarked posts (own) ------------------------------------

export function useBookmarkedPosts(userId: string) {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: postKeys.bookmarks(userId),
    queryFn: async () => {
      if (!user || user.id !== userId) return []
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('bookmarks')
        .select(`
          post_id,
          created_at,
          posts(
            id, user_id, image_url, thumbnail_url, title, description, tags,
            lat, lng, address, city, district,
            like_count, comment_count, bookmark_count, view_count,
            visibility, created_at, updated_at,
            profiles(id, username, display_name, avatar_url)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? [])
        .map((row) => row.posts as unknown as Record<string, unknown>)
        .filter(Boolean)
        .map((p) => ({ ...mapPost(p, userId), is_bookmarked: true }))
    },
    enabled: !!userId && !!user && user.id === userId,
  })
}

// ---- Archive mutation ------------------------------------------

interface ArchiveInput { postId: string; isArchived: boolean }

export function useArchivePost() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async ({ postId, isArchived }: ArchiveInput) => {
      if (!user) throw new Error('로그인이 필요합니다')
      const supabase = getSupabaseClient()

      const { error } = await supabase
        .from('posts')
        .update({ visibility: isArchived ? 'public' : 'private' })
        .eq('id', postId)
        .eq('user_id', user.id)
      if (error) throw error
      return { postId, isArchived: !isArchived }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.all })
      queryClient.invalidateQueries({ queryKey: ['posts', 'archived'] })
    },
  })
}

// ---- Archived posts (own) --------------------------------------

export function useArchivedPosts(userId: string) {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: ['posts', 'archived', userId],
    queryFn: async () => {
      if (!user || user.id !== userId) return []
      const supabase = getSupabaseClient()
      let q = supabase
        .from('posts')
        .select(POST_SELECT)
        .eq('user_id', userId)
        .eq('visibility', 'private')
        .order('created_at', { ascending: false })
      if (user?.id) q = q.eq('likes.user_id', user.id).eq('bookmarks.user_id', user.id)
      const { data, error } = await q
      if (error) throw error
      return ((data ?? []) as Record<string, unknown>[]).map((p) => mapPost(p, user?.id))
    },
    enabled: !!userId && !!user && user.id === userId,
  })
}

// ---- Status reports (still there / gone) -----------------------

export function useStatusReports(postId: string) {
  return useQuery({
    queryKey: ['status_reports', postId],
    queryFn: async () => {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('status_reports')
        .select('*, profiles(id, username, display_name, avatar_url)')
        .eq('post_id', postId)
        .order('created_at', { ascending: false })
        .limit(10)
      if (error) throw error
      return data ?? []
    },
    enabled: !!postId,
  })
}

export function useMyStatusReport(postId: string) {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: ['status_reports', postId, 'mine', user?.id],
    queryFn: async () => {
      if (!user) return null
      const supabase = getSupabaseClient()
      const { data } = await supabase
        .from('status_reports')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle()
      return data
    },
    enabled: !!postId && !!user,
  })
}

export function useReportStatus() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async ({ postId, status }: { postId: string; status: 'still_there' | 'gone' }) => {
      if (!user) throw new Error('로그인이 필요합니다')
      const supabase = getSupabaseClient()

      // Upsert the report
      const { error } = await supabase
        .from('status_reports')
        .upsert(
          { post_id: postId, user_id: user.id, status, created_at: new Date().toISOString() },
          { onConflict: 'post_id,user_id' }
        )
      if (error) throw error

      // Update counts on the post
      const { data: counts } = await supabase
        .from('status_reports')
        .select('status')
        .eq('post_id', postId)
      const stillCount = counts?.filter((r) => r.status === 'still_there').length ?? 0
      const goneCount = counts?.filter((r) => r.status === 'gone').length ?? 0

      await supabase
        .from('posts')
        .update({
          still_there_count: stillCount,
          gone_count: goneCount,
          last_confirmed_at: status === 'still_there' ? new Date().toISOString() : undefined,
        })
        .eq('id', postId)

      return { postId, status }
    },
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ['status_reports', postId] })
      queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) })
      queryClient.invalidateQueries({ queryKey: postKeys.all })
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
      const supabase = getSupabaseClient()
      const { error } = await supabase.from('posts').delete().eq('id', postId).eq('user_id', user.id)
      if (error) throw error
      return postId
    },
    onSuccess: (postId) => {
      queryClient.removeQueries({ queryKey: postKeys.detail(postId) })
      queryClient.invalidateQueries({ queryKey: postKeys.all })
    },
  })
}
