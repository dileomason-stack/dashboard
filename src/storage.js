import { useEffect, useState } from 'react'

// localStorage can throw (private windows, blocked storage), so every access
// is wrapped and falls back to a default instead of crashing the page.

export function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage unavailable: the dashboard still works, it just won't persist.
  }
}

export function removeKey(key) {
  try {
    localStorage.removeItem(key)
  } catch {
    // Nothing to clean up if storage is unavailable.
  }
}

// useState that is saved to localStorage under `key`. `validate` rejects
// stored data with the wrong shape so a corrupted value can't break the app.
export function useStoredState(key, fallback, validate) {
  const [value, setValue] = useState(() => {
    const stored = readJSON(key, fallback)
    return validate && !validate(stored) ? fallback : stored
  })

  useEffect(() => {
    writeJSON(key, value)
  }, [key, value])

  return [value, setValue]
}

export function widgetDataKey(widgetId) {
  return `dashboard:widget:${widgetId}`
}
