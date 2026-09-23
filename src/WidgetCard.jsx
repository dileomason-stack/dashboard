import { useCallback, useState } from 'react'
import ColorPicker from './ColorPicker.jsx'
import ContextMenu from './ContextMenu.jsx'
import { isDark, isValidHex } from './lib/colors.js'
import { useStoreValue } from './storage.js'

const NO_STYLE = {}
const isStyle = (value) => value && typeof value === 'object'

// Widgets are plain cards: no tab bar or address bar. Options live in a menu
// opened by right-click, double-click, or the ⋯ button that appears on hover.
// The ⠿ grip moves the card: in the sidebar it's an HTML drag (reorder); in
// the workspace the grid library uses it as its drag handle.
//
// Clicks inside embedded players (Spotify, Google Calendar) go to that site,
// not to us, which is why the hover handle exists.
//
// With `colorable`, the menu has "Card color…" and the chosen background is
// saved under style:<widgetId>.
export default function WidgetCard({
  widgetId,
  type,
  title,
  menuItems,
  colorable,
  getSpotifyEmbedUrl,
  gridHandle,
  onDragStart,
  onDragEnd,
  children,
}) {
  const [menu, setMenu] = useState(null)
  const [picker, setPicker] = useState(null)
  const [style, setStyle] = useStoreValue(`style:${widgetId}`, NO_STYLE, isStyle)
  const closeMenu = useCallback(() => setMenu(null), [])
  const closePicker = useCallback(() => setPicker(null), [])

  const color = isValidHex(style.background) ? style.background : null
  const items = colorable
    ? [{ label: 'Card color…', onSelect: () => setPicker(menu) }, ...menuItems]
    : menuItems

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
      className={`card card-${type}${color ? (isDark(color) ? ' card-colored card-dark' : ' card-colored card-light') : ''}`}
      style={color ? { '--card-bg': color } : undefined}
      aria-label={title}
      onContextMenu={openMenuAt}
      onDoubleClick={handleDoubleClick}
    >
      <div className="card-handle">
        <span
          className={`card-grip${gridHandle ? ' grid-drag-handle' : ''}`}
          draggable={!gridHandle && !!onDragStart}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          title={gridHandle ? 'Drag to move' : 'Drag to reorder'}
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
      {menu && <ContextMenu x={menu.x} y={menu.y} items={items} onClose={closeMenu} />}
      {picker && (
        <ColorPicker
          x={picker.x}
          y={picker.y}
          value={color}
          spotifyEmbedUrl={getSpotifyEmbedUrl()}
          onChange={(next) => setStyle(next ? { background: next } : {})}
          onClose={closePicker}
        />
      )}
    </section>
  )
}
