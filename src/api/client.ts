import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api'
export const TOKEN_KEY = 'mycareplus_access_token'

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) await SecureStore.deleteItemAsync(TOKEN_KEY)
    return Promise.reject(error)
  },
)

export function apiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.') {
  if (axios.isAxiosError(error)) return error.response?.data?.error ?? fallback
  return fallback
}
