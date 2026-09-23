import { useMemo } from 'react'
import { sampleEvents } from '../example.js'
import { dayLabel, formatTime } from '../lib/dates.js'
import { toCalendarEmbed } from '../lib/embeds.js'
import { useStore, useStoreValue, widgetDataKey } from '../storage.js'
import LinkSetup from './LinkSetup.jsx'

const isSettings = (value) => value && typeof value === 'object'
const NO_SETTINGS = {}

function SampleAgenda() {
  const events = useMemo(() => sampleEvents(), [])
  const now = new Date()
  const days = []
  for (const event of events) {
    const label = dayLabel(new Date(event.start), now)
    if (days.at(-1)?.label !== label) days.push({ label, events: [] })
    days.at(-1).events.push(event)
  }

  return (
    <div className="agenda">
      {days.map((day) => (
        <section key={day.label}>
          <h3>{day.label}</h3>
          <ul>
            {day.events.map((event) => {
              const start = new Date(event.start)
              const end = new Date(event.end)
              const happening = start <= now && now < end
              const past = end <= now
              return (
                <li key={event.id} className={happening ? 'now' : past ? 'past' : undefined}>
                  <span className="agenda-time">{formatTime(start)}</span>
                  <span className="agenda-title">
                    {event.title}
                    {happening && <span className="now-badge">Now</span>}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}

export default function CalendarWidget({ id }) {
  const store = useStore()
  const [settings, setSettings] = useStoreValue(widgetDataKey(id), NO_SETTINGS, isSettings)

  if (settings.sample) {
    return (
      <div className="calendar-sample">
        <SampleAgenda />
        {!store.example && (
          <button type="button" className="link-button" onClick={() => setSettings({})}>
            Connect my Google Calendar
          </button>
        )}
      </div>
    )
  }

  const embed = settings.embedUrl ? toCalendarEmbed(settings.embedUrl) : null
  if (!embed?.ok) {
    return (
      <LinkSetup
        heading="Show your Google Calendar here."
        steps={[
          'On a computer, open Google Calendar → ⚙ Settings',
          'Click your calendar on the left, then “Integrate calendar”',
          'Copy the “Embed code” and paste it below',
        ]}
        placeholder='<iframe src="https://calendar.google.com/calendar/embed?…'
        check={toCalendarEmbed}
        onSave={(result) => setSettings({ embedUrl: result.embedUrl })}
        extra={
          <>
            <p className="setup-note">Private events only show in browsers where you’re signed in to Google.</p>
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
