'use client'

import { useState } from 'react'
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

  const postImage = (
    <div className="relative bg-surface-2 aspect-square w-full">
      <Image
        src={post.image_url}
        alt={post.title}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 50vw"
        priority
      />
    </div>
  )

  const postInfo = (
    <div className="space-y-4">
      {/* Author */}
      <Link href={`/profile/${post.profiles.username}`} className="flex items-center gap-3 tap-highlight-none">
        <Avatar src={post.profiles.avatar_url} username={post.profiles.username} size="md" />
        <div>
          <p className="text-white font-semibold">{post.profiles.display_name || post.profiles.username}</p>
          <p className="text-text-secondary text-sm">@{post.profiles.username}</p>
        </div>
      </Link>

      {/* Actions */}
      <div className="flex items-center justify-between py-2 border-y border-border">
        <div className="flex items-center gap-4">
          <button onClick={() => toggleLike({ postId: post.id, isLiked: post.is_liked })}
            disabled={isLiking || !user}
            className="flex items-center gap-1.5 tap-highlight-none transition-transform active:scale-90">
            <Heart size={22} className={cn('transition-all duration-200', post.is_liked ? 'fill-red-500 text-red-500' : 'text-white')} />
            <span className={cn('text-sm font-medium', post.is_liked ? 'text-red-500' : 'text-white')}>{formatNumber(post.like_count)}</span>
          </button>
          <button className="flex items-center gap-1.5 tap-highlight-none">
            <MessageCircle size={22} className="text-white" />
            <span className="text-sm font-medium text-white">{formatNumber(post.comment_count)}</span>
          </button>
          <button onClick={handleShare} className="tap-highlight-none">
            <Share2 size={22} className="text-white" />
          </button>
        </div>
        <button onClick={() => toggleBookmark({ postId: post.id, isBookmarked: post.is_bookmarked })}
          disabled={isBookmarking || !user}
          className="tap-highlight-none transition-transform active:scale-90">
          <Bookmark size={22} className={cn('transition-all duration-200', post.is_bookmarked ? 'fill-primary text-primary' : 'text-white')} />
        </button>
      </div>

      {/* Title & description */}
      <div>
        <h2 className="text-white font-bold text-lg">{post.title}</h2>
        {post.description && <p className="text-text-secondary text-sm mt-1 leading-relaxed">{post.description}</p>}
      </div>

      {/* Tags */}
      {post.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Link key={tag} href={`/search?q=${encodeURIComponent(tag)}&type=tags`}
              className="tag-pill tap-highlight-none hover:tag-pill-active transition-colors">
              #{tag}
            </Link>
          ))}
        </div>
      )}

      {/* Location */}
      {(post.address || post.city) && (
        <Link href={`/map?lat=${post.lat}&lng=${post.lng}`} className="flex items-center gap-2 tap-highlight-none group">
          <MapPin size={16} className="text-primary shrink-0" />
          <span className="text-text-secondary text-sm group-hover:text-primary transition-colors">{post.address || post.city}</span>
        </Link>
      )}

      {/* Map preview */}
      <Link href={`/map?lat=${post.lat}&lng=${post.lng}&postId=${post.id}`}
        className="block bg-surface-2 rounded-2xl overflow-hidden h-36 relative group tap-highlight-none">
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center">
            <MapPin size={28} className="text-primary mx-auto mb-1.5" />
            <p className="text-white text-sm font-medium">지도에서 보기</p>
            {post.address && <p className="text-text-secondary text-xs mt-0.5">{post.address}</p>}
          </div>
        </div>
        <div className="absolute inset-0 bg-surface-2 group-hover:bg-surface-3 transition-colors" />
      </Link>

      <p className="text-text-muted text-xs">{formatRelativeTime(post.created_at)}</p>
    </div>
  )

  const commentsSection = (
    <div id="comments" className="space-y-4">
      <h3 className="text-white font-semibold">댓글 {formatNumber(post.comment_count)}개</h3>

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
        <div className="py-6 text-center">
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
                    <span className="text-white text-sm font-semibold">{author.display_name || author.username}</span>
                    <span className="text-text-muted text-xs">{formatRelativeTime(c.created_at)}</span>
                  </div>
                  <p className="text-text-secondary text-sm mt-0.5 leading-relaxed">{c.content}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Comment input */}
      <form onSubmit={handleSubmitComment} className="flex items-center gap-3 pt-2 border-t border-border">
        <Avatar src={null} username={user?.email || 'guest'} size="sm" />
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
            <button type="submit" disabled={!comment.trim() || isSubmittingComment}
              className="text-primary disabled:opacity-30 tap-highlight-none">
              <Send size={18} />
            </button>
          )}
        </div>
      </form>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-md pt-safe-top border-b border-border/40">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
          <button onClick={() => router.back()} className="p-2 -ml-2 tap-highlight-none rounded-xl hover:bg-surface-2 transition-colors">
            <ArrowLeft size={22} className="text-white" />
          </button>
          <h1 className="text-white font-semibold">게시물</h1>
          <button className="p-2 -mr-2 tap-highlight-none rounded-xl hover:bg-surface-2 transition-colors">
            <MoreHorizontal size={22} className="text-white" />
          </button>
        </div>
      </div>

      {/* Mobile layout — stacked */}
      <div className="md:hidden">
        {postImage}
        <div className="px-4 py-4 space-y-4">
          {postInfo}
          <div className="h-px bg-border" />
          {commentsSection}
        </div>
        {/* Sticky comment input for mobile */}
        <div className="h-20" />
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border px-4 py-3 z-30">
          <form onSubmit={handleSubmitComment} className="flex items-center gap-3">
            <Avatar src={null} username={user?.email || 'guest'} size="sm" />
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
                <button type="submit" disabled={!comment.trim() || isSubmittingComment}
                  className="text-primary disabled:opacity-30 tap-highlight-none">
                  <Send size={18} />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Desktop layout — 2 columns */}
      <div className="hidden md:block max-w-5xl mx-auto px-6 py-6">
        <div className="grid grid-cols-[1fr_400px] lg:grid-cols-[1fr_440px] gap-6 items-start">
          {/* Left: image carousel */}
          <div className="rounded-2xl overflow-hidden sticky top-20">
            {postImage}
          </div>

          {/* Right: info + comments */}
          <div className="space-y-6">
            {postInfo}
            <div className="h-px bg-border" />
            {commentsSection}
          </div>
        </div>
      </div>
    </div>
  )
}
