'use client'

import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/routing'
import { useAuth } from '@/hooks/useAuth'

export function LocaleSwitcher() {
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslations('settings')
  const { isAuthenticated, updateProfile } = useAuth()

  const toggleLocale = async () => {
    const next = locale === 'ko' ? 'en' : 'ko'
    if (isAuthenticated) {
      try {
        await updateProfile({ preferred_locale: next } as any)
      } catch {}
    }
    router.replace(pathname, { locale: next })
  }

  return (
    <button
      onClick={toggleLocale}
      className="text-sm font-medium text-text-secondary hover:text-white transition-colors"
    >
      {locale === 'ko' ? t('english') : t('korean')}
    </button>
  )
}
