import { hideToast, useToast } from './lib/toast.js'

export default function Toast() {
  const toast = useToast()
  if (!toast) return null
  return (
    <div className="toast" role="status" key={toast.id}>
      <span>{toast.text}</span>
      {toast.action && (
        <button
          type="button"
          className="primary toast-action"
          onClick={() => {
            hideToast()
            toast.action.onClick()
          }}
        >
          {toast.action.label}
        </button>
      )}
      <button type="button" className="toast-close" onClick={hideToast} aria-label="Dismiss">
        ×
      </button>
    </div>
  )
}
