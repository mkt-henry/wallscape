'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff, Check, X } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { isValidEmail, isValidUsername } from '@/lib/utils'

interface PasswordStrength {
  score: number
  label: string
  color: string
}

function getPasswordStrength(password: string): PasswordStrength {
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 1) return { score, label: '매우 약함', color: '#FF4444' }
  if (score === 2) return { score, label: '약함', color: '#FF8855' }
  if (score === 3) return { score, label: '보통', color: '#FFB344' }
  if (score === 4) return { score, label: '강함', color: '#44CC88' }
  return { score, label: '매우 강함', color: '#44FF88' }
}

export default function SignupPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const supabase = getSupabaseClient()

  const passwordStrength = password ? getPasswordStrength(password) : null

  const validations = {
    email: email ? isValidEmail(email) : null,
    username: username ? isValidUsername(username) : null,
    password: password ? password.length >= 8 : null,
  }

  const isFormValid =
    validations.email &&
    validations.username &&
    validations.password

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) return

    setIsLoading(true)
    setError(null)

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            username: username.trim(),
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('이미 사용 중인 이메일 주소입니다.')
        } else {
          setError(signUpError.message)
        }
        return
      }

      if (data.user && !data.session) {
        // Email confirmation required
        setSuccess(true)
      } else if (data.session) {
        // Auto-confirmed
        router.replace('/feed')
      }
    } catch {
      setError('회원가입 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-dvh bg-background flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-success/10 border border-success/30 flex items-center justify-center mx-auto mb-6">
            <Check size={36} className="text-success" />
          </div>
          <h1 className="text-2xl font-black text-white mb-3">이메일을 확인해주세요</h1>
          <p className="text-text-secondary mb-2">
            <span className="text-white font-semibold">{email}</span>로
          </p>
          <p className="text-text-secondary mb-8">
            인증 메일을 보냈습니다. 메일의 링크를 클릭해 가입을 완료하세요.
          </p>
          <Button
            onClick={() => router.push('/login')}
            fullWidth
          >
            로그인으로 이동
          </Button>
          <button
            onClick={() => setSuccess(false)}
            className="mt-4 text-text-secondary text-sm tap-highlight-none"
          >
            다른 이메일로 가입하기
          </button>
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

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 pb-8">
        {/* Brand */}
        <div className="mb-10 pt-4">
          <h1 className="text-3xl font-black text-white mb-2">계정 만들기</h1>
          <p className="text-text-secondary">
            Wallscape와 함께 도시의 예술을 기록하세요
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 bg-error/10 border border-error/30 rounded-2xl flex items-start gap-3">
            <X size={16} className="text-error mt-0.5 shrink-0" />
            <p className="text-error text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          {/* Email */}
          <div>
            <Input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail size={18} />}
              autoComplete="email"
              required
            />
            {validations.email === false && (
              <p className="mt-1.5 text-xs text-error pl-1">
                올바른 이메일 형식을 입력해주세요
              </p>
            )}
          </div>

          {/* Username */}
          <div>
            <Input
              type="text"
              placeholder="사용자명 (영문, 숫자, _ 3-20자)"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              leftIcon={<User size={18} />}
              autoComplete="username"
              required
            />
            {validations.username === false && (
              <p className="mt-1.5 text-xs text-error pl-1">
                영문, 숫자, _만 사용 가능하며 3-20자여야 합니다
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="비밀번호 (8자 이상)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock size={18} />}
              autoComplete="new-password"
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

            {/* Password strength */}
            {password && passwordStrength && (
              <div className="mt-2 space-y-1.5">
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 h-1 rounded-full transition-all duration-300"
                      style={{
                        backgroundColor:
                          i < passwordStrength.score
                            ? passwordStrength.color
                            : '#2E2E2E',
                      }}
                    />
                  ))}
                </div>
                <p className="text-xs pl-1" style={{ color: passwordStrength.color }}>
                  비밀번호 강도: {passwordStrength.label}
                </p>
              </div>
            )}
          </div>

          {/* Terms */}
          <p className="text-text-muted text-xs text-center pt-2 px-2">
            가입하면 Wallscape의{' '}
            <Link href="/terms" className="text-primary">
              이용약관
            </Link>{' '}
            및{' '}
            <Link href="/privacy" className="text-primary">
              개인정보처리방침
            </Link>
            에 동의하는 것으로 간주됩니다.
          </p>

          <Button
            type="submit"
            fullWidth
            size="lg"
            isLoading={isLoading}
            disabled={!isFormValid}
            className="mt-2"
          >
            회원가입
          </Button>
        </form>
      </div>

      {/* Login link */}
      <div className="px-6 pb-safe-bottom pb-8 text-center">
        <p className="text-text-secondary text-sm">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-primary font-semibold">
            로그인
          </Link>
        </p>
      </div>
    </div>
  )
}
