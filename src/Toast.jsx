import { hideToast, useToast } from './lib/toast.js'

export default function Toast() {
  const toast = useToast()
  if (!toast) return null
  return (
    <div className="toast" role="status" key={toast.id}>
      <span>{toast.text}</span>
      <button type="button" className="toast-close" onClick={hideToast} aria-label="Dismiss">
        ×
      </button>
    </div>
  )
}
