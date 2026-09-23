import { useSyncExternalStore } from 'react'

// Small messages that pop up at the bottom of the screen and fade on their own.
let current = null
let timer = null
const listeners = new Set()
const notify = () => listeners.forEach((listener) => listener())

export function showToast(text, ms = 6000) {
  current = { text, id: Date.now() }
  clearTimeout(timer)
  timer = setTimeout(() => {
    current = null
    notify()
  }, ms)
  notify()
}

export function hideToast() {
  current = null
  notify()
}

export function useToast() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => current,
  )
}
