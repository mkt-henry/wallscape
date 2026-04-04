'use client'

import { useState, useRef, useEffect } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/routing'
import { useAuth } from '@/hooks/useAuth'
import { locales, type Locale } from '@/i18n/config'

const LOCALE_LABELS: Record<string, string> = {
  ko: '한국어',
  en: 'English',
  ja: '日本語',
}

export function LocaleSwitcher() {
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslations('settings')
  const { isAuthenticated, updateProfile } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selectLocale = async (code: Locale) => {
    setOpen(false)
    if (code === locale) return
    if (isAuthenticated) {
      try {
        await updateProfile({ preferred_locale: code } as any)
      } catch {}
    }
    router.replace(pathname, { locale: code })
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-sm font-medium text-text-secondary hover:text-white transition-colors"
      >
        {LOCALE_LABELS[locale] ?? locale}
      </button>
      {open && (
        <div className="absolute right-0 bottom-full mb-2 bg-surface border border-border rounded-xl py-1 shadow-lg min-w-[120px] z-50">
          {locales.map((code) => (
            <button
              key={code}
              onClick={() => selectLocale(code)}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                code === locale
                  ? 'text-primary font-semibold'
                  : 'text-text-secondary hover:text-white hover:bg-surface-2'
              }`}
            >
              {LOCALE_LABELS[code]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
