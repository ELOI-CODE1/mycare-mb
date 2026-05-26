import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vqnsjmwbwkcjjdwpvgbf.supabase.co'  
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxbnNqbXdid2tjampkd3B2Z2JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2NjAwMTYsImV4cCI6MjA5NTIzNjAxNn0.Zj5ka11908klcC1tYiwDRSnPBzb9Bl-oyampDxieB88'  

export const supabase = createClient(supabaseUrl, supabaseAnonKey)