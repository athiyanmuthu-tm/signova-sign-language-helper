// Custom username/password auth — no email required, no Supabase Auth.
// Passwords are hashed with PBKDF2 (via Web Crypto API) + random salt.
// Session is stored in localStorage as { username, userId }.

import { useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { login as syncProgress, setUser, setId } from '../lib/progress.jsx'
import { AuthCtx } from './authContext'

// Key used to store session data in browser's localStorage
const SESSION_KEY = 'ss-session'

// Generate a random 16-byte salt for password hashing
// Returns a hex string (each byte converted to 2 hex characters)
function randomSalt() {
  return crypto.getRandomValues(new Uint8Array(16)).reduce((s, b) => s + b.toString(16).padStart(2, '0'), '')
}

// Hash a password using PBKDF2 algorithm with SHA-256
// Returns a hex string hash that can be safely stored in the database
async function hashPassword(password, salt) {
  const enc = new TextEncoder()
  // Import the password as key material for PBKDF2
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  // Derive 256 bits using PBKDF2 with 100,000 iterations (secure against brute force)
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(salt), iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256,
  )
  // Convert bytes to hex string
  return Array.from(new Uint8Array(bits)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

// Load the current session from localStorage
// Returns { username, userId } or null if no session exists
function loadSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || null } catch { return null }
}

// Save session to localStorage
// Pass null to clear the session (logout)
function saveSession(session) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  else localStorage.removeItem(SESSION_KEY)
}

// Restore session on page load
// If a valid session exists, set the user and sync data from database
const _initSession = loadSession()
if (_initSession?.username && _initSession?.userId) {
  setUser(_initSession.username)
  setId(_initSession.userId)
   syncProgress().catch(() => {})
}

// AuthProvider component: wraps the app and provides auth context
// Manages user state and provides login/register/logout functions
function AuthProvider({ children }) {
  const [user, setUserState] = useState(_initSession?.username || null)
  const [ready] = useState(true)

  // Login: verify username and password against database
  // Throws error if credentials are invalid
  const login = async (username, password) => {
    const name = username.trim().toLowerCase()
    // Fetch user from database
    const { data: row, error: fetchError } = await supabase
      .from('users').select('user_id, password_hash, salt').eq('username', name).maybeSingle()
    if (fetchError) throw new Error('Login failed')
    if (!row) throw new Error('Account not found — try registering first')
    // Hash the provided password with the stored salt and compare
    const hash = await hashPassword(password, row.salt)
    if (hash !== row.password_hash) throw new Error('Wrong password')
    // Save session and update state
    const session = { username: name, userId: row.user_id }
    saveSession(session)
    setUserState(name)
    setUser(name)
    setId(row.user_id)
    syncProgress().catch(() => {})
  }

  // Register: create a new user account
  // Throws error if username is already taken
  const register = async (username, password) => {
    const name = username.trim().toLowerCase()
    // Check if username already exists
    const { data: existing } = await supabase
      .from('users').select('user_id').eq('username', name).maybeSingle()
    if (existing) throw new Error('Username already taken')
    // Hash password with new random salt
    const salt = randomSalt()
    const hash = await hashPassword(password, salt)
    // Insert new user into database
    const { data: row, error: insertError } = await supabase
      .from('users').insert({ username: name, password_hash: hash, salt }).select('user_id').single()
    if (insertError) throw new Error('Registration failed')
    if (!row) throw new Error('Registration failed')
    // Save session and update state
    const session = { username: name, userId: row.user_id }
    saveSession(session)
    setUserState(name)
    setUser(name)
    setId(row.user_id)
    syncProgress().catch(() => {})
  }

  // Logout: clear session and user state
  const logout = async () => {
    saveSession(null)
    setUser(null)
    setId(null)
    setUserState(null)
  }

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({ user, ready, login, register, logout }), [user, ready])
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

// Export the AuthProvider component
export { AuthProvider }
