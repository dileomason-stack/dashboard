// Shared by the Canvas widget (to give instant feedback) and api/canvas.js
// (which enforces it). Only Canvas calendar feed links are accepted, so the
// server function can't be used to fetch arbitrary websites.

const SCHOOL_HOSTS = ['canvas.calpoly.edu']
const HOSTED_CANVAS_SUFFIX = '.instructure.com'

function isCanvasHost(host) {
  return (
    SCHOOL_HOSTS.includes(host) ||
    (host.endsWith(HOSTED_CANVAS_SUFFIX) && host.length > HOSTED_CANVAS_SUFFIX.length)
  )
}

export function checkCanvasFeedUrl(input) {
  const text = String(input ?? '').trim()
  if (!text) return { ok: false, error: 'Paste your Canvas calendar feed link first.' }

  let url
  try {
    url = new URL(text)
  } catch {
    return { ok: false, error: 'That isn’t a link. Copy the whole Calendar Feed link from Canvas.' }
  }

  if (url.protocol !== 'https:' || url.username || url.password || url.port) {
    return { ok: false, error: 'That doesn’t look like a Canvas link. It should start with https://' }
  }
  if (!isCanvasHost(url.hostname.toLowerCase())) {
    return {
      ok: false,
      error: 'Only Canvas links work here (canvas.calpoly.edu or a school’s instructure.com address).',
    }
  }
  if (!url.pathname.startsWith('/feeds/calendars/') || !url.pathname.endsWith('.ics')) {
    return {
      ok: false,
      error:
        'That’s a Canvas link, but not the calendar feed. In Canvas, open Calendar and click “Calendar Feed” (bottom right).',
    }
  }

  return { ok: true, url: url.toString() }
}
