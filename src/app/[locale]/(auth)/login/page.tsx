'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Link, useRouter } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { Eye, EyeOff, ArrowLeft, Mail, ShieldCheck } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Logo } from '@/components/ui/Logo'


function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/feed'
  const t = useTranslations('auth')
  const tc = useTranslations('common')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSocialLoading, setIsSocialLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isBanned, setIsBanned] = useState(false)
  const [isRequestingReactivation, setIsRequestingReactivation] = useState(false)
  const [reactivationSent, setReactivationSent] = useState(false)

  const [isAdminLoading, setIsAdminLoading] = useState(false)
  const [isDev, setIsDev] = useState(false)
  const supabase = getSupabaseClient()

  useEffect(() => {
    const hostname = window.location.hostname
    setIsDev(hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('ngrok'))
  }, [])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        if (error.message.toLowerCase().includes('banned') || error.message.toLowerCase().includes('user has been banned')) {
          setIsBanned(true)
          setError(null)
        } else if (error.message.includes('Invalid login credentials')) {
          setError(t('invalidCredentials'))
        } else if (error.message.includes('Email not confirmed')) {
          setError(t('emailVerificationNeeded'))
        } else {
          setError(error.message)
        }
        return
      }

      router.replace(redirectTo)
    } catch {
      setError(t('loginError'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleReactivationRequest = async () => {
    setIsRequestingReactivation(true)
    try {
      const res = await fetch('/api/profile/reactivation-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      if (res.ok) {
        setReactivationSent(true)
      } else {
        const data = await res.json()
        setError(data.error || '요청에 실패했습니다.')
        setIsBanned(false)
      }
    } catch {
      setError('요청 중 오류가 발생했습니다.')
      setIsBanned(false)
    } finally {
      setIsRequestingReactivation(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsSocialLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
        },
      })
      if (error) setError(error.message)
    } catch {
      setError(t('googleLoginError'))
    } finally {
      setIsSocialLoading(false)
    }
  }

  const handleAdminLogin = async () => {
    const adminEmail = process.env.NEXT_PUBLIC_DEV_ADMIN_EMAIL
    const adminPassword = process.env.NEXT_PUBLIC_DEV_ADMIN_PASSWORD
    if (!adminEmail || !adminPassword) {
      setError(t('setEnvVars'))
      return
    }

    setIsAdminLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: adminPassword,
      })

      if (error) {
        setError(`${t('adminLoginFailed')}${error.message}`)
        return
      }

      // SIGNED_IN 이벤트가 발생해야 쿠키 저장이 완료된 것
      // → 그 이후 풀 리로드해야 미들웨어가 쿠키를 정상적으로 읽음
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_IN') {
          subscription.unsubscribe()
          window.location.href = redirectTo
        }
      })
    } catch {
      setError(t('adminLoginError'))
      setIsAdminLoading(false)
    }
  }

  // 밴된 유저 화면
  if (isBanned) {
    return (
      <div className="min-h-dvh bg-background flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-sm w-full space-y-6">
          <div className="w-20 h-20 rounded-full bg-error/10 border border-error/30 flex items-center justify-center mx-auto">
            <span className="text-4xl">🔒</span>
          </div>
          {reactivationSent ? (
            <>
              <h1 className="text-2xl font-black text-white">{t('requestComplete')}</h1>
              <p className="text-text-secondary text-sm leading-relaxed">
                {t('reactivationSent')}
              </p>
              <Button onClick={() => router.push('/')} fullWidth variant="secondary">
                {tc('home')}
              </Button>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-black text-white">{t('accountDeactivated')}</h1>
              <p className="text-text-secondary text-sm leading-relaxed">
                {t('accountDeactivatedDesc')}
              </p>
              {error && (
                <p className="text-error text-sm">{error}</p>
              )}
              <Button
                onClick={handleReactivationRequest}
                isLoading={isRequestingReactivation}
                fullWidth
              >
                {t('requestReactivation')}
              </Button>
              <button
                onClick={() => { setIsBanned(false); setError(null) }}
                className="text-text-secondary text-sm tap-highlight-none"
              >
                {tc('goBack')}
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center px-4 pt-safe-top pt-4 pb-2">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 tap-highlight-none"
        >
          <ArrowLeft size={24} className="text-white" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center px-6 pb-8">
        {/* Brand */}
        <div className="mb-10">
          <div className="mb-6">
            <Logo size="lg" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2">{t('loginGreeting')}</h1>
          <p className="text-text-secondary">
            {t('loginSubtitle')}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 bg-error/10 border border-error/30 rounded-2xl">
            <p className="text-error text-sm">{error}</p>
          </div>
        )}

        {/* 개발 환경 전용 관리자 로그인 */}
        {isDev && (
          <button
            onClick={handleAdminLogin}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-400 text-sm font-medium transition-all duration-200 active:scale-95 tap-highlight-none hover:bg-amber-500/20 mb-3"
          >
            <ShieldCheck size={18} />
            {t('adminLogin')}
          </button>
        )}

        {/* Google login */}
        <button
          onClick={handleGoogleLogin}
          disabled={isSocialLoading || isLoading}
          className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl bg-white text-[#1f1f1f] text-sm font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed tap-highlight-none hover:bg-gray-100 mb-6"
        >
          <GoogleIcon />
          {isSocialLoading ? t('loggingIn') : t('googleLogin')}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-text-muted text-xs">{t('emailDivider')}</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Email form */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <Input
            type="email"
            placeholder={t('email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail size={18} />}
            autoComplete="email"
            required
          />

          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder={t('password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="tap-highlight-none"
                >
                  {showPassword ? (
                    <EyeOff size={18} className="text-text-secondary" />
                  ) : (
                    <Eye size={18} className="text-text-secondary" />
                  )}
                </button>
              }
            />
          </div>

          {/* Forgot password */}
          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-sm text-text-secondary hover:text-primary transition-colors"
            >
              {t('forgotPassword')}
            </Link>
          </div>

          <Button
            type="submit"
            fullWidth
            size="lg"
            isLoading={isLoading}
            disabled={!email || !password || isSocialLoading}
          >
            {tc('login')}
          </Button>
        </form>

      </div>

      {/* Guest browse */}
      <div className="px-6 pb-2 text-center">
        <button
          onClick={() => router.push('/feed')}
          className="text-text-muted text-sm underline underline-offset-2 tap-highlight-none"
        >
          {t('browseWithoutLogin')}
        </button>
      </div>

      {/* Feedback link */}
      <div className="px-6 pb-2 text-center">
        <Link
          href="/feedback"
          className="text-text-muted text-sm underline underline-offset-2 tap-highlight-none"
        >
          {t('feedbackLink')}
        </Link>
      </div>

      {/* Sign up link */}
      <div className="px-6 pb-safe-bottom pb-8 text-center">
        <p className="text-text-secondary text-sm">
          {t('noAccount')}{' '}
          <Link
            href="/signup"
            className="text-primary font-semibold"
          >
            {tc('signup')}
          </Link>
        </p>
      </div>
    </div>
  )
}


export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div className="loader" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
