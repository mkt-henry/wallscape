'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Globe, MapPin, User, Camera, AtSign, CheckCircle, XCircle, Loader } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/useAuthStore'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const USERNAME_REGEX = /^[a-z0-9_]{3,30}$/

export default function ProfileEditPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user, profile, updateProfile } = useAuthStore()
  const supabase = getSupabaseClient()
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [website, setWebsite] = useState('')
  const [location, setLocation] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [initialized, setInitialized] = useState(false)

  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle')

  useEffect(() => {
    if (profile && !initialized) {
      setUsername(profile.username || '')
      setDisplayName(profile.display_name || '')
      setBio(profile.bio || '')
      setWebsite(profile.website || '')
      setLocation(profile.location || '')
      setInitialized(true)
    }
  }, [profile, initialized])

  useEffect(() => {
    if (!initialized || !profile) return
    if (username === profile.username) {
      setUsernameStatus('idle')
      return
    }
    if (!USERNAME_REGEX.test(username)) {
      setUsernameStatus('invalid')
      return
    }
    setUsernameStatus('checking')
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .maybeSingle()
      setUsernameStatus(data ? 'taken' : 'available')
    }, 500)
    return () => clearTimeout(timer)
  }, [username, initialized, profile, supabase])

  if (!user || !profile) return null

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const isUsernameChanged = username !== profile?.username
  const canSave = !isUsernameChanged || usernameStatus === 'available'

  const handleSave = async () => {
    if (!canSave) return
    setIsSaving(true)
    setError('')

    let newAvatarUrl = profile.avatar_url

    // 아바타가 변경됐으면 먼저 업로드
    if (avatarFile) {
      const formData = new FormData()
      formData.append('avatar', avatarFile)

      const res = await fetch('/api/profile/avatar', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || '이미지 업로드에 실패했습니다.')
        setIsSaving(false)
        return
      }

      newAvatarUrl = data.avatar_url
    }

    const updates = {
      username: username.trim(),
      display_name: displayName.trim() || null,
      bio: bio.trim() || null,
      website: website.trim() || null,
      location: location.trim() || null,
      avatar_url: newAvatarUrl,
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
    queryClient.invalidateQueries({ queryKey: ['profile', profile.username] })
    queryClient.invalidateQueries({ queryKey: ['profile', username.trim()] })
    router.replace(`/profile/${username.trim()}`)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-md pt-safe-top">
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={() => router.back()} className="p-2 -ml-2 tap-highlight-none">
            <ArrowLeft size={24} className="text-white" />
          </button>
          <h1 className="text-white font-semibold">프로필 편집</h1>
          <Button size="sm" onClick={handleSave} isLoading={isSaving} disabled={!canSave} className="px-4">
            저장
          </Button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-2">
          <div
            className="relative cursor-pointer"
            onClick={() => avatarInputRef.current?.click()}
          >
            <Avatar
              src={avatarPreview || profile.avatar_url}
              username={profile.username}
              size="xl"
            />
            <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary border-2 border-background flex items-center justify-center">
              <Camera size={13} className="text-white" />
            </div>
          </div>
          <button
            onClick={() => avatarInputRef.current?.click()}
            className="text-primary text-sm tap-highlight-none"
          >
            사진 변경
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarSelect}
            className="hidden"
          />
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Username */}
          <div>
            <Input
              label="핸들 (아이디)"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="username"
              leftIcon={<AtSign size={16} />}
              maxLength={30}
              rightIcon={
                usernameStatus === 'checking' ? <Loader size={16} className="text-text-muted animate-spin" /> :
                usernameStatus === 'available' ? <CheckCircle size={16} className="text-green-500" /> :
                usernameStatus === 'taken' ? <XCircle size={16} className="text-error" /> :
                usernameStatus === 'invalid' ? <XCircle size={16} className="text-error" /> :
                undefined
              }
            />
            <p className={`mt-1.5 text-xs px-1 ${
              usernameStatus === 'invalid' ? 'text-error' :
              usernameStatus === 'taken' ? 'text-error' :
              usernameStatus === 'available' ? 'text-green-500' :
              'text-text-muted'
            }`}>
              {usernameStatus === 'invalid' && '영문 소문자, 숫자, 밑줄(_)만 사용 가능하며 3~30자여야 합니다.'}
              {usernameStatus === 'taken' && '이미 사용 중인 핸들입니다.'}
              {usernameStatus === 'available' && '사용 가능한 핸들입니다.'}
              {usernameStatus === 'idle' && '영문 소문자, 숫자, 밑줄(_) 사용 가능 (3~30자)'}
            </p>
          </div>

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

        {error && <p className="text-error text-sm text-center">{error}</p>}

        <Button fullWidth onClick={handleSave} isLoading={isSaving} disabled={!canSave} size="lg">
          저장하기
        </Button>
      </div>
    </div>
  )
}
