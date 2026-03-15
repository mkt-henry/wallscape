'use client'

import { useState, useCallback } from 'react'
import { Bell, Search } from 'lucide-react'
import Link from 'next/link'
import { useInfiniteFeed } from '@/hooks/usePosts'
import { useLocation } from '@/hooks/useLocation'
import { PostCard } from '@/components/feed/PostCard'
import { cn } from '@/lib/utils'
import type { FeedSortType } from '@/types'

const FEED_TABS: { key: FeedSortType; label: string }[] = [
  { key: 'latest', label: '최신순' },
  { key: 'popular', label: '인기순' },
  { key: 'nearby', label: '내 주변' },
  { key: 'following', label: '팔로잉' },
]

function PostSkeleton() {
  return (
    <div className="bg-surface rounded-3xl overflow-hidden">
      <div className="skeleton aspect-[4/5] w-full" />
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="skeleton w-9 h-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3 w-24 rounded" />
            <div className="skeleton h-2 w-16 rounded" />
          </div>
        </div>
        <div className="skeleton h-3 w-3/4 rounded" />
        <div className="flex gap-4">
          <div className="skeleton h-4 w-16 rounded" />
          <div className="skeleton h-4 w-16 rounded" />
        </div>
      </div>
    </div>
  )
}

export default function FeedPage() {
  const [activeTab, setActiveTab] = useState<FeedSortType>('latest')
  const { location } = useLocation()

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteFeed({
    sort: activeTab,
    lat: location?.lat,
    lng: location?.lng,
    limit: 10,
  })

  const posts = data?.pages.flatMap((page) => page.data) ?? []

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // Infinite scroll via IntersectionObserver
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            handleLoadMore()
          }
        },
        { threshold: 0.1 }
      )
      observer.observe(node)
      return () => observer.disconnect()
    },
    [handleLoadMore]
  )

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-md pt-safe-top">
        <div className="flex items-center justify-between px-4 h-14">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center">
              <span className="text-sm font-black text-white">W</span>
            </div>
            <span className="text-lg font-black text-white tracking-wide">WALLSCAPE</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Link
              href="/search"
              className="p-2 tap-highlight-none"
            >
              <Search size={22} className="text-white" />
            </Link>
            <Link
              href="/activity"
              className="p-2 tap-highlight-none relative"
            >
              <Bell size={22} className="text-white" />
              {/* Notification dot */}
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
            </Link>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-1 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {FEED_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 tap-highlight-none',
                activeTab === tab.key
                  ? 'bg-primary text-white shadow-glow-primary'
                  : 'bg-surface-2 text-text-secondary hover:bg-surface-3'
              )}
            >
              {tab.label}
              {tab.key === 'nearby' && !location && (
                <span className="ml-1.5 text-xs opacity-60">📍</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Feed content */}
      <div className="flex-1 px-4 pt-2 pb-4 space-y-4">
        {/* Error state */}
        {isError && (
          <div className="py-16 flex flex-col items-center gap-4">
            <p className="text-text-secondary text-center">
              피드를 불러오는 중 오류가 발생했습니다
            </p>
            {process.env.NODE_ENV === 'development' && (
              <p className="text-xs text-red-400 text-center px-4 break-all">
                {String((data as unknown as { error?: unknown } | undefined)?.error ?? '') || '콘솔을 확인하세요'}
              </p>
            )}
            <button
              onClick={() => refetch()}
              className="text-primary font-semibold tap-highlight-none"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* Loading skeletons */}
        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <PostSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Posts */}
        {!isLoading && posts.length === 0 && !isError && (
          <div className="py-20 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center">
              <span className="text-3xl">🎨</span>
            </div>
            <div className="text-center">
              <p className="text-white font-semibold mb-1">아직 게시물이 없어요</p>
              <p className="text-text-secondary text-sm">
                {activeTab === 'following'
                  ? '팔로우한 아티스트의 게시물이 여기 표시됩니다'
                  : '첫 번째 그라피티를 업로드해보세요!'}
              </p>
            </div>
          </div>
        )}

        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}

        {/* Load more sentinel */}
        {!isLoading && hasNextPage && (
          <div ref={sentinelRef} className="h-4" />
        )}

        {/* Loading more indicator */}
        {isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <div className="loader" />
          </div>
        )}

        {/* End of feed */}
        {!isLoading && !hasNextPage && posts.length > 0 && (
          <div className="py-8 text-center">
            <p className="text-text-muted text-sm">모든 게시물을 확인했습니다</p>
          </div>
        )}
      </div>
    </div>
  )
}
