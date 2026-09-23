import { NEWS_SOURCES } from '../src/lib/newsSources.js'

// GET /api/news?source=npr  ->  { source, items: [{ title, link, published }] }
// Reads a news site's RSS/Atom feed (browsers can't, because of CORS) and
// returns the latest headlines. Cached for 10 minutes.

const TIMEOUT_MS = 8000
const MAX_BYTES = 3_000_000

function json(status, body, cache = 'no-store') {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': cache },
  })
}

function decode(text) {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .trim()
}

const tag = (block, name) => block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i'))?.[1]

// Handles RSS (<item>, <link>url</link>) and Atom (<entry>, <link href="url"/>).
function parseFeed(xml) {
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) ?? []
  return blocks
    .map((block) => {
      const title = decode(tag(block, 'title') ?? '')
      const atomLink =
        block.match(/<link[^>]*rel="alternate"[^>]*href="([^"]+)"/i)?.[1] ?? block.match(/<link[^>]*href="([^"]+)"/i)?.[1]
      const link = decode(tag(block, 'link') ?? atomLink ?? '')
      const dateText = tag(block, 'pubDate') ?? tag(block, 'published') ?? tag(block, 'updated') ?? tag(block, 'dc:date')
      const time = dateText ? Date.parse(decode(dateText)) : NaN
      return { title, link, published: Number.isNaN(time) ? null : new Date(time).toISOString() }
    })
    .filter((item) => item.title && /^https?:\/\//.test(item.link))
    .slice(0, 20)
}

export async function GET(request) {
  const key = new URL(request.url).searchParams.get('source')
  const source = NEWS_SOURCES[key]
  if (!source) return json(400, { error: 'Unknown news source.' })

  try {
    const response = await fetch(source.url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { 'user-agent': 'Mozilla/5.0 (dashboard news reader)', accept: 'application/rss+xml, application/xml, text/xml' },
    })
    if (!response.ok) return json(502, { error: `${source.name} isn’t responding right now.` })
    const xml = await response.text()
    if (xml.length > MAX_BYTES) return json(502, { error: 'That feed is too large.' })
    const items = parseFeed(xml)
    if (items.length === 0) return json(502, { error: `Couldn’t read ${source.name}’s headlines.` })
    return json(200, { source: source.name, items }, 'public, max-age=300, s-maxage=600, stale-while-revalidate=1800')
  } catch {
    return json(502, { error: `Couldn’t reach ${source.name}. Try again in a minute.` })
  }
}
