// Turn links people paste into embeddable player/calendar URLs.
// Each returns { ok: true, embedUrl } or { ok: false, error } with a friendly message.

const TYPES = ['playlist', 'album', 'track', 'episode', 'show', 'artist']

// Accepts share links (open.spotify.com/playlist/ID?si=..., including
// /intl-xx/ variants), embed links, and spotify:playlist:ID URIs.
export function toSpotifyEmbed(input) {
  const text = String(input ?? '').trim()
  if (!text) return { ok: false, error: 'Paste a Spotify link first.' }

  const uri = text.match(/^spotify:([a-z]+):([A-Za-z0-9]{10,})$/)
  if (uri && TYPES.includes(uri[1])) {
    return { ok: true, embedUrl: `https://open.spotify.com/embed/${uri[1]}/${uri[2]}` }
  }

  let url
  try {
    url = new URL(text)
  } catch {
    return { ok: false, error: 'That isn’t a link. In Spotify, click ••• → Share → Copy link.' }
  }
  if (url.hostname !== 'open.spotify.com') {
    return { ok: false, error: 'That isn’t a Spotify link. It should start with https://open.spotify.com/' }
  }
  const parts = url.pathname.split('/').filter(Boolean).filter((part) => !part.startsWith('intl-'))
  if (parts[0] === 'embed') parts.shift()
  const [type, id] = parts
  if (!TYPES.includes(type) || !/^[A-Za-z0-9]{10,}$/.test(id ?? '')) {
    return { ok: false, error: 'Use a link to a playlist, album, song, or podcast.' }
  }
  return { ok: true, embedUrl: `https://open.spotify.com/embed/${type}/${id}` }
}

// Accepts Google Calendar's embed code (<iframe src="...">) or its embed URL.
export function toCalendarEmbed(input) {
  const text = String(input ?? '').trim()
  if (!text) return { ok: false, error: 'Paste your Google Calendar embed code first.' }
  const src = text.match(/src="([^"]+)"/)?.[1]?.replace(/&amp;/g, '&') ?? text

  let url
  try {
    url = new URL(src)
  } catch {
    return { ok: false, error: 'That isn’t a link or embed code. Copy the “Embed code” from Calendar settings.' }
  }
  if (url.protocol !== 'https:' || url.hostname !== 'calendar.google.com' || !/^\/calendar(\/u\/\d+)?\/embed/.test(url.pathname)) {
    return {
      ok: false,
      error: 'That’s not a Google Calendar embed link. Use the “Embed code” under Settings → Integrate calendar.',
    }
  }
  // Agenda view fits a narrow column best.
  if (!url.searchParams.has('mode')) url.searchParams.set('mode', 'AGENDA')
  return { ok: true, embedUrl: url.toString() }
}
