// Sites that can't run inside a card (Gmail, Claude, Docs editing, a Canvas
// assignment, a news article) open in a new tab, so the dashboard stays put.
export function openExternal(url) {
  window.open(url, '_blank', 'noopener,noreferrer')
}
