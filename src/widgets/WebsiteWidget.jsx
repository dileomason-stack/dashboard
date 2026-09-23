import { classifyLink } from '../lib/classifyLink.js'
import { useStoreValue, widgetDataKey } from '../storage.js'
import LinkSetup from './LinkSetup.jsx'

// Any website that allows being shown inside other pages (YouTube videos,
// Wikipedia, many tools...). Usually created by dropping a link on the
// dashboard. Settings: { url, title, openUrl }.
const isSettings = (value) => value && typeof value === 'object'
const NO_SETTINGS = {}

function checkUrl(input) {
  try {
    const url = new URL(input.trim())
    if (!['https:', 'http:'].includes(url.protocol)) throw new Error()
    return { ok: true, url: url.href }
  } catch {
    return { ok: false, error: 'Paste a full website link (starting with https://).' }
  }
}

export default function WebsiteWidget({ id }) {
  const [settings, setSettings] = useStoreValue(widgetDataKey(id), NO_SETTINGS, isSettings)

  if (!settings.url) {
    return (
      <LinkSetup
        heading="Show a website here (if it allows it), like a YouTube video or Wikipedia page."
        steps={['Copy a link, or just drag one onto the dashboard', 'Paste it below']}
        placeholder="https://…"
        check={checkUrl}
        onSave={async (result) => {
          const card = await classifyLink(result.url)
          if (card?.type === 'website') setSettings(card.settings)
          else setSettings({ url: result.url, title: new URL(result.url).hostname, blocked: true })
        }}
      />
    )
  }

  if (settings.blocked) {
    return (
      <div className="widget-message">
        <p>This site doesn’t allow being shown inside other websites, so it can only open in its own window.</p>
        <div className="button-row">
          <a className="button-link primary" href={settings.url} target="_blank" rel="noopener noreferrer">
            Open {settings.title} ↗
          </a>
          <button type="button" onClick={() => setSettings({})}>
            Try another link
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="website">
      <iframe
        title={settings.title ?? 'Website'}
        src={settings.url}
        loading="lazy"
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture; clipboard-write"
        // The site runs normally but can never take over the dashboard tab.
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation"
      />
    </div>
  )
}
