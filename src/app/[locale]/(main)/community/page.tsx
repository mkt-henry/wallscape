'use client'

import { useState, useCallback } from 'react'
import { Link } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { Plus, MessageSquare, Eye, Heart, Pin, Newspaper, ExternalLink } from 'lucide-react'
import { useBoardPosts } from '@/hooks/useCommunity'
import { useGraffitiNewsList } from '@/hooks/useGraffitiNews'
import { useAuthStore } from '@/stores/useAuthStore'
import { Avatar } from '@/components/ui/Avatar'
import { formatRelativeTime, cn } from '@/lib/utils'
import type { BoardCategory } from '@/types'

const ADMIN_EMAIL = 'bpark0718@gmail.com'

type ActiveTab = 'all' | 'news' | BoardCategory

const TAB_KEYS: { key: ActiveTab; tKey: string }[] = [
  { key: 'all', tKey: 'tabAll' },
  { key: 'news', tKey: 'tabNews' },
  { key: 'general', tKey: 'tabFree' },
  { key: 'question', tKey: 'tabQuestion' },
  { key: 'meetup', tKey: 'tabMeeting' },
]

const CATEGORY_TKEYS: Record<string, string> = {
  general: 'catFree',
  question: 'catQuestion',
  meetup: 'catMeeting',
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

function NewsSkeleton() {
  return (
    <div className="p-4 bg-surface rounded-2xl space-y-3">
      <div className="skeleton h-4 w-3/4 rounded" />
      <div className="skeleton h-3 w-full rounded" />
      <div className="skeleton h-3 w-1/3 rounded" />
    </div>
  )
}

function AllList() {
  const t = useTranslations('community')
  const { data: newsData, isLoading: isNewsLoading } = useGraffitiNewsList()
  const newsList = newsData?.pages[0]?.data ?? []

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading: isPostsLoading } =
    useBoardPosts(undefined)
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

  if (isNewsLoading || isPostsLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => <PostSkeleton key={i} />)}
      </div>
    )
  }

  const hasContent = newsList.length > 0 || posts.length > 0

  if (!hasContent) {
    return (
      <div className="py-20 flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center">
          <MessageSquare size={32} className="text-text-muted" />
        </div>
        <div className="text-center">
          <p className="text-white font-semibold mb-1">{t('emptyPosts')}</p>
          <p className="text-text-secondary text-sm">{t('emptyPostsCta')}</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {newsList.map((news) => (
          <Link
            key={`news-${news.id}`}
            href={`/community/news/${news.id}`}
            className="block bg-surface rounded-2xl tap-highlight-none hover:bg-surface-2 transition-colors overflow-hidden"
          >
            {news.thumbnail_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={news.thumbnail_url} alt={news.title} className="w-full h-40 object-cover" />
            )}
            <div className="p-4">
              {news.is_pinned && (
                <div className="flex items-center gap-1 text-primary text-xs font-semibold mb-2">
                  <Pin size={12} />
                  {t('pinned')}
                </div>
              )}
              <div className="flex items-start gap-2 mb-2">
                <span className="shrink-0 px-2 py-0.5 rounded-md bg-primary/20 text-primary text-xs font-medium flex items-center gap-1">
                  <Newspaper size={10} />
                  {t('news')}
                </span>
                {news.source && (
                  <span className="shrink-0 px-2 py-0.5 rounded-md bg-surface-2 text-text-muted text-xs font-medium flex items-center gap-1">
                    <ExternalLink size={10} />
                    {news.source}
                  </span>
                )}
                <h3 className="text-white font-semibold text-sm leading-snug line-clamp-2 flex-1">
                  {news.title}
                </h3>
              </div>
              <p className="text-text-secondary text-sm line-clamp-2 mb-3 leading-relaxed">
                {news.content}
              </p>
              <div className="flex items-center justify-between text-text-muted text-xs">
                <span>{formatRelativeTime(news.created_at)}</span>
                <span className="flex items-center gap-1"><Eye size={12} />{news.view_count}</span>
              </div>
            </div>
          </Link>
        ))}
        {posts.map((post) => (
          <Link
            key={`post-${post.id}`}
            href={`/community/${post.id}`}
            className="block p-4 bg-surface rounded-2xl tap-highlight-none hover:bg-surface-2 transition-colors"
          >
            {post.is_pinned && (
              <div className="flex items-center gap-1 text-primary text-xs font-semibold mb-2">
                <Pin size={12} />
                {t('pinned')}
              </div>
            )}
            <div className="flex items-start gap-2 mb-2">
              <span className="shrink-0 px-2 py-0.5 rounded-md bg-surface-2 text-text-secondary text-xs font-medium">
                {CATEGORY_TKEYS[post.category] ? t(CATEGORY_TKEYS[post.category]) : post.category}
              </span>
              <h3 className="text-white font-semibold text-sm leading-snug line-clamp-2 flex-1">
                {post.title}
              </h3>
            </div>
            <p className="text-text-secondary text-sm line-clamp-2 mb-3 leading-relaxed">
              {post.content}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar src={post.profiles.avatar_url} username={post.profiles.username} size="xs" />
                <span className="text-text-secondary text-xs">
                  {post.profiles.display_name || post.profiles.username}
                </span>
                <span className="text-text-muted text-xs">{formatRelativeTime(post.created_at)}</span>
              </div>
              <div className="flex items-center gap-3 text-text-muted text-xs">
                <span className="flex items-center gap-1"><Heart size={12} />{post.like_count}</span>
                <span className="flex items-center gap-1"><MessageSquare size={12} />{post.comment_count}</span>
                <span className="flex items-center gap-1"><Eye size={12} />{post.view_count}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {hasNextPage && <div ref={sentinelRef} className="h-4 mt-4" />}
      {isFetchingNextPage && (
        <div className="flex justify-center py-6"><div className="loader" /></div>
      )}
    </>
  )
}

function BoardList({ category }: { category?: BoardCategory }) {
  const t = useTranslations('community')
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useBoardPosts(category)

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

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => <PostSkeleton key={i} />)}
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center">
          <MessageSquare size={32} className="text-text-muted" />
        </div>
        <div className="text-center">
          <p className="text-white font-semibold mb-1">{t('emptyPosts')}</p>
          <p className="text-text-secondary text-sm">{t('emptyPostsCta')}</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/community/${post.id}`}
            className="block p-4 bg-surface rounded-2xl tap-highlight-none hover:bg-surface-2 transition-colors"
          >
            {post.is_pinned && (
              <div className="flex items-center gap-1 text-primary text-xs font-semibold mb-2">
                <Pin size={12} />
                {t('pinned')}
              </div>
            )}
            <div className="flex items-start gap-2 mb-2">
              <span className="shrink-0 px-2 py-0.5 rounded-md bg-surface-2 text-text-secondary text-xs font-medium">
                {CATEGORY_TKEYS[post.category] ? t(CATEGORY_TKEYS[post.category]) : post.category}
              </span>
              <h3 className="text-white font-semibold text-sm leading-snug line-clamp-2 flex-1">
                {post.title}
              </h3>
            </div>
            <p className="text-text-secondary text-sm line-clamp-2 mb-3 leading-relaxed">
              {post.content}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar src={post.profiles.avatar_url} username={post.profiles.username} size="xs" />
                <span className="text-text-secondary text-xs">
                  {post.profiles.display_name || post.profiles.username}
                </span>
                <span className="text-text-muted text-xs">{formatRelativeTime(post.created_at)}</span>
              </div>
              <div className="flex items-center gap-3 text-text-muted text-xs">
                <span className="flex items-center gap-1"><Heart size={12} />{post.like_count}</span>
                <span className="flex items-center gap-1"><MessageSquare size={12} />{post.comment_count}</span>
                <span className="flex items-center gap-1"><Eye size={12} />{post.view_count}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {hasNextPage && <div ref={sentinelRef} className="h-4 mt-4" />}
      {isFetchingNextPage && (
        <div className="flex justify-center py-6"><div className="loader" /></div>
      )}
    </>
  )
}

function NewsList() {
  const t = useTranslations('community')
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useGraffitiNewsList()

  const newsList = data?.pages.flatMap((page) => page.data) ?? []

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

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => <NewsSkeleton key={i} />)}
      </div>
    )
  }

  if (newsList.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center">
          <Newspaper size={32} className="text-text-muted" />
        </div>
        <div className="text-center">
          <p className="text-white font-semibold mb-1">{t('emptyNews')}</p>
          <p className="text-text-secondary text-sm">{t('emptyNewsCta')}</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {newsList.map((news) => (
          <Link
            key={news.id}
            href={`/community/news/${news.id}`}
            className="block bg-surface rounded-2xl tap-highlight-none hover:bg-surface-2 transition-colors overflow-hidden"
          >
            {news.thumbnail_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={news.thumbnail_url} alt={news.title} className="w-full h-40 object-cover" />
            )}
            <div className="p-4">
              {news.is_pinned && (
                <div className="flex items-center gap-1 text-primary text-xs font-semibold mb-2">
                  <Pin size={12} />
                  {t('pinned')}
                </div>
              )}
              <h3 className="text-white font-semibold text-sm leading-snug line-clamp-2 mb-2">
                {news.title}
              </h3>
              {news.source && (
                <div className="flex items-center gap-1 text-text-muted text-xs mb-1">
                  <ExternalLink size={10} />
                  {news.source}
                </div>
              )}
              <p className="text-text-secondary text-sm line-clamp-2 mb-3 leading-relaxed">
                {news.content}
              </p>
              <div className="flex items-center justify-between text-text-muted text-xs">
                <span>{formatRelativeTime(news.created_at)}</span>
                <span className="flex items-center gap-1"><Eye size={12} />{news.view_count}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {hasNextPage && <div ref={sentinelRef} className="h-4 mt-4" />}
      {isFetchingNextPage && (
        <div className="flex justify-center py-6"><div className="loader" /></div>
      )}
    </>
  )
}

export default function CommunityPage() {
  const t = useTranslations('community')
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<ActiveTab>('all')

  const isAdmin = !!user && user.email === ADMIN_EMAIL
  const isNewsTab = activeTab === 'news'
  const boardCategory = (activeTab === 'all' || isNewsTab) ? undefined : activeTab as BoardCategory

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-md pt-safe-top border-b border-border/40">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center h-14">
            <h1 className="text-xl font-black text-white">{t('title')}</h1>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 pb-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory">
            {TAB_KEYS.map((tab) => (
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
                {t(tab.tKey)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 pt-4 pb-6">
        {isNewsTab ? (
          <NewsList />
        ) : activeTab === 'all' ? (
          <AllList />
        ) : (
          <BoardList category={boardCategory} />
        )}
      </div>

      {/* FAB */}
      {isNewsTab ? (
        isAdmin && (
          <Link
            href="/community/news/write"
            className="fixed right-4 z-30 w-14 h-14 rounded-full bg-gradient-brand shadow-glow-primary flex items-center justify-center tap-highlight-none active:scale-90 transition-transform md:bottom-8"
            style={{ bottom: 'calc(var(--bottom-nav-height) + env(safe-area-inset-bottom) + 16px)' }}
            aria-label={t('newsWriteAria')}
          >
            <Plus size={28} className="text-white" strokeWidth={2.5} />
          </Link>
        )
      ) : (
        user && (
          <Link
            href="/community/write"
            className="fixed right-4 z-30 w-14 h-14 rounded-full bg-gradient-brand shadow-glow-primary flex items-center justify-center tap-highlight-none active:scale-90 transition-transform md:bottom-8"
            style={{ bottom: 'calc(var(--bottom-nav-height) + env(safe-area-inset-bottom) + 16px)' }}
            aria-label={t('writeAria')}
          >
            <Plus size={28} className="text-white" strokeWidth={2.5} />
          </Link>
        )
      )}
    </div>
  )
}
