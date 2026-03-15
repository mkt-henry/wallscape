'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/useAuthStore'

export default function SplashPage() {
  const router = useRouter()
  const { isInitialized, user, isLoading } = useAuthStore()

  useEffect(() => {
    if (!isInitialized || isLoading) return

    if (user) {
      router.replace('/feed')
    } else {
      // Check if user has seen onboarding
      const hasSeenOnboarding =
        typeof window !== 'undefined' &&
        localStorage.getItem('wallscape_onboarded') === 'true'

      if (hasSeenOnboarding) {
        router.replace('/login')
      } else {
        router.replace('/onboarding')
      }
    }
  }, [isInitialized, isLoading, user, router])

  return (
    <div className="min-h-dvh bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        {/* Logo mark */}
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center shadow-glow-primary">
            <span className="text-4xl font-black text-white tracking-tighter">W</span>
          </div>
          {/* Decorative dots */}
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-secondary animate-pulse-soft" />
        </div>

        {/* Brand name */}
        <div className="text-center">
          <h1 className="text-3xl font-black text-white tracking-wide">
            WALLSCAPE
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            도시의 예술을 발견하다
          </p>
        </div>

        {/* Loading indicator */}
        <div className="loader" />
      </div>
    </div>
  )
}
