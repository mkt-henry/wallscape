'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, ArrowLeft, Mail } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

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

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSocialLoading, setIsSocialLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = getSupabaseClient()

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
        if (error.message.includes('Invalid login credentials')) {
          setError('이메일 또는 비밀번호가 올바르지 않습니다.')
        } else if (error.message.includes('Email not confirmed')) {
          setError('이메일 인증이 필요합니다. 이메일을 확인해주세요.')
        } else {
          setError(error.message)
        }
        return
      }

      router.replace(redirectTo)
    } catch {
      setError('로그인 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
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
      setError('Google 로그인 중 오류가 발생했습니다.')
    } finally {
      setIsSocialLoading(false)
    }
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
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center mb-6 shadow-glow-primary">
            <span className="text-2xl font-black text-white">W</span>
          </div>
          <h1 className="text-3xl font-black text-white mb-2">다시 돌아왔군요</h1>
          <p className="text-text-secondary">
            계정에 로그인해 도시의 예술을 탐험하세요
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 bg-error/10 border border-error/30 rounded-2xl">
            <p className="text-error text-sm">{error}</p>
          </div>
        )}

        {/* Google login */}
        <button
          onClick={handleGoogleLogin}
          disabled={isSocialLoading || isLoading}
          className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl bg-white text-[#1f1f1f] text-sm font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed tap-highlight-none hover:bg-gray-100 mb-6"
        >
          <GoogleIcon />
          {isSocialLoading ? '로그인 중...' : 'Google로 계속하기'}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-text-muted text-xs">또는 이메일로 로그인</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Email form */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <Input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail size={18} />}
            autoComplete="email"
            required
          />

          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="비밀번호"
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
              비밀번호를 잊으셨나요?
            </Link>
          </div>

          <Button
            type="submit"
            fullWidth
            size="lg"
            isLoading={isLoading}
            disabled={!email || !password || isSocialLoading}
          >
            로그인
          </Button>
        </form>

      </div>

      {/* Guest browse */}
      <div className="px-6 pb-2 text-center">
        <button
          onClick={() => router.push('/feed')}
          className="text-text-muted text-sm underline underline-offset-2 tap-highlight-none"
        >
          로그인 없이 둘러보기
        </button>
      </div>

      {/* Sign up link */}
      <div className="px-6 pb-safe-bottom pb-8 text-center">
        <p className="text-text-secondary text-sm">
          계정이 없으신가요?{' '}
          <Link
            href="/signup"
            className="text-primary font-semibold"
          >
            회원가입
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
