import { useRef, useState } from 'react'
import { SearchIcon } from './icons.jsx'

const LOGO = [
  ['G', '#4285F4'],
  ['o', '#EA4335'],
  ['o', '#FBBC05'],
  ['g', '#4285F4'],
  ['l', '#34A853'],
  ['e', '#EA4335'],
]

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
    <div className="google">
      <div className="google-logo" aria-hidden="true">
        {LOGO.map(([letter, color], index) => (
          <span key={index} style={{ color }}>
            {letter}
          </span>
        ))}
      </div>
      <form className="google-search search" onSubmit={search} role="search">
        <SearchIcon />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ask Google"
          aria-label="Search Google"
        />
      </form>
    </div>
  )
}
