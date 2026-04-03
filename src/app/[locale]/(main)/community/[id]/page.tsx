'use client'

import { useState } from 'react'
import { useRouter, Link } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Heart, MessageSquare, Eye, Send, MoreHorizontal, Trash2 } from 'lucide-react'
import { useBoardPost, useBoardComments, useAddBoardComment, useDeleteBoardPost } from '@/hooks/useCommunity'
import { useAuthStore } from '@/stores/useAuthStore'
import { Avatar } from '@/components/ui/Avatar'
import { ActionSheet } from '@/components/ui/BottomSheet'
import { formatRelativeTime, formatDateTime } from '@/lib/utils'

const CATEGORY_TKEYS: Record<string, string> = {
  general: 'catFree',
  question: 'catQuestion',
  meetup: 'catMeeting',
  tips: 'catTip',
  showcase: 'catBrag',
}

interface Props {
  params: { id: string }
}

export default function CommunityPostPage({ params }: Props) {
  const { id } = params
  const router = useRouter()
  const tp = useTranslations('post')
  const tc = useTranslations('community')
  const tcom = useTranslations('common')
  const { user } = useAuthStore()
  const [comment, setComment] = useState('')
  const [showMoreSheet, setShowMoreSheet] = useState(false)

  const { data: post, isLoading } = useBoardPost(id)
  const { data: comments = [], isLoading: isCommentsLoading } = useBoardComments(id)
  const { mutate: addComment, isPending: isSubmitting } = useAddBoardComment()
  const { mutate: deletePost } = useDeleteBoardPost()

  const isOwnPost = !!user && !!post && user.id === post.user_id

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return
    addComment(
      { boardPostId: id, content: comment.trim() },
      { onSuccess: () => setComment('') }
    )
  }

  const handleDelete = () => {
    deletePost(id, { onSuccess: () => router.replace('/community') })
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

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-white font-semibold mb-2">{tp('communityPostNotFound')}</p>
          <button onClick={() => router.back()} className="text-primary tap-highlight-none">
            {tcom('goBack')}
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
          <h1 className="text-white font-semibold">{tc('title')}</h1>
          {isOwnPost ? (
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
        {/* Category + Title */}
        <div>
          <span className="inline-block px-2 py-0.5 rounded-md bg-surface-2 text-text-secondary text-xs font-medium mb-3">
            {CATEGORY_TKEYS[post.category] ? tc(CATEGORY_TKEYS[post.category]) : post.category}
          </span>
          <h2 className="text-white font-bold text-xl break-words">{post.title}</h2>
        </div>

        {/* Author */}
        <div className="flex items-center justify-between">
          <Link
            href={`/profile/${post.profiles.username}`}
            className="flex items-center gap-3 tap-highlight-none"
          >
            <Avatar src={post.profiles.avatar_url} username={post.profiles.username} size="md" />
            <div>
              <p className="text-white font-semibold text-sm">
                {post.profiles.display_name || post.profiles.username}
              </p>
              <p className="text-text-muted text-xs">{formatDateTime(post.created_at)}</p>
            </div>
          </Link>
          <div className="flex items-center gap-3 text-text-muted text-xs">
            <span className="flex items-center gap-1"><Eye size={14} /> {post.view_count}</span>
            <span className="flex items-center gap-1"><Heart size={14} /> {post.like_count}</span>
          </div>
        </div>

        {/* Body */}
        <div className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap break-words">
          {post.content}
        </div>

        {/* Image */}
        {post.image_url && (
          <div className="rounded-xl overflow-hidden bg-surface-2 -mx-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.image_url} alt={post.title} className="w-full object-cover max-h-96" />
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-border" />

        {/* Comments */}
        <div className="space-y-4">
          <h3 className="text-white font-semibold">{tp('comments')}{post.comment_count}</h3>

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
              <p className="text-text-secondary text-sm">{tp('firstComment')}</p>
            </div>
          )}

          {!isCommentsLoading && comments.length > 0 && (
            <div className="space-y-5">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <Avatar src={c.profiles.avatar_url} username={c.profiles.username} size="sm" className="shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-white text-sm font-semibold truncate">
                        {c.profiles.display_name || c.profiles.username}
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
              ))}
            </div>
          )}

          {/* Comment form */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-3 pt-2 border-t border-border"
          >
            <Avatar src={null} username={user?.email || 'guest'} size="sm" className="shrink-0" />
            <div className="flex-1 flex items-center gap-2 bg-surface-2 rounded-full px-4 py-2.5 min-w-0">
              <input
                type="text"
                placeholder={user ? tp('addComment') : tp('loginToComment')}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={!user}
                className="flex-1 min-w-0 bg-transparent text-sm text-white placeholder:text-text-muted outline-none disabled:cursor-not-allowed"
              />
              {user && (
                <button
                  type="submit"
                  disabled={!comment.trim() || isSubmitting}
                  className="text-primary disabled:opacity-30 tap-highlight-none shrink-0"
                >
                  <Send size={18} />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Delete ActionSheet */}
      {isOwnPost && (
        <ActionSheet
          isOpen={showMoreSheet}
          onClose={() => setShowMoreSheet(false)}
          title={tp('communityPostOptions')}
          options={[
            {
              icon: <Trash2 size={20} />,
              label: tcom('delete'),
              destructive: true,
              onClick: handleDelete,
            },
          ]}
        />
      )}
    </div>
  )
}
