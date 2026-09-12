// Authentication context: provides user state to all components.
// Uses React Context API to share auth data without prop drilling.

import { createContext, useContext } from 'react'

// Create a context object with default value null
// Components can use this context to access auth state
const AuthCtx = createContext(null)

// Custom hook to easily access auth context from any component
// Usage: const { user, login, logout } = useAuth()
function useAuth() {
  return useContext(AuthCtx)
}

// Export both the context and the hook
export { useAuth }
export { AuthCtx }
