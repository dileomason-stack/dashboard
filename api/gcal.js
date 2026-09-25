import ICAL from 'ical.js'
import { checkGoogleIcsUrl } from '../src/lib/gcalFeed.js'

// POST /api/gcal  { url: "<Google Calendar secret iCal address>" }
// Fetches the calendar server-side (browsers can't, because of CORS) and
// returns its events from two weeks ago to two months ahead as JSON, with
// repeating events (classes) expanded into each meeting.
//
// Privacy: the secret address is a private credential. It arrives in the
// request body (not the URL, so it stays out of request logs), is never
// logged, and is never echoed back.

const MAX_BYTES = 10_000_000
const TIMEOUT_MS = 10_000
const MAX_REDIRECTS = 3
const DAY_MS = 24 * 60 * 60 * 1000
const LOOKBACK_MS = 14 * DAY_MS
const LOOKAHEAD_MS = 62 * DAY_MS
const MAX_EVENTS = 2000

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
      const next = checkGoogleIcsUrl(new URL(response.headers.get('location') ?? '', target).toString())
      if (!next.ok) throw new FeedError('Google sent us somewhere unexpected. Copy the iCal address again.')
      target = next.url
      continue
    }
    return response
  }
  throw new FeedError('Google redirected too many times. Copy the iCal address again.')
}

async function readLimited(response) {
  const declared = Number(response.headers.get('content-length') ?? 0)
  if (declared > MAX_BYTES) throw new FeedError('That calendar is too large to load.')
  const reader = response.body.getReader()
  const chunks = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > MAX_BYTES) {
      await reader.cancel()
      throw new FeedError('That calendar is too large to load.')
    }
    chunks.push(value)
  }
  return new TextDecoder().decode(Buffer.concat(chunks))
}

// One meeting of an event: all-day events keep plain dates (end is the day
// after they finish); timed events become exact instants.
function occurrence(event, start, end, index) {
  const allDay = start.isDate
  return {
    id: `${event.uid}-${index}`,
    title: event.summary || '(No title)',
    location: event.location || '',
    allDay,
    start: allDay ? start.toString() : start.toJSDate().toISOString(),
    end: allDay ? end.toString() : end.toJSDate().toISOString(),
  }
}

export function eventsBetween(text, from, to) {
  const calendar = new ICAL.Component(ICAL.parse(text))
  // Register the calendar's own time zone definitions so local times convert correctly.
  for (const zone of calendar.getAllSubcomponents('vtimezone')) ICAL.TimezoneService.register(zone)

  const vevents = calendar.getAllSubcomponents('vevent')
  // Edited single meetings of a repeating event ("this event only" changes).
  const exceptions = vevents.filter((vevent) => vevent.hasProperty('recurrence-id'))
  const results = []

  for (const vevent of vevents) {
    if (vevent.hasProperty('recurrence-id')) continue
    if (vevent.getFirstPropertyValue('status') === 'CANCELLED') continue
    const event = new ICAL.Event(vevent)
    for (const exception of exceptions) {
      if (exception.getFirstPropertyValue('uid') === event.uid) event.relateException(exception)
    }

    if (!event.isRecurring()) {
      const end = event.endDate ?? event.startDate
      if (end.toJSDate() >= from && event.startDate.toJSDate() <= to) results.push(occurrence(event, event.startDate, end, 0))
      continue
    }

    const iterator = event.iterator()
    let next
    let index = 0
    // Guard against rules that never reach the window (e.g. very long series).
    for (let step = 0; step < 5000 && (next = iterator.next()); step++) {
      if (next.toJSDate() > to) break
      const details = event.getOccurrenceDetails(next)
      if (details.item.component.getFirstPropertyValue('status') === 'CANCELLED') continue
      if (details.endDate.toJSDate() < from) continue
      results.push(occurrence(details.item, details.startDate, details.endDate, index++))
      if (results.length > MAX_EVENTS) break
    }
  }
  return results.sort((a, b) => (a.start < b.start ? -1 : 1)).slice(0, MAX_EVENTS)
}

export async function POST(request) {
  let body
  try {
    body = await request.json()
  } catch {
    return json(400, { error: 'Send the iCal address as JSON: { "url": "..." }' })
  }

  const checked = checkGoogleIcsUrl(body?.url)
  if (!checked.ok) return json(400, { error: checked.error })

  let text
  try {
    const response = await fetchFeed(checked.url)
    if ([400, 401, 403, 404, 410].includes(response.status)) {
      return json(404, {
        error: 'Google didn’t recognize that iCal address. It may have been reset. Copy it again from Calendar settings.',
      })
    }
    if (!response.ok) return json(502, { error: `Google had a problem (error ${response.status}). Try again in a minute.` })
    text = await readLimited(response)
  } catch (error) {
    if (error instanceof FeedError) return json(502, { error: error.message })
    if (error?.name === 'TimeoutError') return json(504, { error: 'Google took too long to respond. Try again in a minute.' })
    return json(502, { error: 'Couldn’t reach Google Calendar. Check the link and try again.' })
  }

  if (!text.includes('BEGIN:VCALENDAR')) {
    return json(502, { error: 'That link didn’t return a calendar. Copy the iCal address again.' })
  }

  const now = Date.now()
  let events
  try {
    events = eventsBetween(text, new Date(now - LOOKBACK_MS), new Date(now + LOOKAHEAD_MS))
  } catch {
    return json(502, { error: 'Couldn’t read that calendar. Copy the iCal address again.' })
  }
  const name = text.match(/^X-WR-CALNAME:(.*)$/m)?.[1]?.trim() ?? ''
  return json(200, { name, events, fetchedAt: new Date(now).toISOString() })
}
