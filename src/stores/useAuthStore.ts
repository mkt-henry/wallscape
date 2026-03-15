import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { Session, User } from '@supabase/supabase-js'
import type { Profile } from '@/types'

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  isLoading: boolean
  isInitialized: boolean

  // Actions
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
  setInitialized: (initialized: boolean) => void
  updateProfile: (updates: Partial<Profile>) => void
  reset: () => void
}

const initialState = {
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  isInitialized: false,
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        setUser: (user) => set({ user }, false, 'setUser'),

        setSession: (session) =>
          set(
            {
              session,
              user: session?.user ?? null,
            },
            false,
            'setSession'
          ),

        setProfile: (profile) => set({ profile }, false, 'setProfile'),

        setLoading: (isLoading) => set({ isLoading }, false, 'setLoading'),

        setInitialized: (isInitialized) =>
          set({ isInitialized }, false, 'setInitialized'),

        updateProfile: (updates) =>
          set(
            (state) => ({
              profile: state.profile ? { ...state.profile, ...updates } : null,
            }),
            false,
            'updateProfile'
          ),

        reset: () =>
          set(
            { ...initialState, isLoading: false, isInitialized: true },
            false,
            'reset'
          ),
      }),
      {
        name: 'wallscape-auth',
        // Only persist non-sensitive data
        partialize: (state) => ({
          profile: state.profile,
        }),
      }
    ),
    { name: 'AuthStore' }
  )
)

// Selectors
export const selectUser = (state: AuthState) => state.user
export const selectProfile = (state: AuthState) => state.profile
export const selectSession = (state: AuthState) => state.session
export const selectIsAuthenticated = (state: AuthState) =>
  !!state.user && !!state.session
export const selectIsLoading = (state: AuthState) => state.isLoading
