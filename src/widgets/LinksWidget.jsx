import { useState } from 'react'
import { newId } from '../lib/id.js'
import { useStoreValue, widgetDataKey } from '../storage.js'

// Quick-launch buttons for sites that can't be shown inside a card (Gmail,
// Wordle, Canvas pages...). Each opens in a new tab. Settings: { links: [{ id, title, url }] }.
const isSettings = (value) => value && typeof value === 'object'
const NO_SETTINGS = {}

function checkLink(input) {
  const text = input.trim()
  if (!text) return { ok: false, error: 'Paste a link first.' }
  let url
  try {
    url = new URL(/^[a-z]+:\/\//i.test(text) ? text : `https://${text}`)
  } catch {
    return { ok: false, error: 'That doesn’t look like a link.' }
  }
  if (!['https:', 'http:'].includes(url.protocol) || !url.hostname.includes('.')) {
    return { ok: false, error: 'Links need to be websites, like gmail.com.' }
  }
  return { ok: true, url: url.toString() }
}

const hostOf = (url) => new URL(url).hostname.replace(/^www\./, '')

export default function LinksWidget({ id }) {
  const [settings, setSettings] = useStoreValue(widgetDataKey(id), NO_SETTINGS, isSettings)
  const links = Array.isArray(settings.links) ? settings.links : []
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')

  function add(event) {
    event.preventDefault()
    const checked = checkLink(url)
    if (!checked.ok) return setError(checked.error)
    const link = { id: newId(), title: title.trim() || hostOf(checked.url), url: checked.url }
    setSettings((current) => ({ ...current, links: [...(current.links ?? []), link] }))
    setTitle('')
    setUrl('')
    setError('')
    setAdding(false)
  }

  function remove(linkId) {
    setSettings((current) => ({ ...current, links: (current.links ?? []).filter((link) => link.id !== linkId) }))
  }

  return (
    <div className="links">
      {links.length === 0 && !adding && (
        <p className="empty-state">Add buttons for sites you open a lot, like Gmail, Wordle, or a Google Doc.</p>
      )}
      <div className="link-grid">
        {links.map((link) => (
          <div key={link.id} className="link-tile">
            <a href={link.url} target="_blank" rel="noopener noreferrer" title={link.url}>
              <img
                src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostOf(link.url))}&sz=64`}
                alt=""
                width="20"
                height="20"
                loading="lazy"
              />
              <span>{link.title}</span>
            </a>
            <button type="button" className="link-remove" onClick={() => remove(link.id)} aria-label={`Remove ${link.title}`}>
              ×
            </button>
          </div>
        ))}
      </div>
      {adding ? (
        <form className="link-add-form" onSubmit={add}>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Name (optional)" aria-label="Link name" />
          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value)
              setError('')
            }}
            placeholder="gmail.com or https://…"
            aria-label="Link address"
            autoFocus
          />
          <div className="button-row">
            <button type="submit" className="primary" disabled={!url.trim()}>
              Add
            </button>
            <button type="button" onClick={() => setAdding(false)}>
              Cancel
            </button>
          </div>
          {error && <p className="form-error">{error}</p>}
        </form>
      ) : (
        <button type="button" className="link-button" onClick={() => setAdding(true)}>
          + Add a link
        </button>
      )}
    </div>
  )
}
