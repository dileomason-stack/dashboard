import { createContext, useCallback, useContext, useSyncExternalStore } from 'react'

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

// A small key-value store holding the dashboard layout and every widget's
// data. The example dashboard uses a memory-only store seeded with Alex's
// data, so it resets on reload. "Build your own" uses a store that also saves
// to localStorage under `prefix`.
export function createStore({ prefix = null, seed = {}, example = false } = {}) {
  const memory = new Map(Object.entries(seed))
  const listeners = new Set()
  const notify = () => listeners.forEach((listener) => listener())

  return {
    example,
    get(key) {
      if (!memory.has(key) && prefix) memory.set(key, readJSON(prefix + key, undefined))
      return memory.get(key)
    },
    set(key, value) {
      memory.set(key, value)
      if (prefix) writeJSON(prefix + key, value)
      notify()
    },
    remove(key) {
      memory.set(key, undefined)
      if (prefix) removeKey(prefix + key)
      notify()
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

export const StoreContext = createContext(null)

export function useStore() {
  return useContext(StoreContext)
}

// Like useState, but the value lives in the dashboard's store. `validate`
// rejects stored data with the wrong shape so corrupted data can't crash a
// widget; the fallback is used instead.
export function useStoreValue(key, fallback, validate) {
  const store = useStore()
  const raw = useSyncExternalStore(store.subscribe, () => store.get(key))
  const valid = raw !== undefined && (!validate || validate(raw))
  const value = valid ? raw : fallback

  const setValue = useCallback(
    (next) => {
      const current = store.get(key)
      const base = current !== undefined && (!validate || validate(current)) ? current : fallback
      store.set(key, typeof next === 'function' ? next(base) : next)
    },
    // Callers pass module-level fallback/validate, so these rarely change.
    [store, key, fallback, validate],
  )

  return [value, setValue]
}

export function widgetDataKey(widgetId) {
  return `widget:${widgetId}`
}
