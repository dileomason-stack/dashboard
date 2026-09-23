// Minimal iCalendar (.ics) reader: just enough for Canvas calendar feeds.

function unescapeText(value) {
  return value
    .replace(/\\n/gi, '\n')
    .replace(/\\([,;\\])/g, '$1')
    .trim()
}

// Offset (ms) of a time zone from UTC at a given instant.
function timeZoneOffset(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date)
  const get = (type) => Number(parts.find((part) => part.type === type).value)
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'))
  return asUtc - date.getTime()
}

// Returns { date: ISO string, allDay: false } or { date: 'YYYY-MM-DD', allDay: true }.
function parseDate(property) {
  if (!property) return null
  const { value, params } = property
  const match = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/)
  if (!match) return null
  const [, y, mo, d, h, mi, s, utc] = match

  if (h === undefined || params.VALUE === 'DATE') {
    return { date: `${y}-${mo}-${d}`, allDay: true }
  }

  const wallClock = Date.UTC(+y, +mo - 1, +d, +h, +mi, +s)
  if (utc) return { date: new Date(wallClock).toISOString(), allDay: false }

  if (params.TZID) {
    try {
      const guess = new Date(wallClock)
      const offset = timeZoneOffset(guess, params.TZID)
      return { date: new Date(wallClock - offset).toISOString(), allDay: false }
    } catch {
      // Unknown time zone name: fall through and treat it as UTC.
    }
  }
  return { date: new Date(wallClock).toISOString(), allDay: false }
}

export function parseIcsEvents(text) {
  // Long lines are "folded" onto continuation lines that start with a space.
  const lines = text.replace(/\r\n?/g, '\n').replace(/\n[ \t]/g, '').split('\n')
  const events = []
  let current = null

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      current = {}
    } else if (line === 'END:VEVENT') {
      if (current) events.push(current)
      current = null
    } else if (current) {
      const colon = line.indexOf(':')
      if (colon < 0) continue
      const [name, ...rawParams] = line.slice(0, colon).split(';')
      const params = {}
      for (const param of rawParams) {
        const [key, val = ''] = param.split('=')
        params[key.toUpperCase()] = val.replace(/^"|"$/g, '')
      }
      current[name.toUpperCase()] = { value: line.slice(colon + 1), params }
    }
  }

  return events.map((event) => ({
    uid: event.UID?.value ?? '',
    summary: event.SUMMARY ? unescapeText(event.SUMMARY.value) : '',
    url: event.URL?.value ?? '',
    start: parseDate(event.DTSTART),
  }))
}

// Canvas titles look like "Lab 4 [CSC-202-05-2268]". Split out the course and
// shorten it to "CSC 202" when it follows the usual pattern.
export function splitCanvasTitle(summary) {
  const match = summary.match(/^(.*?)\s*\[([^\]]+)\]\s*$/)
  if (!match) return { title: summary, course: '' }
  const [, title, course] = match
  const code = course.match(/^([A-Za-z]{2,5})[-\s]?(\d{3,4})/)
  return { title: title || summary, course: code ? `${code[1].toUpperCase()} ${code[2]}` : course }
}
