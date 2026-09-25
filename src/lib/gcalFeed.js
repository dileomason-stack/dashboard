// Shared by the Calendar widget (instant feedback) and api/gcal.js (which
// enforces it). Only Google Calendar's iCal addresses are accepted, so the
// server function can't be used to fetch arbitrary websites.
//
// A calendar's "Secret address in iCal format" looks like
// https://calendar.google.com/calendar/ical/<calendar id>/private-<key>/basic.ics
// (a public calendar's address has /public/ in place of /private-<key>/).
const ICS_PATH = /^\/calendar\/ical\/[^/]+\/(private-[a-z0-9]+|public)\/basic\.ics$/i

export function looksLikeGoogleIcs(input) {
  return /calendar\.google\.com\/calendar\/ical\//i.test(String(input ?? ''))
}

export function checkGoogleIcsUrl(input) {
  const text = String(input ?? '').trim()
  let url
  try {
    url = new URL(text)
  } catch {
    return { ok: false, error: 'That isn’t a link. Copy the whole “Secret address in iCal format”.' }
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.port || url.hostname !== 'calendar.google.com') {
    return { ok: false, error: 'Only Google Calendar iCal links work here (https://calendar.google.com/calendar/ical/…).' }
  }
  if (!ICS_PATH.test(url.pathname)) {
    return {
      ok: false,
      error:
        'That’s a Google Calendar link, but not the iCal address. Copy “Secret address in iCal format” from the calendar’s settings.',
    }
  }
  return { ok: true, url: `https://calendar.google.com${url.pathname}` }
}
