import { DeviceIcon, LockIcon } from './widgets/icons.jsx'

// Each widget is drawn as a small browser window: a tab with the site's icon
// and name, an address bar, and the widget itself as the "page".
// The top bar is the drag handle; the tab's × removes the widget.
export default function WidgetFrame({ tab, onRemove, children }) {
  const { title, address, href, icon: Icon } = tab

  return (
    <section className="widget" aria-label={title}>
      <header className="widget-chrome" title="Drag to move">
        <div className="tab-strip">
          <div className="tab">
            <Icon />
            <span className="tab-title">{title}</span>
            <button
              type="button"
              className="tab-close widget-remove"
              onClick={onRemove}
              aria-label={`Remove ${title} widget`}
              title="Remove widget"
            >
              ×
            </button>
          </div>
        </div>
        <div className="address-row">
          {href ? (
            <a
              className="address address-link"
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
      </header>
      <div className="widget-body">{children}</div>
    </section>
  )
}
