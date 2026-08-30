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
    if (!error.response) return `Network error while contacting ${API_URL}: ${error.message}${error.code ? ` [${error.code}]` : ''}. Check that the backend is running and the API URL is correct.`
    const serverError = error.response.data?.error
    return serverError ? `${serverError} (HTTP ${error.response.status})` : `Request failed (HTTP ${error.response.status})`
  }
  if (error instanceof Error && error.message) return error.message
  return fallback
}
