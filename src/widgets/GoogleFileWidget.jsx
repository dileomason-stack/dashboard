import { toGoogleEmbed } from '../lib/embeds.js'
import { openExternal } from '../lib/openExternal.js'
import { useStoreValue, widgetDataKey } from '../storage.js'
import LinkSetup from './LinkSetup.jsx'

// Shows a Google Doc/Sheet/Slides, Drive file, or shared Drive folder inside
// the card (view-only; Google doesn't allow editing inside other sites).
// The bar on top says so and has the Edit / Open button (opens in a new tab).
// Settings: { url } (the original share link).
const isSettings = (value) => value && typeof value === 'object'
const NO_SETTINGS = {}

export default function GoogleFileWidget({ id }) {
  const [settings, setSettings] = useStoreValue(widgetDataKey(id), NO_SETTINGS, isSettings)
  const embed = settings.url ? toGoogleEmbed(settings.url) : null

  if (!embed?.ok) {
    return (
      <LinkSetup
        heading="Show a Google Doc, Sheet, Slides, or Drive folder here."
        steps={[
          'In Google Drive, click Share on the file or folder',
          'Set General access to “Anyone with the link” (Viewer)',
          'Copy link and paste it below',
        ]}
        placeholder="https://docs.google.com/… or https://drive.google.com/…"
        check={toGoogleEmbed}
        onSave={(result) => setSettings({ url: result.openUrl })}
      />
    )
  }

  return (
    <div className="google-file">
      <div className="google-file-bar">
        <span>👁 View only</span>
        <button type="button" className="primary" onClick={() => openExternal(embed.openUrl)}>
          {embed.kind === 'Drive folder' ? '📁 Open in Drive ↗' : `✏️ Edit in ${embed.kind === 'Drive file' ? 'Drive' : embed.kind} ↗`}
        </button>
      </div>
      <iframe title={embed.kind} src={embed.embedUrl} loading="lazy" allow="autoplay; fullscreen" />
    </div>
  )
}
