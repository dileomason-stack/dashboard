import { useCallback, useEffect, useState } from 'react'

// Loads JSON with `load()` (an async function returning data) whenever `key`
// changes, and again every `refreshMs` if given. Results are tagged with the
// key they came from, so changing settings never shows the old results.
export function useLoader(key, load, refreshMs) {
  const [result, setResult] = useState(null)
  const [run, setRun] = useState(0)

  useEffect(() => {
    if (key == null) return
    let cancelled = false
    const go = () =>
      load()
        .then((data) => !cancelled && setResult({ key, data }))
        .catch((error) => !cancelled && setResult({ key, error: error.message || 'Something went wrong.' }))
    go()
    const timer = refreshMs ? setInterval(go, refreshMs) : null
    return () => {
      cancelled = true
      if (timer) clearInterval(timer)
    }
    // `load` is recreated each render; `key` captures what it depends on.
  }, [key, run, refreshMs]) // eslint-disable-line react-hooks/exhaustive-deps

  const reload = useCallback(() => setRun((count) => count + 1), [])
  const current = result?.key === key ? result : null
  return { data: current?.data, error: current?.error, loading: !current, reload }
}

export async function getJSON(url) {
  let response
  try {
    response = await fetch(url)
  } catch {
    throw new Error('You seem to be offline. Check your connection.')
  }
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new Error(data?.error ?? 'Couldn’t load that right now. Try again in a minute.')
  return data
}

export function timeAgo(iso, now = Date.now()) {
  if (!iso) return ''
  const minutes = Math.round((now - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}
