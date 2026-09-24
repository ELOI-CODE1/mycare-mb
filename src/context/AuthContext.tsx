import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, apiErrorMessage, getAccessToken, setAccessToken, clearTokens, getRefreshToken, setRefreshToken, onUnauthorized } from '../api/client'

export type Role = 'girl' | 'boy' | 'parent' | 'admin'
export type User = { id: string; email: string; fullName: string; phone: string | null; role: Role; status: 'active' | 'suspended' | 'deleted'; createdAt: string }

type AuthContextValue = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (input: { fullName: string; email: string; password: string; phone?: string; role: Exclude<Role, 'admin'> }) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
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
      await clearTokens()
      setUser(null)
    }
  }, [])

  // Dead refresh (bad/expired refresh token) forces a clean logout → Login.
  useEffect(() => {
    onUnauthorized(() => setUser(null))
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const response = await api.get<{ user: User }>('/auth/me')
      setUser(response.data.user)
    } catch { /* interceptor handles refresh; bell stays quiet */ }
  }, [])

  useEffect(() => {
    let mounted = true
    getAccessToken()
      .then(async (token) => {
        if (!token) return
        try {
          // 401 here is auto-refreshed + retried by the api interceptor.
          const response = await api.get<{ user: User }>('/auth/me')
          if (mounted) setUser(response.data.user)
        } catch {
          await clearTokens()
          if (mounted) setUser(null)
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

  const value = useMemo(() => ({ user, loading, login, signup, logout, refreshUser, requestPasswordReset, confirmPasswordReset }), [user, loading, login, signup, logout, refreshUser, requestPasswordReset, confirmPasswordReset])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used within AuthProvider')
  return value
}
