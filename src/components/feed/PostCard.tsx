'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Link } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { Heart, MessageCircle, Bookmark, MapPin, MoreHorizontal, Archive, EyeOff, CheckCircle2, XCircle } from 'lucide-react'
import { useLikePost, useBookmarkPost, useArchivePost } from '@/hooks/usePosts'
import { useAuthStore } from '@/stores/useAuthStore'
import { Avatar } from '@/components/ui/Avatar'
import { ActionSheet } from '@/components/ui/BottomSheet'
import { formatRelativeTime, formatNumber, cn, getDisplayProfile } from '@/lib/utils'
import type { PostWithUser } from '@/types'

interface PostCardProps {
  post: PostWithUser
  showLocation?: boolean
  priority?: boolean
}

export function PostCard({ post, showLocation = true, priority = false }: PostCardProps) {
  const t = useTranslations('post')
  const { user } = useAuthStore()
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [doubleTapTimer, setDoubleTapTimer] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [showHeartAnim, setShowHeartAnim] = useState(false)

  const [showMoreSheet, setShowMoreSheet] = useState(false)

  const { mutate: toggleLike, isPending: isLiking } = useLikePost()
  const { mutate: toggleBookmark, isPending: isBookmarking } = useBookmarkPost()
  const { mutate: archivePost } = useArchivePost()

  const isOwnPost = !!user && user.id === post.user_id

  const handleImageDoubleTap = () => {
    if (doubleTapTimer) {
      // Double tap detected
      clearTimeout(doubleTapTimer)
      setDoubleTapTimer(null)
      if (user && !post.is_liked) {
        toggleLike({ postId: post.id, isLiked: false })
        triggerHeartAnimation()
      }
    } else {
      const timer = setTimeout(() => {
        setDoubleTapTimer(null)
      }, 300)
      setDoubleTapTimer(timer)
    }
  }

  const triggerHeartAnimation = () => {
    setShowHeartAnim(true)
    setTimeout(() => setShowHeartAnim(false), 800)
  }

  const { profile: author, isAnonymous } = getDisplayProfile(post.profiles, post.show_in_profile, user?.id, post.user_id, post.id)

  return (
    <article className="bg-surface rounded-3xl overflow-hidden shadow-card animate-fade-in">
      {/* Author header */}
      <div className="flex items-center justify-between px-4 py-3">
        {isAnonymous ? (
          <div className="flex items-center gap-3">
            <Avatar src={author.avatar_url} username={author.username} size="sm" />
            <div>
              <p className="text-text-secondary text-sm font-semibold leading-tight">
                {author.display_name}
              </p>
              {showLocation && (post.district || post.city || post.address) && (
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin size={10} className="text-primary" />
                  <span className="text-text-secondary text-xs">
                    {post.district || post.city || post.address}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <Link
            href={`/profile/${author.username}`}
            className="flex items-center gap-3 tap-highlight-none"
          >
            <Avatar src={author.avatar_url} username={author.username} size="sm" />
            <div>
              <p className="text-white text-sm font-semibold leading-tight">
                {author.display_name || author.username}
              </p>
              {showLocation && (post.district || post.city || post.address) && (
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin size={10} className="text-primary" />
                  <span className="text-text-secondary text-xs">
                    {post.district || post.city || post.address}
                  </span>
                </div>
              )}
            </div>
          </Link>
        )}

        <button
          className="p-1 tap-highlight-none"
          onClick={() => setShowMoreSheet(true)}
        >
          <MoreHorizontal size={20} className="text-text-secondary" />
        </button>
      </div>

      {/* Image */}
      <Link href={`/feed/${post.id}`} className="block relative tap-highlight-none">
        <div
          className="relative w-full aspect-square bg-surface-2"
          onClick={handleImageDoubleTap}
        >
          {!isImageLoaded && !imageError && <div className="absolute inset-0 skeleton" />}

          {imageError ? (
            <div className="absolute inset-0 bg-surface-2 flex items-center justify-center">
              <span className="text-4xl">🎨</span>
            </div>
          ) : (
            <Image
              src={post.image_url}
              alt={post.title}
              fill
              priority={priority}
              className={cn(
                'object-cover transition-opacity duration-300',
                isImageLoaded ? 'opacity-100' : 'opacity-0'
              )}
              sizes="(max-width: 768px) 100vw, 600px"
              onLoad={() => setIsImageLoaded(true)}
              onError={() => { setImageError(true); setIsImageLoaded(true) }}
            />
          )}

          {/* Category badge */}
          {post.category && (
            <div className="absolute top-3 left-3 pointer-events-none">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-black/50 text-white backdrop-blur-sm">
                {post.category}
              </span>
            </div>
          )}

          {/* Double tap heart animation */}
          {showHeartAnim && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Heart
                size={80}
                className="fill-white text-white animate-scale-in"
                style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }}
              />
            </div>
          )}
        </div>
      </Link>

      {/* Actions */}
      <div className="px-4 pt-3 pb-1 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Like */}
          <button
            onClick={() => user && toggleLike({ postId: post.id, isLiked: post.is_liked })}
            disabled={isLiking || !user}
            className="flex items-center gap-1.5 tap-highlight-none transition-transform active:scale-90"
          >
            <Heart
              size={22}
              className={cn(
                'transition-all duration-200',
                post.is_liked ? 'fill-red-500 text-red-500' : 'text-white'
              )}
            />
            <span
              className={cn(
                'text-sm font-medium',
                post.is_liked ? 'text-red-500' : 'text-white'
              )}
            >
              {formatNumber(post.like_count)}
            </span>
          </button>

          {/* Comment */}
          <Link
            href={`/feed/${post.id}#comments`}
            className="flex items-center gap-1.5 tap-highlight-none"
          >
            <MessageCircle size={22} className="text-white" />
            <span className="text-sm font-medium text-white">
              {formatNumber(post.comment_count)}
            </span>
          </Link>
        </div>

        {/* Bookmark */}
        <button
          onClick={() =>
            user && toggleBookmark({ postId: post.id, isBookmarked: post.is_bookmarked })
          }
          disabled={isBookmarking || !user}
          className="tap-highlight-none transition-transform active:scale-90"
        >
          <Bookmark
            size={22}
            className={cn(
              'transition-all duration-200',
              post.is_bookmarked ? 'fill-primary text-primary' : 'text-white'
            )}
          />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 pb-4 space-y-1.5">
        {/* Title */}
        <Link href={`/feed/${post.id}`} className="tap-highlight-none block">
          <h3 className="text-white font-semibold text-sm leading-snug line-clamp-1">
            {post.title}
          </h3>
        </Link>

        {/* Description */}
        {post.description && (
          <p className="text-text-secondary text-sm leading-relaxed line-clamp-2">
            {post.description}
          </p>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {post.tags.slice(0, 4).map((tag) => (
              <Link
                key={tag}
                href={`/search?q=${encodeURIComponent(tag)}&type=tags`}
                className="text-primary text-xs font-medium tap-highlight-none hover:underline"
              >
                #{tag}
              </Link>
            ))}
            {post.tags.length > 4 && (
              <span className="text-text-muted text-xs">
                +{post.tags.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Status + Timestamp */}
        <div className="flex items-center gap-2 pt-1">
          {post.last_report_status === 'gone' ? (
            <span className="flex items-center gap-1 text-red-400 text-xs">
              <XCircle size={12} />
              {t('statusGone')}
            </span>
          ) : post.last_report_status === 'still_there' ? (
            <span className="flex items-center gap-1 text-green-400 text-xs">
              <CheckCircle2 size={12} />
              {t('statusConfirmed')}
            </span>
          ) : null}
          <p className="text-text-muted text-xs">
            {formatRelativeTime(post.last_confirmed_at ?? post.created_at)}
          </p>
        </div>
      </div>
      {isOwnPost && (
        <ActionSheet
          isOpen={showMoreSheet}
          onClose={() => setShowMoreSheet(false)}
          title={t('postOptions')}
          options={[
            {
              icon: post.visibility === 'private' ? <EyeOff size={20} /> : <Archive size={20} />,
              label: post.visibility === 'private' ? t('makePublic') : t('archive'),
              onClick: () =>
                archivePost({ postId: post.id, isArchived: post.visibility === 'private' }),
            },
          ]}
        />
      )}
    </article>
  )
}
