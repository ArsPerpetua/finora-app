import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

export interface Profile {
  id: string
  name: string
  telegram_chat_id: number | null
  active_until: string | null
}

interface AuthState {
  loading: boolean
  session: Session | null
  profile: Profile | null
  isActive: boolean
  refreshProfile: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)

  const loadProfile = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setProfile(null)
      return
    }
    const { data } = await supabase
      .from('profiles')
      .select('id, name, telegram_chat_id, active_until')
      .eq('id', userId)
      .maybeSingle()
    setProfile((data as Profile | null) ?? null)
  }, [])

  useEffect(() => {
    let alive = true
    supabase.auth.getSession().then(async ({ data }) => {
      if (!alive) return
      setSession(data.session)
      await loadProfile(data.session?.user.id)
      if (alive) setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      // Jangan memanggil Supabase langsung di dalam callback ini; tunda satu tick.
      setTimeout(() => void loadProfile(next?.user.id), 0)
    })
    return () => {
      alive = false
      sub.subscription.unsubscribe()
    }
  }, [loadProfile])

  const value = useMemo<AuthState>(
    () => ({
      loading,
      session,
      profile,
      isActive: Boolean(profile?.active_until && new Date(profile.active_until) > new Date()),
      refreshProfile: () => loadProfile(session?.user.id),
      signOut: async () => {
        await supabase.auth.signOut()
      },
    }),
    [loading, session, profile, loadProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth harus dipakai di dalam AuthProvider')
  return ctx
}
