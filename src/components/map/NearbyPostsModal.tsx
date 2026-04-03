'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { Link } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { X, Heart, MapPin, Navigation, ExternalLink } from 'lucide-react'
import { formatNumber, formatDistance, getDisplayProfile } from '@/lib/utils'
import { useAuthStore } from '@/stores/useAuthStore'
import type { NearbyPost } from '@/types'

interface NearbyPostsModalProps {
  posts: NearbyPost[]
  onClose: () => void
}

export function NearbyPostsModal({ posts, onClose }: NearbyPostsModalProps) {
  const t = useTranslations('map')
  const { user } = useAuthStore()
  const [currentIndex, setCurrentIndex] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  if (posts.length === 0) return null

  const post = posts[currentIndex]
  const { profile: author, isAnonymous } = getDisplayProfile(
    post.profiles,
    post.show_in_profile,
    user?.id,
    post.user_id,
    post.id
  )

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const index = Math.round(el.scrollLeft / el.clientWidth)
    if (index !== currentIndex) setCurrentIndex(index)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Sheet */}
      <div
        className="relative w-full rounded-t-3xl bg-background overflow-hidden"
        style={{ maxHeight: '78dvh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2">
          <p className="text-white font-semibold text-sm">{t('areaArtworks')}</p>
          <div className="flex items-center gap-3">
            <span className="text-text-secondary text-sm">{currentIndex + 1} / {posts.length}</span>
            <button onClick={onClose} className="p-1 tap-highlight-none">
              <X size={20} className="text-text-secondary" />
            </button>
          </div>
        </div>

        {/* Image carousel */}
        <div
          ref={scrollRef}
          className="flex overflow-x-auto"
          style={{
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
          onScroll={handleScroll}
        >
          {posts.map((p) => (
            <div
              key={p.id}
              className="shrink-0 relative bg-surface-2"
              style={{
                width: '100%',
                aspectRatio: '4/3',
                scrollSnapAlign: 'start',
                scrollSnapStop: 'always',
              }}
            >
              <Image
                src={p.image_url}
                alt={p.title ?? ''}
                fill
                className="object-cover"
                sizes="100vw"
              />
            </div>
          ))}
        </div>

        {/* Dot indicators */}
        {posts.length > 1 && (
          <div className="flex justify-center gap-1.5 py-2">
            {posts.slice(0, 20).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  i === currentIndex ? 'w-4 bg-primary' : 'w-1.5 bg-white/30'
                }`}
              />
            ))}
          </div>
        )}

        {/* Post info */}
        <div className="px-4 pt-1 pb-[calc(env(safe-area-inset-bottom)+var(--bottom-nav-height)+1rem)] space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              {post.title && (
                <h2 className="text-white font-bold text-base leading-snug mb-0.5 line-clamp-1">
                  {post.title}
                </h2>
              )}
              <p className="text-text-secondary text-sm">
                {isAnonymous ? author.display_name : (author.display_name || author.username)}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0 pt-0.5">
              <Heart size={13} className="text-red-400" />
              <span className="text-text-secondary text-sm">{formatNumber(post.like_count)}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {post.address && (
              <div className="flex items-center gap-1 flex-1 min-w-0">
                <MapPin size={12} className="text-primary shrink-0" />
                <span className="text-text-secondary text-xs truncate">{post.address}</span>
              </div>
            )}
            {post.distance_meters !== undefined && (
              <div className="flex items-center gap-1 shrink-0">
                <Navigation size={12} className="text-secondary" />
                <span className="text-secondary text-xs font-medium">
                  {formatDistance(post.distance_meters)}
                </span>
              </div>
            )}
          </div>

          <Link
            href={`/feed/${post.id}`}
            className="flex items-center justify-center gap-2 w-full bg-primary text-white font-semibold py-3 rounded-2xl tap-highlight-none active:scale-95 transition-transform"
          >
            <ExternalLink size={18} />
            {t('viewInFeed')}
          </Link>
        </div>
      </div>
    </div>
  )
}
