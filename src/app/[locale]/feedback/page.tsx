'use client'

import { useState, useEffect } from 'react'
import { Link } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { Mail, Clock, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import { useAuthStore } from '@/stores/useAuthStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Logo } from '@/components/ui/Logo'

type FeedbackType = 'feedback' | 'bug' | 'contact' | 'partnership'

const TYPE_OPTIONS: { value: FeedbackType; labelKey: string }[] = [
  { value: 'feedback', labelKey: 'typeFeedback' },
  { value: 'bug', labelKey: 'typeBug' },
  { value: 'contact', labelKey: 'typeInquiry' },
  { value: 'partnership', labelKey: 'typePartnership' },
]

interface FormState {
  name: string
  email: string
  type: FeedbackType
  message: string
}

interface FormErrors {
  name?: string
  email?: string
  message?: string
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function FeedbackPage() {
  const { user, profile } = useAuthStore()
  const t = useTranslations('feedback')
  const tc = useTranslations('common')

  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    type: 'feedback',
    message: '',
  })

  // Pre-fill name/email once auth is ready
  useEffect(() => {
    if (user && !form.name && !form.email) {
      setForm((f) => ({
        ...f,
        name: profile?.display_name || profile?.username || '',
        email: user.email || '',
      }))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile])
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  function validate(): boolean {
    const next: FormErrors = {}
    if (!form.name.trim()) next.name = t('nameRequired')
    if (!form.email.trim()) {
      next.email = t('emailRequired')
    } else if (!validateEmail(form.email)) {
      next.email = t('emailInvalid')
    }
    if (form.message.trim().length < 10) {
      next.message = t('messageTooShort')
    } else if (form.message.trim().length > 2000) {
      next.message = t('messageTooLong')
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          type: form.type,
          message: form.message.trim(),
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? t('unknownError'))

      setSubmitStatus('success')
    } catch (err) {
      console.error('Feedback submit error:', err)
      setErrorMessage(err instanceof Error ? err.message : t('submitError'))
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitStatus === 'success') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-400" />
          </div>
          <h1 className="text-2xl font-black text-white mb-3">{t('successTitle')}</h1>
          <p className="text-text-secondary text-base leading-relaxed mb-8 whitespace-pre-line">
            {t('successDesc')}
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              variant="secondary"
              onClick={() => {
                setForm({ name: '', email: '', type: 'feedback', message: '' })
                setSubmitStatus('idle')
              }}
            >
              {t('resend')}
            </Button>
            <Link href="/">
              <Button variant="primary">{tc('home')}</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-text-secondary hover:text-white transition-colors tap-highlight-none"
          >
            <ArrowLeft size={16} />
            <span className="text-sm">{t('navHome')}</span>
          </Link>
          <Logo size="xs" showText />
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 pt-28 pb-20">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            {t('pageTitle')}
          </h1>
          <p className="text-text-secondary text-base md:text-lg max-w-xl mx-auto leading-relaxed whitespace-pre-line">
            {t('pageDesc')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* ── Form ──────────────────────────── */}
          <div className="lg:col-span-3">
            <div className="bg-surface rounded-3xl p-6 md:p-8 border border-white/5">
              <h2 className="text-xl font-bold text-white mb-6">{t('formTitle')}</h2>

              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                {/* Name */}
                <Input
                  label={t('nameLabel')}
                  placeholder={t('namePlaceholder')}
                  value={form.name}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, name: e.target.value }))
                    if (errors.name) setErrors((err) => ({ ...err, name: undefined }))
                  }}
                  error={errors.name}
                  autoComplete="name"
                />

                {/* Email */}
                <Input
                  label={t('emailLabel')}
                  type="email"
                  placeholder="hello@example.com"
                  value={form.email}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, email: e.target.value }))
                    if (errors.email) setErrors((err) => ({ ...err, email: undefined }))
                  }}
                  error={errors.email}
                  autoComplete="email"
                />

                {/* Type */}
                <div className="w-full">
                  <label className="block text-text-secondary text-xs font-semibold uppercase tracking-wide mb-2">
                    {t('typeLabel')}
                  </label>
                  <div className="flex items-center gap-2 bg-surface-2 rounded-2xl px-4 py-3 border border-border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30 transition-all duration-200">
                    <select
                      value={form.type}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, type: e.target.value as FeedbackType }))
                      }
                      className="flex-1 bg-transparent text-white text-sm outline-none cursor-pointer"
                    >
                      {TYPE_OPTIONS.map((opt) => (
                        <option
                          key={opt.value}
                          value={opt.value}
                          className="bg-surface-2 text-white"
                        >
                          {t(opt.labelKey)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Message */}
                <div className="w-full">
                  <label className="block text-text-secondary text-xs font-semibold uppercase tracking-wide mb-2">
                    {t('messageLabel')}
                  </label>
                  <div
                    className={`bg-surface-2 rounded-2xl px-4 py-3 border transition-all duration-200 ${
                      errors.message
                        ? 'border-error focus-within:ring-1 focus-within:ring-error/30'
                        : 'border-border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30'
                    }`}
                  >
                    <textarea
                      rows={6}
                      placeholder={t('messagePlaceholder')}
                      value={form.message}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, message: e.target.value }))
                        if (errors.message)
                          setErrors((err) => ({ ...err, message: undefined }))
                      }}
                      className="w-full bg-transparent text-white text-sm placeholder:text-text-muted outline-none resize-none disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="flex items-start justify-between mt-1.5 pl-1">
                    {errors.message ? (
                      <p className="text-error text-xs">{errors.message}</p>
                    ) : (
                      <span />
                    )}
                    <span
                      className={`text-xs ml-2 shrink-0 ${
                        form.message.length > 2000 ? 'text-error' : 'text-text-muted'
                      }`}
                    >
                      {form.message.length} / 2000
                    </span>
                  </div>
                </div>

                {/* Server error */}
                {submitStatus === 'error' && (
                  <div className="flex items-center gap-2.5 bg-error/10 border border-error/20 rounded-2xl px-4 py-3">
                    <AlertCircle size={16} className="text-error shrink-0" />
                    <p className="text-error text-sm">{errorMessage}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  isLoading={isSubmitting}
                >
                  {t('submitBtn')}
                </Button>
              </form>
            </div>
          </div>

          {/* ── Contact Info ──────────────────── */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            {/* Email card */}
            <div className="bg-surface rounded-3xl p-6 border border-white/5">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                <Mail size={22} className="text-primary" />
              </div>
              <h3 className="text-white font-bold text-base mb-1.5">{t('emailCardTitle')}</h3>
              <a
                href="mailto:contact@bpstudio.co.kr"
                className="text-primary text-sm hover:underline break-all"
              >
                contact@bpstudio.co.kr
              </a>
              <p className="text-text-secondary text-xs mt-2 leading-relaxed whitespace-pre-line">
                {t('emailCardDesc')}
              </p>
            </div>

            {/* Response time card */}
            <div className="bg-surface rounded-3xl p-6 border border-white/5">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4">
                <Clock size={22} className="text-cyan-400" />
              </div>
              <h3 className="text-white font-bold text-base mb-1.5">{t('responseCardTitle')}</h3>
              <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-line">
                {t('responseCardDesc')}
              </p>
              <p className="text-text-muted text-xs mt-2">
                {t('responseCardNote')}
              </p>
            </div>

            {/* Type guide card */}
            <div className="bg-surface rounded-3xl p-6 border border-white/5">
              <h3 className="text-white font-bold text-base mb-4">{t('typeGuideTitle')}</h3>
              <ul className="space-y-3">
                {[
                  {
                    typeKey: 'typeFeedback',
                    descKey: 'feedbackTypeDesc',
                    color: 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30',
                  },
                  {
                    typeKey: 'typeBug',
                    descKey: 'bugTypeDesc',
                    color: 'bg-red-500/20 text-red-400 border-red-500/30',
                  },
                  {
                    typeKey: 'typeInquiry',
                    descKey: 'inquiryTypeDesc',
                    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                  },
                  {
                    typeKey: 'typePartnership',
                    descKey: 'partnershipTypeDesc',
                    color: 'bg-green-500/20 text-green-400 border-green-500/30',
                  },
                ].map(({ typeKey, descKey, color }) => (
                  <li key={typeKey} className="flex items-center gap-3">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${color}`}
                    >
                      {t(typeKey)}
                    </span>
                    <span className="text-text-secondary text-xs">{t(descKey)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-white/5">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size="xs" showText />
          <p className="text-text-muted text-xs">{t('footer')}</p>
          <div className="flex items-center gap-4 text-xs text-text-muted">
            <Link href="/feed" className="hover:text-white transition-colors">{tc('home')}</Link>
            <Link href="/login" className="hover:text-white transition-colors">{tc('login')}</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
