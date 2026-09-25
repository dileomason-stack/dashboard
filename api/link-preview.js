// GET /api/link-preview?url=https://example.com
//   ->  { url, title, description, image, siteName, icon }
// The same preview a link gets in iMessage or Slack, read from the page's
// Open Graph / Twitter / <title> tags, for sites that can't be shown inside a
// card. Only the start of the page is read, only public sites are fetched
// (plain IP addresses and local names are refused, on every redirect), and
// only those few text fields are returned. Picture links are checked to
// really be images (some sites' preview tags point at a web page), falling
// back to a logo on the page, then the site's icon.

const TIMEOUT_MS = 6000
const MAX_BYTES = 600_000
const MAX_REDIRECTS = 4

function json(status, body, cache = 'no-store') {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': cache },
  })
}

function isPublicHostname(host) {
  if (!host.includes('.')) return false // "localhost", intranet names
  if (/^[\d.]+$/.test(host) || host.includes(':') || host.startsWith('[')) return false // IP addresses
  return !/(^|\.)(local|localhost|internal|lan|home|corp)$/.test(host)
}

const isPublicUrl = (url) =>
  ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password && isPublicHostname(url.hostname)

// Follow redirects by hand so every hop is checked.
async function fetchPage(url) {
  let target = url
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const response = await fetch(target, {
      redirect: 'manual',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36',
        accept: 'text/html',
      },
    })
    if (response.status >= 300 && response.status < 400) {
      const next = new URL(response.headers.get('location') ?? '', target)
      if (!isPublicUrl(next)) return null
      target = next
      continue
    }
    return { response, finalUrl: target }
  }
  return null
}

// As much of the start of the page as the limit allows (the head, and
// usually the top of the body, where a logo would be).
async function readStart(response) {
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let html = ''
  while (html.length < MAX_BYTES) {
    const { done, value } = await reader.read()
    if (done) break
    html += decoder.decode(value, { stream: true })
  }
  reader.cancel().catch(() => {})
  return html
}

// The first link that really serves an image (public sites only).
async function firstImage(candidates) {
  for (const href of candidates) {
    if (!href) continue
    const url = new URL(href)
    if (!isPublicUrl(url)) continue
    try {
      const response = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(3000), headers: { accept: 'image/*' } })
      response.body?.cancel().catch(() => {})
      if (response.ok && (response.headers.get('content-type') ?? '').startsWith('image/')) return url.href
    } catch {
      // try the next one
    }
  }
  return null
}

const decode = (text) =>
  text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()

// Every <meta property|name=... content=...> in the head, by lowercased key.
function metaTags(html) {
  const tags = {}
  for (const [tag] of html.matchAll(/<meta\b[^>]*>/gi)) {
    const key = tag.match(/\b(?:property|name)\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase()
    const content = tag.match(/\bcontent\s*=\s*"([^"]*)"|\bcontent\s*=\s*'([^']*)'/i)
    if (key && content && !(key in tags)) tags[key] = decode(content[1] ?? content[2] ?? '')
  }
  return tags
}

function absolute(href, base) {
  if (!href) return null
  try {
    const url = new URL(href, base)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null
  } catch {
    return null
  }
}

export async function GET(request) {
  let url
  try {
    url = new URL(new URL(request.url).searchParams.get('url') ?? '')
  } catch {
    return json(400, { error: 'That isn’t a link.' })
  }
  if (!isPublicUrl(url)) return json(400, { error: 'Only public websites can be previewed.' })

  const fallback = { url: url.href, title: url.hostname.replace(/^www\./, ''), description: '', image: null, siteName: '', icon: null }
  try {
    const page = await fetchPage(url)
    if (!page || !page.response.ok || !(page.response.headers.get('content-type') ?? '').includes('html')) {
      page?.response.body?.cancel().catch(() => {})
      return json(200, fallback, 'public, max-age=3600, s-maxage=3600')
    }
    const html = await readStart(page.response)
    const tags = metaTags(html)
    const base = page.finalUrl
    const title = tags['og:title'] || tags['twitter:title'] || decode(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? '')
    const hrefOf = (tag) => tag?.match(/href=["']([^"']+)["']/i)?.[1]
    const touchIcon = absolute(hrefOf(html.match(/<link\b[^>]*rel=["'][^"']*apple-touch-icon[^"']*["'][^>]*>/i)?.[0]), base)
    const favicon = absolute(hrefOf(html.match(/<link\b[^>]*rel=["'](?:shortcut )?icon["'][^>]*>/i)?.[0]) ?? '/favicon.ico', base)
    const logo = absolute(html.match(/<img\b[^>]*src=["']([^"']*logo[^"']*)["']/i)?.[1], base)
    const [image, icon] = await Promise.all([
      firstImage([absolute(tags['og:image'] || tags['og:image:url'], base), absolute(tags['twitter:image'], base), logo, touchIcon]),
      firstImage([touchIcon, favicon]),
    ])
    return json(
      200,
      {
        url: url.href,
        title: (title || fallback.title).slice(0, 200),
        description: (tags['og:description'] || tags['twitter:description'] || tags.description || '').slice(0, 400),
        image,
        siteName: (tags['og:site_name'] || '').slice(0, 80),
        icon,
      },
      'public, max-age=3600, s-maxage=86400',
    )
  } catch {
    return json(200, fallback)
  }
}
