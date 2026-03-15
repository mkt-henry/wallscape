'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Clock, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import { useAuthStore } from '@/stores/useAuthStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

type FeedbackType = 'feedback' | 'bug' | 'contact' | 'partnership'

const TYPE_OPTIONS: { value: FeedbackType; label: string }[] = [
  { value: 'feedback', label: '피드백' },
  { value: 'bug', label: '버그 신고' },
  { value: 'contact', label: '문의' },
  { value: 'partnership', label: '파트너십' },
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
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuthStore()

  const { profile } = useAuthStore()

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?redirectTo=/feedback')
    }
  }, [user, authLoading, router])

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
    if (!form.name.trim()) next.name = '이름을 입력해주세요.'
    if (!form.email.trim()) {
      next.email = '이메일을 입력해주세요.'
    } else if (!validateEmail(form.email)) {
      next.email = '올바른 이메일 형식을 입력해주세요.'
    }
    if (form.message.trim().length < 10) {
      next.message = '메시지를 10자 이상 입력해주세요.'
    } else if (form.message.trim().length > 2000) {
      next.message = '메시지는 2000자 이하로 입력해주세요.'
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
      if (!res.ok) throw new Error(json.error ?? '알 수 없는 오류')

      setSubmitStatus('success')
    } catch (err) {
      console.error('Feedback submit error:', err)
      setErrorMessage(err instanceof Error ? err.message : '제출 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="loader" />
      </div>
    )
  }

  if (submitStatus === 'success') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-400" />
          </div>
          <h1 className="text-2xl font-black text-white mb-3">감사합니다!</h1>
          <p className="text-text-secondary text-base leading-relaxed mb-8">
            메시지가 성공적으로 전달되었습니다.<br />
            빠른 시일 내에 답변 드리겠습니다.
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              variant="secondary"
              onClick={() => {
                setForm({ name: '', email: '', type: 'feedback', message: '' })
                setSubmitStatus('idle')
              }}
            >
              다시 보내기
            </Button>
            <Link href="/">
              <Button variant="primary">홈으로</Button>
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
            <span className="text-sm">홈</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center">
              <span className="text-xs font-black text-white">W</span>
            </div>
            <span className="text-sm font-black tracking-wide">WALLSCAPE</span>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 pt-28 pb-20">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            문의 &amp;{' '}
            <span className="text-gradient-primary">피드백</span>
          </h1>
          <p className="text-text-secondary text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Wallscape를 더 좋게 만드는 데 여러분의 의견이 큰 힘이 됩니다.
            <br className="hidden md:block" /> 버그 신고, 기능 제안, 파트너십 문의 모두 환영합니다.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* ── Form ──────────────────────────── */}
          <div className="lg:col-span-3">
            <div className="bg-surface rounded-3xl p-6 md:p-8 border border-white/5">
              <h2 className="text-xl font-bold text-white mb-6">메시지 보내기</h2>

              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                {/* Name */}
                <Input
                  label="이름"
                  placeholder="홍길동"
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
                  label="이메일"
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
                    유형
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
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Message */}
                <div className="w-full">
                  <label className="block text-text-secondary text-xs font-semibold uppercase tracking-wide mb-2">
                    메시지
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
                      placeholder="메시지를 입력해주세요. (10자 이상 2000자 이하)"
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
                  보내기
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
              <h3 className="text-white font-bold text-base mb-1.5">이메일</h3>
              <a
                href="mailto:bpark0718@gmail.com"
                className="text-primary text-sm hover:underline break-all"
              >
                bpark0718@gmail.com
              </a>
              <p className="text-text-secondary text-xs mt-2 leading-relaxed">
                파트너십 및 비즈니스 문의는<br />이메일로 직접 보내주셔도 됩니다.
              </p>
            </div>

            {/* Response time card */}
            <div className="bg-surface rounded-3xl p-6 border border-white/5">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-4">
                <Clock size={22} className="text-teal-400" />
              </div>
              <h3 className="text-white font-bold text-base mb-1.5">답변 시간</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                영업일 기준 <span className="text-white font-semibold">1~2일</span> 내로
                답변 드립니다.
              </p>
              <p className="text-text-muted text-xs mt-2">
                주말 및 공휴일은 답변이 늦을 수 있습니다.
              </p>
            </div>

            {/* Type guide card */}
            <div className="bg-surface rounded-3xl p-6 border border-white/5">
              <h3 className="text-white font-bold text-base mb-4">문의 유형 안내</h3>
              <ul className="space-y-3">
                {[
                  {
                    type: '피드백',
                    desc: '기능 개선 및 의견 제안',
                    color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
                  },
                  {
                    type: '버그 신고',
                    desc: '오류 및 앱 문제 신고',
                    color: 'bg-red-500/20 text-red-400 border-red-500/30',
                  },
                  {
                    type: '문의',
                    desc: '서비스 관련 일반 문의',
                    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                  },
                  {
                    type: '파트너십',
                    desc: '협업 및 비즈니스 제안',
                    color: 'bg-green-500/20 text-green-400 border-green-500/30',
                  },
                ].map(({ type, desc, color }) => (
                  <li key={type} className="flex items-center gap-3">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${color}`}
                    >
                      {type}
                    </span>
                    <span className="text-text-secondary text-xs">{desc}</span>
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
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center">
              <span className="text-xs font-black text-white">W</span>
            </div>
            <span className="text-sm font-bold text-white">WALLSCAPE</span>
          </div>
          <p className="text-text-muted text-xs">© 2025 Wallscape. 서울의 예술을 기록합니다.</p>
          <div className="flex items-center gap-4 text-xs text-text-muted">
            <Link href="/feed" className="hover:text-white transition-colors">피드</Link>
            <Link href="/login" className="hover:text-white transition-colors">로그인</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
