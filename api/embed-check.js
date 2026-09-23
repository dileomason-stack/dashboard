// GET /api/embed-check?url=https://example.com  ->  { embeddable: true | false }
// Used when a link is dropped on the dashboard: sites that allow being shown
// inside other pages become live cards, the rest become shortcut buttons.
// It looks only at the site's response headers (X-Frame-Options and the
// frame-ancestors part of Content-Security-Policy) and never returns page
// content. Plain IP addresses and local names are refused, so it can't be
// pointed at private networks.

const TIMEOUT_MS = 6000

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

// Can a page on another site show this one in a frame?
function allowsEmbedding(headers) {
  const frameOptions = (headers.get('x-frame-options') ?? '').toLowerCase()
  if (frameOptions.includes('deny') || frameOptions.includes('sameorigin')) return false
  const policy = headers.get('content-security-policy') ?? ''
  const ancestors = policy.match(/frame-ancestors([^;]*)/i)?.[1]?.trim()
  if (ancestors === undefined) return true
  return ancestors.split(/\s+/).includes('*')
}

export async function GET(request) {
  let url
  try {
    url = new URL(new URL(request.url).searchParams.get('url') ?? '')
  } catch {
    return json(400, { error: 'That isn’t a link.' })
  }
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || !isPublicHostname(url.hostname)) {
    return json(400, { error: 'Only public websites can be checked.' })
  }

  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36',
        accept: 'text/html',
      },
    })
    response.body?.cancel().catch(() => {})
    const finalHost = new URL(response.url || url).hostname
    // Pages that send you to a sign-in page elsewhere aren't really embeddable.
    const embeddable = response.ok && isPublicHostname(finalHost) && allowsEmbedding(response.headers)
    return json(200, { embeddable }, 'public, max-age=3600, s-maxage=86400')
  } catch {
    return json(200, { embeddable: false })
  }
}
