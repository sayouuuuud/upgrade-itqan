"use client"

import { useCallback, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'itqan:sidebar-collapsed'
const EVENT_NAME = 'itqan:sidebar-collapsed-change'

function readStorage(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function writeStorage(value: boolean) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? '1' : '0')
  } catch {
    /* ignore */
  }
  // Broadcast to other useSidebarCollapsed instances in the same tab.
  window.dispatchEvent(new Event(EVENT_NAME))
}

function subscribe(onChange: () => void) {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(EVENT_NAME, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(EVENT_NAME, onChange)
    window.removeEventListener('storage', onChange)
  }
}

/**
 * Persists the collapse state of the main dashboard sidebar so it survives
 * navigation between pages and full reloads.
 *
 * Uses `useSyncExternalStore` to safely hydrate from localStorage without
 * triggering a cascading render in `useEffect`.
 */
export function useSidebarCollapsed() {
  const collapsed = useSyncExternalStore(
    subscribe,
    readStorage,
    () => false,
  )

  const setCollapsed = useCallback((next: boolean) => {
    writeStorage(next)
  }, [])

  const toggle = useCallback(() => {
    writeStorage(!readStorage())
  }, [])

  return { collapsed, setCollapsed, toggle }
}
