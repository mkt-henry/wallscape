'use client'

import { useEffect } from 'react'
import { useRouter } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { useAuthStore } from '@/stores/useAuthStore'
import { Button } from '@/components/ui/Button'
import { Link } from '@/i18n/routing'
import { User } from 'lucide-react'

export default function MyProfilePage() {
  const router = useRouter()
  const t = useTranslations('profile')
  const tc = useTranslations('common')
  const { user, profile, isInitialized } = useAuthStore()

  useEffect(() => {
    if (isInitialized && user && profile) {
      router.replace(`/profile/${profile.username}`)
    }
  }, [isInitialized, user, profile, router])

  if (!isInitialized || (user && profile)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="loader" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 gap-6">
        <div className="w-20 h-20 rounded-full bg-surface-2 flex items-center justify-center">
          <User size={36} className="text-text-muted" />
        </div>
        <div className="text-center">
          <h2 className="text-white text-xl font-bold mb-2">{t('myProfile')}</h2>
          <p className="text-text-secondary mb-6">
            {t('loginPrompt')}
          </p>
          <Link href="/login">
            <Button fullWidth>{tc('login')}</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="loader" />
    </div>
  )
}
