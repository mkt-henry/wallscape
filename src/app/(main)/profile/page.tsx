'use client'

import { useAuthStore } from '@/stores/useAuthStore'
import { ProfileView } from '@/components/profile/ProfileView'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { User } from 'lucide-react'

export default function MyProfilePage() {
  const { user, profile } = useAuthStore()

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 gap-6">
        <div className="w-20 h-20 rounded-full bg-surface-2 flex items-center justify-center">
          <User size={36} className="text-text-muted" />
        </div>
        <div className="text-center">
          <h2 className="text-white text-xl font-bold mb-2">내 프로필</h2>
          <p className="text-text-secondary mb-6">
            로그인하면 내 게시물과 활동을 확인할 수 있어요
          </p>
          <Link href="/login">
            <Button fullWidth>로그인</Button>
          </Link>
        </div>
      </div>
    )
  }

  return <ProfileView username={profile.username} isOwnProfile />
}
