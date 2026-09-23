const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

// Calendar days between two dates (0 = same day, 1 = tomorrow, ...).
export function daysFromToday(date, now = new Date()) {
  const a = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((a - b) / DAY)
}

export function formatTime(date) {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

export function dayLabel(date, now = new Date()) {
  const days = daysFromToday(date, now)
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })
}

// "Due in 40 min", "Due in 5 hr", "Tomorrow, 11:59 PM", "Friday, 11:59 PM", "Mon, Oct 6"
export function formatDue(dueMs, now = new Date()) {
  const diff = dueMs - now.getTime()
  const date = new Date(dueMs)
  if (diff < 0) return 'Past due'
  if (diff < HOUR) return `Due in ${Math.max(1, Math.round(diff / MINUTE))} min`
  if (diff < 12 * HOUR) return `Due in ${Math.round(diff / HOUR)} hr`
  const days = daysFromToday(date, now)
  if (days === 0) return `Today, ${formatTime(date)}`
  if (days === 1) return `Tomorrow, ${formatTime(date)}`
  if (days < 7) return `${date.toLocaleDateString([], { weekday: 'long' })}, ${formatTime(date)}`
  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
}

export const SOON_MS = 48 * HOUR
