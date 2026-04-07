'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useUpdatePost } from '@/hooks/usePosts'
import { parseTagsFromString, cn } from '@/lib/utils'
import type { PostWithUser, PostCategory } from '@/types'

interface PostEditModalProps {
  post: PostWithUser
  onClose: () => void
}

export function PostEditModal({ post, onClose }: PostEditModalProps) {
  const [title, setTitle] = useState(post.title ?? '')
  const [description, setDescription] = useState(post.description ?? '')
  const [tagsInput, setTagsInput] = useState((post.tags ?? []).join(' '))
  const [category, setCategory] = useState<PostCategory | null>(post.category ?? null)

  const { mutate: updatePost, isPending } = useUpdatePost()

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleSave = () => {
    updatePost(
      {
        postId: post.id,
        title: title.trim(),
        description: description.trim(),
        tags: parseTagsFromString(tagsInput),
        category,
      },
      { onSuccess: onClose }
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-background overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
          <h2 className="text-white font-bold">게시물 수정</h2>
          <button onClick={onClose} className="p-1 tap-highlight-none">
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        {/* Form */}
        <div className="px-4 py-4 space-y-4 max-h-[70dvh] overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+var(--bottom-nav-height)+1.5rem)]">
          {/* Category */}
          <div>
            <label className="text-text-secondary text-xs font-medium uppercase tracking-wide mb-2 block">
              카테고리
            </label>
            <div className="flex gap-2">
              {(['태깅', '뮤럴', '바밍'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(category === cat ? null : cat)}
                  className={cn(
                    'flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all tap-highlight-none border',
                    category === cat
                      ? 'bg-primary text-white border-primary'
                      : 'bg-surface-2 text-text-secondary border-transparent hover:border-primary/30'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-text-secondary text-xs font-medium uppercase tracking-wide mb-2 block">
              제목
            </label>
            <Input
              placeholder="이 작품의 제목은?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={60}
            />
            <p className="text-text-muted text-xs mt-1 text-right">{title.length}/60</p>
          </div>

          {/* Description */}
          <div>
            <label className="text-text-secondary text-xs font-medium uppercase tracking-wide mb-2 block">
              설명
            </label>
            <textarea
              placeholder="이 작품에 대해 이야기해주세요..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              className="input-base resize-none text-sm"
            />
            <p className="text-text-muted text-xs mt-1 text-right">{description.length}/500</p>
          </div>

          {/* Tags */}
          <div>
            <label className="text-text-secondary text-xs font-medium uppercase tracking-wide mb-2 block">
              태그
            </label>
            <Input
              placeholder="#graffiti #streetart #서울"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
            <p className="text-text-muted text-xs mt-1">쉼표나 공백으로 구분, # 자동 제거</p>
          </div>

          <Button onClick={handleSave} isLoading={isPending} fullWidth>
            저장하기
          </Button>
        </div>
      </div>
    </div>
  )
}
