import axios from 'axios'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://127.0.0.1:3000/api'
export const TOKEN_KEY = 'mycareplus_access_token'

export async function getAccessToken() {
  return Platform.OS === 'web' ? globalThis.localStorage?.getItem(TOKEN_KEY) ?? null : SecureStore.getItemAsync(TOKEN_KEY)
}

export async function setAccessToken(token: string) {
  if (Platform.OS === 'web') globalThis.localStorage?.setItem(TOKEN_KEY, token)
  else await SecureStore.setItemAsync(TOKEN_KEY, token)
}

export async function clearAccessToken() {
  if (Platform.OS === 'web') globalThis.localStorage?.removeItem(TOKEN_KEY)
  else await SecureStore.deleteItemAsync(TOKEN_KEY)
}

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(async (config) => {
  const token = await getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) await clearAccessToken()
    return Promise.reject(error)
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
