import { Fragment, useState } from 'react'
import { Group, Panel, Separator } from 'react-resizable-panels'
import { WIDGETS } from './widgets/registry.js'

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
// draggable divider between each pair. Cards can be dragged to a new position
// by grabbing any empty spot on them.
export default function Sidebar({ widgets, sizes, onSizesChange, onReorder, renderWidget, stacked }) {
  const [dragId, setDragId] = useState(null)
  const [dropTarget, setDropTarget] = useState(null)

  const dragPropsFor = (id) => ({
    onDragStart: (event) => {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', id)
      const card = event.currentTarget.closest('.card')
      const rect = card.getBoundingClientRect()
      event.dataTransfer.setDragImage(card, event.clientX - rect.left, event.clientY - rect.top)
      // Changing the page during dragstart can cancel the drag in Chrome.
      setTimeout(() => setDragId(id))
    },
    onDragEnd: () => {
      setDragId(null)
      setDropTarget(null)
    },
  })

  const dropPropsFor = (id) => ({
    onDragOver: (event) => {
      if (!dragId) return
      event.preventDefault()
      const rect = event.currentTarget.getBoundingClientRect()
      const after = event.clientY > rect.top + rect.height / 2
      if (dropTarget?.id !== id || dropTarget.after !== after) setDropTarget({ id, after })
    },
    onDrop: (event) => {
      event.preventDefault()
      if (dragId && dragId !== id) onReorder(dragId, id, dropTarget?.after ?? false)
      setDragId(null)
      setDropTarget(null)
    },
  })

  const dropClass = (id) =>
    dropTarget?.id === id && dragId !== id ? (dropTarget.after ? ' drop-after' : ' drop-before') : ''

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
            {renderWidget(widget, {})}
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
      className={`sidebar-group${dragId ? ' dragging' : ''}`}
      defaultLayout={sharesFor(ids, sizes)}
      onLayoutChanged={(layout, meta) => {
        if (meta?.isUserInteraction) onSizesChange(layout)
      }}
    >
      {widgets.map((widget, index) => (
        <Fragment key={widget.id}>
          {index > 0 && <Separator className="resize-handle horizontal" />}
          <Panel
            id={widget.id}
            minSize={WIDGETS[widget.type].sidebarHeight ?? 70}
            maxSize={WIDGETS[widget.type].sidebarHeight}
            className={`sidebar-panel${dropClass(widget.id)}`}
          >
            <div className="drop-zone" {...dropPropsFor(widget.id)}>
              {renderWidget(widget, dragPropsFor(widget.id))}
            </div>
          </Panel>
        </Fragment>
      ))}
    </Group>
  )
}
