'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, ArrowLeft, Mail } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/feed'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
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

  const handleSocialLogin = async (provider: 'google' | 'kakao' | 'apple') => {
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider === 'kakao' ? 'kakao' : provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirectTo=${redirectTo}`,
          scopes: provider === 'google' ? 'email profile' : undefined,
        },
      })

      if (error) throw error
    } catch {
      setError('소셜 로그인 중 오류가 발생했습니다.')
      setIsLoading(false)
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

        {/* Email form */}
        <form onSubmit={handleEmailLogin} className="space-y-4 mb-6">
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
            disabled={!email || !password}
          >
            로그인
          </Button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-text-muted text-xs">또는</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Social login */}
        <div className="space-y-3">
          {/* Google */}
          <SocialButton
            onClick={() => handleSocialLogin('google')}
            disabled={isLoading}
            icon={
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            }
            label="Google로 계속하기"
          />

          {/* Kakao */}
          <SocialButton
            onClick={() => handleSocialLogin('kakao')}
            disabled={isLoading}
            icon={
              <div className="w-5 h-5 bg-[#FEE500] rounded flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5">
                  <path
                    fill="#3A1D1D"
                    d="M12 3C6.48 3 2 6.48 2 10.8c0 2.72 1.59 5.12 4 6.61v3.59l3.6-2.07c.78.14 1.58.21 2.4.21 5.52 0 10-3.48 10-7.8S17.52 3 12 3z"
                  />
                </svg>
              </div>
            }
            label="카카오로 계속하기"
            style="kakao"
          />

          {/* Apple */}
          <SocialButton
            onClick={() => handleSocialLogin('apple')}
            disabled={isLoading}
            icon={
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
            }
            label="Apple로 계속하기"
            style="apple"
          />
        </div>
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

interface SocialButtonProps {
  onClick: () => void
  disabled?: boolean
  icon: React.ReactNode
  label: string
  style?: 'default' | 'kakao' | 'apple'
}

function SocialButton({
  onClick,
  disabled,
  icon,
  label,
  style = 'default',
}: SocialButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl',
        'text-sm font-medium transition-all duration-200 active:scale-95',
        'disabled:opacity-50 disabled:cursor-not-allowed tap-highlight-none',
        style === 'kakao' &&
          'bg-[#FEE500] text-[#3A1D1D] hover:bg-[#FFD700]',
        style === 'apple' &&
          'bg-white text-black hover:bg-gray-100',
        style === 'default' &&
          'bg-surface-2 text-white border border-border hover:bg-surface-3'
      )}
    >
      {icon}
      {label}
    </button>
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
