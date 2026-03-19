'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Globe, MapPin, FileText, User } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/useAuthStore'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function ProfileEditPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user, profile, updateProfile } = useAuthStore()
  const supabase = getSupabaseClient()

  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [website, setWebsite] = useState('')
  const [location, setLocation] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [initialized, setInitialized] = useState(false)

  // Zustand persist hydration 후 profile이 로드되면 폼 초기화
  useEffect(() => {
    if (profile && !initialized) {
      setDisplayName(profile.display_name || '')
      setBio(profile.bio || '')
      setWebsite(profile.website || '')
      setLocation(profile.location || '')
      setInitialized(true)
    }
  }, [profile, initialized])

  if (!user || !profile) {
    return null
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError('')

    const updates = {
      display_name: displayName.trim() || null,
      bio: bio.trim() || null,
      website: website.trim() || null,
      location: location.trim() || null,
      updated_at: new Date().toISOString(),
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profile.id)

    if (updateError) {
      setError('저장에 실패했습니다. 다시 시도해주세요.')
      setIsSaving(false)
      return
    }

    updateProfile(updates)
    // 프로필 쿼리 캐시 즉시 반영
    queryClient.setQueryData(['profile', profile.username], (old: Record<string, unknown>) => ({
      ...old,
      ...updates,
    }))
    router.back()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-md pt-safe-top">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 tap-highlight-none"
          >
            <ArrowLeft size={24} className="text-white" />
          </button>
          <h1 className="text-white font-semibold">프로필 편집</h1>
          <Button
            size="sm"
            onClick={handleSave}
            isLoading={isSaving}
            className="px-4"
          >
            저장
          </Button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <Avatar
            src={profile.avatar_url}
            username={profile.username}
            size="xl"
          />
          <p className="text-text-muted text-xs">@{profile.username}</p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <Input
            label="표시 이름"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={profile.username}
            leftIcon={<User size={16} />}
            maxLength={50}
          />

          <div className="w-full">
            <label className="block text-text-secondary text-xs font-semibold uppercase tracking-wide mb-2">
              소개
            </label>
            <div className="bg-surface-2 rounded-2xl px-4 py-3 border border-border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30 transition-all duration-200">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="나를 소개해보세요"
                rows={3}
                maxLength={150}
                className="w-full bg-transparent text-white text-sm placeholder:text-text-muted outline-none resize-none"
              />
              <div className="flex justify-end">
                <span className="text-text-muted text-xs">{bio.length}/150</span>
              </div>
            </div>
          </div>

          <Input
            label="웹사이트"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://example.com"
            leftIcon={<Globe size={16} />}
            type="url"
          />

          <Input
            label="위치"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="서울, 대한민국"
            leftIcon={<MapPin size={16} />}
            maxLength={60}
          />
        </div>

        {error && (
          <p className="text-error text-sm text-center">{error}</p>
        )}

        <Button
          fullWidth
          onClick={handleSave}
          isLoading={isSaving}
          size="lg"
        >
          저장하기
        </Button>
      </div>
    </div>
  )
}
