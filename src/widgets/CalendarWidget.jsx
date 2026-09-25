import { useMemo } from 'react'
import { sampleEvents } from '../example.js'
import { toCalendarEmbed } from '../lib/embeds.js'
import { checkGoogleIcsUrl, looksLikeGoogleIcs } from '../lib/gcalFeed.js'
import { formatTime } from '../lib/dates.js'
import { useLoader } from '../lib/useFetch.js'
import { useStore, useStoreValue, widgetDataKey } from '../storage.js'
import DayView from './DayView.jsx'
import LinkSetup from './LinkSetup.jsx'

// Settings, one of:
//   { icsUrl }   a calendar's secret iCal address → our own Day view
//   { embedUrl } Google's embeddable calendar (from an email or embed code)
//   { sample: true } Alex's made-up week, in the Day view
const isSettings = (value) => value && typeof value === 'object'
const NO_SETTINGS = {}

// The setup box takes either kind of input.
function checkCalendarInput(input) {
  if (looksLikeGoogleIcs(input)) {
    const checked = checkGoogleIcsUrl(input)
    return checked.ok ? { ok: true, icsUrl: checked.url } : checked
  }
  return toCalendarEmbed(input)
}

async function loadCalendar(url) {
  let response
  try {
    response = await fetch('/api/gcal', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url }),
    })
  } catch {
    throw new Error('You seem to be offline. Check your connection.')
  }
  const data = await response.json().catch(() => null)
  if (!response.ok || !data) throw new Error(data?.error ?? 'Couldn’t load your calendar. Try again in a minute.')
  return data
}

function SampleCalendar() {
  const events = useMemo(() => sampleEvents(), [])
  return <DayView events={events} />
}

function FeedCalendar({ icsUrl, onReset }) {
  const { data, error, loading, reload } = useLoader(icsUrl, () => loadCalendar(icsUrl), 5 * 60 * 1000)
  if (error) {
    return (
      <div className="widget-message">
        <p className="form-error">{error}</p>
        <div className="button-row">
          <button type="button" onClick={reload}>
            Try again
          </button>
          <button type="button" onClick={onReset}>
            Use a different calendar
          </button>
        </div>
      </div>
    )
  }
  if (loading) return <p className="empty-state">Loading your calendar…</p>
  return (
    <DayView
      events={data.events}
      footer={<p className="dayview-footer">Updated {formatTime(new Date(data.fetchedAt))} · refreshes every 5 minutes</p>}
    />
  )
}

export default function CalendarWidget({ id }) {
  const store = useStore()
  const [settings, setSettings] = useStoreValue(widgetDataKey(id), NO_SETTINGS, isSettings)

  if (settings.sample) {
    return (
      <div className="calendar-sample">
        <SampleCalendar />
        {!store.example && (
          <button type="button" className="link-button" onClick={() => setSettings({})}>
            Connect my Google Calendar
          </button>
        )}
      </div>
    )
  }

  if (settings.icsUrl) return <FeedCalendar icsUrl={settings.icsUrl} onReset={() => setSettings({})} />

  const embed = settings.embedUrl ? toCalendarEmbed(settings.embedUrl) : null
  if (!embed?.ok) {
    return (
      <LinkSetup
        heading="Show your Google Calendar here, in Day view."
        steps={[
          'On a computer, open Google Calendar → ⚙ → Settings',
          'On the left under “Settings for my calendars”, click your calendar',
          'Scroll down to “Secret address in iCal format”, click the copy button, and paste it below',
        ]}
        placeholder="https://calendar.google.com/calendar/ical/…/basic.ics"
        check={checkCalendarInput}
        onSave={(result) => setSettings(result.icsUrl ? { icsUrl: result.icsUrl } : { embedUrl: result.embedUrl })}
        extra={
          <>
            <p className="setup-note">
              The secret address lets Homeroom read your events; it’s saved only in this browser. Quicker option: type your Google
              email instead to show Google’s own compact calendar (no Day view).
            </p>
            <button type="button" className="link-button" onClick={() => setSettings({ sample: true })}>
              Or show a sample week
            </button>
          </>
        }
      />
    )
  }

  return (
    <div className="calendar-embed">
      <iframe title="Google Calendar" src={embed.embedUrl} loading="lazy" />
    </div>
  )
}
