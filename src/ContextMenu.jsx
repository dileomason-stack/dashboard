import { useEffect, useLayoutEffect, useRef, useState } from 'react'

// A small menu shown at a screen position (right-click, double-click, or the
// ⋯ button). Closes on outside click, Escape, scroll, or window resize.
export default function ContextMenu({ x, y, items, onClose }) {
  const menuRef = useRef(null)
  const [position, setPosition] = useState({ left: x, top: y })

  // Keep the menu on screen near the edges.
  useLayoutEffect(() => {
    const rect = menuRef.current.getBoundingClientRect()
    setPosition({
      left: Math.max(8, Math.min(x, window.innerWidth - rect.width - 8)),
      top: Math.max(8, Math.min(y, window.innerHeight - rect.height - 8)),
    })
  }, [x, y])

  useEffect(() => {
    menuRef.current.querySelector('button')?.focus()
    const close = () => onClose()
    const onPointer = (event) => !menuRef.current?.contains(event.target) && onClose()
    const onKey = (event) => event.key === 'Escape' && onClose()
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', close)
    window.addEventListener('scroll', close, true)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', close)
      window.removeEventListener('scroll', close, true)
    }
  }, [onClose])

  return (
    <div ref={menuRef} className="context-menu" role="menu" style={position}>
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          role="menuitem"
          className={item.danger ? 'danger' : undefined}
          onClick={() => {
            onClose()
            item.onSelect()
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
