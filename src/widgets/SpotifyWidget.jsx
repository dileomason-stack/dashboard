import { useStoreValue, widgetDataKey } from '../storage.js'
import { toSpotifyEmbed } from '../lib/embeds.js'
import LinkSetup from './LinkSetup.jsx'

const isSettings = (value) => value && typeof value === 'object'
const NO_SETTINGS = {}

export default function SpotifyWidget({ id }) {
  const [settings, setSettings] = useStoreValue(widgetDataKey(id), NO_SETTINGS, isSettings)
  const embed = settings.url ? toSpotifyEmbed(settings.url) : null

  if (!embed?.ok) {
    return (
      <LinkSetup
        heading="Play a playlist, album, or podcast right here."
        steps={['In Spotify, open a playlist', 'Click ••• → Share → Copy link', 'Paste it below']}
        placeholder="https://open.spotify.com/playlist/…"
        check={toSpotifyEmbed}
        onSave={(result) => setSettings({ url: result.embedUrl })}
      />
    )
  }

  return (
    <div className="spotify">
      <iframe
        title="Spotify player"
        src={`${embed.embedUrl}?utm_source=generator`}
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      />
    </div>
  )
}
