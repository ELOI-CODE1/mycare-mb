import axios, { type AxiosRequestConfig } from 'axios'
import { Platform } from 'react-native'

// Resolve API URL once. Warn loudly in dev if missing so LAN IP mistakes surface early.
function resolveApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  if (__DEV__) {
    console.warn('[api] EXPO_PUBLIC_API_URL is not set — falling back to http://127.0.0.1:3000/api. Set it in .env for device testing.')
  }
  return 'http://127.0.0.1:3000/api'
}

export const API_URL = resolveApiUrl()
export const TOKEN_KEY = 'mycareplus_access_token'
export const REFRESH_KEY = 'mycareplus_refresh_token'

// ---- Web-safe token storage (dynamic SecureStore import, no static import) ----
async function secureGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web') return globalThis.localStorage?.getItem(key) ?? null
  const SecureStore = await import('expo-secure-store')
  return SecureStore.getItemAsync(key)
}

async function secureSet(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(key, value)
    return
  }
  const SecureStore = await import('expo-secure-store')
  await SecureStore.setItemAsync(key, value)
}

async function secureDel(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.removeItem(key)
    return
  }
  const SecureStore = await import('expo-secure-store')
  await SecureStore.deleteItemAsync(key)
}

export const getAccessToken = () => secureGet(TOKEN_KEY)
export const setAccessToken = (token: string) => secureSet(TOKEN_KEY, token)
export const clearAccessToken = () => secureDel(TOKEN_KEY)
export const getRefreshToken = () => secureGet(REFRESH_KEY)
export const setRefreshToken = (token: string) => secureSet(REFRESH_KEY, token)
export const clearTokens = async () => {
  await secureDel(TOKEN_KEY)
  await secureDel(REFRESH_KEY)
}

type UnauthorizedHandler = () => void
let unauthorizedHandler: UnauthorizedHandler | null = null
/** AuthContext registers this so a dead refresh forces a logout → Login. */
export function onUnauthorized(handler: UnauthorizedHandler) {
  unauthorizedHandler = handler
}

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

type RetryableConfig = AxiosRequestConfig & { _retry?: boolean; _skipAuthRefresh?: boolean }

const AUTH_PATHS = ['/auth/login', '/auth/signup', '/auth/refresh', '/auth/forgot-password', '/auth/reset-password']
const isAuthPath = (url = '') => AUTH_PATHS.some((p) => url.includes(p))

let isRefreshing = false
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = []

function processQueue(error: unknown, token = '') {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)))
  failedQueue = []
}

async function refreshTokens(): Promise<string> {
  const refresh = await getRefreshToken()
  if (!refresh) throw new Error('No refresh token')
  // Bypass interceptors so a 401 here doesn't recurse.
  const res = await axios.post<{ token: string; refreshToken: string }>(
    `${API_URL}/auth/refresh`,
    { refreshToken: refresh },
    { timeout: 15000, headers: { 'Content-Type': 'application/json' } },
  )
  await setAccessToken(res.data.token)
  await setRefreshToken(res.data.refreshToken)
  return res.data.token
}

api.interceptors.request.use(async (config) => {
  const token = await getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as RetryableConfig | undefined
    const status = error.response?.status
    if (status !== 401 || !original || original._retry || original._skipAuthRefresh || isAuthPath(original.url)) {
      return Promise.reject(error)
    }
    original._retry = true

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            original.headers = { ...original.headers, Authorization: `Bearer ${token}` }
            resolve(api(original))
          },
          reject,
        })
      })
    }

    isRefreshing = true
    try {
      const newToken = await refreshTokens()
      processQueue(null, newToken)
      original.headers = { ...original.headers, Authorization: `Bearer ${newToken}` }
      return api(original)
    } catch (refreshError) {
      processQueue(refreshError, '')
      await clearTokens().catch(() => undefined)
      unauthorizedHandler?.()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

export function apiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.') {
  if (axios.isAxiosError(error)) {
    if (!error.response) return 'Can\u2019t reach the server. Check your internet connection and try again.'
    const serverError = error.response.data?.error
    if (typeof serverError === 'string' && serverError.trim()) return serverError
    switch (error.response.status) {
      case 400: return 'Something wasn\u2019t right. Please check your entries and try again.'
      case 401: return 'Your session has expired. Please log in again.'
      case 403: return 'You don\u2019t have permission to do that.'
      case 404: return 'We couldn\u2019t find what you asked for.'
      case 410: return 'That feature is no longer available.'
      default: return 'Something went wrong on our side. Please try again later.'
    }
  }
  if (error instanceof Error && error.message) return error.message
  return fallback
}
