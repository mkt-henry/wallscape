'use client'

import { useState, useRef, useCallback } from 'react'
import {
  Newspaper,
  Plus,
  Trash2,
  RefreshCw,
  ImagePlus,
  X,
  Eye,
  ExternalLink,
  Pin,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  useGraffitiNewsList,
  useCreateGraffitiNews,
  useDeleteGraffitiNews,
} from '@/hooks/useGraffitiNews'
import { useAuthStore } from '@/stores/useAuthStore'
import { resizeImage, generateStoragePath, formatRelativeTime } from '@/lib/utils'
import type { GraffitiNews } from '@/types'

export default function NewsPanel() {
  const { user, session } = useAuthStore()
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch } =
    useGraffitiNewsList()
  const { mutate: createNews, isPending: isCreating } = useCreateGraffitiNews()
  const { mutate: deleteNews } = useDeleteGraffitiNews()

  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const newsList = data?.pages.flatMap((page) => page.data) ?? []
  const canSubmit = title.trim().length > 0 && content.trim().length > 0 && !isCreating && !isUploading

  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
            fetchNextPage()
          }
        },
        { threshold: 0.1 }
      )
      observer.observe(node)
      return () => observer.disconnect()
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  )

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !user || !session?.access_token) return null
    const resized = await resizeImage(imageFile, 1200, 800, 0.85)
    const path = generateStoragePath(user.id, imageFile.name)
    const storageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/post-images/${path}`
    const res = await fetch(storageUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        'Content-Type': 'image/jpeg',
        'x-upsert': 'false',
      },
      body: resized,
    })
    if (!res.ok) throw new Error('Image upload failed')
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/post-images/${path}`
  }

  const handleSubmit = async () => {
    if (!canSubmit) return
    setIsUploading(true)
    try {
      const thumbnail_url = await uploadImage()
      createNews(
        { title: title.trim(), content: content.trim(), thumbnail_url: thumbnail_url ?? undefined },
        {
          onSuccess: () => {
            setTitle('')
            setContent('')
            handleRemoveImage()
            setShowForm(false)
          },
        }
      )
    } catch {
      alert('이미지 업로드 실패')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = (id: string) => {
    deleteNews(id, { onSuccess: () => setDeleteConfirm(null) })
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Newspaper size={20} className="text-primary" />
          <h2 className="text-lg font-bold">뉴스 관리</h2>
          <span className="text-text-muted text-sm">
            {newsList.length}건
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            className="text-text-secondary"
          >
            <RefreshCw size={14} />
          </Button>
          <Button
            size="sm"
            onClick={() => setShowForm(!showForm)}
            className="bg-primary text-white"
          >
            <Plus size={14} />
            <span className="ml-1">뉴스 작성</span>
          </Button>
        </div>
      </div>

      {/* Write Form */}
      {showForm && (
        <div className="bg-surface rounded-2xl p-5 space-y-4 border border-border/40">
          <h3 className="text-white font-semibold text-sm">새 뉴스 작성</h3>

          <Input
            placeholder="뉴스 제목"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
          />

          {/* Image */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleImageChange}
            />
            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden bg-surface-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Preview" className="w-full max-h-48 object-cover" />
                <button
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center tap-highlight-none"
                >
                  <X size={14} className="text-white" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-border text-text-secondary hover:border-primary hover:text-primary transition-colors tap-highlight-none"
              >
                <ImagePlus size={18} />
                <span className="text-sm">썸네일 이미지 (선택)</span>
              </button>
            )}
          </div>

          <textarea
            placeholder="뉴스 내용을 입력하세요..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            className="w-full bg-surface-2 text-white text-sm leading-relaxed placeholder:text-text-muted outline-none resize-none rounded-xl px-4 py-3"
          />

          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowForm(false)
                setTitle('')
                setContent('')
                handleRemoveImage()
              }}
            >
              취소
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="bg-primary text-white disabled:opacity-40"
            >
              {isUploading || isCreating ? '게시 중...' : '게시'}
            </Button>
          </div>
        </div>
      )}

      {/* News List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 bg-surface rounded-2xl space-y-2">
              <div className="skeleton h-4 w-3/4 rounded" />
              <div className="skeleton h-3 w-full rounded" />
              <div className="skeleton h-3 w-1/3 rounded" />
            </div>
          ))}
        </div>
      ) : newsList.length === 0 ? (
        <div className="py-16 text-center text-text-muted">
          <Newspaper size={32} className="mx-auto mb-3 opacity-40" />
          <p>아직 뉴스가 없습니다</p>
        </div>
      ) : (
        <div className="space-y-2">
          {newsList.map((news: GraffitiNews) => (
            <div
              key={news.id}
              className="bg-surface rounded-xl p-4 flex items-start gap-3"
            >
              {/* Thumbnail */}
              {news.thumbnail_url && (
                <div className="shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-surface-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={news.thumbnail_url}
                    alt={news.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {news.is_pinned && <Pin size={12} className="text-primary shrink-0" />}
                  {news.is_auto && (
                    <span className="shrink-0 px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] font-medium">
                      AUTO
                    </span>
                  )}
                  {news.source && (
                    <span className="shrink-0 px-1.5 py-0.5 rounded bg-surface-2 text-text-muted text-[10px] font-medium">
                      {news.source}
                    </span>
                  )}
                </div>
                <h4 className="text-white text-sm font-medium line-clamp-1">{news.title}</h4>
                <p className="text-text-secondary text-xs line-clamp-1 mt-0.5">{news.content}</p>
                <div className="flex items-center gap-3 mt-2 text-text-muted text-xs">
                  <span>{formatRelativeTime(news.created_at)}</span>
                  <span className="flex items-center gap-1">
                    <Eye size={11} /> {news.view_count}
                  </span>
                  {news.source_url && (
                    <a
                      href={news.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      <ExternalLink size={11} /> 원문
                    </a>
                  )}
                </div>
              </div>

              {/* Delete */}
              <div className="shrink-0">
                {deleteConfirm === news.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(news.id)}
                      className="px-2 py-1 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium tap-highlight-none"
                    >
                      삭제
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="px-2 py-1 rounded-lg bg-surface-2 text-text-muted text-xs tap-highlight-none"
                    >
                      취소
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(news.id)}
                    className="p-2 rounded-lg hover:bg-surface-2 text-text-muted hover:text-red-400 transition-colors tap-highlight-none"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
          {hasNextPage && <div ref={sentinelRef} className="h-4" />}
          {isFetchingNextPage && (
            <div className="flex justify-center py-4"><div className="loader" /></div>
          )}
        </div>
      )}
    </div>
  )
}
