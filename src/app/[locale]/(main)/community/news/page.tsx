'use client'

import { useCallback } from 'react'
import { Link, useRouter } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Eye, Pin, Plus, Newspaper } from 'lucide-react'
import { useGraffitiNewsList } from '@/hooks/useGraffitiNews'
import { useAuthStore } from '@/stores/useAuthStore'
import { formatRelativeTime } from '@/lib/utils'

const ADMIN_EMAIL = 'bpark0718@gmail.com'

function NewsSkeleton() {
  return (
    <div className="p-4 bg-surface rounded-2xl space-y-3">
      <div className="skeleton h-4 w-3/4 rounded" />
      <div className="skeleton h-3 w-full rounded" />
      <div className="skeleton h-3 w-1/3 rounded" />
    </div>
  )
}

export default function GraffitiNewsPage() {
  const t = useTranslations('community')
  const tp = useTranslations('post')
  const router = useRouter()
  const { user } = useAuthStore()
  const isAdmin = !!user && user.email === ADMIN_EMAIL

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

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-md pt-safe-top border-b border-border/40">
        <div className="max-w-3xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 tap-highlight-none rounded-xl hover:bg-surface-2 transition-colors"
            >
              <ArrowLeft size={22} className="text-white" />
            </button>
            <h1 className="text-xl font-black text-white">{tp('newsTitle')}</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 pt-4 pb-6">
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <NewsSkeleton key={i} />
            ))}
          </div>
        )}

        {!isLoading && newsList.length === 0 && (
          <div className="py-20 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center">
              <Newspaper size={32} className="text-text-muted" />
            </div>
            <div className="text-center">
              <p className="text-white font-semibold mb-1">{t('emptyNews')}</p>
              <p className="text-text-secondary text-sm">{t('emptyNewsCta')}</p>
            </div>
          </div>
        )}

        {newsList.length > 0 && (
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

                  <p className="text-text-secondary text-sm line-clamp-2 mb-3 leading-relaxed">
                    {news.content}
                  </p>

                  <div className="flex items-center justify-between text-text-muted text-xs">
                    <span>{formatRelativeTime(news.created_at)}</span>
                    <span className="flex items-center gap-1">
                      <Eye size={12} />
                      {news.view_count}
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

      {/* Admin: Write FAB */}
      {isAdmin && (
        <Link
          href="/community/news/write"
          className="fixed right-4 z-30 w-14 h-14 rounded-full bg-gradient-brand shadow-glow-primary flex items-center justify-center tap-highlight-none active:scale-90 transition-transform md:bottom-8"
          style={{ bottom: 'calc(var(--bottom-nav-height) + env(safe-area-inset-bottom) + 16px)' }}
          aria-label={t('newsWriteAria')}
        >
          <Plus size={28} className="text-white" strokeWidth={2.5} />
        </Link>
      )}
    </div>
  )
}
