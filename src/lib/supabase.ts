import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { AppState } from 'react-native'
import { createClient } from '@supabase/supabase-js'

// TODO: move these to env config and rotate the committed anon key.
const supabaseUrl = 'https://vqnsjmwbwkcjjdwpvgbf.supabase.co'
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxbnNqbXdid2tjampkd3B2Z2JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2NjAwMTYsImV4cCI6MjA5NTIzNjAxNn0.Zj5ka11908klcC1tYiwDRSnPBzb9Bl-oyampDxieB88'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // URL-based session detection is web-only; off for React Native.
    detectSessionInUrl: false,
  },
})

// Keep the access token fresh while the app is in the foreground, and stop
// refreshing in the background (per the Supabase React Native guide).
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh()
  } else {
    supabase.auth.stopAutoRefresh()
  }
})
