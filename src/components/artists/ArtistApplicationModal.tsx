'use client'

import { useState, useEffect } from 'react'
import { X, Instagram, Globe, Brush, ChevronRight, User, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface ArtistApplicationModalProps {
  onClose: () => void
}

type Step = 'type' | 'form' | 'success'
type RegistrationType = 'self' | 'other'

export function ArtistApplicationModal({ onClose }: ArtistApplicationModalProps) {
  const [step, setStep] = useState<Step>('type')
  const [registrationType, setRegistrationType] = useState<RegistrationType>('self')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [artistName, setArtistName] = useState('')
  const [bio, setBio] = useState('')
  const [instagram, setInstagram] = useState('')
  const [website, setWebsite] = useState('')
  const [note, setNote] = useState('')
  const [targetUsername, setTargetUsername] = useState('')

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleSubmit = async () => {
    if (!artistName.trim()) {
      setError('작가 이름을 입력해주세요.')
      return
    }
    setIsSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/artist-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artist_name: artistName.trim(),
          bio: bio.trim() || undefined,
          instagram_handle: instagram.trim().replace(/^@/, '') || undefined,
          website: website.trim() || undefined,
          note: note.trim() || undefined,
          registration_type: registrationType,
          target_username: registrationType === 'other' ? (targetUsername.trim().replace(/^@/, '') || undefined) : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || '신청에 실패했습니다.')
        return
      }
      setStep('success')
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
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
          <div className="flex items-center gap-2">
            <Brush size={18} className="text-primary" />
            <h2 className="text-white font-bold">작가 등록 신청</h2>
          </div>
          <button onClick={onClose} className="p-1 tap-highlight-none">
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        {/* ── Step: type selection ── */}
        {step === 'type' && (
          <div className="px-4 py-6 space-y-3 pb-[calc(env(safe-area-inset-bottom)+var(--bottom-nav-height)+1.5rem)]">
            <p className="text-text-secondary text-sm text-center mb-4">
              누구를 작가로 등록하시겠어요?
            </p>

            <button
              onClick={() => { setRegistrationType('self'); setStep('form') }}
              className="w-full flex items-center gap-4 p-4 bg-surface rounded-2xl tap-highlight-none hover:bg-surface-2 transition-colors border-2 border-transparent hover:border-primary/30"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User size={20} className="text-primary" />
              </div>
              <div className="text-left">
                <p className="text-white font-semibold">본인 등록</p>
                <p className="text-text-secondary text-xs mt-0.5">나를 작가로 등록 신청합니다</p>
              </div>
              <ChevronRight size={16} className="text-text-muted ml-auto" />
            </button>

            <button
              onClick={() => { setRegistrationType('other'); setStep('form') }}
              className="w-full flex items-center gap-4 p-4 bg-surface rounded-2xl tap-highlight-none hover:bg-surface-2 transition-colors border-2 border-transparent hover:border-primary/30"
            >
              <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center shrink-0">
                <Users size={20} className="text-text-secondary" />
              </div>
              <div className="text-left">
                <p className="text-white font-semibold">다른 작가 등록</p>
                <p className="text-text-secondary text-xs mt-0.5">알고 있는 작가를 추천 등록합니다</p>
              </div>
              <ChevronRight size={16} className="text-text-muted ml-auto" />
            </button>
          </div>
        )}

        {/* ── Step: form ── */}
        {step === 'form' && (
          <div className="px-4 py-4 space-y-4 max-h-[70dvh] overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+var(--bottom-nav-height)+1.5rem)]">
            {/* Type badge + back */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStep('type')}
                className="text-text-muted text-xs tap-highlight-none hover:text-white transition-colors"
              >
                ← 변경
              </button>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                registrationType === 'self'
                  ? 'bg-primary/15 text-primary'
                  : 'bg-surface-2 text-text-secondary'
              }`}>
                {registrationType === 'self' ? '본인 등록' : '다른 작가 등록'}
              </span>
            </div>

            {/* Notice */}
            <div className="flex items-start gap-2 p-3 bg-primary/10 rounded-2xl border border-primary/20">
              <ChevronRight size={14} className="text-primary mt-0.5 shrink-0" />
              <p className="text-text-secondary text-xs leading-relaxed">
                등록 신청 후 <span className="text-white font-semibold">운영진 승인</span>을 거쳐 작가 피드에 반영됩니다.
              </p>
            </div>

            {/* Target username (other only) */}
            {registrationType === 'other' && (
              <div>
                <label className="text-text-secondary text-xs font-medium uppercase tracking-wide mb-1.5 block">
                  앱 아이디 (선택)
                </label>
                <Input
                  placeholder="@username — 앱에 계정이 있다면 입력"
                  value={targetUsername}
                  onChange={(e) => setTargetUsername(e.target.value)}
                  maxLength={40}
                />
                <p className="text-text-muted text-xs mt-1">입력 시 승인 후 자동으로 작가 인증됩니다</p>
              </div>
            )}

            {/* Artist name */}
            <div>
              <label className="text-text-secondary text-xs font-medium uppercase tracking-wide mb-1.5 block">
                작가 이름 <span className="text-error">*</span>
              </label>
              <Input
                placeholder="활동명 또는 실명"
                value={artistName}
                onChange={(e) => setArtistName(e.target.value)}
                maxLength={40}
              />
            </div>

            {/* Bio */}
            <div>
              <label className="text-text-secondary text-xs font-medium uppercase tracking-wide mb-1.5 block">
                작가 소개
              </label>
              <textarea
                placeholder="작품 세계, 활동 지역, 스타일 등을 자유롭게 소개해주세요."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={300}
                rows={3}
                className="input-base resize-none text-sm"
              />
              <p className="text-text-muted text-xs mt-1 text-right">{bio.length}/300</p>
            </div>

            {/* Instagram */}
            <div>
              <label className="text-text-secondary text-xs font-medium uppercase tracking-wide mb-1.5 block">
                인스타그램
              </label>
              <div className="relative">
                <Instagram size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <Input
                  placeholder="@username"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="pl-9"
                  maxLength={40}
                />
              </div>
            </div>

            {/* Website */}
            <div>
              <label className="text-text-secondary text-xs font-medium uppercase tracking-wide mb-1.5 block">
                웹사이트
              </label>
              <div className="relative">
                <Globe size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <Input
                  placeholder="https://"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="pl-9"
                  maxLength={100}
                />
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="text-text-secondary text-xs font-medium uppercase tracking-wide mb-1.5 block">
                추가 메시지 (선택)
              </label>
              <textarea
                placeholder="운영진에게 전달할 내용이 있다면 적어주세요."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={200}
                rows={2}
                className="input-base resize-none text-sm"
              />
            </div>

            {error && <p className="text-error text-sm text-center">{error}</p>}

            <Button
              onClick={handleSubmit}
              isLoading={isSubmitting}
              disabled={!artistName.trim()}
              fullWidth
            >
              신청하기
            </Button>
          </div>
        )}

        {/* ── Step: success ── */}
        {step === 'success' && (
          <div className="px-6 py-10 flex flex-col items-center gap-4 text-center pb-[calc(env(safe-area-inset-bottom)+var(--bottom-nav-height)+2.5rem)]">
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
              <span className="text-3xl">🎨</span>
            </div>
            <div>
              <p className="text-white font-bold text-lg mb-1">신청이 완료됐어요!</p>
              <p className="text-text-secondary text-sm leading-relaxed">
                운영진 검토 후 승인되면<br />
                작가 피드에 프로필이 노출됩니다.<br />
                보통 1~3일 내로 처리됩니다.
              </p>
            </div>
            <Button onClick={onClose} fullWidth variant="secondary" className="mt-2">
              닫기
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
