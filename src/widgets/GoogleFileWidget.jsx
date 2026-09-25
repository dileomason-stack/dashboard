import { useCallback, useState } from 'react'
import { createPortal } from 'react-dom'
import { toGoogleEmbed } from '../lib/embeds.js'
import { openExternal } from '../lib/openExternal.js'
import { useStoreValue, widgetDataKey } from '../storage.js'
import LinkSetup from './LinkSetup.jsx'

// Shows a Google Doc/Sheet/Slides, Drive file, or shared Drive folder inside
// the card (view-only; Google doesn't allow editing inside other sites, which
// the card's 👁 Preview badge says). A small Edit / Open button sits in the
// card's top strip, next to its name, and opens it in Google (in a new tab).
// Settings: { url } (the original share link).
const isSettings = (value) => value && typeof value === 'object'
const NO_SETTINGS = {}

export default function GoogleFileWidget({ id }) {
  const [settings, setSettings] = useStoreValue(widgetDataKey(id), NO_SETTINGS, isSettings)
  const embed = settings.url ? toGoogleEmbed(settings.url) : null
  // The card's top strip (found once the card is on the page), where the
  // button goes so it never covers the document.
  const [strip, setStrip] = useState(null)
  const frameRef = useCallback((element) => setStrip(element?.closest('.card')?.querySelector('.card-top') ?? null), [])

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

  const openButton = <OpenButton embed={embed} />
  return (
    <div className="google-file" ref={frameRef}>
      <iframe title={embed.kind} src={embed.embedUrl} loading="lazy" allow="autoplay; fullscreen" />
      {strip ? createPortal(openButton, strip) : openButton}
    </div>
  )
}

function OpenButton({ embed }) {
  return (
    <button
      type="button"
      className="google-file-open"
      onClick={() => openExternal(embed.openUrl)}
      title={`View only here. Open in ${embed.kind === 'Drive folder' || embed.kind === 'Drive file' ? 'Drive' : 'Google'} to edit.`}
    >
      {embed.kind === 'Drive folder' ? '📁 Open ↗' : '✏️ Edit ↗'}
    </button>
  )
}
