import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Role } from '../theme'

export type Profile = {
  id: string
  email: string
  full_name: string
  role: Role | string
  phone: string
  parent_id?: string | null
  avatar_url?: string | null
  created_at?: string
}

type AuthContextValue = {
  loading: boolean // initial session check in progress
  profileLoading: boolean // profile (role) fetch in progress
  session: Session | null
  user: User | null
  profile: Profile | null
  role: string | null
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  // Starts true so a restored session shows the splash until the role is known
  // (prevents a flash of the "No role assigned" screen on cold start).
  const [profileLoading, setProfileLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)

  const user = session?.user ?? null
  const metadataRole = typeof user?.user_metadata?.role === 'string' ? user.user_metadata.role : null

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.warn('Failed to load profile:', error.message)
      setProfile(null)
      return
    }
    setProfile((data as Profile) ?? null)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user?.id) await fetchProfile(user.id)
  }, [user?.id, fetchProfile])

  // Initial session load + subscribe to auth changes.
  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      // Only sync state here; avoid awaiting supabase calls inside this callback.
      setSession(newSession)
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  // Load the profile whenever the signed-in user changes.
  useEffect(() => {
    let active = true
    if (user?.id) {
      setProfileLoading(true)
      fetchProfile(user.id).finally(() => {
        if (active) setProfileLoading(false)
      })
    } else {
      setProfile(null)
      setProfileLoading(false)
    }
    return () => {
      active = false
    }
  }, [user?.id, fetchProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    return error ? { error: error.message } : {}
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }, [])

  const value: AuthContextValue = {
    loading,
    profileLoading,
    session,
    user,
    profile,
    role: profile?.role ?? metadataRole ?? null,
    signIn,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
