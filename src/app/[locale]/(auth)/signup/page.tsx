'use client'

import { useState } from 'react'
import { Link, useRouter } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff, Check, X } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { isValidEmail, isValidUsername } from '@/lib/utils'

interface PasswordStrength {
  score: number
  labelKey: string
  color: string
}

function getPasswordStrength(password: string): PasswordStrength {
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 1) return { score, labelKey: 'strengthVeryWeak', color: '#FF4466' }
  if (score === 2) return { score, labelKey: 'strengthWeak', color: '#D946EF' }
  if (score === 3) return { score, labelKey: 'strengthFair', color: '#FBBF24' }
  if (score === 4) return { score, labelKey: 'strengthStrong', color: '#22D3EE' }
  return { score, labelKey: 'strengthVeryStrong', color: '#CCFF00' }
}

export default function SignupPage() {
  const router = useRouter()
  const t = useTranslations('auth')
  const tc = useTranslations('common')

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
          setError(t('emailTaken'))
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
      setError(t('signupError'))
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
          <h1 className="text-2xl font-black text-white mb-3">{t('checkEmail')}</h1>
          <p className="text-text-secondary mb-2">
            <span className="text-white font-semibold">{email}</span>
          </p>
          <p className="text-text-secondary mb-8">
            {t('verificationSent')}
          </p>
          <Button
            onClick={() => router.push('/login')}
            fullWidth
          >
            {t('goToLogin')}
          </Button>
          <button
            onClick={() => setSuccess(false)}
            className="mt-4 text-text-secondary text-sm tap-highlight-none"
          >
            {t('signupWithOtherEmail')}
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
          <h1 className="text-3xl font-black text-white mb-2">{t('signupTitle')}</h1>
          <p className="text-text-secondary">
            {t('signupSubtitle')}
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
              placeholder={t('emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail size={18} />}
              autoComplete="email"
              required
            />
            {validations.email === false && (
              <p className="mt-1.5 text-xs text-error pl-1">
                {t('invalidEmail')}
              </p>
            )}
          </div>

          {/* Username */}
          <div>
            <Input
              type="text"
              placeholder={t('usernamePlaceholder')}
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              leftIcon={<User size={18} />}
              autoComplete="username"
              required
            />
            {validations.username === false && (
              <p className="mt-1.5 text-xs text-error pl-1">
                {t('invalidUsername')}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder={t('passwordPlaceholder')}
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
                            : '#262632',
                      }}
                    />
                  ))}
                </div>
                <p className="text-xs pl-1" style={{ color: passwordStrength.color }}>
                  {t('passwordStrength')}{t(passwordStrength.labelKey as any)}
                </p>
              </div>
            )}
          </div>

          {/* Terms */}
          <p className="text-text-muted text-xs text-center pt-2 px-2">
            {t('termsAgreement')}
          </p>

          <Button
            type="submit"
            fullWidth
            size="lg"
            isLoading={isLoading}
            disabled={!isFormValid}
            className="mt-2"
          >
            {tc('signup')}
          </Button>
        </form>
      </div>

      {/* Login link */}
      <div className="px-6 pb-safe-bottom pb-8 text-center">
        <p className="text-text-secondary text-sm">
          {t('haveAccount')}{' '}
          <Link href="/login" className="text-primary font-semibold">
            {tc('login')}
          </Link>
        </p>
      </div>
    </div>
  )
}
