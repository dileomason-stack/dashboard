import { useCallback, useState } from 'react'
import ContextMenu from './ContextMenu.jsx'

// Sidebar widgets are plain cards: no tab bar or address bar. Options live in
// a menu opened by right-click, double-click, or the ⋯ button that appears on
// hover. The ⠿ grip drags the card to a new spot in the sidebar.
//
// Clicks inside embedded players (Spotify, Google Calendar) go to that site,
// not to us, which is why the hover handle exists.
export default function SidebarCard({ type, title, menuItems, onDragStart, onDragEnd, children }) {
  const [menu, setMenu] = useState(null)
  const closeMenu = useCallback(() => setMenu(null), [])

  function openMenuAt(event) {
    event.preventDefault()
    setMenu({ x: event.clientX, y: event.clientY })
  }

  function handleDoubleClick(event) {
    // Leave double-click alone where it already means something.
    if (event.target.closest('button, a, input, textarea, label, select')) return
    openMenuAt(event)
  }

  return (
    <section
      className={`card card-${type}`}
      aria-label={title}
      onContextMenu={openMenuAt}
      onDoubleClick={handleDoubleClick}
    >
      <div className="card-handle">
        <span
          className="card-grip"
          draggable
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          title="Drag to reorder"
          aria-hidden="true"
        >
          ⠿
        </span>
        <button
          type="button"
          className="card-menu-button"
          aria-label={`${title} options`}
          aria-haspopup="menu"
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect()
            setMenu({ x: rect.right - 180, y: rect.bottom + 4 })
          }}
        >
          ⋯
        </button>
      </div>
      <div className="card-body">{children}</div>
      {menu && <ContextMenu x={menu.x} y={menu.y} items={menuItems} onClose={closeMenu} />}
    </section>
  )
}
