import { useRef, useState } from 'react'

export default function SearchWidget() {
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)

  function search(event) {
    event.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) {
      inputRef.current?.focus()
      return
    }
    const url = `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`
    window.open(url, '_blank', 'noopener,noreferrer')
    setQuery('')
  }

  return (
    <form className="inline-form search" onSubmit={search} role="search">
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search Google…"
        aria-label="Search Google"
      />
      <button type="submit">Search</button>
    </form>
  )
}
