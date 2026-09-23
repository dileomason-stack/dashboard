import { useCallback, useState } from 'react'
import ContextMenu from './ContextMenu.jsx'
import { TEMPLATES } from './templates.js'
import { MAX_NAME_LENGTH } from './useDashboards.js'

// Tabs for switching dashboards. + offers templates for a new one (and then
// starts renaming it);
// double-click a tab to rename; right-click for Rename / Delete.
// `editingId` lives in the parent: switching dashboards rebuilds the page
// (tabs included), and a new dashboard must still open with its name ready
// to edit.
export default function DashboardTabs({ dashboards, editingId, setEditingId }) {
  const { list, active, select, create, rename, remove } = dashboards
  const [menu, setMenu] = useState(null)
  const closeMenu = useCallback(() => setMenu(null), [])

  function commit(event) {
    rename(editingId, event.target.value)
    setEditingId(null)
  }

  function confirmRemove(item) {
    if (window.confirm(`Delete “${item.name}” and everything on it?`)) remove(item.id)
  }

  return (
    <nav className="dash-tabs" aria-label="Dashboards">
      {list.map((item) =>
        item.id === editingId ? (
          <input
            key={item.id}
            className="dash-tab-input"
            defaultValue={item.name}
            maxLength={MAX_NAME_LENGTH}
            aria-label="Dashboard name"
            autoFocus
            onFocus={(event) => event.target.select()}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.target.blur()
              if (event.key === 'Escape') setEditingId(null)
            }}
          />
        ) : (
          <button
            key={item.id}
            type="button"
            className={`dash-tab${item.id === active.id ? ' active' : ''}`}
            aria-current={item.id === active.id ? 'page' : undefined}
            title="Double-click to rename · Right-click for options"
            onClick={() => select(item.id)}
            onDoubleClick={() => setEditingId(item.id)}
            onContextMenu={(event) => {
              event.preventDefault()
              setMenu({ x: event.clientX, y: event.clientY, item })
            }}
          >
            {item.name}
          </button>
        ),
      )}
      <button
        type="button"
        className="dash-tab-add"
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect()
          setMenu({ x: rect.left, y: rect.bottom + 4, templates: true })
        }}
        title="New dashboard"
        aria-label="New dashboard"
      >
        +
      </button>
      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          onClose={closeMenu}
          items={
            menu.templates
              ? Object.entries(TEMPLATES).map(([key, template]) => ({
                  label: template.label,
                  onSelect: () => setEditingId(create(key)),
                }))
              : [
                  { label: 'Rename', onSelect: () => setEditingId(menu.item.id) },
                  list.length > 1 && {
                    label: 'Delete dashboard',
                    danger: true,
                    onSelect: () => confirmRemove(menu.item),
                  },
                ].filter(Boolean)
          }
        />
      )}
    </nav>
  )
}
