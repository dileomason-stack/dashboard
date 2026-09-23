import { useState } from 'react'
import { useStoreValue, widgetDataKey } from '../storage.js'

// Gmail can't be shown inside other sites, so this card offers quick ways in:
// open the inbox, compose, or search Gmail (opens in a new tab), plus Outlook.
// Alex's example shows a made-up inbox instead. Settings: { sample, read: {id: true} }.
const isSettings = (value) => value && typeof value === 'object'
const NO_SETTINGS = {}

const GMAIL = 'https://mail.google.com/mail/u/0/'
const open = (url) => window.open(url, '_blank', 'noopener,noreferrer')

const SAMPLE_EMAILS = [
  { id: 'e1', from: 'Prof. Kim', subject: 'CSC 202 Lab 4: extension until Friday', snippet: 'Hi all, a few of you asked about the linked list lab…', time: '9:12 AM' },
  { id: 'e2', from: 'Canvas', subject: 'Reading Quiz: Ch. 6 is due tomorrow', snippet: 'PSY 201 · Due Sep 24 at 11:59pm', time: '8:30 AM' },
  { id: 'e3', from: 'Vibe Coding Club', subject: 'Build Day #1 is Friday! 🎉', snippet: 'Doors at 12:00, demos start 12:10 in Frost 181…', time: 'Yesterday' },
  { id: 'e4', from: 'Mustang News', subject: 'This week at Cal Poly', snippet: 'Farmers market returns, new dining hours, and more', time: 'Yesterday' },
  { id: 'e5', from: 'Maya (lab partner)', subject: 'Re: project proposal', snippet: 'Sounds good, I can take the remove() tests if you…', time: 'Mon' },
]

export default function InboxWidget({ id }) {
  const [settings, setSettings] = useStoreValue(widgetDataKey(id), NO_SETTINGS, isSettings)
  const [query, setQuery] = useState('')
  const read = settings.read ?? {}
  const unread = SAMPLE_EMAILS.filter((email) => !read[email.id]).length

  function search(event) {
    event.preventDefault()
    const trimmed = query.trim()
    if (trimmed) open(`${GMAIL}#search/${encodeURIComponent(trimmed)}`)
    setQuery('')
  }

  return (
    <div className="inbox">
      <div className="inbox-actions">
        <button type="button" className="primary" onClick={() => open(`${GMAIL}#inbox`)}>
          Open Gmail ↗
        </button>
        <button type="button" onClick={() => open('https://mail.google.com/mail/?view=cm&fs=1')}>
          ✏️ Compose
        </button>
        <button type="button" onClick={() => open('https://outlook.office.com/mail/')} title="Cal Poly email">
          Outlook ↗
        </button>
      </div>
      <form className="inline-form" onSubmit={search}>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search Gmail…"
          aria-label="Search Gmail"
        />
      </form>

      {settings.sample ? (
        <>
          <p className="inbox-count">
            {unread ? `${unread} unread` : 'All caught up'} <span>· sample inbox</span>
          </p>
          <ul className="inbox-list">
            {SAMPLE_EMAILS.map((email) => (
              <li key={email.id}>
                <button
                  type="button"
                  className={read[email.id] ? 'read' : undefined}
                  onClick={() => setSettings((current) => ({ ...current, read: { ...current.read, [email.id]: true } }))}
                >
                  <span className="inbox-from">{email.from}</span>
                  <span className="inbox-time">{email.time}</span>
                  <span className="inbox-subject">{email.subject}</span>
                  <span className="inbox-snippet">{email.snippet}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="setup-note">
          Gmail doesn’t allow itself to be shown inside other websites, so these open it in a new tab.
        </p>
      )}
    </div>
  )
}
