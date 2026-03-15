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
    if (hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return
      const observer = new IntersectionObserver(
        (entries) => { if (entries[0].isIntersecting) handleLoadMore() },
        { threshold: 0.1 }
      )
      observer.observe(node)
      return () => observer.disconnect()
    },
    [handleLoadMore]
  )

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top bar — mobile only logo, desktop shows only tabs + actions */}
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-md pt-safe-top border-b border-border/40">
        <div className="max-w-3xl mx-auto px-4">
          {/* Mobile: logo row */}
          <div className="flex items-center justify-between h-14 md:hidden">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center">
                <span className="text-sm font-black text-white">W</span>
              </div>
              <span className="text-lg font-black text-white tracking-wide">WALLSCAPE</span>
            </div>
            <div className="flex items-center gap-1">
              <Link href="/search" className="p-2 tap-highlight-none">
                <Search size={22} className="text-white" />
              </Link>
              <Link href="/activity" className="p-2 tap-highlight-none relative">
                <Bell size={22} className="text-white" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
              </Link>
            </div>
          </div>

          {/* Desktop: title + actions row */}
          <div className="hidden md:flex items-center justify-between h-14">
            <h1 className="text-xl font-black text-white">피드</h1>
            <div className="flex items-center gap-1">
              <Link href="/search" className="p-2 tap-highlight-none rounded-xl hover:bg-surface-2 transition-colors">
                <Search size={20} className="text-text-secondary" />
              </Link>
              <Link href="/activity" className="p-2 tap-highlight-none relative rounded-xl hover:bg-surface-2 transition-colors">
                <Bell size={20} className="text-text-secondary" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
              </Link>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex items-center gap-1 pb-3 overflow-x-auto scrollbar-hide">
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
      </div>

      {/* Feed content */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 pt-4 pb-6">
        {/* Error state */}
        {isError && (
          <div className="py-16 flex flex-col items-center gap-4">
            <p className="text-text-secondary text-center">피드를 불러오는 중 오류가 발생했습니다</p>
            <p className="text-red-400 text-xs text-center max-w-xs break-all">
              {(isError as unknown as Error)?.message ?? String(isError)}
            </p>
            <button onClick={() => refetch()} className="text-primary font-semibold tap-highlight-none">
              다시 시도
            </button>
          </div>
        )}

        {/* Loading skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <PostSkeleton key={i} />)}
          </div>
        )}

        {/* Empty state */}
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

        {/* Posts grid */}
        {posts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {/* Sentinel */}
        {!isLoading && hasNextPage && <div ref={sentinelRef} className="h-4 mt-4" />}

        {isFetchingNextPage && (
          <div className="flex justify-center py-6">
            <div className="loader" />
          </div>
        )}

        {!isLoading && !hasNextPage && posts.length > 0 && (
          <div className="py-8 text-center">
            <p className="text-text-muted text-sm">모든 게시물을 확인했습니다</p>
          </div>
        )}
      </div>
    </div>
  )
}
