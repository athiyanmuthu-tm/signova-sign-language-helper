// ============================================================
// SUPABASE DATABASE
// Setup for database connection
// ============================================================

import { createClient } from '@supabase/supabase-js'

// Get URL and key from environment
const URL = import.meta.env.VITE_SUPABASE_URL || ''
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Create and export the database client
export const supabase = createClient(URL, KEY)
