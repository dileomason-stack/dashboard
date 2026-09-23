import { toGoogleEmbed } from '../lib/embeds.js'
import { useStoreValue, widgetDataKey } from '../storage.js'
import LinkSetup from './LinkSetup.jsx'

// Shows a Google Doc/Sheet/Slides, Drive file, or shared Drive folder inside
// the card (view-only; Google doesn't allow editing inside other sites).
// "Open in Google" in the menu, or double-clicking the tab, opens it to edit.
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
      <iframe title={embed.kind} src={embed.embedUrl} loading="lazy" allow="autoplay; fullscreen" />
    </div>
  )
}
