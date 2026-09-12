// ============================================================
// PROGRESS TRACKER
// Saves practice data to browser storage and cloud
// ============================================================

import { supabase } from './supabase.js'

// Key for storing data in browser
const STORAGE_KEY = 'ss-progress-'

// Maximum number of attempts to keep
const MAX_ATTEMPTS = 3000

// Functions to call when data changes
const listeners = []

// Current user info
let currentUser = null
let currentUserId = null

// Should we save to cloud?
let shouldSyncToCloud = false

// Timer for saving to cloud
let saveTimer = null

// ----------------------------------------------------------
// Get today's date as string
// ----------------------------------------------------------
function getTodayDate() {
  const now = new Date()
  return now.toISOString().slice(0, 10)
}

// ----------------------------------------------------------
// Create empty progress object
// ----------------------------------------------------------
function createEmptyProgress() {
  return {
    mastered: {},
    attempts: [],
    days: {},
    totalMs: 0
  }
}

// ----------------------------------------------------------
// Load progress from browser storage
// ----------------------------------------------------------
function loadFromBrowser() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY + currentUser)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    // Ignore errors
  }
  return createEmptyProgress()
}

// Current progress data
let progress = createEmptyProgress()

// Load on startup (browser only)
if (typeof window !== 'undefined') {
  progress = loadFromBrowser()
}

// ----------------------------------------------------------
// Save progress to browser storage
// ----------------------------------------------------------
function saveToBrowser() {
  progress.updatedAt = Date.now()
  try {
    const key = STORAGE_KEY + currentUser
    localStorage.setItem(key, JSON.stringify(progress))
  } catch (error) {
    // Ignore errors
  }
}

// ----------------------------------------------------------
// Tell all listeners that data changed
// ----------------------------------------------------------
function notifyListeners() {
  listeners.forEach(function(callback) {
    callback(progress)
  })
}

// ----------------------------------------------------------
// Schedule saving to cloud (waits 2 seconds)
// ----------------------------------------------------------
function scheduleCloudSave() {
  // Only save if user is logged in
  if (!shouldSyncToCloud) {
    return
  }
  
  // Cancel previous timer
  if (saveTimer) {
    clearTimeout(saveTimer)
  }
  
  // Save after 2 seconds
  saveTimer = setTimeout(saveToCloud, 2000)
}

// ----------------------------------------------------------
// Save progress to cloud (Supabase)
// ----------------------------------------------------------
async function saveToCloud() {
  // Check if we should sync
  if (!shouldSyncToCloud || !currentUserId) {
    return
  }
  
  try {
    await supabase.from('progress').upsert({
      user_id: currentUserId,
      username: currentUser,
      data: progress
    })
  } catch (error) {
    // Ignore errors
  }
}

// ----------------------------------------------------------
// Merge cloud data with local data
// ----------------------------------------------------------
function mergeCloudData(cloud) {
  // Merge mastered signs
  if (cloud.mastered) {
    Object.entries(cloud.mastered).forEach(function(entry) {
      const signId = entry[0]
      const timestamp = entry[1]
      if (!progress.mastered[signId] || timestamp < progress.mastered[signId]) {
        progress.mastered[signId] = timestamp
      }
    })
  }
  
  // Add all attempts
  if (cloud.attempts) {
    cloud.attempts.forEach(function(attempt) {
      progress.attempts.push(attempt)
    })
  }
  
  // Sort by time
  progress.attempts.sort(function(a, b) {
    return a.ts - b.ts
  })
  
  // Merge daily stats
  if (cloud.days) {
    Object.entries(cloud.days).forEach(function(entry) {
      const day = entry[0]
      const info = entry[1]
      
      if (!progress.days[day]) {
        progress.days[day] = { events: 0, best: 0 }
      }
      
      progress.days[day].events = Math.max(progress.days[day].events, info.events || 0)
      progress.days[day].best = Math.max(progress.days[day].best, info.best || 0)
    })
  }
  
  // Keep longer practice time
  if (cloud.totalMs && cloud.totalMs > progress.totalMs) {
    progress.totalMs = cloud.totalMs
  }
  
  saveToBrowser()
  notifyListeners()
}

// ============================================================
// PUBLIC FUNCTIONS
// ============================================================

// Get current progress
export function get() {
  return progress
}

// Listen for changes
export function onChange(callback) {
  listeners.push(callback)
  return function unsubscribe() {
    const index = listeners.indexOf(callback)
    if (index > -1) {
      listeners.splice(index, 1)
    }
  }
}

// Record a practice attempt
export function addAttempt(signId, score) {
  // Add to attempts list
  const attempt = {
    signId: signId,
    score: score,
    ts: Date.now()
  }
  progress.attempts.push(attempt)
  
  // Remove old attempts if too many
  if (progress.attempts.length > MAX_ATTEMPTS) {
    progress.attempts.shift()
  }
  
  // Update today's stats
  const today = getTodayDate()
  if (!progress.days[today]) {
    progress.days[today] = { events: 0, best: 0 }
  }
  progress.days[today].events = progress.days[today].events + 1
  if (score > progress.days[today].best) {
    progress.days[today].best = score
  }
  
  // Save and notify
  saveToBrowser()
  notifyListeners()
  scheduleCloudSave()
}

// Mark a sign as mastered
export function master(signId) {
  if (!progress.mastered[signId]) {
    progress.mastered[signId] = Date.now()
    saveToBrowser()
    notifyListeners()
    scheduleCloudSave()
  }
}

// Add practice time
export function addTime(ms) {
  progress.totalMs = progress.totalMs + ms
  saveToBrowser()
  scheduleCloudSave()
}

// Sync after login
export async function login() {
  shouldSyncToCloud = true
  
  try {
    // Get cloud progress
    const result = await supabase.from('progress')
      .select('data')
      .eq('user_id', currentUserId)
      .maybeSingle()
    
    // Merge with local
    if (result.data && result.data.data) {
      mergeCloudData(result.data.data)
    }
    
    // Push to cloud
    await saveToCloud()
  } catch (error) {
    // Ignore errors
  }
}

// Set current user
export function setUser(name) {
  // Convert name to lowercase
  currentUser = name ? name.toLowerCase() : null
  
  // Load progress for this user
  progress = createEmptyProgress()
  if (typeof window !== 'undefined') {
    progress = loadFromBrowser()
  }
  
  // Enable cloud sync only for logged in users
  shouldSyncToCloud = Boolean(currentUser)
  
  // Clear save timer
  if (saveTimer) {
    clearTimeout(saveTimer)
    saveTimer = null
  }
  
  // Notify listeners
  notifyListeners()
  
  // Start syncing if logged in
  if (shouldSyncToCloud) {
    scheduleCloudSave()
  }
}

// Set user ID
export function setId(id) {
  currentUserId = id
}
