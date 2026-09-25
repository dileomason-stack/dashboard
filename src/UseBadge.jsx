
// What a card does, so no click surprises anyone:
// ▶ Use here (works fully in the card), 👁 Preview (see it here, act in the
// real app), ↗ New tab (a one-click shortcut to an app that can't run
// inside other websites).
const TEXT = {
  live: ['▶ Use here', 'Works fully right here in the card'],
  preview: ['👁 Preview', 'See it here at a glance; click an item to open it in the real app'],
}

// compact: just the symbol (the full label is in its tooltip).
export default function UseBadge({ use, compact }) {
  if (!use) return null
  const [label, help] =
    use === 'jump'
      ? ['↗ New tab', 'This app can’t run inside other websites, so it opens in a new tab in one click']
      : TEXT[use]
  return (
    <span className={`use-badge use-${use}${compact ? ' compact' : ''}`} title={compact ? `${label}: ${help}` : help}>
      {compact ? label.split(' ')[0] : label}
    </span>
  )
}
