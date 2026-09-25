import { useState } from 'react'
import { openExternal } from '../lib/openExternal.js'
import { getJSON, useLoader } from '../lib/useFetch.js'
import { useStoreValue, widgetDataKey } from '../storage.js'
import LinkSetup from './LinkSetup.jsx'

// A preview of a site that can't be shown inside a card (it blocks being
// embedded): its picture, name, title and description, like a link in
// iMessage or Slack, with one click to open it. Settings: { url }.
const isSettings = (value) => value && typeof value === 'object'
const NO_SETTINGS = {}

function checkUrl(input) {
  try {
    const url = new URL(String(input ?? '').trim())
    if (url.protocol === 'https:' || url.protocol === 'http:') return { ok: true, url: url.href }
  } catch {
    // fall through
  }
  return { ok: false, error: 'Paste a whole link, starting with https://' }
}

export default function PreviewWidget({ id }) {
  const [settings, setSettings] = useStoreValue(widgetDataKey(id), NO_SETTINGS, isSettings)
  const { data, loading } = useLoader(settings.url ?? null, () =>
    getJSON(`/api/link-preview?url=${encodeURIComponent(settings.url)}`),
  )
  const [imageFailed, setImageFailed] = useState(false)

  if (!settings.url) {
    return (
      <LinkSetup
        heading="Show a preview of any website."
        steps={['Copy a link from your browser', 'Paste it below']}
        placeholder="https://…"
        check={checkUrl}
        onSave={(result) => setSettings({ url: result.url })}
      />
    )
  }

  const host = new URL(settings.url).hostname.replace(/^www\./, '')
  const preview = data ?? { title: host, description: '', image: null, siteName: '', icon: null }
  const open = () => openExternal(settings.url)

  return (
    <div className={`link-preview${loading ? ' loading' : ''}`}>
      <button type="button" className="link-preview-image" onClick={open} aria-label={`Open ${preview.title}`}>
        {preview.image && !imageFailed ? (
          <img src={preview.image} alt="" onError={() => setImageFailed(true)} />
        ) : (
          <span className="link-preview-placeholder">{host.slice(0, 1).toUpperCase()}</span>
        )}
      </button>
      <div className="link-preview-text">
        <p className="link-preview-site">
          {preview.icon && (
            <img src={preview.icon} alt="" width="16" height="16" onError={(event) => (event.target.hidden = true)} />
          )}
          {preview.siteName || host}
        </p>
        <p className="link-preview-title">{loading ? 'Loading preview…' : preview.title}</p>
        {preview.description && <p className="link-preview-description">{preview.description}</p>}
      </div>
      <button type="button" className="primary link-preview-open" onClick={open}>
        Open {preview.siteName || host} ↗
      </button>
    </div>
  )
}
