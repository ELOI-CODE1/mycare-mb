import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Platform } from 'react-native'
import { api, apiErrorMessage, getAccessToken, setAccessToken, clearAccessToken } from '../api/client'

export type Role = 'girl' | 'boy' | 'parent' | 'admin'
export type User = { id: string; email: string; fullName: string; phone: string | null; role: Role; status: 'active' | 'suspended' | 'deleted'; createdAt: string }

const REFRESH_KEY = 'mycareplus_refresh_token'

async function getRefreshToken(): Promise<string | null> {
  if (Platform.OS === 'web') return globalThis.localStorage?.getItem(REFRESH_KEY) ?? null
  const SecureStore = await import('expo-secure-store')
  return SecureStore.getItemAsync(REFRESH_KEY)
}

async function setRefreshToken(token: string) {
  if (Platform.OS === 'web') globalThis.localStorage?.setItem(REFRESH_KEY, token)
  else {
    const SecureStore = await import('expo-secure-store')
    await SecureStore.setItemAsync(REFRESH_KEY, token)
  }
}

async function clearRefreshToken() {
  if (Platform.OS === 'web') globalThis.localStorage?.removeItem(REFRESH_KEY)
  else {
    const SecureStore = await import('expo-secure-store')
    await SecureStore.deleteItemAsync(REFRESH_KEY)
  }
}

type AuthContextValue = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (input: { fullName: string; email: string; password: string; phone?: string; role: Exclude<Role, 'admin'> }) => Promise<void>
  logout: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<string>
  confirmPasswordReset: (token: string, newPassword: string) => Promise<string>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const logout = useCallback(async () => {
    try {
      const refresh = await getRefreshToken()
      if (refresh) await api.post('/auth/logout', { refreshToken: refresh }).catch(() => undefined)
    } finally {
      await clearAccessToken()
      await clearRefreshToken()
      setUser(null)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    getAccessToken()
      .then(async (token) => {
        if (!token) return
        try {
          const response = await api.get<{ user: User }>('/auth/me')
          if (mounted) setUser(response.data.user)
        } catch {
          // Try refresh once before giving up.
          const refresh = await getRefreshToken()
          if (!refresh) return
          try {
            const r = await api.post<{ token: string; refreshToken: string }>('/auth/refresh', { refreshToken: refresh })
            await setAccessToken(r.data.token)
            await setRefreshToken(r.data.refreshToken)
            const me = await api.get<{ user: User }>('/auth/me')
            if (mounted) setUser(me.data.user)
          } catch {
            await clearAccessToken()
            await clearRefreshToken()
            if (mounted) setUser(null)
          }
        }
      })
      .catch(() => { if (mounted) setUser(null) })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await api.post<{ token: string; refreshToken: string; user: User }>('/auth/login', { email, password })
      await setAccessToken(response.data.token)
      await setRefreshToken(response.data.refreshToken)
      setUser(response.data.user)
    } catch (error) { throw new Error(apiErrorMessage(error, 'Login failed.')) }
  }, [])

  const signup = useCallback(async (input: { fullName: string; email: string; password: string; phone?: string; role: Exclude<Role, 'admin'> }) => {
    try {
      const response = await api.post<{ token: string; refreshToken: string; user: User }>('/auth/signup', input)
      await setAccessToken(response.data.token)
      await setRefreshToken(response.data.refreshToken)
      setUser(response.data.user)
    } catch (error) { throw new Error(apiErrorMessage(error, 'Registration failed.')) }
  }, [])

  const requestPasswordReset = useCallback(async (email: string) => {
    try {
      const response = await api.post<{ message: string }>('/auth/forgot-password', { email })
      return response.data.message
    } catch (error) { throw new Error(apiErrorMessage(error, 'Could not request a reset link.')) }
  }, [])

  const confirmPasswordReset = useCallback(async (token: string, newPassword: string) => {
    try {
      const response = await api.post<{ message: string }>('/auth/reset-password', { token, newPassword })
      return response.data.message
    } catch (error) { throw new Error(apiErrorMessage(error, 'Reset link is invalid or has expired.')) }
  }, [])

  const value = useMemo(() => ({ user, loading, login, signup, logout, requestPasswordReset, confirmPasswordReset }), [user, loading, login, signup, logout, requestPasswordReset, confirmPasswordReset])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used within AuthProvider')
  return value
}
