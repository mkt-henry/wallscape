'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useCreateGraffitiNews } from '@/hooks/useGraffitiNews'
import { useAuthStore } from '@/stores/useAuthStore'
import { cn } from '@/lib/utils'

const ADMIN_EMAIL = 'bpark0718@gmail.com'

export default function GraffitiNewsWritePage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const { mutate: createNews, isPending } = useCreateGraffitiNews()

  const isAdmin = !!user && user.email === ADMIN_EMAIL
  const canSubmit = title.trim().length > 0 && content.trim().length > 0 && !isPending

  const handleSubmit = () => {
    if (!canSubmit) return
    createNews(
      { title: title.trim(), content: content.trim() },
      {
        onSuccess: (news) => {
          router.replace(`/community/news/${news.id}`)
        },
      }
    )
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-white font-semibold mb-2">관리자만 작성할 수 있습니다</p>
          <button onClick={() => router.back()} className="text-primary tap-highlight-none">
            돌아가기
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
          <h1 className="text-white font-semibold">뉴스 작성</h1>
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
            {isPending ? '게시 중...' : '게시'}
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Title */}
        <div>
          <input
            type="text"
            placeholder="뉴스 제목을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            className="w-full bg-transparent text-white text-lg font-semibold placeholder:text-text-muted outline-none border-b border-border pb-3"
          />
        </div>

        {/* Content */}
        <div>
          <textarea
            placeholder="뉴스 내용을 입력하세요..."
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
