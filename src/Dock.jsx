// Minimized cards wait here as small pills (like a computer's dock or
// taskbar). Clicking one puts the card back exactly where it was.
export default function Dock({ widgets, tabFor, onRestore }) {
  if (widgets.length === 0) return null
  return (
    <nav className="dock" aria-label="Minimized widgets">
      {widgets.map((widget) => {
        const tab = tabFor(widget)
        const Icon = tab.icon
        return (
          <button
            key={widget.id}
            type="button"
            className="dock-pill"
            onClick={() => onRestore(widget.id)}
            title={`Restore ${tab.title}`}
          >
            <Icon />
            <span>{tab.title}</span>
          </button>
        )
      })}
    </nav>
  )
}
