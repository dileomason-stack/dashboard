import { useEffect, useState } from 'react'
import { Group, Panel, Separator } from 'react-resizable-panels'
import AddWidgetMenu from './AddWidgetMenu.jsx'
import { EXAMPLE_PERSON } from './example.js'
import { bottom } from 'react-grid-layout'
import { newId } from './lib/id.js'
import Sidebar from './Sidebar.jsx'
import SidebarCard from './SidebarCard.jsx'
import { useStore, useStoreValue, widgetDataKey } from './storage.js'
import WidgetFrame from './WidgetFrame.jsx'
import { OWN_DEFAULT_LAYOUT, WIDGETS } from './widgets/registry.js'
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

// A new workspace widget goes at the bottom of the grid at its default size.
function newGridItem(type, id, grid) {
  const { w, h } = WIDGETS[type].size
  return { i: id, x: 0, y: bottom(grid), w, h }
}

export default function Dashboard({ hasOwn, onBuildOwn, onViewExample, onResetExample }) {
  const store = useStore()
  const [layout, setLayout] = useStoreValue('layout', OWN_DEFAULT_LAYOUT, isLayout)
  const [maximizedId, setMaximizedId] = useState(null)
  const stacked = useWindowWidth() < STACK_BELOW

  const sidebarWidgets = layout.sidebar.filter(known)
  const sidebarMinWidth = Math.max(240, ...sidebarWidgets.map((widget) => WIDGETS[widget.type].sidebarMinWidth ?? 0))
  const workspaceWidgets = layout.workspace.filter(known)
  const maximized = [...sidebarWidgets, ...workspaceWidgets].find((widget) => widget.id === maximizedId)

  useEffect(() => {
    if (!maximizedId) return
    const onKey = (event) => event.key === 'Escape' && setMaximizedId(null)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [maximizedId])

  const update = (changes) => setLayout((current) => ({ ...current, ...changes(current) }))

  function addWidget(type, area) {
    const id = `${type}-${newId()}`
    update((current) =>
      area === 'sidebar'
        ? { sidebar: [...current.sidebar, { id, type }], sidebarOpen: true }
        : { workspace: [...current.workspace, { id, type }], grid: [...current.grid, newGridItem(type, id, current.grid)] },
    )
  }

  function removeWidget(id) {
    store.remove(widgetDataKey(id))
    store.remove(`style:${id}`)
    if (maximizedId === id) setMaximizedId(null)
    update((current) => ({
      sidebar: current.sidebar.filter((widget) => widget.id !== id),
      workspace: current.workspace.filter((widget) => widget.id !== id),
      grid: current.grid.filter((item) => item.i !== id),
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

  function menuItemsFor(widget) {
    const { editLabel, tab } = WIDGETS[widget.type]
    return [
      editLabel && { label: editLabel, onSelect: () => store.set(widgetDataKey(widget.id), {}) },
      tab.href && {
        label: `Open ${tab.address}`,
        onSelect: () => window.open(tab.href, '_blank', 'noopener,noreferrer'),
      },
      { label: 'Full screen', onSelect: () => setMaximizedId(widget.id) },
      { label: 'Move to workspace', onSelect: () => moveWidget(widget.id) },
      { label: 'Remove', danger: true, onSelect: () => removeWidget(widget.id) },
    ].filter(Boolean)
  }

  function resetLayout() {
    if (store.example) {
      onResetExample()
      return
    }
    if (!window.confirm('Reset your dashboard to the starting layout? Widgets you added will be removed.')) return
    const keep = new Set([...OWN_DEFAULT_LAYOUT.sidebar, ...OWN_DEFAULT_LAYOUT.workspace].map((widget) => widget.id))
    for (const widget of [...layout.sidebar, ...layout.workspace]) {
      if (!keep.has(widget.id)) {
        store.remove(widgetDataKey(widget.id))
        store.remove(`style:${widget.id}`)
      }
    }
    setMaximizedId(null)
    setLayout(OWN_DEFAULT_LAYOUT)
  }

  // For "Match Spotify playlist": the first Spotify widget with a playlist.
  function getSpotifyEmbedUrl() {
    const spotify = [...layout.sidebar, ...layout.workspace].find((widget) => widget.type === 'spotify')
    return spotify ? (store.get(widgetDataKey(spotify.id))?.url ?? null) : null
  }

  function renderWidget(widget, area, dragProps = {}) {
    const { tab, component: Component } = WIDGETS[widget.type]
    const isMaximized = maximizedId === widget.id
    if (area === 'sidebar' && !isMaximized && !stacked) {
      return (
        <SidebarCard
          widgetId={widget.id}
          type={widget.type}
          title={tab.title}
          menuItems={menuItemsFor(widget)}
          colorable={WIDGETS[widget.type].colorable !== false}
          getSpotifyEmbedUrl={getSpotifyEmbedUrl}
          {...dragProps}
        >
          <Component id={widget.id} />
        </SidebarCard>
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
      grid={layout.grid}
      onGridChange={(grid) => update(() => ({ grid }))}
      renderWidget={renderSlot('workspace')}
      stacked={stacked}
    />
  )

  return (
    <div className="app">
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
          <h1>Dashboard</h1>
        </div>
        <div className="toolbar-actions">
          <AddWidgetMenu onAdd={addWidget} />
          <button type="button" onClick={resetLayout}>
            Reset
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
          <p>
            <strong>👋 This is a sample dashboard</strong> for {EXAMPLE_PERSON}, a fictional Cal Poly student. Try
            anything: it all resets when you reload.
          </p>
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
            <Panel id="sidebar" minSize={sidebarMinWidth} maxSize="65%" className="sidebar">
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
