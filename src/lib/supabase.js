// ============================================================
// SUPABASE DATABASE
// Setup for database connection
// ============================================================

import { createClient } from '@supabase/supabase-js'

// Get URL and key from environment, with real values as fallback
// (so the app also works on hosted builds like Vercel, where .env is not available)
const URL = import.meta.env.VITE_SUPABASE_URL || 'https://ocsteejxosurtciyotxl.supabase.co'
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_c-I4FH2iyFK8S4B-LkLLyA_gTIS2gk0'

// Create and export the database client
export const supabase = createClient(URL, KEY)

// Export the URL and key so other files can use them (e.g. AI chat service)
export const SUPABASE_URL = URL
export const SUPABASE_ANON_KEY = KEY
