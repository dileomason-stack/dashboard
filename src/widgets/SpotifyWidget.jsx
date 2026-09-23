import { useEffect, useRef, useState } from 'react'
import { useStoreValue, widgetDataKey } from '../storage.js'
import { toSpotifyEmbed } from '../lib/embeds.js'
import LinkSetup from './LinkSetup.jsx'

const isSettings = (value) => value && typeof value === 'object'
const NO_SETTINGS = {}

// Spotify's player crops play/pause below about 310px wide (the logged-in
// view has an extra ＋ button). Narrower than this, we draw the player at this
// width and scale it down, so every button stays visible.
const PLAYER_MIN_WIDTH = 320

function useWidth(ref) {
  const [width, setWidth] = useState(null)
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [ref])
  return width
}

function SpotifyPlayer({ embedUrl }) {
  const ref = useRef(null)
  const width = useWidth(ref)
  const scale = width && width < PLAYER_MIN_WIDTH ? width / PLAYER_MIN_WIDTH : 1

  return (
    <div className="spotify" ref={ref}>
      <iframe
        title="Spotify player"
        src={`${embedUrl}?utm_source=generator`}
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        style={
          scale < 1
            ? {
                width: PLAYER_MIN_WIDTH,
                height: `${100 / scale}%`,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
              }
            : undefined
        }
      />
    </div>
  )
}

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

  return <SpotifyPlayer embedUrl={embed.embedUrl} />
}
