import { Fragment } from 'react'
import { Group, Panel, Separator } from 'react-resizable-panels'

// Give every widget its saved share of the column (in %), splitting any
// missing share evenly, then scale so the shares add up to 100.
function sharesFor(ids, saved) {
  const known = ids.filter((id) => saved[id] > 0)
  const knownTotal = known.reduce((sum, id) => sum + saved[id], 0)
  const fallback = known.length ? knownTotal / known.length : 100 / ids.length
  const raw = ids.map((id) => (saved[id] > 0 ? saved[id] : fallback))
  const total = raw.reduce((sum, value) => sum + value, 0)
  return Object.fromEntries(ids.map((id, index) => [id, (raw[index] / total) * 100]))
}

// The collapsible column on the left: widgets stacked top to bottom, with a
// draggable divider between each pair.
export default function Sidebar({ widgets, sizes, onSizesChange, renderWidget, stacked }) {
  if (widgets.length === 0) {
    return (
      <div className="empty-area sidebar-empty">
        <p>Nothing in the sidebar. Add a widget here with “+ Add widget”, or move one over with ⇄.</p>
      </div>
    )
  }

  if (stacked) {
    return (
      <div className="stack">
        {widgets.map((widget) => (
          <div key={widget.id} className="stack-sidebar-item">
            {renderWidget(widget)}
          </div>
        ))}
      </div>
    )
  }

  const ids = widgets.map((widget) => widget.id)
  return (
    <Group
      // Remount when the list of widgets changes so the new sizes apply.
      key={ids.join('|')}
      orientation="vertical"
      className="sidebar-group"
      defaultLayout={sharesFor(ids, sizes)}
      onLayoutChanged={(layout, meta) => {
        if (meta?.isUserInteraction) onSizesChange(layout)
      }}
    >
      {widgets.map((widget, index) => (
        <Fragment key={widget.id}>
          {index > 0 && <Separator className="resize-handle horizontal" />}
          <Panel id={widget.id} minSize={90} className="sidebar-panel">
            {renderWidget(widget)}
          </Panel>
        </Fragment>
      ))}
    </Group>
  )
}
