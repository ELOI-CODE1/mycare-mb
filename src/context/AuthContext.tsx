import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as SecureStore from 'expo-secure-store'
import { api, apiErrorMessage, TOKEN_KEY } from '../api/client'

export type Role = 'girl' | 'boy' | 'parent' | 'admin'
export type User = { id: string; email: string; fullName: string; phone: string | null; role: Role; status: 'active' | 'suspended' | 'deleted'; createdAt: string }

type AuthContextValue = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (input: { fullName: string; email: string; password: string; phone?: string; role: Exclude<Role, 'admin'> }) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY)
    setUser(null)
  }, [])

  useEffect(() => {
    let mounted = true
    SecureStore.getItemAsync(TOKEN_KEY)
      .then(async (token) => {
        if (!token) return
        const response = await api.get<{ user: User }>('/auth/me')
        if (mounted) setUser(response.data.user)
      })
      .catch(() => { if (mounted) setUser(null) })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await api.post<{ token: string; user: User }>('/auth/login', { email, password })
      await SecureStore.setItemAsync(TOKEN_KEY, response.data.token)
      setUser(response.data.user)
    } catch (error) { throw new Error(apiErrorMessage(error, 'Login failed.')) }
  }, [])

  const signup = useCallback(async (input: { fullName: string; email: string; password: string; phone?: string; role: Exclude<Role, 'admin'> }) => {
    try {
      const response = await api.post<{ token: string; user: User }>('/auth/signup', input)
      await SecureStore.setItemAsync(TOKEN_KEY, response.data.token)
      setUser(response.data.user)
    } catch (error) { throw new Error(apiErrorMessage(error, 'Registration failed.')) }
  }, [])

  const value = useMemo(() => ({ user, loading, login, signup, logout }), [user, loading, login, signup, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used within AuthProvider')
  return value
}
