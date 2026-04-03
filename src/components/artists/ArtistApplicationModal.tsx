'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { X, Instagram, Globe, Brush, ChevronRight, User, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface ArtistApplicationModalProps {
  onClose: () => void
}

type Step = 'type' | 'form' | 'success'
type RegistrationType = 'self' | 'other'

export function ArtistApplicationModal({ onClose }: ArtistApplicationModalProps) {
  const t = useTranslations('artists')
  const tc = useTranslations('common')
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
      setError(t('artistNameRequired'))
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
        setError(data.error || t('submitError'))
        return
      }
      setStep('success')
    } catch {
      setError(t('networkError'))
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
            <h2 className="text-white font-bold">{t('applicationHeader')}</h2>
          </div>
          <button onClick={onClose} className="p-1 tap-highlight-none">
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        {/* ── Step: type selection ── */}
        {step === 'type' && (
          <div className="px-4 py-6 space-y-3 pb-[calc(env(safe-area-inset-bottom)+var(--bottom-nav-height)+1.5rem)]">
            <p className="text-text-secondary text-sm text-center mb-4">
              {t('applicationTitle')}
            </p>

            <button
              onClick={() => { setRegistrationType('self'); setStep('form') }}
              className="w-full flex items-center gap-4 p-4 bg-surface rounded-2xl tap-highlight-none hover:bg-surface-2 transition-colors border-2 border-transparent hover:border-primary/30"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User size={20} className="text-primary" />
              </div>
              <div className="text-left">
                <p className="text-white font-semibold">{t('selfRegister')}</p>
                <p className="text-text-secondary text-xs mt-0.5">{t('selfDesc')}</p>
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
                <p className="text-white font-semibold">{t('otherRegister')}</p>
                <p className="text-text-secondary text-xs mt-0.5">{t('otherDesc')}</p>
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
                {t('changeType')}
              </button>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                registrationType === 'self'
                  ? 'bg-primary/15 text-primary'
                  : 'bg-surface-2 text-text-secondary'
              }`}>
                {registrationType === 'self' ? t('selfRegister') : t('otherRegister')}
              </span>
            </div>

            {/* Notice */}
            <div className="flex items-start gap-2 p-3 bg-primary/10 rounded-2xl border border-primary/20">
              <ChevronRight size={14} className="text-primary mt-0.5 shrink-0" />
              <p className="text-text-secondary text-xs leading-relaxed">
                {t('approvalNote')}
              </p>
            </div>

            {/* Target username (other only) */}
            {registrationType === 'other' && (
              <div>
                <label className="text-text-secondary text-xs font-medium uppercase tracking-wide mb-1.5 block">
                  {t('appId')}
                </label>
                <Input
                  placeholder={t('appIdPlaceholder')}
                  value={targetUsername}
                  onChange={(e) => setTargetUsername(e.target.value)}
                  maxLength={40}
                />
                <p className="text-text-muted text-xs mt-1">{t('appIdNote')}</p>
              </div>
            )}

            {/* Artist name */}
            <div>
              <label className="text-text-secondary text-xs font-medium uppercase tracking-wide mb-1.5 block">
                {t('artistName')} <span className="text-error">*</span>
              </label>
              <Input
                placeholder={t('artistNamePlaceholder')}
                value={artistName}
                onChange={(e) => setArtistName(e.target.value)}
                maxLength={40}
              />
            </div>

            {/* Bio */}
            <div>
              <label className="text-text-secondary text-xs font-medium uppercase tracking-wide mb-1.5 block">
                {t('artistBio')}
              </label>
              <textarea
                placeholder={t('artistBioPlaceholder')}
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
                {t('instagram')}
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
                {t('website')}
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
                {t('additionalMessage')}
              </label>
              <textarea
                placeholder={t('additionalMessagePlaceholder')}
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
              {t('submit')}
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
              <p className="text-white font-bold text-lg mb-1">{t('successTitle')}</p>
              <p className="text-text-secondary text-sm leading-relaxed">
                {t('successDesc')}<br />
                {t('successProcessing')}
              </p>
            </div>
            <Button onClick={onClose} fullWidth variant="secondary" className="mt-2">
              {tc('close')}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
