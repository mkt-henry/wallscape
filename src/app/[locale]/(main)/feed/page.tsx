'use client'

import { useState, useCallback, useEffect } from 'react'
import { Bell, Search, ArrowUp, Plus } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { useInfiniteFeed } from '@/hooks/usePosts'
import { useLocation } from '@/hooks/useLocation'
import { PostCard } from '@/components/feed/PostCard'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/ui/Logo'
import type { FeedSortType } from '@/types'

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
  const t = useTranslations('feed')
  const tc = useTranslations('common')
  const [activeTab, setActiveTab] = useState<FeedSortType>('latest')
  const [showScrollTop, setShowScrollTop] = useState(false)
  const { location } = useLocation()

  const FEED_TABS: { key: FeedSortType; label: string }[] = [
    { key: 'latest', label: t('latest') },
    { key: 'popular', label: t('popular') },
    { key: 'nearby', label: t('nearby') },
    { key: 'following', label: t('following') },
  ]

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
            <Logo size="md" showText />
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
            <h1 className="text-xl font-black text-white">{t('title')}</h1>
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
          <div className="flex items-center gap-1 pb-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory">
            {FEED_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex-shrink-0 snap-start px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 tap-highlight-none',
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
            <p className="text-text-secondary text-center">{t('loadError')}</p>
            <p className="text-red-400 text-xs text-center max-w-xs break-all">
              {(isError as unknown as Error)?.message ?? String(isError)}
            </p>
            <button onClick={() => refetch()} className="text-primary font-semibold tap-highlight-none">
              {tc('retry')}
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
              <p className="text-white font-semibold mb-1">{t('emptyTitle')}</p>
              <p className="text-text-secondary text-sm">
                {activeTab === 'following'
                  ? t('emptyFollowing')
                  : t('emptyDefault')}
              </p>
            </div>
          </div>
        )}

        {/* Posts grid */}
        {posts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {posts.map((post, i) => (
              <PostCard key={post.id} post={post} priority={i < 2} />
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
            <p className="text-text-muted text-sm">{t('endMessage')}</p>
          </div>
        )}
      </div>

      {/* Upload FAB */}
      <Link
        href="/upload"
        className="fixed right-4 z-30 w-14 h-14 rounded-full bg-gradient-brand shadow-glow-primary flex items-center justify-center tap-highlight-none active:scale-90 transition-transform md:bottom-8"
        style={{ bottom: 'calc(var(--bottom-nav-height) + env(safe-area-inset-bottom) + 16px)' }}
        aria-label={t('uploadAria')}
      >
        <Plus size={28} className="text-white" strokeWidth={2.5} />
      </Link>

      {/* Scroll-to-top button */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed right-4 z-30 w-11 h-11 rounded-full bg-surface border border-border shadow-lg flex items-center justify-center tap-highlight-none active:scale-90 transition-transform md:bottom-8"
          style={{ bottom: 'calc(var(--bottom-nav-height) + env(safe-area-inset-bottom) + 80px)' }}
          aria-label={t('scrollTopAria')}
        >
          <ArrowUp size={20} className="text-white" />
        </button>
      )}
    </div>
  )
}
