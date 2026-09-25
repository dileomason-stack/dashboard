import { useCallback, useRef, useState } from 'react'
import ContextMenu from './ContextMenu.jsx'

// A collapsed card: just its icon and name. Click to open it back up;
// right-click for its menu. It can still be dragged, so a
// press that moves more than a few pixels is a drag, not a click.
export default function CollapsedCard({ widgetId, title, Icon, onExpand, menuItems, onDragStart, onDragEnd }) {
  const [menu, setMenu] = useState(null)
  const closeMenu = useCallback(() => setMenu(null), [])
  const pressedAt = useRef(null)

  function openMenuAt(event) {
    event.preventDefault()
    setMenu({ x: event.clientX, y: event.clientY })
  }

  function handleClick(event) {
    const start = pressedAt.current
    if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > 4) return
    onExpand()
  }

  return (
    <div className="collapsed-slot" data-widget-id={widgetId}>
      <div
        className="collapsed-card"
        role="button"
        tabIndex={0}
        title={`Open ${title}`}
        aria-label={`Open ${title}`}
        onMouseDown={(event) => (pressedAt.current = { x: event.clientX, y: event.clientY })}
        onClick={handleClick}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onExpand()
          }
        }}
        onContextMenu={openMenuAt}
        draggable={Boolean(onDragStart)}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        {Icon && <Icon />}
        <span>{title}</span>
      </div>
      {menu && <ContextMenu x={menu.x} y={menu.y} items={menuItems()} onClose={closeMenu} />}
    </div>
  )
}
