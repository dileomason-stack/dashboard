import { useEffect, useRef, useState } from 'react'

// Keyboard control for built-in games. Clicking inside the game "arms" it:
// from then on arrow keys / WASD / space go to the game (and don't scroll the
// page) until you click somewhere else. This works even though clicking a
// button inside the game moves keyboard focus around.
export function useGameKeys(onKey, { keys }) {
  const rootRef = useRef(null)
  const [active, setActive] = useState(false)
  const onKeyRef = useRef(onKey)

  useEffect(() => {
    onKeyRef.current = onKey
  })

  useEffect(() => {
    const onPointerDown = (event) => setActive(!!rootRef.current?.contains(event.target))
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
  }, [])

  useEffect(() => {
    if (!active) return
    const onKeyDown = (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (event.target.closest?.('input, textarea, [contenteditable]')) return
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
      if (!keys.includes(key)) return
      event.preventDefault()
      onKeyRef.current(key)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [active, keys])

  return { rootRef, active, setActive }
}

export const ARROW_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd']
