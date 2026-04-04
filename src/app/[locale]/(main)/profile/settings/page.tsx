'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/routing'
import { useLocale, useTranslations } from 'next-intl'
import {
  ArrowLeft,
  User,
  Bell,
  Shield,
  LogOut,
  ChevronRight,
  Moon,
  Globe,
  Trash2,
  MessageSquare,
} from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/useAuthStore'
import { useAuth } from '@/hooks/useAuth'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { BottomSheet } from '@/components/ui/BottomSheet'

interface SettingItem {
  icon: React.ReactNode
  label: string
  description?: string
  action?: () => void   // undefined이면 클릭 불가 (표시 전용)
  danger?: boolean
  value?: string
  comingSoon?: boolean
}

interface SettingSection {
  title: string
  items: SettingItem[]
}

export default function SettingsPage() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('settings')
  const tc = useTranslations('common')
  const { profile, reset } = useAuthStore()
  const { updateProfile } = useAuth()
  const supabase = getSupabaseClient()

  const [showLogoutSheet, setShowLogoutSheet] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [showDeleteSheet, setShowDeleteSheet] = useState(false)
  const [isDeactivating, setIsDeactivating] = useState(false)
  const [showComingSoonSheet, setShowComingSoonSheet] = useState(false)
  const [comingSoonLabel, setComingSoonLabel] = useState('')
  const [showLanguageSheet, setShowLanguageSheet] = useState(false)

  const openComingSoon = (label: string) => {
    setComingSoonLabel(label)
    setShowComingSoonSheet(true)
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await supabase.auth.signOut()
    reset()
    router.replace('/login')
  }

  const handleDeactivate = async () => {
    setIsDeactivating(true)
    const res = await fetch('/api/profile/deactivate', { method: 'POST' })
    if (res.ok) {
      await supabase.auth.signOut()
      reset()
      router.replace('/login')
    } else {
      setIsDeactivating(false)
      setShowDeleteSheet(false)
      alert('계정 비활성화에 실패했습니다. 다시 시도해주세요.')
    }
  }

  const sections: SettingSection[] = [
    {
      title: t('accountSection'),
      items: [
        {
          icon: <User size={20} />,
          label: t('editProfile'),
          description: t('editProfileDesc'),
          action: () => router.push('/profile/edit'),
        },
        {
          icon: <Globe size={20} />,
          label: t('accountVisibility'),
          value: t('public'),
          // 표시 전용 — action 없음
        },
      ],
    },
    {
      title: t('notifSection'),
      items: [
        {
          icon: <Bell size={20} />,
          label: t('notifSettings'),
          description: t('notifDesc'),
          action: () => openComingSoon(t('notifComingSoon')),
          comingSoon: true,
        },
      ],
    },
    {
      title: t('appSection'),
      items: [
        {
          icon: <Moon size={20} />,
          label: t('darkMode'),
          value: t('alwaysOn'),
          // 표시 전용
        },
        {
          icon: <Globe size={20} />,
          label: t('language'),
          value: { ko: t('korean'), en: t('english'), ja: t('japanese') }[locale] ?? t('korean'),
          action: () => setShowLanguageSheet(true),
        },
      ],
    },
    {
      title: t('supportSection'),
      items: [
        {
          icon: <MessageSquare size={20} />,
          label: t('feedbackOption'),
          description: t('feedbackDesc'),
          action: () => router.push('/feedback'),
        },
        {
          icon: <Shield size={20} />,
          label: t('privacyPolicy'),
          action: () => router.push('/privacy'),
        },
      ],
    },
    {
      title: t('accountMgmt'),
      items: [
        {
          icon: <LogOut size={20} />,
          label: t('logout'),
          action: () => setShowLogoutSheet(true),
          danger: true,
        },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-md pt-safe-top">
        <div className="flex items-center px-4 h-14">
          <button onClick={() => router.back()} className="p-2 -ml-2 tap-highlight-none">
            <ArrowLeft size={24} className="text-white" />
          </button>
          <h1 className="text-white font-semibold ml-2">{t('title')}</h1>
        </div>
      </div>

      {/* Profile summary */}
      {profile && (
        <div
          className="mx-4 mt-2 mb-6 p-4 bg-surface rounded-2xl flex items-center gap-4 tap-highlight-none cursor-pointer"
          onClick={() => router.push('/profile')}
        >
          <Avatar src={profile.avatar_url} username={profile.username} size="lg" />
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold truncate">
              {profile.display_name || profile.username}
            </p>
            <p className="text-text-secondary text-sm">@{profile.username}</p>
          </div>
          <ChevronRight size={18} className="text-text-muted" />
        </div>
      )}

      {/* Settings sections */}
      <div className="space-y-6 px-4 pb-[calc(env(safe-area-inset-bottom)+var(--bottom-nav-height)+2rem)]">
        {sections.map((section) => (
          <div key={section.title}>
            <h3 className="text-text-muted text-xs font-semibold uppercase tracking-widest mb-2 px-1">
              {section.title}
            </h3>
            <div className="bg-surface rounded-2xl overflow-hidden divide-y divide-border/30">
              {section.items.map((item) => {
                const isReadOnly = !item.action
                return (
                  <div
                    key={item.label}
                    onClick={item.action}
                    className={[
                      'w-full flex items-center gap-4 px-4 py-4 text-left',
                      isReadOnly ? 'cursor-default opacity-70' : 'tap-highlight-none hover:bg-surface-2 transition-colors cursor-pointer',
                    ].join(' ')}
                  >
                    <div className={item.danger ? 'text-error' : 'text-text-secondary'}>
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={item.danger ? 'text-error font-medium' : 'text-white'}>
                          {item.label}
                        </p>
                        {item.comingSoon && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-surface-2 text-text-muted border border-border/50">
                            {tc('comingSoon')}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-text-secondary text-xs mt-0.5">{item.description}</p>
                      )}
                    </div>
                    {item.value && (
                      <span className="text-text-secondary text-sm shrink-0">{item.value}</span>
                    )}
                    {!item.value && !isReadOnly && (
                      <ChevronRight size={16} className="text-text-muted shrink-0" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        <p className="text-center text-text-muted text-xs">Wallscape v0.1.0</p>
      </div>

      {/* Logout sheet */}
      <BottomSheet isOpen={showLogoutSheet} onClose={() => setShowLogoutSheet(false)} title={t('logout')}>
        <div className="px-4 pb-safe-bottom pb-6 space-y-4">
          <p className="text-text-secondary text-center">{t('logoutConfirm')}</p>
          <Button onClick={handleLogout} isLoading={isLoggingOut} fullWidth variant="danger">
            {t('logout')}
          </Button>
          <Button onClick={() => setShowLogoutSheet(false)} fullWidth variant="secondary">
            {tc('cancel')}
          </Button>
        </div>
      </BottomSheet>

      {/* Delete account sheet */}
      <BottomSheet isOpen={showDeleteSheet} onClose={() => !isDeactivating && setShowDeleteSheet(false)} title={t('deleteAccount')}>
        <div className="px-4 pb-safe-bottom pb-6 space-y-4">
          <p className="text-text-secondary text-center text-sm leading-relaxed">
            {t('deleteAccountDesc')}
          </p>
          <Button onClick={handleDeactivate} isLoading={isDeactivating} fullWidth variant="danger">
            {t('deleteAccount')}
          </Button>
          <Button onClick={() => setShowDeleteSheet(false)} fullWidth variant="secondary" disabled={isDeactivating}>
            {tc('cancel')}
          </Button>
        </div>
      </BottomSheet>

      {/* Coming soon sheet */}
      <BottomSheet isOpen={showComingSoonSheet} onClose={() => setShowComingSoonSheet(false)} title={comingSoonLabel}>
        <div className="px-4 pb-safe-bottom pb-6 space-y-4">
          <p className="text-text-secondary text-center text-sm">
            {t('notifComingSoonDesc')}
          </p>
          <Button onClick={() => setShowComingSoonSheet(false)} fullWidth variant="secondary">
            {tc('confirm')}
          </Button>
        </div>
      </BottomSheet>

      {/* Language sheet */}
      <BottomSheet isOpen={showLanguageSheet} onClose={() => setShowLanguageSheet(false)} title={t('language')}>
        <div className="px-4 pb-safe-bottom pb-6 space-y-1">
          {([
            { code: 'ko', label: t('korean') },
            { code: 'en', label: t('english') },
            { code: 'ja', label: t('japanese') },
          ] as const).map(({ code, label }) => (
            <button
              key={code}
              onClick={async () => {
                setShowLanguageSheet(false)
                if (code !== locale) {
                  try {
                    await updateProfile({ preferred_locale: code } as any)
                  } catch {}
                  router.replace('/profile/settings', { locale: code })
                }
              }}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-colors ${
                code === locale
                  ? 'text-primary font-semibold bg-primary/10'
                  : 'text-white hover:bg-surface-2'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </BottomSheet>
    </div>
  )
}
