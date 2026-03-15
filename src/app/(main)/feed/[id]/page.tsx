'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  MapPin,
  MoreHorizontal,
  Send,
} from 'lucide-react'
import { usePost, useLikePost, useBookmarkPost, useComments, useAddComment } from '@/hooks/usePosts'
import { useAuthStore } from '@/stores/useAuthStore'
import { Avatar } from '@/components/ui/Avatar'
import { formatRelativeTime, formatNumber, cn } from '@/lib/utils'

interface Props {
  params: { id: string }
}

export default function PostDetailPage({ params }: Props) {
  const { id } = params
  const router = useRouter()
  const { user } = useAuthStore()

  const [comment, setComment] = useState('')
  const [showAllComments, setShowAllComments] = useState(false)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)

  const handleCarouselScroll = useCallback(() => {
    if (!carouselRef.current) return
    const { scrollLeft, offsetWidth } = carouselRef.current
    setActiveImageIndex(Math.round(scrollLeft / offsetWidth))
  }, [])

  const { data: post, isLoading } = usePost(id)
  const { data: comments = [], isLoading: isCommentsLoading } = useComments(id)
  const { mutate: toggleLike, isPending: isLiking } = useLikePost()
  const { mutate: toggleBookmark, isPending: isBookmarking } = useBookmarkPost()
  const { mutate: addComment, isPending: isSubmittingComment } = useAddComment()

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return
    addComment({ postId: id, content: comment.trim() }, {
      onSuccess: () => setComment(''),
    })
  }

  const handleShare = async () => {
    try {
      await navigator.share({
        title: post?.title,
        url: window.location.href,
      })
    } catch {
      // Copy to clipboard as fallback
      await navigator.clipboard.writeText(window.location.href)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header skeleton */}
        <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-md">
          <div className="flex items-center px-4 h-14">
            <div className="skeleton w-8 h-8 rounded-full" />
          </div>
        </div>

        {/* Image skeleton */}
        <div className="skeleton w-full aspect-square" />

        {/* Content skeleton */}
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="skeleton w-10 h-10 rounded-full" />
            <div className="space-y-2">
              <div className="skeleton h-4 w-24 rounded" />
              <div className="skeleton h-3 w-16 rounded" />
            </div>
          </div>
          <div className="skeleton h-4 w-3/4 rounded" />
          <div className="skeleton h-3 w-full rounded" />
          <div className="skeleton h-3 w-2/3 rounded" />
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-white font-semibold mb-2">게시물을 찾을 수 없습니다</p>
          <button
            onClick={() => router.back()}
            className="text-primary tap-highlight-none"
          >
            돌아가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-md pt-safe-top">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 tap-highlight-none"
          >
            <ArrowLeft size={24} className="text-white" />
          </button>
          <h1 className="text-white font-semibold">게시물</h1>
          <button className="p-2 -mr-2 tap-highlight-none">
            <MoreHorizontal size={24} className="text-white" />
          </button>
        </div>
      </div>

      {/* Image carousel */}
      {(() => {
        const images = post.image_urls?.length > 0 ? post.image_urls : [post.image_url]
        return (
          <div className="relative w-full bg-surface-2">
            <div
              ref={carouselRef}
              className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
              onScroll={handleCarouselScroll}
            >
              {images.map((url, i) => (
                <div key={i} className="flex-shrink-0 w-full aspect-square relative snap-start">
                  <Image
                    src={url}
                    alt={`${post.title} ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="100vw"
                    priority={i === 0}
                  />
                </div>
              ))}
            </div>

            {/* Dot indicators */}
            {images.length > 1 && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                {images.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'rounded-full transition-all duration-200',
                      i === activeImageIndex
                        ? 'w-4 h-1.5 bg-white'
                        : 'w-1.5 h-1.5 bg-white/50'
                    )}
                  />
                ))}
              </div>
            )}

            {/* Image counter */}
            {images.length > 1 && (
              <div className="absolute top-3 right-3 bg-black/60 rounded-full px-2.5 py-1 text-white text-xs font-medium">
                {activeImageIndex + 1} / {images.length}
              </div>
            )}
          </div>
        )
      })()}

      {/* Post actions bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-4">
          <button
            onClick={() => toggleLike({ postId: post.id, isLiked: post.is_liked })}
            disabled={isLiking || !user}
            className="flex items-center gap-1.5 tap-highlight-none transition-transform active:scale-90"
          >
            <Heart
              size={26}
              className={cn(
                'transition-all duration-200',
                post.is_liked
                  ? 'fill-red-500 text-red-500 scale-110'
                  : 'text-white'
              )}
            />
            <span className={cn(
              'text-sm font-medium',
              post.is_liked ? 'text-red-500' : 'text-white'
            )}>
              {formatNumber(post.like_count)}
            </span>
          </button>

          <button className="flex items-center gap-1.5 tap-highlight-none">
            <MessageCircle size={26} className="text-white" />
            <span className="text-sm font-medium text-white">
              {formatNumber(post.comment_count)}
            </span>
          </button>

          <button
            onClick={handleShare}
            className="tap-highlight-none"
          >
            <Share2 size={24} className="text-white" />
          </button>
        </div>

        <button
          onClick={() => toggleBookmark({ postId: post.id, isBookmarked: post.is_bookmarked })}
          disabled={isBookmarking || !user}
          className="tap-highlight-none transition-transform active:scale-90"
        >
          <Bookmark
            size={24}
            className={cn(
              'transition-all duration-200',
              post.is_bookmarked
                ? 'fill-primary text-primary'
                : 'text-white'
            )}
          />
        </button>
      </div>

      {/* Post info */}
      <div className="px-4 py-4 space-y-4">
        {/* Author */}
        <Link
          href={`/profile/${post.profiles.username}`}
          className="flex items-center gap-3 tap-highlight-none"
        >
          <Avatar
            src={post.profiles.avatar_url}
            username={post.profiles.username}
            size="md"
          />
          <div>
            <p className="text-white font-semibold">
              {post.profiles.display_name || post.profiles.username}
            </p>
            <p className="text-text-secondary text-sm">
              @{post.profiles.username}
            </p>
          </div>
        </Link>

        {/* Title & description */}
        <div>
          <h2 className="text-white font-bold text-lg">{post.title}</h2>
          {post.description && (
            <p className="text-text-secondary text-sm mt-1 leading-relaxed">
              {post.description}
            </p>
          )}
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Link
                key={tag}
                href={`/search?q=${encodeURIComponent(tag)}&type=tags`}
                className="tag-pill tap-highlight-none hover:tag-pill-active transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {/* Location */}
        {(post.address || post.city) && (
          <Link
            href={`/map?lat=${post.lat}&lng=${post.lng}`}
            className="flex items-center gap-2 tap-highlight-none group"
          >
            <MapPin size={16} className="text-primary shrink-0" />
            <span className="text-text-secondary text-sm group-hover:text-primary transition-colors">
              {post.address || post.city}
            </span>
          </Link>
        )}

        {/* Map preview */}
        <Link
          href={`/map?lat=${post.lat}&lng=${post.lng}&postId=${post.id}`}
          className="block bg-surface-2 rounded-2xl overflow-hidden h-40 relative group tap-highlight-none"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <MapPin size={32} className="text-primary mx-auto mb-2" />
              <p className="text-white text-sm font-medium">지도에서 보기</p>
              {post.address && (
                <p className="text-text-secondary text-xs mt-1">{post.address}</p>
              )}
            </div>
          </div>
          <div className="absolute inset-0 bg-surface-2 group-hover:bg-surface-3 transition-colors" />
        </Link>

        {/* Timestamp */}
        <p className="text-text-muted text-xs">
          {formatRelativeTime(post.created_at)}
        </p>
      </div>

      {/* Divider */}
      <div className="h-px bg-border mx-4" />

      {/* Comments section */}
      <div id="comments" className="px-4 py-4">
        <h3 className="text-white font-semibold mb-4">
          댓글 {formatNumber(post.comment_count)}개
        </h3>

        {isCommentsLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="skeleton w-8 h-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3 w-20 rounded" />
                  <div className="skeleton h-3 w-full rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isCommentsLoading && comments.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-text-secondary text-sm">첫 댓글을 남겨보세요!</p>
          </div>
        )}

        {!isCommentsLoading && comments.length > 0 && (
          <div className="space-y-5">
            {comments.map((c) => {
              const author = (c as { profiles: { username: string; display_name: string | null; avatar_url: string | null } }).profiles
              return (
                <div key={c.id} className="flex gap-3">
                  <Avatar src={author.avatar_url} username={author.username} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-white text-sm font-semibold">
                        {author.display_name || author.username}
                      </span>
                      <span className="text-text-muted text-xs">
                        {formatRelativeTime(c.created_at)}
                      </span>
                    </div>
                    <p className="text-text-secondary text-sm mt-0.5 leading-relaxed">
                      {c.content}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Comment input - sticky at bottom */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur-md border-t border-border px-4 py-3">
        <form onSubmit={handleSubmitComment} className="flex items-center gap-3">
          <Avatar
            src={user ? null : null}
            username={user?.email || 'guest'}
            size="sm"
          />
          <div className="flex-1 flex items-center gap-2 bg-surface-2 rounded-full px-4 py-2.5">
            <input
              type="text"
              placeholder={user ? '댓글 추가...' : '로그인 후 댓글을 남길 수 있어요'}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={!user}
              className="flex-1 bg-transparent text-sm text-white placeholder:text-text-muted outline-none disabled:cursor-not-allowed"
            />
            {user && (
              <button
                type="submit"
                disabled={!comment.trim() || isSubmittingComment}
                className="text-primary disabled:opacity-30 tap-highlight-none"
              >
                <Send size={18} />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
