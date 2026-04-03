'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Eye, EyeOff, Lock } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/useAuthStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function ChangePasswordPage() {
  const router = useRouter()
  const t = useTranslations('changePassword')
  const { user } = useAuthStore()
  const supabase = getSupabaseClient()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  if (!user) {
    return null
  }

  const handleSave = async () => {
    setError('')

    if (newPassword.length < 6) {
      setError(t('tooShort'))
      return
    }

    if (newPassword !== confirmPassword) {
      setError(t('mismatch'))
      return
    }

    setIsSaving(true)

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (updateError) {
      setError(t('failed'))
      setIsSaving(false)
      return
    }

    setSuccess(true)
    setIsSaving(false)
    setTimeout(() => router.back(), 1500)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-md pt-safe-top">
        <div className="flex items-center px-4 h-14">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 tap-highlight-none"
          >
            <ArrowLeft size={24} className="text-white" />
          </button>
          <h1 className="text-white font-semibold ml-2">{t('title')}</h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {success ? (
          <div className="py-16 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <Lock size={28} className="text-primary" />
            </div>
            <div>
              <p className="text-white font-semibold mb-1">{t('success')}</p>
              <p className="text-text-secondary text-sm">{t('redirecting')}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <Input
                label={t('newPassword')}
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('newPasswordPlaceholder')}
                leftIcon={<Lock size={16} />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="tap-highlight-none"
                  >
                    {showNew ? (
                      <EyeOff size={16} className="text-text-secondary" />
                    ) : (
                      <Eye size={16} className="text-text-secondary" />
                    )}
                  </button>
                }
              />

              <Input
                label={t('confirmPassword')}
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('confirmPlaceholder')}
                leftIcon={<Lock size={16} />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="tap-highlight-none"
                  >
                    {showConfirm ? (
                      <EyeOff size={16} className="text-text-secondary" />
                    ) : (
                      <Eye size={16} className="text-text-secondary" />
                    )}
                  </button>
                }
              />
            </div>

            {error && (
              <p className="text-error text-sm text-center">{error}</p>
            )}

            <Button
              fullWidth
              onClick={handleSave}
              isLoading={isSaving}
              disabled={!newPassword || !confirmPassword}
              size="lg"
            >
              {t('submitBtn')}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
