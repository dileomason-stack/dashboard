import ReactGridLayout, { bottom, useContainerWidth } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { WIDGETS } from './widgets/registry.js'

export const ROW_HEIGHT = 40
const COLS = 12
const MARGIN = 12

// Saved position + the widget type's min size. A widget with no saved
// position goes at the bottom, and nothing is ever smaller than its minimum.
function buildLayout(widgets, grid) {
  const layout = []
  for (const widget of widgets) {
    const { minW, minH, w, h } = WIDGETS[widget.type].size
    const saved = grid.find((item) => item.i === widget.id)
    const position = saved ?? { i: widget.id, x: 0, y: bottom(layout), w, h }
    layout.push({
      ...position,
      w: Math.max(position.w, minW),
      h: Math.max(position.h, minH),
      minW,
      minH,
    })
  }
  return layout
}

// Keep only the fields worth saving.
const pickPosition = ({ i, x, y, w, h }) => ({ i, x, y, w, h })

// The open area next to the sidebar: a free grid where widgets can be
// dragged by their ⠿ grip (or tab bar on phones) and resized from the
// bottom-right corner.
export default function Workspace({ widgets, grid, onGridChange, onAddWidget, showStarter, renderWidget, stacked }) {
  const { width, containerRef, mounted } = useContainerWidth()
  const layout = buildLayout(widgets, grid)

  function handleLayoutChange(newLayout) {
    const positions = newLayout.map(pickPosition)
    if (JSON.stringify(positions) !== JSON.stringify(grid)) onGridChange(positions)
  }

  if (widgets.length === 0) {
    return (
      <div className="workspace" ref={containerRef}>
        {showStarter ? (
          <div className="empty-area starter">
            <h2>Start building your dashboard</h2>
            <p>Click a widget to add it. Drag it by its ⠿ grip, resize it from the corner, and right-click for more.</p>
            <div className="starter-grid">
              {Object.entries(WIDGETS).map(([type, widget]) => {
                const Icon = widget.tab.icon
                return (
                  <button key={type} type="button" className="starter-button" onClick={() => onAddWidget(type)}>
                    <Icon />
                    <strong>{widget.title}</strong>
                    <span>{widget.description}</span>
                  </button>
                )
              })}
            </div>
            <p className="setup-note">Want a sidebar? Use “+ Add widget” and choose Sidebar.</p>
          </div>
        ) : (
          <div className="empty-area">
            <h2>This space is yours</h2>
            <p>Use “+ Add widget” to put something here, or move a card over from the sidebar (right-click → Move to workspace).</p>
          </div>
        )}
      </div>
    )
  }

  if (stacked) {
    // Narrow screens: one column in reading order (top to bottom, left to right).
    const ordered = [...layout].sort((a, b) => a.y - b.y || a.x - b.x)
    return (
      <div className="workspace stack" ref={containerRef}>
        {ordered.map((item) => (
          <div key={item.i} style={{ height: item.h * ROW_HEIGHT + (item.h - 1) * MARGIN }}>
            {renderWidget(widgets.find((widget) => widget.id === item.i))}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="workspace" ref={containerRef}>
      {mounted && (
        <ReactGridLayout
          width={width}
          layout={layout}
          gridConfig={{ cols: COLS, rowHeight: ROW_HEIGHT, margin: [MARGIN, MARGIN] }}
          dragConfig={{ handle: '.grid-drag-handle', cancel: '.widget-control' }}
          onLayoutChange={handleLayoutChange}
        >
          {widgets.map((widget) => (
            <div key={widget.id}>{renderWidget(widget)}</div>
          ))}
        </ReactGridLayout>
      )}
    </div>
  )
}
