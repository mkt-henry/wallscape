'use client'

import { useState, useEffect, useRef } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/useAuthStore'
import type { Profile } from '@/types'

// ---- React Query setup -------------------------------------

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        gcTime: 5 * 60 * 1000, // 5 minutes
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors
          if (error instanceof Error && error.message.includes('4')) return false
          return failureCount < 2
        },
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 1,
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined = undefined

function getQueryClient() {
  if (typeof window === 'undefined') {
    return makeQueryClient()
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient()
  }
  return browserQueryClient
}

// ---- Auth Provider -----------------------------------------

function AuthProvider({ children }: { children: React.ReactNode }) {
  const {
    setSession,
    setProfile,
    setLoading,
    setInitialized,
    reset,
  } = useAuthStore()

  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const supabase = getSupabaseClient()

    // Use onAuthStateChange only — avoids getSession() network hang
    // INITIAL_SESSION fires immediately with the current session state
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)

      if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN') && session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profile) setProfile(profile as Profile)
      } else if (event === 'SIGNED_OUT') {
        reset()
      }

      // Mark initialized after first event (INITIAL_SESSION always fires first)
      if (event === 'INITIAL_SESSION') {
        setLoading(false)
        setInitialized(true)
      }
    })

    // Fallback: if INITIAL_SESSION never fires within 4s, unblock the app
    const fallback = setTimeout(() => {
      setLoading(false)
      setInitialized(true)
    }, 4000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(fallback)
    }
  }, [setSession, setProfile, setLoading, setInitialized, reset])

  return <>{children}</>
}

// ---- Root Providers ----------------------------------------

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => getQueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      )}
    </QueryClientProvider>
  )
}
