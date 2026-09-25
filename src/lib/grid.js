// A fine grid (48 columns, 8px rows) so moving and resizing feel free-form
// rather than snapping between a few big slots. The gap between cards is
// padding inside each cell (see .grid-cell), so a row is exactly 8px.
export const ROW_HEIGHT = 8
export const COLS = 48
export const GAP = 4

// Layouts saved before the fine grid used 12 columns and 40px rows with 12px
// gaps (52px per row). Convert them so cards keep their size and place.
export function upgradeGrid(grid) {
  const rows = (units) => Math.round((units * 52) / ROW_HEIGHT)
  return grid.map(({ i, x, y, w, h }) => ({ i, x: x * 4, y: rows(y), w: w * 4, h: rows(h) }))
}

const overlaps = (a, b) =>
  a.i !== b.i && a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h

// How cards settle in the workspace. The grid library's own "no compacting"
// mode lets cards land on top of each other, so this replaces it:
// - the card being dragged or resized (see setActive) stays exactly where it is,
// - any card it overlaps is pushed straight down until it's clear,
// - every other card keeps its place (nothing slides up to fill gaps).
// Pushes are worked out from where cards were when the drag started, so a card
// the dragged one only passed over springs back once it's clear again.
export function createPushDownCompactor() {
  let activeId = null
  let startPositions = null
  // While the dragged card is outside the grid (over the sidebar), it doesn't
  // push anything: every other card goes back to where it started.
  let activeOutside = false
  return {
    type: null,
    // We resolve overlaps ourselves in compact().
    allowOverlap: true,
    setOutside(outside) {
      activeOutside = outside
    },
    setActive(id, layout) {
      activeId = id
      activeOutside = false
      startPositions = id && layout ? new Map(layout.map((item) => [item.i, { x: item.x, y: item.y }])) : null
    },
    compact(layout) {
      const active = layout.find((item) => item.i === activeId)
      const placed = active && !activeOutside ? [{ ...active }] : []
      const rest = layout
        .filter((item) => item !== active)
        .map((item) => ({ ...item, ...(startPositions?.get(item.i) ?? {}) }))
        .sort((a, b) => a.y - b.y || a.x - b.x)
      for (const item of rest) {
        const next = { ...item }
        let hit
        while ((hit = placed.find((other) => overlaps(other, next)))) next.y = hit.y + hit.h
        placed.push(next)
      }
      return layout.map((item) => placed.find((other) => other.i === item.i) ?? item)
    },
  }
}
