'use client'

import Image from 'next/image'
import Link from 'next/link'
import { X, Heart, MapPin, ExternalLink, Navigation } from 'lucide-react'
import { useMapStore } from '@/stores/useMapStore'
import { Avatar } from '@/components/ui/Avatar'
import { formatNumber, formatDistance, formatRelativeTime, getDisplayProfile } from '@/lib/utils'
import { useAuthStore } from '@/stores/useAuthStore'
import type { NearbyPost } from '@/types'

export function MarkerBottomSheet() {
  const { selectedPost, closePostSheet } = useMapStore()

  const { user } = useAuthStore()

  if (!selectedPost) return null

  const isNearby = 'distance_meters' in selectedPost
  const post = selectedPost as NearbyPost
  const author = getDisplayProfile(post.profiles, post.show_in_profile, user?.id, post.user_id)
  const isAnonymous = author.id === 'anonymous'

  const handleDirections = () => {
    const url = `https://map.kakao.com/link/to/${encodeURIComponent(post.title)},${post.lat},${post.lng}`
    window.open(url, '_blank')
  }

  return (
    <div className="bottom-sheet-content pb-safe-bottom">
      {/* Handle bar */}
      <div className="flex justify-center pt-3 pb-2">
        <div className="w-10 h-1 bg-border rounded-full" />
      </div>

      {/* Close button */}
      <button
        onClick={closePostSheet}
        className="absolute top-4 right-4 p-2 tap-highlight-none"
      >
        <X size={20} className="text-text-secondary" />
      </button>

      {/* Content */}
      <div className="px-4 pb-6">
        {/* Post preview */}
        <div className="flex gap-4 mb-4">
          {/* Thumbnail */}
          <Link
            href={`/feed/${post.id}`}
            className="shrink-0 w-20 h-20 rounded-2xl overflow-hidden bg-surface-2 tap-highlight-none"
          >
            <Image
              src={post.image_url}
              alt={post.title}
              width={80}
              height={80}
              className="w-full h-full object-cover"
            />
          </Link>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <Link href={`/feed/${post.id}`} className="tap-highlight-none">
              <h3 className="text-white font-semibold line-clamp-2 leading-snug mb-1.5">
                {post.title}
              </h3>
            </Link>

            {/* Location */}
            {post.address && (
              <div className="flex items-center gap-1 mb-2">
                <MapPin size={12} className="text-primary shrink-0" />
                <span className="text-text-secondary text-xs truncate">
                  {post.address}
                </span>
              </div>
            )}

            {/* Distance */}
            {isNearby && post.distance_meters !== undefined && (
              <div className="flex items-center gap-1 mb-2">
                <Navigation size={12} className="text-secondary" />
                <span className="text-secondary text-xs font-medium">
                  {formatDistance(post.distance_meters)} 거리
                </span>
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Heart size={12} className="text-red-400" />
                <span className="text-text-secondary text-xs">
                  {formatNumber(post.like_count)}
                </span>
              </div>
              <span className="text-text-muted text-xs">
                {formatRelativeTime(post.created_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Author */}
        {isAnonymous ? (
          <div className="flex items-center gap-3 p-3 bg-surface-2 rounded-2xl mb-4">
            <Avatar src={null} username="wallscape" size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-text-secondary text-sm font-medium">공용 계정</p>
            </div>
          </div>
        ) : (
          <Link
            href={`/profile/${author.username}`}
            className="flex items-center gap-3 p-3 bg-surface-2 rounded-2xl mb-4 tap-highlight-none"
          >
            <Avatar src={author.avatar_url} username={author.username} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {author.display_name || author.username}
              </p>
              <p className="text-text-secondary text-xs">@{author.username}</p>
            </div>
          </Link>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {post.tags.slice(0, 5).map((tag) => (
              <span key={tag} className="tag-pill">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href={`/feed/${post.id}`}
            className="flex items-center justify-center gap-2 bg-primary text-white font-semibold py-3 rounded-2xl tap-highlight-none active:scale-95 transition-transform"
          >
            <ExternalLink size={18} />
            게시물 보기
          </Link>

          <button
            onClick={handleDirections}
            className="flex items-center justify-center gap-2 bg-surface-2 text-white font-semibold py-3 rounded-2xl border border-border tap-highlight-none active:scale-95 transition-transform"
          >
            <Navigation size={18} />
            길찾기
          </button>
        </div>
      </div>
    </div>
  )
}
