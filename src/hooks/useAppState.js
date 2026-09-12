// Hook for managing app-level state (current tab/page and practice seed).
// This allows components to navigate between pages and share state without prop drilling.

import { useCallback, useState } from 'react'

// useAppState: custom hook that manages:
// - tab: which page is currently active (home, learn, practice, translate, etc.)
// - seed: which sign is selected for practice (if any)
// Returns an object with the current state and functions to update it
function useAppState() {
  const [tab, setTab] = useState('home')  // Start on home page
  const [seed, setSeed] = useState(null)  // No sign selected initially

  // practiceSeed: navigate to practice page with a specific sign selected
  // Used when user clicks a sign in the dashboard or learn page
  const practiceSeed = useCallback((id) => {
    setSeed(id || null)  // Set the sign to practice
    setTab('practice')   // Switch to practice page
  }, [])

  // Return all state and functions for the component to use
  return { tab, setTab, seed, practiceSeed }
}

// Export the hook
export { useAppState }
