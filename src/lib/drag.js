// Pressing on these never starts dragging a card, so buttons, links, text
// boxes, checkboxes and embedded players keep working normally.
export const NOT_DRAGGABLE =
  'input, textarea, select, button, a, label, iframe, [contenteditable], .react-resizable-handle, .no-drag'

// Our own sidebar card drags carry this type; links from other tabs don't.
export const CARD_TYPE = 'application/x-homeroom-card'

export const isCardDrag = (dataTransfer) => [...(dataTransfer?.types ?? [])].includes(CARD_TYPE)

export function isLinkDrag(dataTransfer) {
  const types = [...(dataTransfer?.types ?? [])]
  return !types.includes(CARD_TYPE) && (types.includes('text/uri-list') || types.includes('text/plain'))
}

// The first web link in a drop (from the address bar, a link, or dragged text).
export function droppedLink(dataTransfer) {
  if (!isLinkDrag(dataTransfer)) return null
  const uriList = (dataTransfer.getData('text/uri-list') ?? '').split('\n').find((line) => line && !line.startsWith('#'))
  const text = (uriList || dataTransfer.getData('text/plain') || '').trim()
  return /^https?:\/\/\S+$/i.test(text) ? text : null
}
