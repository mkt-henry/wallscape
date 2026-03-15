'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/useAuthStore'
import type { Profile } from '@/types'

export function useAuth() {
  const router = useRouter()
  const { user, session, profile, isLoading, isInitialized, setProfile, reset } =
    useAuthStore()

  const supabase = getSupabaseClient()

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      return data
    },
    [supabase]
  )

  const signUpWithEmail = useCallback(
    async (email: string, password: string, username: string) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error
      return data
    },
    [supabase]
  )

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) throw error
  }, [supabase])

  const signInWithKakao = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) throw error
  }, [supabase])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    reset()
    router.replace('/login')
  }, [supabase, reset, router])

  const updateProfile = useCallback(
    async (updates: Partial<Profile>) => {
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error
      setProfile(data as Profile)
      return data
    },
    [supabase, user, setProfile]
  )

  const uploadAvatar = useCallback(
    async (file: File) => {
      if (!user) throw new Error('Not authenticated')

      const ext = file.name.split('.').pop()
      const path = `${user.id}/avatar.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(path)

      return urlData.publicUrl
    },
    [supabase, user]
  )

  const refreshProfile = useCallback(async () => {
    if (!user) return

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (data) setProfile(data as Profile)
  }, [supabase, user, setProfile])

  return {
    user,
    session,
    profile,
    isLoading,
    isInitialized,
    isAuthenticated: !!user && !!session,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithKakao,
    signOut,
    updateProfile,
    uploadAvatar,
    refreshProfile,
  }
}
