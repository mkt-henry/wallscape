'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  User,
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
  const { profile, reset } = useAuthStore()
  const supabase = getSupabaseClient()

  const [showLogoutSheet, setShowLogoutSheet] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [showDeleteSheet, setShowDeleteSheet] = useState(false)
  const [showComingSoonSheet, setShowComingSoonSheet] = useState(false)
  const [comingSoonLabel, setComingSoonLabel] = useState('')

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
          icon: <Globe size={20} />,
          label: '계정 공개 범위',
          value: '공개',
          // 표시 전용 — action 없음
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
          action: () => openComingSoon('알림 설정'),
          comingSoon: true,
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
          // 표시 전용
        },
        {
          icon: <Globe size={20} />,
          label: '언어',
          value: '한국어',
          // 표시 전용
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
          action: () => openComingSoon('도움말 및 지원'),
          comingSoon: true,
        },
        {
          icon: <Shield size={20} />,
          label: '개인정보처리방침',
          action: () => openComingSoon('개인정보처리방침'),
          comingSoon: true,
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
          action: () => setShowDeleteSheet(true),
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
          <h1 className="text-white font-semibold ml-2">설정</h1>
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
      <div className="space-y-6 px-4 pb-safe-bottom pb-8">
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
                            준비 중
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
      <BottomSheet isOpen={showLogoutSheet} onClose={() => setShowLogoutSheet(false)} title="로그아웃">
        <div className="px-4 pb-safe-bottom pb-6 space-y-4">
          <p className="text-text-secondary text-center">정말로 로그아웃 하시겠습니까?</p>
          <Button onClick={handleLogout} isLoading={isLoggingOut} fullWidth variant="danger">
            로그아웃
          </Button>
          <Button onClick={() => setShowLogoutSheet(false)} fullWidth variant="secondary">
            취소
          </Button>
        </div>
      </BottomSheet>

      {/* Delete account sheet */}
      <BottomSheet isOpen={showDeleteSheet} onClose={() => setShowDeleteSheet(false)} title="계정 삭제">
        <div className="px-4 pb-safe-bottom pb-6 space-y-4">
          <p className="text-text-secondary text-center text-sm leading-relaxed">
            계정 삭제는 되돌릴 수 없습니다.{'\n'}
            삭제를 원하시면 <span className="text-white font-semibold">피드백/문의</span>로 요청해 주세요.
          </p>
          <Button onClick={() => { setShowDeleteSheet(false); router.push('/feedback') }} fullWidth variant="danger">
            문의하기
          </Button>
          <Button onClick={() => setShowDeleteSheet(false)} fullWidth variant="secondary">
            취소
          </Button>
        </div>
      </BottomSheet>

      {/* Coming soon sheet */}
      <BottomSheet isOpen={showComingSoonSheet} onClose={() => setShowComingSoonSheet(false)} title={comingSoonLabel}>
        <div className="px-4 pb-safe-bottom pb-6 space-y-4">
          <p className="text-text-secondary text-center text-sm">
            해당 기능은 현재 준비 중입니다.{'\n'}곧 업데이트될 예정이에요!
          </p>
          <Button onClick={() => setShowComingSoonSheet(false)} fullWidth variant="secondary">
            확인
          </Button>
        </div>
      </BottomSheet>
    </div>
  )
}
