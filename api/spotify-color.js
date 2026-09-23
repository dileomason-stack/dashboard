import { toSpotifyEmbed } from '../src/lib/embeds.js'

// POST /api/spotify-color  { url: "<Spotify link>" }  ->  { color: "#085038" }
// Returns the background color Spotify's own player uses for that playlist,
// album, or song, so a card can match it exactly. Browsers can't read the
// player page themselves (CORS), so this fetches it server-side.
//
// Only open.spotify.com/embed/<type>/<id> is ever fetched: the URL is rebuilt
// from the validated type and id, never taken from the request as-is.

const TIMEOUT_MS = 8000
const MAX_BYTES = 3_000_000

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  })
}

const toHex = ({ red, green, blue }) =>
  `#${[red, green, blue].map((part) => Number(part).toString(16).padStart(2, '0')).join('')}`

export async function POST(request) {
  let body
  try {
    body = await request.json()
  } catch {
    return json(400, { error: 'Send the link as JSON: { "url": "..." }' })
  }

  const embed = toSpotifyEmbed(body?.url)
  if (!embed.ok) return json(400, { error: embed.error })
  const [, type, id] = embed.embedUrl.match(/\/embed\/([a-z]+)\/([A-Za-z0-9]+)$/)

  let html
  try {
    const response = await fetch(`https://open.spotify.com/embed/${type}/${id}`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
    })
    if (!response.ok) return json(404, { error: 'Spotify couldn’t find that link.' })
    html = await response.text()
    if (html.length > MAX_BYTES) throw new Error('too large')
  } catch {
    return json(502, { error: 'Couldn’t reach Spotify. Try again.' })
  }

  try {
    const script = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)?.[1]
    const background = JSON.parse(script).props.pageProps.state.data.entity.visualIdentity.backgroundBase
    return json(200, { color: toHex(background) })
  } catch {
    return json(502, { error: 'Spotify didn’t include a color for that link.' })
  }
}
