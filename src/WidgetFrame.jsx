import { DeviceIcon, LockIcon } from './widgets/icons.jsx'

function openSite(href) {
  window.open(href, '_blank', 'noopener,noreferrer')
}

// Each widget is drawn as a small browser window: a tab with the site's icon
// and name, an address bar, and the widget itself as the "page".
// - The top bar is the drag handle in the workspace.
// - Double-clicking the top bar opens the real site in a new tab.
// - `compact` (used in the sidebar) hides the address bar to save space.
export default function WidgetFrame({ tab, compact, maximized, moveLabel, onMove, onMaximize, onRemove, children }) {
  const { title, address, href, icon: Icon } = tab

  function handleDoubleClick(event) {
    if (!href || event.target.closest('button, a')) return
    openSite(href)
  }

  return (
    <section className={`widget${compact ? ' compact' : ''}`} aria-label={title}>
      <header
        className="widget-chrome"
        title={href ? 'Drag to move · Double-click to open the real site' : 'Drag to move'}
        onDoubleClick={handleDoubleClick}
      >
        <div className="tab-strip">
          <div className="tab">
            <Icon />
            <span className="tab-title">{title}</span>
            <button
              type="button"
              className="tab-close widget-control"
              onClick={onRemove}
              aria-label={`Remove ${title} widget`}
              title="Remove widget"
            >
              ×
            </button>
          </div>
          <div className="window-controls">
            {onMove && !maximized && (
              <button type="button" className="widget-control" onClick={onMove} title={moveLabel} aria-label={moveLabel}>
                ⇄
              </button>
            )}
            <button
              type="button"
              className="widget-control"
              onClick={onMaximize}
              title={maximized ? 'Exit full screen (Esc)' : 'Full screen'}
              aria-label={maximized ? `Exit full screen for ${title}` : `Show ${title} full screen`}
            >
              {maximized ? '⤡' : '⤢'}
            </button>
          </div>
        </div>
        {!compact && (
          <div className="address-row">
            {href ? (
              <a
                className="address widget-control"
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                title={`Open ${address} in a new tab`}
              >
                <LockIcon />
                <span>{address}</span>
              </a>
            ) : (
              <span className="address">
                <DeviceIcon />
                <span>{address}</span>
              </span>
            )}
          </div>
        )}
      </header>
      <div className="widget-body">{children}</div>
    </section>
  )
}
