import { toGoogleEmbed, toSpotifyEmbed } from './embeds.js'
import { GAMES, TOOLS } from './tools.js'

// Turns a link someone dropped on the dashboard into the best card for it:
// a Spotify player, a Google Doc/Drive view, a YouTube player, a known tool
// or game, a live Website card (if the site allows being shown inside other
// pages), or else a shortcut in a Links card. Returns
// { type, settings, label } or { type: 'links', link } for shortcuts.

export function youtubeEmbed(url) {
  const host = url.hostname.replace(/^www\.|^m\./, '')
  let id = null
  if (host === 'youtu.be') id = url.pathname.slice(1)
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    id = url.searchParams.get('v') ?? url.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]+)/)?.[1]
  }
  return id && /^[\w-]{6,20}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null
}

function findIn(catalog, url) {
  return Object.entries(catalog).find(([, item]) => {
    const known = new URL(item.url)
    return known.hostname === url.hostname && url.pathname.startsWith(known.pathname.replace(/\/$/, ''))
  })?.[0]
}

export async function classifyLink(text) {
  let url
  try {
    url = new URL(text.trim())
  } catch {
    return null
  }
  if (!['https:', 'http:'].includes(url.protocol)) return null
  const host = url.hostname.replace(/^www\./, '')

  const spotify = toSpotifyEmbed(url.href)
  if (spotify.ok) return { type: 'spotify', settings: { url: spotify.embedUrl }, label: 'Spotify player' }

  const google = toGoogleEmbed(url.href)
  if (google.ok) return { type: 'googlefile', settings: { url: google.openUrl }, label: google.kind }

  const youtube = youtubeEmbed(url)
  if (youtube) return { type: 'website', settings: { url: youtube, title: 'YouTube video', openUrl: url.href }, label: 'YouTube video' }

  const tool = findIn(TOOLS, url)
  if (tool) return { type: 'tool', settings: { tool }, label: TOOLS[tool].name }
  const game = findIn(GAMES, url)
  if (game) return { type: 'game', settings: { tool: game }, label: GAMES[game].name }

  // Anything else: ask our server whether the site allows being embedded.
  let embeddable = false
  try {
    const response = await fetch(`/api/embed-check?url=${encodeURIComponent(url.href)}`)
    embeddable = response.ok && (await response.json()).embeddable === true
  } catch {
    embeddable = false
  }
  if (embeddable) return { type: 'website', settings: { url: url.href, title: host }, label: host }
  return { type: 'links', link: { title: host, url: url.href }, label: host }
}
