export default function WidgetFrame({ title, onRemove, children }) {
  return (
    <section className="widget">
      <header className="widget-header" title="Drag to move">
        <h2>{title}</h2>
        <button
          type="button"
          className="icon-button widget-remove"
          onClick={onRemove}
          aria-label={`Remove ${title} widget`}
          title="Remove widget"
        >
          ×
        </button>
      </header>
      <div className="widget-body">{children}</div>
    </section>
  )
}
