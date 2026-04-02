'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, MessageSquare, Eye, Heart, Pin, Newspaper } from 'lucide-react'
import { useBoardPosts, useCreateBoardPost } from '@/hooks/useCommunity'
import { useAuthStore } from '@/stores/useAuthStore'
import { Avatar } from '@/components/ui/Avatar'
import { formatRelativeTime, cn } from '@/lib/utils'
import type { BoardCategory } from '@/types'

const CATEGORIES: { key: BoardCategory | 'all'; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'general', label: '자유' },
  { key: 'question', label: '질문' },
  { key: 'meetup', label: '모임' },
  { key: 'tips', label: '팁' },
  { key: 'showcase', label: '자랑' },
]

const CATEGORY_LABELS: Record<string, string> = {
  general: '자유',
  question: '질문',
  meetup: '모임',
  tips: '팁',
  showcase: '자랑',
}

function PostSkeleton() {
  return (
    <div className="p-4 bg-surface rounded-2xl space-y-3">
      <div className="flex items-center gap-3">
        <div className="skeleton w-8 h-8 rounded-full" />
        <div className="skeleton h-3 w-24 rounded" />
      </div>
      <div className="skeleton h-4 w-3/4 rounded" />
      <div className="skeleton h-3 w-full rounded" />
    </div>
  )
}

export default function CommunityPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [activeCategory, setActiveCategory] = useState<BoardCategory | 'all'>('all')
  const [showWriteModal, setShowWriteModal] = useState(false)

  const category = activeCategory === 'all' ? undefined : activeCategory
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useBoardPosts(category)

  const posts = data?.pages.flatMap((page) => page.data) ?? []

  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
            fetchNextPage()
          }
        },
        { threshold: 0.1 }
      )
      observer.observe(node)
      return () => observer.disconnect()
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  )

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-md pt-safe-top border-b border-border/40">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <h1 className="text-xl font-black text-white">커뮤니티</h1>
            <Link
              href="/community/news"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-2 text-text-secondary hover:bg-surface-3 transition-colors text-sm font-medium tap-highlight-none"
            >
              <Newspaper size={15} />
              뉴스
            </Link>
          </div>

          {/* Category tabs */}
          <div className="flex items-center gap-1 pb-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={cn(
                  'flex-shrink-0 snap-start px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 tap-highlight-none',
                  activeCategory === cat.key
                    ? 'bg-primary text-white shadow-glow-primary'
                    : 'bg-surface-2 text-text-secondary hover:bg-surface-3'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 pt-4 pb-6">
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <PostSkeleton key={i} />)}
          </div>
        )}

        {!isLoading && posts.length === 0 && (
          <div className="py-20 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center">
              <MessageSquare size={32} className="text-text-muted" />
            </div>
            <div className="text-center">
              <p className="text-white font-semibold mb-1">아직 게시글이 없어요</p>
              <p className="text-text-secondary text-sm">첫 번째 글을 작성해보세요!</p>
            </div>
          </div>
        )}

        {posts.length > 0 && (
          <div className="space-y-3">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/community/${post.id}`}
                className="block p-4 bg-surface rounded-2xl tap-highlight-none hover:bg-surface-2 transition-colors"
              >
                {/* Pinned badge */}
                {post.is_pinned && (
                  <div className="flex items-center gap-1 text-primary text-xs font-semibold mb-2">
                    <Pin size={12} />
                    고정됨
                  </div>
                )}

                {/* Category badge + title */}
                <div className="flex items-start gap-2 mb-2">
                  <span className="shrink-0 px-2 py-0.5 rounded-md bg-surface-2 text-text-secondary text-xs font-medium">
                    {CATEGORY_LABELS[post.category] || post.category}
                  </span>
                  <h3 className="text-white font-semibold text-sm leading-snug line-clamp-2 flex-1">
                    {post.title}
                  </h3>
                </div>

                {/* Content preview */}
                <p className="text-text-secondary text-sm line-clamp-2 mb-3 leading-relaxed">
                  {post.content}
                </p>

                {/* Author + stats */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar
                      src={post.profiles.avatar_url}
                      username={post.profiles.username}
                      size="xs"
                    />
                    <span className="text-text-secondary text-xs">
                      {post.profiles.display_name || post.profiles.username}
                    </span>
                    <span className="text-text-muted text-xs">
                      {formatRelativeTime(post.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-text-muted text-xs">
                    <span className="flex items-center gap-1">
                      <Heart size={12} />
                      {post.like_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare size={12} />
                      {post.comment_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye size={12} />
                      {post.view_count}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!isLoading && hasNextPage && <div ref={sentinelRef} className="h-4 mt-4" />}

        {isFetchingNextPage && (
          <div className="flex justify-center py-6">
            <div className="loader" />
          </div>
        )}
      </div>

      {/* Write FAB */}
      {user && (
        <Link
          href="/community/write"
          className="fixed right-4 z-30 w-14 h-14 rounded-full bg-gradient-brand shadow-glow-primary flex items-center justify-center tap-highlight-none active:scale-90 transition-transform md:bottom-8"
          style={{ bottom: 'calc(var(--bottom-nav-height) + env(safe-area-inset-bottom) + 16px)' }}
          aria-label="글쓰기"
        >
          <Plus size={28} className="text-white" strokeWidth={2.5} />
        </Link>
      )}
    </div>
  )
}
