import { useSyncExternalStore } from 'react'
import { getAuthSession } from './storage'

// 1. Setup the subscription for storage changes
function subscribe(callback: () => void): () => void {
  window.addEventListener('storage', callback)
  return () => window.removeEventListener('storage', callback)
}

// 2. Define how to get the current state
function getSnapshot() {
  return !!getAuthSession()
}

// 3. The Hook
export function useIsAuthenticated(): boolean {
  // RULE: No 'if' statements before this line!
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
