import { useCallback, useEffect, useMemo, useState } from 'react'
import { sampleAssignments } from '../example.js'
import { checkCanvasFeedUrl } from '../lib/canvasFeed.js'
import { formatDue, formatTime, SOON_MS } from '../lib/dates.js'
import { useStore, useStoreValue, widgetDataKey } from '../storage.js'
import LinkSetup from './LinkSetup.jsx'

// Settings: { feedUrl } for a real feed or { sample: true }, plus
// done: { [assignmentId]: true } for items checked off on the dashboard.
const isSettings = (value) => value && typeof value === 'object'
const NO_SETTINGS = {}

// All-day items have only a date; treat them as due at the end of that day.
function dueMs(item) {
  return new Date(item.allDay ? `${item.due}T23:59:00` : item.due).getTime()
}

async function fetchAssignments(feedUrl) {
  try {
    const response = await fetch('/api/canvas', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: feedUrl }),
    })
    const data = await response.json().catch(() => null)
    if (!response.ok || !data) {
      return { status: 'error', error: data?.error ?? 'Couldn’t reach the server. Try again.' }
    }
    return { status: 'ready', assignments: data.assignments, fetchedAt: new Date(data.fetchedAt) }
  } catch {
    return { status: 'error', error: 'You seem to be offline. Check your connection and try again.' }
  }
}

// Loads assignments for `feedUrl`. Results are tagged with the link they came
// from, so switching links never shows the previous link's assignments.
function useCanvasFeed(feedUrl) {
  const [result, setResult] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [run, setRun] = useState(0)

  useEffect(() => {
    if (!feedUrl) return
    let cancelled = false
    fetchAssignments(feedUrl).then((next) => {
      if (cancelled) return
      setResult({ ...next, feedUrl })
      setRefreshing(false)
    })
    return () => {
      cancelled = true
    }
  }, [feedUrl, run])

  const reload = useCallback(() => {
    setRefreshing(true)
    setRun((count) => count + 1)
  }, [])

  const current = result?.feedUrl === feedUrl ? result : null
  const status = refreshing ? 'loading' : (current?.status ?? 'loading')
  return [{ ...current, status }, reload]
}

export default function CanvasWidget({ id }) {
  const store = useStore()
  const [settings, setSettings] = useStoreValue(widgetDataKey(id), NO_SETTINGS, isSettings)
  const [feed, reload] = useCanvasFeed(settings.feedUrl)
  const sample = useMemo(() => (settings.sample ? sampleAssignments() : null), [settings.sample])
  const done = settings.done ?? {}

  function toggleDone(assignmentId) {
    setSettings((current) => ({
      ...current,
      done: { ...current.done, [assignmentId]: !current.done?.[assignmentId] },
    }))
  }

  if (!settings.feedUrl && !settings.sample) {
    return (
      <LinkSetup
        heading="See what’s due across all your classes."
        steps={[
          'In Canvas, open Calendar',
          'Click “Calendar Feed” (bottom right) and copy the link',
          'Paste it below. It stays private in this browser.',
        ]}
        placeholder="https://canvas.calpoly.edu/feeds/calendars/…"
        check={checkCanvasFeedUrl}
        onSave={(result) => setSettings({ feedUrl: result.url, done: {} })}
        extra={
          <button type="button" className="link-button" onClick={() => setSettings({ sample: true, done: {} })}>
            Or try it with sample assignments
          </button>
        }
      />
    )
  }

  if (settings.feedUrl && feed.status === 'error' && feed.error) {
    return (
      <div className="widget-message">
        <p className="form-error" role="alert">
          {feed.error}
        </p>
        <div className="button-row">
          <button type="button" onClick={reload}>
            Try again
          </button>
          <button type="button" onClick={() => setSettings({})}>
            Use a different link
          </button>
        </div>
      </div>
    )
  }

  const assignments = sample ?? feed.assignments
  if (!assignments) {
    return <p className="empty-state">Loading your assignments…</p>
  }

  const now = new Date()
  const soonCount = assignments.filter((item) => !done[item.id] && dueMs(item) - now.getTime() < SOON_MS).length

  return (
    <div className="canvas">
      <div className="canvas-summary">
        <strong>
          {soonCount === 0 ? 'Nothing due in the next 48 hours' : `${soonCount} due in the next 48 hours`}
        </strong>
        <span className="canvas-source">
          {sample ? (store.example ? 'Alex’s classes (sample)' : 'Sample assignments') : null}
          {!sample && feed.fetchedAt && `Updated ${formatTime(feed.fetchedAt)}`}
          {!sample && (
            <button type="button" className="link-button" onClick={reload} disabled={feed.status === 'loading'}>
              {feed.status === 'loading' ? 'Refreshing…' : 'Refresh'}
            </button>
          )}
          {!store.example && (
            <button type="button" className="link-button" onClick={() => setSettings({})}>
              {sample ? 'Connect my Canvas' : 'Disconnect'}
            </button>
          )}
        </span>
      </div>

      {assignments.length === 0 ? (
        <p className="empty-state">No upcoming assignments in the next 60 days. Enjoy it.</p>
      ) : (
        <ul className="canvas-list">
          {assignments.map((item) => {
            const due = dueMs(item)
            const isDone = !!done[item.id]
            const soon = !isDone && due - now.getTime() < SOON_MS
            return (
              <li key={item.id} className={[soon && 'soon', isDone && 'done'].filter(Boolean).join(' ') || undefined}>
                <input
                  type="checkbox"
                  checked={isDone}
                  onChange={() => toggleDone(item.id)}
                  aria-label={`Mark “${item.title}” done on this dashboard`}
                />
                <div className="canvas-item">
                  {item.url ? (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="canvas-title">
                      {item.title}
                    </a>
                  ) : (
                    <span className="canvas-title">{item.title}</span>
                  )}
                  <span className="canvas-meta">
                    {item.course && <span className="course-chip">{item.course}</span>}
                    <span className={soon ? 'due soon' : 'due'}>{formatDue(due, now)}</span>
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
