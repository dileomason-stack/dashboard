import { useSyncExternalStore } from 'react'
import { readJSON, writeJSON } from '../storage.js'
import { showToast } from './toast.js'

// Sites that can't run inside a card (Gmail, Claude, Docs editing, a Canvas
// assignment, a news article) open "beside" the dashboard: in a window on the
// right half of the screen, so the dashboard stays visible. The same window
// is reused when the browser allows it; sites that isolate their windows
// (Gmail and other Google sites do) get a fresh one in the same spot.
// People can switch to plain new tabs instead.

const MODE_KEY = 'dashboard:openMode'
const SIDE_WINDOW = 'homeroom-side'

let mode = readJSON(MODE_KEY, 'side') === 'tab' ? 'tab' : 'side'
const listeners = new Set()

export function setOpenMode(next) {
  mode = next === 'tab' ? 'tab' : 'side'
  writeJSON(MODE_KEY, mode)
  listeners.forEach((listener) => listener())
}

export function useOpenMode() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => mode,
  )
}

export const openModeLabel = (current) => (current === 'side' ? 'Opens beside' : 'Opens in a new tab')

function openInNewTab(url) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

// A full-screen browser window can't have another window beside it (macOS
// gives each new window its own full-screen space), so there we use a tab.
function isFullScreen() {
  return !!document.fullscreenElement || (window.outerWidth >= screen.width && window.outerHeight >= screen.height)
}

let fullScreenTipShown = false

export function openExternal(url) {
  if (mode === 'tab') return openInNewTab(url)
  if (isFullScreen()) {
    if (!fullScreenTipShown) {
      fullScreenTipShown = true
      showToast(
        'You’re in full screen, so this opened in a tab. Tip: right-click that tab → “Add tab to split view” to keep your dashboard beside it.',
        10000,
      )
    }
    return openInNewTab(url)
  }

  const { availWidth, availHeight } = window.screen
  const availLeft = window.screen.availLeft ?? 0
  const availTop = window.screen.availTop ?? 0
  const width = Math.round(availWidth / 2)
  const features = `popup=yes,width=${width},height=${availHeight},left=${availLeft + availWidth - width},top=${availTop}`

  // Reuse the side window if the browser still lets us reach it; otherwise
  // this creates a new one in the same place. Opening a blank page first lets
  // us cut the link back to the dashboard (window.opener) before the other
  // site loads.
  const side = window.open('', SIDE_WINDOW, features)
  if (!side) return openInNewTab(url) // popup blocked
  try {
    side.opener = null
  } catch {
    // Already showing another site: it can't reach us anyway.
  }
  side.location.href = url
  side.focus()
}

// Ordinary links (target="_blank") anywhere in the dashboard follow the same
// rule. Cmd/Ctrl/Shift/middle clicks are left alone so people can still
// choose where a link opens.
export function routeLinksBeside() {
  const onClick = (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    const link = event.target.closest?.('a[target="_blank"]')
    if (!link || !/^https?:/.test(link.href)) return
    event.preventDefault()
    openExternal(link.href)
  }
  document.addEventListener('click', onClick)
  return () => document.removeEventListener('click', onClick)
}
