import { useEffect, useState } from 'react'
import { Group, Panel, Separator } from 'react-resizable-panels'
import AddWidgetMenu from './AddWidgetMenu.jsx'
import ColorPicker from './ColorPicker.jsx'
import Dock from './Dock.jsx'
import { EXAMPLE_PERSON } from './example.js'
import { bottom } from 'react-grid-layout'
import { COLS, upgradeGrid } from './lib/grid.js'
import { newId } from './lib/id.js'
import Sidebar from './Sidebar.jsx'
import { useStore, useStoreValue, widgetDataKey } from './storage.js'
import WidgetCard from './WidgetCard.jsx'
import WidgetFrame from './WidgetFrame.jsx'
import { OWN_DEFAULT_LAYOUT, tabOf, WIDGETS } from './widgets/registry.js'
import Workspace from './Workspace.jsx'

// Below this width the page switches to a single scrolling column.
const STACK_BELOW = 700

const isLayout = (value) =>
  value &&
  Array.isArray(value.sidebar) &&
  Array.isArray(value.workspace) &&
  Array.isArray(value.grid) &&
  value.sidebarSizes &&
  typeof value.sidebarSizes === 'object'

function useWindowWidth() {
  const [width, setWidth] = useState(() => window.innerWidth)
  useEffect(() => {
    const update = () => setWidth(window.innerWidth)
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return width
}

const known = (widget) => WIDGETS[widget.type]

// A new workspace widget goes where it was asked for (right-click → Add here),
// or at the bottom of the grid, at its default size.
function newGridItem(type, id, grid, at) {
  const { w, h } = WIDGETS[type].size
  if (at) return { i: id, x: Math.max(0, Math.min(at.x, COLS - w)), y: Math.max(0, at.y), w, h }
  return { i: id, x: 0, y: bottom(grid), w, h }
}

export default function Dashboard({ layoutKey, tabs, hasOwn, onBuildOwn, onViewExample, onResetExample }) {
  const store = useStore()
  const [layout, setLayout] = useStoreValue(layoutKey, OWN_DEFAULT_LAYOUT, isLayout)
  const [maximizedId, setMaximizedId] = useState(null)
  // The "Colors" picker: where it's open, and whether it colors the sidebar
  // or every card on this dashboard.
  const [colorsPicker, setColorsPicker] = useState(null)
  const [colorScope, setColorScope] = useState('sidebar')
  // The card just added: scrolled into view and briefly highlighted.
  const [newestId, setNewestId] = useState(null)
  const stacked = useWindowWidth() < STACK_BELOW

  // Minimized cards keep their place in the sidebar/workspace lists (and their
  // grid position) but are shown only in the dock until restored.
  const minimized = new Set(Array.isArray(layout.minimized) ? layout.minimized : [])
  const visible = (widget) => known(widget) && !minimized.has(widget.id)
  const sidebarWidgets = layout.sidebar.filter(visible)
  const workspaceWidgets = layout.workspace.filter(visible)
  const dockWidgets = [...layout.sidebar, ...layout.workspace].filter((widget) => known(widget) && minimized.has(widget.id))
  const visibleGrid = layout.grid.filter((item) => !minimized.has(item.i))
  const maximized = [...sidebarWidgets, ...workspaceWidgets].find((widget) => widget.id === maximizedId)

  // Layouts saved before the fine grid get converted once.
  useEffect(() => {
    if (layout.gridVersion !== 2) {
      setLayout((current) => ({ ...current, grid: upgradeGrid(current.grid), gridVersion: 2 }))
    }
  }, [layout.gridVersion, setLayout])

  useEffect(() => {
    if (!maximizedId) return
    const onKey = (event) => event.key === 'Escape' && setMaximizedId(null)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [maximizedId])

  // Scroll a newly added card into view, then let its glow fade.
  useEffect(() => {
    if (!newestId) return
    const frame = requestAnimationFrame(() =>
      document.querySelector(`[data-widget-id="${newestId}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }),
    )
    const timer = setTimeout(() => setNewestId(null), 1800)
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(timer)
    }
  }, [newestId])

  const update = (changes) => setLayout((current) => ({ ...current, ...changes(current) }))

  // `at` is a grid position ({ x, y }) from right-click → "Add … here".
  function addWidget(type, area, at) {
    const id = `${type}-${newId()}`
    update((current) =>
      area === 'sidebar'
        ? { sidebar: [...current.sidebar, { id, type }], sidebarOpen: true }
        : {
            workspace: [...current.workspace, { id, type }],
            grid: [...current.grid, newGridItem(type, id, current.grid, at)],
          },
    )
    setNewestId(id)
  }

  function minimizeWidget(id) {
    if (maximizedId === id) setMaximizedId(null)
    update((current) => ({ minimized: [...new Set([...(current.minimized ?? []), id])] }))
  }

  function restoreWidget(id) {
    update((current) => ({ minimized: (current.minimized ?? []).filter((item) => item !== id) }))
    setNewestId(id)
  }

  function removeWidget(id) {
    store.remove(widgetDataKey(id))
    store.remove(`style:${id}`)
    if (maximizedId === id) setMaximizedId(null)
    update((current) => ({
      sidebar: current.sidebar.filter((widget) => widget.id !== id),
      workspace: current.workspace.filter((widget) => widget.id !== id),
      grid: current.grid.filter((item) => item.i !== id),
      minimized: (current.minimized ?? []).filter((item) => item !== id),
    }))
  }

  function moveWidget(id) {
    update((current) => {
      const inSidebar = current.sidebar.find((widget) => widget.id === id)
      if (inSidebar) {
        return {
          sidebar: current.sidebar.filter((widget) => widget.id !== id),
          workspace: [...current.workspace, inSidebar],
          grid: [...current.grid.filter((item) => item.i !== id), newGridItem(inSidebar.type, id, current.grid)],
        }
      }
      const inWorkspace = current.workspace.find((widget) => widget.id === id)
      return {
        workspace: current.workspace.filter((widget) => widget.id !== id),
        grid: current.grid.filter((item) => item.i !== id),
        sidebar: [...current.sidebar, inWorkspace],
        sidebarOpen: true,
      }
    })
  }

  function reorderSidebar(fromId, toId, after) {
    update((current) => {
      const moving = current.sidebar.find((widget) => widget.id === fromId)
      const rest = current.sidebar.filter((widget) => widget.id !== fromId)
      const index = rest.findIndex((widget) => widget.id === toId) + (after ? 1 : 0)
      return { sidebar: [...rest.slice(0, index), moving, ...rest.slice(index)] }
    })
  }

  const tabFor = (widget) => tabOf(widget, store.get(widgetDataKey(widget.id)))

  function menuItemsFor(widget, area, isMaximized) {
    const { editLabel } = WIDGETS[widget.type]
    const tab = tabFor(widget)
    return [
      editLabel && { label: editLabel, onSelect: () => store.set(widgetDataKey(widget.id), {}) },
      tab.href && {
        label: `Open ${tab.address}`,
        onSelect: () => window.open(tab.href, '_blank', 'noopener,noreferrer'),
      },
      isMaximized
        ? { label: 'Exit full screen', onSelect: () => setMaximizedId(null) }
        : { label: 'Full screen', onSelect: () => setMaximizedId(widget.id) },
      { label: 'Minimize to dock', onSelect: () => minimizeWidget(widget.id) },
      !isMaximized && {
        label: area === 'sidebar' ? 'Move to workspace' : 'Move to sidebar',
        onSelect: () => moveWidget(widget.id),
      },
      { label: 'Remove', danger: true, onSelect: () => removeWidget(widget.id) },
    ].filter(Boolean)
  }

  function resetLayout() {
    if (store.example) {
      onResetExample()
      return
    }
    if (!window.confirm('Clear this dashboard? All its widgets and what’s in them (to-dos, links) will be removed.')) return
    for (const widget of [...layout.sidebar, ...layout.workspace]) {
      store.remove(widgetDataKey(widget.id))
      store.remove(`style:${widget.id}`)
    }
    setMaximizedId(null)
    setLayout(OWN_DEFAULT_LAYOUT)
  }

  // "Colors": give many cards the same background at once (the sidebar's, or
  // every card on this dashboard). Cards the Spotify player covers are
  // skipped. Each card can still be recolored on its own afterwards.
  const colorableIn = (scope) =>
    (scope === 'sidebar' ? sidebarWidgets : [...sidebarWidgets, ...workspaceWidgets]).filter(
      (widget) => WIDGETS[widget.type].colorable !== false,
    )

  function colorCards(scope, color) {
    for (const widget of colorableIn(scope)) {
      if (color) store.set(`style:${widget.id}`, { background: color })
      else store.remove(`style:${widget.id}`)
    }
  }

  // Each card gets its app's own color (Sleeper navy, ESPN red, ...); cards
  // without one go back to the default.
  function appColorCards(scope) {
    for (const widget of colorableIn(scope)) {
      const brand = WIDGETS[widget.type].brandColor
      if (brand) store.set(`style:${widget.id}`, { background: brand })
      else store.remove(`style:${widget.id}`)
    }
  }

  // The color those cards share, if they all have the same one.
  function sharedColor(scope) {
    const colors = colorableIn(scope).map((widget) => store.get(`style:${widget.id}`)?.background ?? null)
    return colors.length && colors.every((color) => color === colors[0]) ? colors[0] : null
  }

  // For "Match Spotify playlist": the first Spotify widget with a playlist.
  function getSpotifyEmbedUrl() {
    const spotify = [...layout.sidebar, ...layout.workspace].find((widget) => widget.type === 'spotify')
    return spotify ? (store.get(widgetDataKey(spotify.id))?.url ?? null) : null
  }

  function renderWidget(widget, area, dragProps = {}) {
    const { component: Component } = WIDGETS[widget.type]
    const tab = tabFor(widget)
    const isMaximized = maximizedId === widget.id
    // Phones get the browser-window frame, whose buttons are always visible
    // (no hover or right-click there). Everywhere else widgets are cards.
    if (!stacked) {
      return (
        <WidgetCard
          widgetId={widget.id}
          type={widget.type}
          title={tab.title}
          // A function, so the menu reflects the card's latest settings
          // (e.g. which tool it shows) each time it opens.
          menuItems={() => menuItemsFor(widget, area, isMaximized)}
          colorable={WIDGETS[widget.type].colorable !== false}
          getSpotifyEmbedUrl={getSpotifyEmbedUrl}
          appColor={WIDGETS[widget.type].brandColor}
          highlight={widget.id === newestId}
          {...(area === 'sidebar' && !isMaximized ? dragProps : {})}
        >
          <Component id={widget.id} />
        </WidgetCard>
      )
    }
    return (
      <WidgetFrame
        tab={tab}
        maximized={isMaximized}
        moveLabel={area === 'sidebar' ? 'Move to workspace' : 'Move to sidebar'}
        onMove={() => moveWidget(widget.id)}
        onMaximize={() => setMaximizedId(isMaximized ? null : widget.id)}
        onRemove={() => removeWidget(widget.id)}
      >
        <Component id={widget.id} />
      </WidgetFrame>
    )
  }

  // While a widget is full screen, its normal spot shows a placeholder so the
  // widget isn't on the page twice.
  const renderSlot = (area) => (widget, dragProps) =>
    widget.id === maximizedId ? (
      <div className="maximized-placeholder">Showing full screen</div>
    ) : (
      renderWidget(widget, area, dragProps)
    )

  const sidebar = (
    <Sidebar
      widgets={sidebarWidgets}
      sizes={layout.sidebarSizes}
      onSizesChange={(sizes) => update(() => ({ sidebarSizes: sizes }))}
      onReorder={reorderSidebar}
      renderWidget={renderSlot('sidebar')}
      stacked={stacked}
    />
  )
  const workspace = (
    <Workspace
      widgets={workspaceWidgets}
      grid={visibleGrid}
      // Keep minimized cards' saved positions when the visible ones move.
      onGridChange={(grid) => update((current) => ({ grid: [...grid, ...current.grid.filter((item) => minimized.has(item.i))] }))}
      onAddWidget={(type, at) => addWidget(type, 'workspace', at)}
      showStarter={sidebarWidgets.length === 0 && dockWidgets.length === 0}
      renderWidget={renderSlot('workspace')}
      stacked={stacked}
    />
  )

  return (
    <div className={`app${layout.theme === 'dark' ? ' theme-dark' : ''}`}>
      <header className="toolbar">
        <div className="toolbar-start">
          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => update((current) => ({ sidebarOpen: !current.sidebarOpen }))}
            aria-pressed={layout.sidebarOpen}
            title={layout.sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          >
            <span aria-hidden="true">◧</span> {layout.sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          </button>
          {sidebarWidgets.length + workspaceWidgets.length > 0 && !stacked && (
            <button
              type="button"
              onClick={(event) => {
                const rect = event.currentTarget.getBoundingClientRect()
                setColorScope(layout.sidebarOpen && sidebarWidgets.length > 0 ? 'sidebar' : 'all')
                setColorsPicker({ x: rect.left, y: rect.bottom + 6 })
              }}
              title="Color many cards at once"
            >
              🎨 Colors
            </button>
          )}
          <h1>OnlyOneScreen</h1>
          {tabs}
        </div>
        <div className="toolbar-actions">
          <AddWidgetMenu onAdd={addWidget} />
          <button type="button" onClick={resetLayout}>
            {store.example ? 'Reset' : 'Clear all'}
          </button>
          {!store.example && (
            <button type="button" className="link-button" onClick={onViewExample}>
              View example
            </button>
          )}
        </div>
      </header>

      {store.example && (
        <div className="example-banner" role="note">
          <div className="example-banner-text">
            <p>
              <strong>👋 This is a sample dashboard</strong> for {EXAMPLE_PERSON}, a fictional Cal Poly student. It all
              resets when you reload.
            </p>
            <ul className="example-tips" aria-label="Things to try">
              <li>Switch dashboards with the tabs above</li>
              <li>Drag any card to move it</li>
              <li>Right-click a card for options</li>
              <li>🎨 Colors → Match Spotify</li>
              <li>Search Google right in its card</li>
            </ul>
          </div>
          <button type="button" className="primary" onClick={onBuildOwn}>
            {hasOwn ? 'Back to my dashboard →' : 'Build your own →'}
          </button>
        </div>
      )}

      <main className="main">
        {stacked ? (
          <div className="stacked-page">
            {layout.sidebarOpen && sidebar}
            {workspace}
          </div>
        ) : layout.sidebarOpen ? (
          <Group
            orientation="horizontal"
            className="main-group"
            defaultLayout={{ sidebar: layout.sidebarSize, workspace: 100 - layout.sidebarSize }}
            onLayoutChanged={(sizes, meta) => {
              if (meta?.isUserInteraction && sizes.sidebar) update(() => ({ sidebarSize: sizes.sidebar }))
            }}
          >
            {/* Dragging the edge past the minimum snaps the sidebar closed. */}
            <Panel
              id="sidebar"
              minSize={200}
              maxSize="65%"
              collapsible
              collapsedSize={0}
              onResize={(size) => {
                if (size.inPixels === 0) update(() => ({ sidebarOpen: false }))
              }}
              className="sidebar"
            >
              {sidebar}
            </Panel>
            <Separator className="resize-handle vertical" />
            <Panel id="workspace" className="workspace-panel">
              {workspace}
            </Panel>
          </Group>
        ) : (
          <div className="workspace-panel full">{workspace}</div>
        )}
      </main>

      <Dock widgets={dockWidgets} tabFor={tabFor} onRestore={restoreWidget} />

      {colorsPicker && (
        <ColorPicker
          title="Colors"
          x={colorsPicker.x}
          y={colorsPicker.y}
          value={sharedColor(colorScope)}
          spotifyEmbedUrl={getSpotifyEmbedUrl()}
          onChange={(color) => colorCards(colorScope, color)}
          onAppColors={() => appColorCards(colorScope)}
          onClose={() => setColorsPicker(null)}
        >
          <div className="segmented-tabs" role="radiogroup" aria-label="Dashboard background">
            {[
              [undefined, '☀️ Normal'],
              ['dark', '🌙 Dark'],
            ].map(([theme, label]) => (
              <button
                key={label}
                type="button"
                role="radio"
                aria-checked={layout.theme === theme}
                className={layout.theme === theme ? 'active' : undefined}
                onClick={() => update(() => ({ theme }))}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="segmented-tabs" role="radiogroup" aria-label="Which cards">
            {[
              ['sidebar', 'Sidebar'],
              ['all', 'Whole dashboard'],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={colorScope === key}
                className={colorScope === key ? 'active' : undefined}
                onClick={() => setColorScope(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </ColorPicker>
      )}

      {maximized && (
        <div className="maximized-layer" onClick={(event) => event.target === event.currentTarget && setMaximizedId(null)}>
          <div className="maximized-window">
            {renderWidget(maximized, sidebarWidgets.includes(maximized) ? 'sidebar' : 'workspace')}
          </div>
        </div>
      )}
    </div>
  )
}
