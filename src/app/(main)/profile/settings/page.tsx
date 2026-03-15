'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  User,
  Lock,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Moon,
  Globe,
  Trash2,
  MessageSquare,
} from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/useAuthStore'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { BottomSheet } from '@/components/ui/BottomSheet'

interface SettingItem {
  icon: React.ReactNode
  label: string
  description?: string
  action: () => void
  danger?: boolean
  value?: string
}

interface SettingSection {
  title: string
  items: SettingItem[]
}

export default function SettingsPage() {
  const router = useRouter()
  const { profile, reset } = useAuthStore()
  const supabase = getSupabaseClient()

  const [showLogoutSheet, setShowLogoutSheet] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await supabase.auth.signOut()
    reset()
    router.replace('/login')
  }

  const sections: SettingSection[] = [
    {
      title: '계정',
      items: [
        {
          icon: <User size={20} />,
          label: '프로필 편집',
          description: '이름, 소개, 아바타 변경',
          action: () => router.push('/profile/edit'),
        },
        {
          icon: <Lock size={20} />,
          label: '비밀번호 변경',
          action: () => router.push('/profile/change-password'),
        },
        {
          icon: <Globe size={20} />,
          label: '계정 공개 범위',
          value: '공개',
          action: () => {},
        },
      ],
    },
    {
      title: '알림',
      items: [
        {
          icon: <Bell size={20} />,
          label: '알림 설정',
          description: '푸시 알림 및 이메일 설정',
          action: () => router.push('/settings/notifications'),
        },
      ],
    },
    {
      title: '앱',
      items: [
        {
          icon: <Moon size={20} />,
          label: '다크 모드',
          value: '항상 켜짐',
          action: () => {},
        },
        {
          icon: <Globe size={20} />,
          label: '언어',
          value: '한국어',
          action: () => {},
        },
      ],
    },
    {
      title: '지원',
      items: [
        {
          icon: <MessageSquare size={20} />,
          label: '피드백 / 문의 보내기',
          description: '버그 신고, 기능 제안, 파트너십 문의',
          action: () => router.push('/feedback'),
        },
        {
          icon: <HelpCircle size={20} />,
          label: '도움말 및 지원',
          action: () => {},
        },
        {
          icon: <Shield size={20} />,
          label: '개인정보처리방침',
          action: () => {},
        },
      ],
    },
    {
      title: '계정 관리',
      items: [
        {
          icon: <LogOut size={20} />,
          label: '로그아웃',
          action: () => setShowLogoutSheet(true),
          danger: true,
        },
        {
          icon: <Trash2 size={20} />,
          label: '계정 삭제',
          description: '계정과 모든 데이터가 영구 삭제됩니다',
          action: () => {},
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
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 tap-highlight-none"
          >
            <ArrowLeft size={24} className="text-white" />
          </button>
          <h1 className="text-white font-semibold ml-2">설정</h1>
        </div>
      </div>

      {/* Profile summary */}
      {profile && (
        <div
          className="mx-4 mt-2 mb-6 p-4 bg-surface rounded-2xl flex items-center gap-4 tap-highlight-none"
          onClick={() => router.push('/profile')}
        >
          <Avatar
            src={profile.avatar_url}
            username={profile.username}
            size="lg"
          />
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
      <div className="space-y-6 px-4 pb-safe-bottom pb-8">
        {sections.map((section) => (
          <div key={section.title}>
            <h3 className="text-text-muted text-xs font-semibold uppercase tracking-widest mb-2 px-1">
              {section.title}
            </h3>
            <div className="bg-surface rounded-2xl overflow-hidden divide-y divide-border/30">
              {section.items.map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="w-full flex items-center gap-4 px-4 py-4 text-left tap-highlight-none hover:bg-surface-2 transition-colors"
                >
                  <div className={item.danger ? 'text-error' : 'text-text-secondary'}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={item.danger ? 'text-error font-medium' : 'text-white'}>
                      {item.label}
                    </p>
                    {item.description && (
                      <p className="text-text-secondary text-xs mt-0.5">
                        {item.description}
                      </p>
                    )}
                  </div>
                  {item.value && (
                    <span className="text-text-secondary text-sm">{item.value}</span>
                  )}
                  {!item.value && (
                    <ChevronRight size={16} className="text-text-muted shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* App version */}
        <p className="text-center text-text-muted text-xs">
          Wallscape v0.1.0
        </p>
      </div>

      {/* Logout bottom sheet */}
      <BottomSheet
        isOpen={showLogoutSheet}
        onClose={() => setShowLogoutSheet(false)}
        title="로그아웃"
      >
        <div className="px-4 pb-safe-bottom pb-6 space-y-4">
          <p className="text-text-secondary text-center">
            정말로 로그아웃 하시겠습니까?
          </p>
          <Button
            onClick={handleLogout}
            isLoading={isLoggingOut}
            fullWidth
            variant="danger"
          >
            로그아웃
          </Button>
          <Button
            onClick={() => setShowLogoutSheet(false)}
            fullWidth
            variant="secondary"
          >
            취소
          </Button>
        </div>
      </BottomSheet>
    </div>
  )
}
