'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
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
  Archive,
  EyeOff,
  Trash2,
  Flag,
  Link as LinkIcon,
  Camera,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react'
import { usePost, useLikePost, useBookmarkPost, useComments, useAddComment, useArchivePost, useDeletePost, useReportStatus, useMyStatusReport } from '@/hooks/usePosts'
import { useAuthStore } from '@/stores/useAuthStore'
import { Avatar } from '@/components/ui/Avatar'
import { ActionSheet } from '@/components/ui/BottomSheet'
import { formatRelativeTime, formatNumber, formatDate, cn, getDisplayProfile } from '@/lib/utils'

const MiniMap = dynamic(() => import('@/components/map/MiniMap'), {
  ssr: false,
  loading: () => <div className="h-36 rounded-2xl skeleton" />,
})

interface Props {
  params: { id: string }
}

export default function PostDetailPage({ params }: Props) {
  const { id } = params
  const router = useRouter()
  const { user } = useAuthStore()
  const [comment, setComment] = useState('')
  const [showMoreSheet, setShowMoreSheet] = useState(false)

  const { data: post, isLoading } = usePost(id)
  const { data: comments = [], isLoading: isCommentsLoading } = useComments(id)
  const { mutate: toggleLike, isPending: isLiking } = useLikePost()
  const { mutate: toggleBookmark, isPending: isBookmarking } = useBookmarkPost()
  const { mutate: addComment, isPending: isSubmittingComment } = useAddComment()
  const { mutate: archivePost } = useArchivePost()
  const { mutate: deletePost } = useDeletePost()
  const { mutate: reportStatus, isPending: isReporting } = useReportStatus()
  const { data: myReport } = useMyStatusReport(id)

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return
    addComment({ postId: id, content: comment.trim() }, {
      onSuccess: () => setComment(''),
    })
  }

  const isOwnPost = !!user && !!post && user.id === post.user_id

  const handleShare = async () => {
    try {
      await navigator.share({ title: post?.title, url: window.location.href })
    } catch {
      await navigator.clipboard.writeText(window.location.href)
    }
  }

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setShowMoreSheet(false)
  }

  const handleDelete = () => {
    if (!post) return
    deletePost(post.id, { onSuccess: () => router.replace('/feed') })
    setShowMoreSheet(false)
  }

  // ── Loading skeleton ──────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-md border-b border-border/40">
          <div className="flex items-center px-4 h-14">
            <div className="skeleton w-8 h-8 rounded-full" />
          </div>
        </div>
        <div className="skeleton w-full aspect-square" />
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="skeleton w-10 h-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-24 rounded" />
              <div className="skeleton h-3 w-16 rounded" />
            </div>
          </div>
          <div className="skeleton h-4 w-3/4 rounded" />
          <div className="skeleton h-3 w-full rounded" />
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-white font-semibold mb-2">게시물을 찾을 수 없습니다</p>
          <button onClick={() => router.back()} className="text-primary tap-highlight-none">
            돌아가기
          </button>
        </div>
      </div>
    )
  }

  const { profile: author, isAnonymous } = getDisplayProfile(post.profiles, post.show_in_profile, user?.id, post.user_id, post.id)

  // ── Main render ───────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">

      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-md pt-safe-top border-b border-border/40">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 tap-highlight-none rounded-xl hover:bg-surface-2 transition-colors"
          >
            <ArrowLeft size={22} className="text-white" />
          </button>
          <h1 className="text-white font-semibold">게시물</h1>
          <button
            onClick={() => setShowMoreSheet(true)}
            className="p-2 -mr-2 tap-highlight-none rounded-xl hover:bg-surface-2 transition-colors"
          >
            <MoreHorizontal size={22} className="text-white" />
          </button>
        </div>
      </div>

      {/* Content — max-width container, responsive grid */}
      <div className="max-w-5xl mx-auto lg:px-6 lg:py-6">
        <div className="lg:grid lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_440px] lg:gap-6 lg:items-start">

          {/* ── Image ── */}
          <div className="overflow-hidden lg:rounded-2xl lg:sticky lg:top-20">
            <div className="relative w-full aspect-square bg-surface-2 overflow-hidden">
              <Image
                src={post.image_url}
                alt={post.title}
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 60vw"
                priority
              />
            </div>
          </div>

          {/* ── Post info + comments ── */}
          <div className="px-4 py-4 lg:px-0 lg:py-0 space-y-4 lg:space-y-6">

            {/* Author */}
            {isAnonymous ? (
              <div className="flex items-center gap-3">
                <Avatar src={author.avatar_url} username={author.username} size="md" className="shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-text-secondary font-semibold">{author.display_name}</p>
                </div>
              </div>
            ) : (
              <Link
                href={`/profile/${author.username}`}
                className="flex items-center gap-3 tap-highlight-none"
              >
                <Avatar
                  src={author.avatar_url}
                  username={author.username}
                  size="md"
                  className="shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold truncate">
                    {author.display_name || author.username}
                  </p>
                  <p className="text-text-secondary text-sm truncate">
                    @{author.username}
                  </p>
                </div>
              </Link>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-between py-2 border-y border-border">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => toggleLike({ postId: post.id, isLiked: post.is_liked })}
                  disabled={isLiking || !user}
                  className="flex items-center gap-1.5 tap-highlight-none transition-transform active:scale-90"
                >
                  <Heart size={22} className={cn('transition-all duration-200', post.is_liked ? 'fill-red-500 text-red-500' : 'text-white')} />
                  <span className={cn('text-sm font-medium', post.is_liked ? 'text-red-500' : 'text-white')}>
                    {formatNumber(post.like_count)}
                  </span>
                </button>
                <button className="flex items-center gap-1.5 tap-highlight-none">
                  <MessageCircle size={22} className="text-white" />
                  <span className="text-sm font-medium text-white">{formatNumber(post.comment_count)}</span>
                </button>
                <button onClick={handleShare} className="tap-highlight-none">
                  <Share2 size={22} className="text-white" />
                </button>
              </div>
              <button
                onClick={() => toggleBookmark({ postId: post.id, isBookmarked: post.is_bookmarked })}
                disabled={isBookmarking || !user}
                className="tap-highlight-none transition-transform active:scale-90"
              >
                <Bookmark size={22} className={cn('transition-all duration-200', post.is_bookmarked ? 'fill-primary text-primary' : 'text-white')} />
              </button>
            </div>

            {/* Title & description */}
            <div>
              <h2 className="text-white font-bold text-lg break-words">{post.title}</h2>
              {post.description && (
                <p className="text-text-secondary text-sm mt-1 leading-relaxed break-words">
                  {post.description}
                </p>
              )}
            </div>

            {/* Tags */}
            {post.tags?.length > 0 && (
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
                <span className="text-text-secondary text-sm group-hover:text-primary transition-colors truncate">
                  {post.address || post.city}
                </span>
              </Link>
            )}

            {/* Map preview */}
            {post.lat && post.lng && (
              <MiniMap lat={post.lat} lng={post.lng} address={post.address ?? undefined} postId={post.id} />
            )}

            {/* Photo taken date */}
            {post.photo_taken_at && (
              <div className="flex items-center gap-2">
                <Camera size={16} className="text-text-muted shrink-0" />
                <span className="text-text-secondary text-sm">
                  촬영일: {formatDate(post.photo_taken_at)}
                </span>
              </div>
            )}

            <p className="text-text-muted text-xs">{formatRelativeTime(post.created_at)}</p>

            {/* Status report section */}
            <div className="bg-surface-2 rounded-2xl p-4 space-y-3">
              <h4 className="text-white text-sm font-semibold">현재 상태</h4>

              {/* Status verdict + last confirmed date */}
              <div className="flex items-center justify-between gap-3">
                {post.gone_count > 0 && post.gone_count >= post.still_there_count ? (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                    <XCircle size={15} className="text-red-400" />
                    <span className="text-red-400 text-sm font-semibold">없어짐</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2">
                    <CheckCircle2 size={15} className="text-green-400" />
                    <span className="text-green-400 text-sm font-semibold">아직 있음</span>
                  </div>
                )}
                <span className="text-text-muted text-xs flex items-center gap-1 shrink-0">
                  <Clock size={12} />
                  {formatRelativeTime(post.last_confirmed_at ?? post.created_at)}
                </span>
              </div>

              {/* Report counts */}
              {(post.still_there_count > 0 || post.gone_count > 0) && (
                <div className="flex items-center gap-4">
                  {post.still_there_count > 0 && (
                    <div className="flex items-center gap-1.5 text-green-400">
                      <CheckCircle2 size={13} />
                      <span className="text-xs">{post.still_there_count}명 확인</span>
                    </div>
                  )}
                  {post.gone_count > 0 && (
                    <div className="flex items-center gap-1.5 text-red-400">
                      <XCircle size={13} />
                      <span className="text-xs">{post.gone_count}명 없어짐 보고</span>
                    </div>
                  )}
                </div>
              )}


              {/* Report buttons */}
              {user && !isOwnPost && (
                <div className="flex gap-2">
                  <button
                    onClick={() => reportStatus({ postId: post.id, status: 'still_there' })}
                    disabled={isReporting}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all tap-highlight-none',
                      myReport?.status === 'still_there'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-surface-3 text-text-secondary hover:bg-surface-3/80'
                    )}
                  >
                    <CheckCircle2 size={16} />
                    아직 있어요
                  </button>
                  <button
                    onClick={() => reportStatus({ postId: post.id, status: 'gone' })}
                    disabled={isReporting}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all tap-highlight-none',
                      myReport?.status === 'gone'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-surface-3 text-text-secondary hover:bg-surface-3/80'
                    )}
                  >
                    <XCircle size={16} />
                    없어졌어요
                  </button>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="h-px bg-border" />

            {/* Comments section */}
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
                    const author = (c as {
                      profiles: { username: string; display_name: string | null; avatar_url: string | null }
                    }).profiles
                    return (
                      <div key={c.id} className="flex gap-3">
                        <Avatar src={author.avatar_url} username={author.username} size="sm" className="shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="text-white text-sm font-semibold truncate min-w-0">
                              {author.display_name || author.username}
                            </span>
                            <span className="text-text-muted text-xs shrink-0">
                              {formatRelativeTime(c.created_at)}
                            </span>
                          </div>
                          <p className="text-text-secondary text-sm mt-0.5 leading-relaxed break-words">
                            {c.content}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Desktop comment form */}
              <form
                onSubmit={handleSubmitComment}
                className="hidden lg:flex items-center gap-3 pt-2 border-t border-border"
              >
                <Avatar src={null} username={user?.email || 'guest'} size="sm" className="shrink-0" />
                <div className="flex-1 flex items-center gap-2 bg-surface-2 rounded-full px-4 py-2.5 min-w-0">
                  <input
                    type="text"
                    placeholder={user ? '댓글 추가...' : '로그인 후 댓글을 남길 수 있어요'}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    disabled={!user}
                    className="flex-1 min-w-0 bg-transparent text-sm text-white placeholder:text-text-muted outline-none disabled:cursor-not-allowed"
                  />
                  {user && (
                    <button
                      type="submit"
                      disabled={!comment.trim() || isSubmittingComment}
                      className="text-primary disabled:opacity-30 tap-highlight-none shrink-0"
                    >
                      <Send size={18} />
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Mobile spacer for fixed comment bar above bottom nav */}
            <div className="lg:hidden h-16" />
          </div>
        </div>
      </div>

      {/* Mobile comment bar — fixed above BottomNavBar, hidden on lg+. */}
      <div className="lg:hidden fixed left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border px-4 py-3 z-[60]"
        style={{ bottom: 'calc(var(--bottom-nav-height) + env(safe-area-inset-bottom))' }}
      >
        <form onSubmit={handleSubmitComment} className="flex items-center gap-3">
          <Avatar src={null} username={user?.email || 'guest'} size="sm" className="shrink-0" />
          <div className="flex-1 flex items-center gap-2 bg-surface-2 rounded-full px-4 py-2.5 min-w-0">
            <input
              type="text"
              placeholder={user ? '댓글 추가...' : '로그인 후 댓글을 남길 수 있어요'}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={!user}
              className="flex-1 min-w-0 bg-transparent text-sm text-white placeholder:text-text-muted outline-none disabled:cursor-not-allowed"
            />
            {user && (
              <button
                type="submit"
                disabled={!comment.trim() || isSubmittingComment}
                className="text-primary disabled:opacity-30 tap-highlight-none shrink-0"
              >
                <Send size={18} />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ── More options ActionSheet ── */}
      {isOwnPost ? (
        <ActionSheet
          isOpen={showMoreSheet}
          onClose={() => setShowMoreSheet(false)}
          title="게시물 옵션"
          options={[
            {
              icon: post.visibility === 'private' ? <EyeOff size={20} /> : <Archive size={20} />,
              label: post.visibility === 'private' ? '공개로 전환' : '보관하기',
              onClick: () => {
                archivePost({ postId: post.id, isArchived: post.visibility === 'private' })
                setShowMoreSheet(false)
              },
            },
            {
              icon: <LinkIcon size={20} />,
              label: '링크 복사',
              onClick: handleCopyLink,
            },
            {
              icon: <Trash2 size={20} />,
              label: '삭제',
              destructive: true,
              onClick: handleDelete,
            },
          ]}
        />
      ) : (
        <ActionSheet
          isOpen={showMoreSheet}
          onClose={() => setShowMoreSheet(false)}
          title="게시물 옵션"
          options={[
            {
              icon: <LinkIcon size={20} />,
              label: '링크 복사',
              onClick: handleCopyLink,
            },
            {
              icon: <Flag size={20} />,
              label: '신고',
              destructive: true,
              onClick: () => setShowMoreSheet(false),
            },
          ]}
        />
      )}
    </div>
  )
}
