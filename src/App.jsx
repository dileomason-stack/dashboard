import ReactGridLayout, { bottom, useContainerWidth } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import AddWidgetMenu from './AddWidgetMenu.jsx'
import WidgetFrame from './WidgetFrame.jsx'
import { removeKey, useStoredState, widgetDataKey } from './storage.js'
import { DEFAULT_DASHBOARD, WIDGETS } from './widgets/registry.js'

const COLS = 12
const ROW_HEIGHT = 40
const MARGIN = 12
// Below this width the 12-column grid gets too cramped, so widgets stack.
const STACK_BELOW = 700

// Bumped when widget sizes change so old saved layouts don't squash widgets.
// To-do items are stored separately, so they survive the bump.
const STORAGE_KEY = 'dashboard:v2'
removeKey('dashboard:v1')

const isDashboard = (value) =>
  value && Array.isArray(value.widgets) && Array.isArray(value.layout)

function newWidgetId(type) {
  const random =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `${type}-${random}`
}

// Keep only the fields worth saving, so the stored layout stays small.
const pickPosition = ({ i, x, y, w, h }) => ({ i, x, y, w, h })

export default function App() {
  const [dashboard, setDashboard] = useStoredState(STORAGE_KEY, DEFAULT_DASHBOARD, isDashboard)
  const { width, containerRef, mounted } = useContainerWidth()

  // Ignore widgets whose type no longer exists (e.g. saved by an older version).
  const widgets = dashboard.widgets.filter((widget) => WIDGETS[widget.type])

  // Build the grid layout: saved position + the widget type's min size.
  // A widget with no saved position is placed at the bottom.
  const layout = []
  for (const widget of widgets) {
    const { minW, minH, w, h } = WIDGETS[widget.type].size
    const saved = dashboard.layout.find((item) => item.i === widget.id)
    const position = saved ?? { i: widget.id, x: 0, y: bottom(layout), w, h }
    // Never smaller than the widget's minimum, even if an old save says so.
    layout.push({
      ...position,
      w: Math.max(position.w, minW),
      h: Math.max(position.h, minH),
      minW,
      minH,
    })
  }

  function handleLayoutChange(newLayout) {
    const positions = newLayout.map(pickPosition)
    setDashboard((current) =>
      JSON.stringify(current.layout) === JSON.stringify(positions)
        ? current
        : { ...current, layout: positions },
    )
  }

  function addWidget(type) {
    const id = newWidgetId(type)
    const { w, h } = WIDGETS[type].size
    setDashboard((current) => ({
      widgets: [...current.widgets, { id, type }],
      layout: [...current.layout, { i: id, x: 0, y: bottom(current.layout), w, h }],
    }))
  }

  function removeWidget(id) {
    removeKey(widgetDataKey(id))
    setDashboard((current) => ({
      widgets: current.widgets.filter((widget) => widget.id !== id),
      layout: current.layout.filter((item) => item.i !== id),
    }))
  }

  function resetLayout() {
    if (!window.confirm('Reset your dashboard to the default layout? Widgets you added will be removed.')) {
      return
    }
    const keep = new Set(DEFAULT_DASHBOARD.widgets.map((widget) => widget.id))
    for (const widget of dashboard.widgets) {
      if (!keep.has(widget.id)) removeKey(widgetDataKey(widget.id))
    }
    setDashboard(DEFAULT_DASHBOARD)
  }

  function renderWidget(widget) {
    const { tab, component: Component } = WIDGETS[widget.type]
    return (
      <WidgetFrame tab={tab} onRemove={() => removeWidget(widget.id)}>
        <Component id={widget.id} />
      </WidgetFrame>
    )
  }

  const stacked = width < STACK_BELOW
  // Stacked view follows the grid's reading order: top to bottom, left to right.
  const stackOrder = [...layout].sort((a, b) => a.y - b.y || a.x - b.x)

  return (
    <div className="app">
      <header className="toolbar">
        <h1>Dashboard</h1>
        <div className="toolbar-actions">
          <AddWidgetMenu onAdd={addWidget} />
          <button type="button" onClick={resetLayout}>
            Reset layout
          </button>
        </div>
      </header>

      <main ref={containerRef}>
        {widgets.length === 0 ? (
          <div className="empty-dashboard">
            <h2>Your dashboard is empty</h2>
            <p>Use “+ Add widget” above to add one, or reset to the default layout.</p>
          </div>
        ) : !mounted ? null : stacked ? (
          <div className="stack">
            {stackOrder.map((item) => (
              <div key={item.i} style={{ height: item.h * ROW_HEIGHT + (item.h - 1) * MARGIN }}>
                {renderWidget(widgets.find((widget) => widget.id === item.i))}
              </div>
            ))}
          </div>
        ) : (
          <ReactGridLayout
            width={width}
            layout={layout}
            gridConfig={{ cols: COLS, rowHeight: ROW_HEIGHT, margin: [MARGIN, MARGIN] }}
            dragConfig={{ handle: '.widget-chrome', cancel: '.widget-remove, .address-link' }}
            onLayoutChange={handleLayoutChange}
          >
            {widgets.map((widget) => (
              <div key={widget.id}>{renderWidget(widget)}</div>
            ))}
          </ReactGridLayout>
        )}
      </main>
    </div>
  )
}
