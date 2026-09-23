import { useEffect, useRef, useState } from 'react'
import UseBadge from './UseBadge.jsx'
import { WIDGETS } from './widgets/registry.js'

export default function AddWidgetMenu({ onAdd }) {
  const [open, setOpen] = useState(false)
  const [area, setArea] = useState('workspace')
  const menuRef = useRef(null)

  // Close when clicking anywhere else or pressing Escape.
  useEffect(() => {
    if (!open) return
    function handleClick(event) {
      if (!menuRef.current?.contains(event.target)) setOpen(false)
    }
    function handleKey(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  return (
    <div className="add-menu" ref={menuRef}>
      <button
        type="button"
        className="primary"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        + Add widget
      </button>
      {open && (
        <div className="add-menu-list">
          <div className="segmented" role="radiogroup" aria-label="Add to">
            <span>Add to</span>
            {[
              ['sidebar', 'Sidebar'],
              ['workspace', 'Workspace'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={area === value}
                className={area === value ? 'selected' : undefined}
                onClick={() => setArea(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <ul role="menu">
          {Object.entries(WIDGETS).map(([type, widget]) => (
            <li key={type}>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onAdd(type, area)
                  setOpen(false)
                }}
              >
                <strong>
                  {widget.title} <UseBadge use={widget.use} />
                </strong>
                <span>{widget.description}</span>
              </button>
            </li>
          ))}
          </ul>
        </div>
      )}
    </div>
  )
}
