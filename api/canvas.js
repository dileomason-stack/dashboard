import { checkCanvasFeedUrl } from '../src/lib/canvasFeed.js'
import { parseIcsEvents, splitCanvasTitle } from './_lib/ics.js'

// POST /api/canvas  { url: "<Canvas calendar feed link>" }
// Fetches the feed server-side (browsers can't, because of CORS) and returns
// upcoming assignments as JSON.
//
// Privacy: the feed link is a private credential. It arrives in the request
// body (not the URL, so it stays out of request logs), is never logged, and is
// never echoed back.

const MAX_BYTES = 5_000_000
const TIMEOUT_MS = 10_000
const MAX_REDIRECTS = 3
const LOOKBACK_MS = 6 * 60 * 60 * 1000 // keep things due in the last 6 hours
const LOOKAHEAD_MS = 60 * 24 * 60 * 60 * 1000 // and the next 60 days

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'private, no-store' },
  })
}

class FeedError extends Error {}

// Follow redirects by hand so every hop is re-checked against the allowlist.
async function fetchFeed(url) {
  let target = url
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const response = await fetch(target, {
      redirect: 'manual',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { accept: 'text/calendar, text/plain;q=0.9' },
    })
    if (response.status >= 300 && response.status < 400) {
      const next = checkCanvasFeedUrl(new URL(response.headers.get('location') ?? '', target).toString())
      if (!next.ok) throw new FeedError('Canvas sent us somewhere unexpected. Copy the feed link again.')
      target = next.url
      continue
    }
    return response
  }
  throw new FeedError('Canvas redirected too many times. Copy the feed link again.')
}

async function readLimited(response) {
  const declared = Number(response.headers.get('content-length') ?? 0)
  if (declared > MAX_BYTES) throw new FeedError('That calendar feed is too large to load.')

  const reader = response.body.getReader()
  const chunks = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > MAX_BYTES) {
      await reader.cancel()
      throw new FeedError('That calendar feed is too large to load.')
    }
    chunks.push(value)
  }
  return new TextDecoder().decode(Buffer.concat(chunks))
}

export async function POST(request) {
  let body
  try {
    body = await request.json()
  } catch {
    return json(400, { error: 'Send the feed link as JSON: { "url": "..." }' })
  }

  const checked = checkCanvasFeedUrl(body?.url)
  if (!checked.ok) return json(400, { error: checked.error })

  let text
  try {
    const response = await fetchFeed(checked.url)
    if ([400, 401, 403, 404, 410].includes(response.status)) {
      return json(404, {
        error: 'Canvas didn’t recognize that feed link. It may have been reset. Copy it again from Canvas.',
      })
    }
    if (!response.ok) {
      return json(502, { error: `Canvas had a problem (error ${response.status}). Try again in a minute.` })
    }
    text = await readLimited(response)
  } catch (error) {
    if (error instanceof FeedError) return json(502, { error: error.message })
    if (error?.name === 'TimeoutError') {
      return json(504, { error: 'Canvas took too long to respond. Try again in a minute.' })
    }
    return json(502, { error: 'Couldn’t reach Canvas. Check the link and try again.' })
  }

  if (!text.includes('BEGIN:VCALENDAR')) {
    return json(502, { error: 'That link didn’t return a calendar. Copy the Calendar Feed link again.' })
  }

  const now = Date.now()
  const events = parseIcsEvents(text).filter((event) => event.start && event.summary)
  // Canvas marks assignment events with UIDs like "event-assignment-123".
  // Fall back to every event if a school's feed doesn't use that pattern.
  const assignmentEvents = events.filter((event) => event.uid.includes('assignment'))
  const source = assignmentEvents.length > 0 ? assignmentEvents : events

  const assignments = source
    .map((event) => {
      const { title, course } = splitCanvasTitle(event.summary)
      // All-day dates have no time; count them as due at the end of that day.
      const sortTime = new Date(event.start.allDay ? `${event.start.date}T23:59:00` : event.start.date).getTime()
      return {
        id: event.uid || `${title}-${event.start.date}`,
        title,
        course,
        due: event.start.date,
        allDay: event.start.allDay,
        url: event.url,
        sortTime,
      }
    })
    .filter((item) => item.sortTime >= now - LOOKBACK_MS && item.sortTime <= now + LOOKAHEAD_MS)
    .sort((a, b) => a.sortTime - b.sortTime)
    .slice(0, 100)
    .map(({ sortTime: _sortTime, ...item }) => item)

  return json(200, { assignments, fetchedAt: new Date(now).toISOString() })
}
