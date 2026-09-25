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
        steps={['Type the email address you use for Google Calendar (like you@gmail.com or your school email)', 'Click Save']}
        placeholder="you@gmail.com"
        check={toCalendarEmbed}
        onSave={(result) => setSettings({ embedUrl: result.embedUrl })}
        extra={
          <>
            <p className="setup-note">
              Your events show in browsers where you’re signed in to that Google account. For a shared or club
              calendar, paste its Calendar ID or embed code instead (Calendar ⚙ Settings → click the calendar →
              Integrate calendar).
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
