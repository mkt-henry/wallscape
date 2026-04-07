'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Eye, MoreHorizontal, Trash2, Pin, ExternalLink } from 'lucide-react'
import { useGraffitiNews, useDeleteGraffitiNews } from '@/hooks/useGraffitiNews'
import { useAuthStore } from '@/stores/useAuthStore'
import { ActionSheet } from '@/components/ui/BottomSheet'
import { formatDateTime } from '@/lib/utils'

const ADMIN_EMAIL = 'bpark0718@gmail.com'

interface Props {
  params: { id: string }
}

export default function GraffitiNewsDetailPage({ params }: Props) {
  const { id } = params
  const router = useRouter()
  const t = useTranslations('post')
  const tc = useTranslations('common')
  const tcom = useTranslations('community')
  const { user } = useAuthStore()
  const [showMoreSheet, setShowMoreSheet] = useState(false)

  const { data: news, isLoading } = useGraffitiNews(id)
  const { mutate: deleteNews } = useDeleteGraffitiNews()

  const isAdmin = !!user && user.email === ADMIN_EMAIL

  const handleDelete = () => {
    deleteNews(id, { onSuccess: () => router.replace('/community/news') })
    setShowMoreSheet(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-md border-b border-border/40">
          <div className="flex items-center px-4 h-14">
            <div className="skeleton w-8 h-8 rounded-full" />
          </div>
        </div>
        <div className="p-4 space-y-4">
          <div className="skeleton h-6 w-3/4 rounded" />
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-4 w-2/3 rounded" />
        </div>
      </div>
    )
  }

  if (!news) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-white font-semibold mb-2">{t('newsNotFound')}</p>
          <button onClick={() => router.back()} className="text-primary tap-highlight-none">
            {tc('goBack')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-md pt-safe-top border-b border-border/40">
        <div className="max-w-3xl mx-auto px-4 flex items-center justify-between h-14">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 tap-highlight-none rounded-xl hover:bg-surface-2 transition-colors"
          >
            <ArrowLeft size={22} className="text-white" />
          </button>
          <h1 className="text-white font-semibold">{t('newsTitle')}</h1>
          {isAdmin ? (
            <button
              onClick={() => setShowMoreSheet(true)}
              className="p-2 -mr-2 tap-highlight-none rounded-xl hover:bg-surface-2 transition-colors"
            >
              <MoreHorizontal size={22} className="text-white" />
            </button>
          ) : (
            <div className="w-10" />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Pinned */}
        {news.is_pinned && (
          <div className="flex items-center gap-1 text-primary text-xs font-semibold">
            <Pin size={12} />
            {t('pinned')}
          </div>
        )}

        {/* Title */}
        <h2 className="text-white font-bold text-xl break-words">{news.title}</h2>

        {/* Meta */}
        <div className="flex items-center justify-between text-text-muted text-xs pb-4 border-b border-border">
          <span>{formatDateTime(news.created_at)}</span>
          <span className="flex items-center gap-1">
            <Eye size={14} />
            {news.view_count}
          </span>
        </div>

        {/* Thumbnail */}
        {news.thumbnail_url && (
          <div className="rounded-xl overflow-hidden bg-surface-2 -mx-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={news.thumbnail_url} alt={news.title} className="w-full object-cover max-h-72" />
          </div>
        )}

        {/* Body */}
        <div className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap break-words">
          {news.content}
        </div>

        {/* Source link */}
        {news.source_url && (
          <a
            href={news.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-surface hover:bg-surface-2 transition-colors tap-highlight-none"
          >
            <ExternalLink size={16} className="text-primary" />
            <span className="text-primary text-sm font-medium">
              {tcom('readOriginal')}
            </span>
            {news.source && (
              <span className="text-text-muted text-xs">— {news.source}</span>
            )}
          </a>
        )}
      </div>

      {/* Admin ActionSheet */}
      {isAdmin && (
        <ActionSheet
          isOpen={showMoreSheet}
          onClose={() => setShowMoreSheet(false)}
          title={t('newsOptions')}
          options={[
            {
              icon: <Trash2 size={20} />,
              label: tc('delete'),
              destructive: true,
              onClick: handleDelete,
            },
          ]}
        />
      )}
    </div>
  )
}
