'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, X, Heart, MessageCircle, Bookmark, MapPin, RefreshCw } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/useAuthStore'
import { ImagePicker } from '@/components/upload/ImagePicker'
import { LocationPicker } from '@/components/upload/LocationPicker'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Input } from '@/components/ui/Input'
import {
  resizeImage,
  generateStoragePath,
  parseTagsFromString,
  cn,
  ANON_NAMES,
} from '@/lib/utils'
import type { Location, UploadFormData } from '@/types'

type UploadStep = 'image' | 'location' | 'info' | 'visibility' | 'publishing'

const ANON_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVXYZ'.split('')

const STEPS: { key: UploadStep; label: string }[] = [
  { key: 'image', label: '사진' },
  { key: 'location', label: '위치' },
  { key: 'info', label: '정보' },
  { key: 'visibility', label: '공개' },
]

export default function UploadPage() {
  const router = useRouter()
  const { user, session, profile } = useAuthStore()

  const [step, setStep] = useState<UploadStep>('image')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [location, setLocation] = useState<Location | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [showInProfile, setShowInProfile] = useState(true)
  const [showInFeed, setShowInFeed] = useState(true)
  const [showInMap, setShowInMap] = useState(true)
  const [previewLetter, setPreviewLetter] = useState(() => ANON_LETTERS[Math.floor(Math.random() * ANON_LETTERS.length)])
  const shuffleLetter = () => {
    let next: string
    do { next = ANON_LETTERS[Math.floor(Math.random() * ANON_LETTERS.length)] } while (next === previewLetter)
    setPreviewLetter(next)
  }
  const [photoTakenAt, setPhotoTakenAt] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  const supabase = getSupabaseClient()

  const currentStepIndex = STEPS.findIndex((s) => s.key === step)

  const handleImageSelect = useCallback((file: File, preview: string, exifLocation?: Location, takenAt?: string) => {
    setSelectedImage(file)
    setImagePreview(preview)
    if (exifLocation && !location) {
      setLocation(exifLocation)
    }
    if (takenAt) {
      setPhotoTakenAt(takenAt)
    }
  }, [location])

  const handleNext = () => {
    const steps: UploadStep[] = ['image', 'location', 'info', 'visibility']
    const currentIndex = steps.indexOf(step)
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1])
    }
  }

  const handleBack = () => {
    const steps: UploadStep[] = ['image', 'location', 'info', 'visibility']
    const currentIndex = steps.indexOf(step)
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1])
    } else {
      router.back()
    }
  }

  const handlePublish = async () => {
    if (!selectedImage || !location || !title || !user) return

    setIsUploading(true)
    setUploadError(null)
    setStep('publishing')

    try {
      // 0. Verify session
      setUploadProgress(5)
      if (!session?.access_token) throw new Error('로그인 세션이 없습니다. 다시 로그인해주세요.')

      // 1. Resize image (with timeout for large files)
      setUploadProgress(10)
      const resizeTimeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('이미지 처리 시간 초과. 더 작은 이미지를 사용해주세요.')), 20000)
      )
      const resized = await Promise.race([resizeImage(selectedImage, 1080, 1080, 0.82), resizeTimeout])

      // 2. Upload to storage via direct fetch (bypass SDK session issues)
      setUploadProgress(30)
      const storagePath = generateStoragePath(user.id, selectedImage.name)
      const storageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/post-images/${storagePath}`

      const uploadPromise = fetch(storageUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Content-Type': 'image/jpeg',
          'x-upsert': 'false',
        },
        body: resized,
      }).then(async (res) => {
        if (!res.ok) {
          const text = await res.text()
          throw new Error(`이미지 업로드 실패 (${res.status}): ${text}`)
        }
        return res
      })

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('업로드 시간 초과 (30초). 네트워크를 확인해주세요.')), 30000)
      )
      await Promise.race([uploadPromise, timeoutPromise])

      // 3. Get public URL
      setUploadProgress(60)
      const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/post-images/${storagePath}`

      // 4. Create post record
      setUploadProgress(80)
      const tags = parseTagsFromString(tagsInput)

      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          image_url: imageUrl,
          title: title.trim(),
          description: description.trim() || null,
          tags,
          lat: location.lat,
          lng: location.lng,
          address: location.address || null,
          city: location.city || null,
          district: location.district || null,
          show_in_profile: showInProfile,
          show_in_feed: showInFeed,
          show_in_map: showInMap,
          photo_taken_at: photoTakenAt,
        })
        .select()
        .single()

      if (postError) throw new Error(`게시물 생성 실패: ${postError.message}`)

      setUploadProgress(100)

      // Success - navigate to the new post
      setTimeout(() => {
        router.replace(`/feed/${post.id}`)
      }, 500)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : '업로드 중 오류가 발생했습니다')
      setStep('visibility')
      setIsUploading(false)
    }
  }

  const canProceedFromImage = !!selectedImage
  const canProceedFromLocation = !!location
  const canProceedFromInfo = title.trim().length >= 2

  // Publishing state
  if (step === 'publishing') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <div className="text-center space-y-6 max-w-xs w-full">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
            <div className="relative w-20 h-20 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
              {uploadProgress < 100 ? (
                <div className="loader" />
              ) : (
                <Check size={32} className="text-primary" />
              )}
            </div>
          </div>

          <div>
            <h2 className="text-white font-bold text-xl mb-2">게시 중...</h2>
            <p className="text-text-secondary text-sm">
              도시의 캔버스에 작품을 올리고 있어요
            </p>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-surface-2 rounded-full h-1.5">
            <div
              className="h-1.5 bg-primary rounded-full transition-all duration-500"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-text-secondary text-sm">{uploadProgress}%</p>

          {uploadError && (
            <div className="p-4 bg-error/10 border border-error/30 rounded-2xl text-left">
              <p className="text-error text-sm">{uploadError}</p>
              <button
                onClick={() => { setStep('visibility'); setIsUploading(false) }}
                className="mt-3 text-primary text-sm font-semibold tap-highlight-none"
              >
                돌아가기
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-background" style={{ minHeight: 'calc(100dvh - var(--bottom-nav-height) - env(safe-area-inset-bottom))' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-safe-top h-14">
        <button onClick={handleBack} className="p-2 -ml-2 tap-highlight-none">
          <ArrowLeft size={24} className="text-white" />
        </button>

        <h1 className="text-white font-semibold">새 게시물</h1>

        <button
          onClick={() => router.back()}
          className="p-2 -mr-2 tap-highlight-none"
        >
          <X size={24} className="text-text-secondary" />
        </button>
      </div>

      {/* Step indicator */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300',
                    i < currentStepIndex
                      ? 'bg-primary text-white'
                      : i === currentStepIndex
                      ? 'bg-primary text-white ring-2 ring-primary/30 ring-offset-2 ring-offset-background'
                      : 'bg-surface-2 text-text-secondary'
                  )}
                >
                  {i < currentStepIndex ? <Check size={14} /> : i + 1}
                </div>
                <span
                  className={cn(
                    'text-xs font-medium',
                    i <= currentStepIndex ? 'text-white' : 'text-text-secondary'
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-px transition-all duration-300',
                    i < currentStepIndex ? 'bg-primary' : 'bg-border'
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {step === 'image' && (
          <div className="px-4 pb-4">
            <ImagePicker
              onSelect={handleImageSelect}
              selectedImage={selectedImage}
              preview={imagePreview}
            />
          </div>
        )}

        {step === 'location' && (
          <div className="pb-4">
            <LocationPicker
              onLocationSelect={setLocation}
              initialLocation={location}
            />
          </div>
        )}

        {step === 'info' && (
          <div className="px-4 pb-4 space-y-4">
            {/* Image thumbnail */}
            {imagePreview && (
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-surface-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                {location?.address && (
                  <div className="absolute bottom-3 left-3 right-3 glass rounded-xl px-3 py-2">
                    <p className="text-white text-xs font-medium truncate">
                      📍 {location.address}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Upload error */}
            {uploadError && (
              <div className="p-4 bg-error/10 border border-error/30 rounded-2xl">
                <p className="text-error text-sm">{uploadError}</p>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="text-text-secondary text-xs font-medium uppercase tracking-wide mb-2 block">
                제목 *
              </label>
              <Input
                type="text"
                placeholder="이 작품의 제목은?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={60}
              />
              <p className="text-text-muted text-xs mt-1 text-right">
                {title.length}/60
              </p>
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
                className="input-base resize-none"
              />
              <p className="text-text-muted text-xs mt-1 text-right">
                {description.length}/500
              </p>
            </div>

            {/* Tags */}
            <div>
              <label className="text-text-secondary text-xs font-medium uppercase tracking-wide mb-2 block">
                태그
              </label>
              <Input
                type="text"
                placeholder="#graffiti #streetart #서울"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
              />
              <p className="text-text-muted text-xs mt-1">
                쉼표나 공백으로 구분, # 자동 제거
              </p>
            </div>

          </div>
        )}

        {step === 'visibility' && (
          <div className="px-4 pb-4 space-y-4">
            {/* Upload error */}
            {uploadError && (
              <div className="p-4 bg-error/10 border border-error/30 rounded-2xl">
                <p className="text-error text-sm">{uploadError}</p>
              </div>
            )}

            {/* Toggles */}
            <div className="bg-surface-2 rounded-2xl divide-y divide-border overflow-hidden">
              {([
                { label: '프로필 공개', desc: '끄면 익명 프로필로 노출', value: showInProfile, setter: setShowInProfile },
                { label: '피드 노출', desc: '다른 사람의 피드에 표시', value: showInFeed, setter: setShowInFeed },
                { label: '지도 노출', desc: '지도에서 검색 가능', value: showInMap, setter: setShowInMap },
              ]).map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => opt.setter(!opt.value)}
                  className="w-full flex items-center justify-between px-4 py-3.5 tap-highlight-none"
                >
                  <div className="text-left">
                    <p className="text-white text-sm font-medium">{opt.label}</p>
                    <p className="text-text-muted text-xs">{opt.desc}</p>
                  </div>
                  <div
                    className={cn(
                      'relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0',
                      opt.value ? 'bg-primary' : 'bg-surface-3'
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
                        opt.value ? 'translate-x-5' : 'translate-x-0'
                      )}
                    />
                  </div>
                </button>
              ))}
            </div>

            {/* 피드 미리보기 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-text-secondary text-xs font-medium uppercase tracking-wide">
                  피드 미리보기
                </p>
                {!showInProfile && (
                  <button
                    type="button"
                    onClick={shuffleLetter}
                    className="flex items-center gap-1 text-primary text-xs font-medium tap-highlight-none active:scale-95 transition-transform"
                  >
                    <RefreshCw size={12} />
                    셔플
                  </button>
                )}
              </div>

              {showInFeed ? (
                <article className="bg-surface rounded-3xl overflow-hidden shadow-card">
                  {/* Author header */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    {showInProfile ? (
                      <>
                        <Avatar src={profile?.avatar_url} username={profile?.username || 'me'} size="sm" />
                        <div>
                          <p className="text-white text-sm font-semibold leading-tight">
                            {profile?.display_name || profile?.username || '나'}
                          </p>
                          {(location?.district || location?.city || location?.address) && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <MapPin size={10} className="text-primary" />
                              <span className="text-text-secondary text-xs">
                                {location.district || location.city || location.address}
                              </span>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <Avatar
                          src={`/anonymous/${previewLetter.toLowerCase()}.png`}
                          username={`anonymous-${previewLetter.toLowerCase()}`}
                          size="sm"
                        />
                        <div>
                          <p className="text-text-secondary text-sm font-semibold leading-tight">
                            {ANON_NAMES[previewLetter]}
                          </p>
                          {(location?.district || location?.city || location?.address) && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <MapPin size={10} className="text-primary" />
                              <span className="text-text-secondary text-xs">
                                {location.district || location.city || location.address}
                              </span>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Image */}
                  {imagePreview && (
                    <div className="relative w-full aspect-square bg-surface-2">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="px-4 pt-3 pb-1 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <Heart size={22} className="text-white" />
                        <span className="text-sm font-medium text-white">0</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MessageCircle size={22} className="text-white" />
                        <span className="text-sm font-medium text-white">0</span>
                      </div>
                    </div>
                    <Bookmark size={22} className="text-white" />
                  </div>

                  {/* Content */}
                  <div className="px-4 pb-4 space-y-1.5">
                    <h3 className="text-white font-semibold text-sm leading-snug line-clamp-1">
                      {title || '제목 없음'}
                    </h3>
                    {description && (
                      <p className="text-text-secondary text-sm leading-relaxed line-clamp-2">
                        {description}
                      </p>
                    )}
                    {tagsInput && (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {parseTagsFromString(tagsInput).slice(0, 4).map((tag) => (
                          <span key={tag} className="text-primary text-xs font-medium">#{tag}</span>
                        ))}
                      </div>
                    )}
                    <p className="text-text-muted text-xs pt-1">방금 전</p>
                  </div>
                </article>
              ) : (
                <div className="bg-surface rounded-3xl p-8 flex flex-col items-center gap-3 border border-dashed border-border">
                  <div className="w-12 h-12 rounded-2xl bg-surface-2 flex items-center justify-center">
                    <span className="text-2xl">🔒</span>
                  </div>
                  <p className="text-text-secondary text-sm text-center">
                    피드에 노출되지 않습니다
                  </p>
                  <p className="text-text-muted text-xs text-center">
                    지도와 직접 링크로만 접근 가능
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom action — fixed above BottomNavBar */}
      <div
        className="fixed left-0 right-0 px-4 pt-3 pb-4 border-t border-border bg-background/95 backdrop-blur-md z-[60] md:static md:z-auto md:bg-background md:backdrop-blur-none"
        style={{ bottom: 'calc(var(--bottom-nav-height) + env(safe-area-inset-bottom))' }}
      >
        {step === 'visibility' ? (
          <Button
            onClick={handlePublish}
            fullWidth
            size="lg"
            disabled={isUploading}
            isLoading={isUploading}
          >
            <span className="flex items-center gap-2">
              게시하기
              <Check size={18} />
            </span>
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            fullWidth
            size="lg"
            disabled={
              (step === 'image' && !canProceedFromImage) ||
              (step === 'location' && !canProceedFromLocation) ||
              (step === 'info' && !canProceedFromInfo)
            }
          >
            <span className="flex items-center gap-2">
              다음
              <ArrowRight size={18} />
            </span>
          </Button>
        )}
      </div>
    </div>
  )
}
