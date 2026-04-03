'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { X, Heart, MapPin, Navigation, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import { formatNumber, formatDistance, getDisplayProfile } from '@/lib/utils'
import { useAuthStore } from '@/stores/useAuthStore'
import type { NearbyPost } from '@/types'

interface NearbyPostsModalProps {
  posts: NearbyPost[]
  onClose: () => void
}

export function NearbyPostsModal({ posts, onClose }: NearbyPostsModalProps) {
  const { user } = useAuthStore()
  const [currentIndex, setCurrentIndex] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  if (posts.length === 0) return null

  const goTo = (index: number) => {
    const next = Math.max(0, Math.min(index, posts.length - 1))
    setCurrentIndex(next)
    scrollRef.current?.children[next]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }

  const post = posts[currentIndex]
  const { profile: author, isAnonymous } = getDisplayProfile(
    post.profiles,
    post.show_in_profile,
    user?.id,
    post.user_id,
    post.id
  )

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-safe-top h-14 shrink-0">
        <button onClick={onClose} className="p-2 -ml-2 tap-highlight-none">
          <X size={22} className="text-white" />
        </button>
        <p className="text-white font-semibold text-sm">
          이 지역 게시물
        </p>
        <span className="text-text-secondary text-sm font-medium">
          {currentIndex + 1} / {posts.length}
        </span>
      </div>

      {/* Image carousel */}
      <div className="relative flex-1 min-h-0">
        <div
          ref={scrollRef}
          className="flex h-full overflow-x-auto snap-x snap-mandatory scrollbar-none"
          style={{ scrollbarWidth: 'none' }}
          onScroll={(e) => {
            const el = e.currentTarget
            const index = Math.round(el.scrollLeft / el.clientWidth)
            if (index !== currentIndex) setCurrentIndex(index)
          }}
        >
          {posts.map((p) => (
            <div key={p.id} className="w-full h-full shrink-0 snap-center relative">
              <Image
                src={p.image_url}
                alt={p.title ?? '작품'}
                fill
                className="object-contain"
                sizes="100vw"
              />
            </div>
          ))}
        </div>

        {/* Prev / Next arrows */}
        {currentIndex > 0 && (
          <button
            onClick={() => goTo(currentIndex - 1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass flex items-center justify-center tap-highlight-none"
          >
            <ChevronLeft size={20} className="text-white" />
          </button>
        )}
        {currentIndex < posts.length - 1 && (
          <button
            onClick={() => goTo(currentIndex + 1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass flex items-center justify-center tap-highlight-none"
          >
            <ChevronRight size={20} className="text-white" />
          </button>
        )}

        {/* Dot indicators */}
        {posts.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {posts.slice(0, 20).map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === currentIndex ? 'bg-primary w-4' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Post info */}
      <div className="shrink-0 bg-surface-1 border-t border-border/40 px-4 pt-4 pb-safe-bottom space-y-3">
        {/* Title & author */}
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            {post.title && (
              <h2 className="text-white font-bold text-base leading-snug mb-1 line-clamp-2">
                {post.title}
              </h2>
            )}
            <p className="text-text-secondary text-sm">
              {isAnonymous ? author.display_name : (author.display_name || author.username)}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Heart size={14} className="text-red-400" />
            <span className="text-text-secondary text-sm">{formatNumber(post.like_count)}</span>
          </div>
        </div>

        {/* Location & distance */}
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

        {/* CTA */}
        <Link
          href={`/feed/${post.id}`}
          className="flex items-center justify-center gap-2 w-full bg-primary text-white font-semibold py-3 rounded-2xl tap-highlight-none active:scale-95 transition-transform"
        >
          <ExternalLink size={18} />
          피드에서 보기
        </Link>
      </div>
    </div>
  )
}
