'use client'

import { useRef, useState } from 'react'
import { useRouter } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { ArrowLeft, ImagePlus, X } from 'lucide-react'
import { useCreateGraffitiNews } from '@/hooks/useGraffitiNews'
import { useAuthStore } from '@/stores/useAuthStore'
import { resizeImage, generateStoragePath, cn } from '@/lib/utils'

const ADMIN_EMAIL = 'bpark0718@gmail.com'

export default function GraffitiNewsWritePage() {
  const t = useTranslations('community')
  const tc = useTranslations('common')
  const router = useRouter()
  const { user, session } = useAuthStore()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { mutate: createNews, isPending } = useCreateGraffitiNews()

  const isAdmin = !!user && user.email === ADMIN_EMAIL
  const canSubmit = title.trim().length > 0 && content.trim().length > 0 && !isPending && !isUploading

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
    if (!res.ok) throw new Error(t('imageUploadFailed'))
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
          onSuccess: (news) => {
            router.replace(`/community/news/${news.id}`)
          },
        }
      )
    } catch {
      alert(t('imageUploadError'))
    } finally {
      setIsUploading(false)
    }
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-white font-semibold mb-2">{t('adminOnly')}</p>
          <button onClick={() => router.back()} className="text-primary tap-highlight-none">
            {tc('goBack')}
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
          <h1 className="text-white font-semibold">{t('newsWriteTitle')}</h1>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-semibold transition-all tap-highlight-none',
              canSubmit
                ? 'bg-primary text-white'
                : 'bg-surface-2 text-text-muted'
            )}
          >
            {isUploading || isPending ? tc('publishing') : tc('publish')}
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Title */}
        <div>
          <input
            type="text"
            placeholder={t('newsTitlePlaceholder')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            className="w-full bg-transparent text-white text-lg font-semibold placeholder:text-text-muted outline-none border-b border-border pb-3"
          />
        </div>

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
              <img src={imagePreview} alt={t('preview')} className="w-full max-h-64 object-cover" />
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
              <ImagePlus size={20} />
              <span className="text-sm">{t('attachImage')}</span>
            </button>
          )}
        </div>

        {/* Content */}
        <div>
          <textarea
            placeholder={t('newsContentPlaceholder')}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={16}
            className="w-full bg-transparent text-white text-sm leading-relaxed placeholder:text-text-muted outline-none resize-none"
          />
        </div>
      </div>
    </div>
  )
}
