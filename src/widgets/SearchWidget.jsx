import { useEffect, useRef, useState } from 'react'
import { SearchIcon } from './icons.jsx'

const LOGO = [
  ['G', '#4285F4'],
  ['o', '#EA4335'],
  ['o', '#FBBC05'],
  ['g', '#4285F4'],
  ['l', '#34A853'],
  ['e', '#EA4335'],
]

const googleUrl = (query) => `https://www.google.com/search?q=${encodeURIComponent(query)}`
// igu=1 is an undocumented Google setting that allows its results page to be
// shown inside another site. See api/google-embed.js for the fallback check.
const embeddedUrl = (query) => `https://www.google.com/search?igu=1&q=${encodeURIComponent(query)}`

function openInGoogle(query) {
  window.open(query ? googleUrl(query) : 'https://www.google.com', '_blank', 'noopener,noreferrer')
}

// Asked once per page load and shared by every Google card.
let embedCheck = null
function checkEmbeddable() {
  embedCheck ??= fetch('/api/google-embed')
    .then((response) => response.json())
    .then((data) => data.embeddable !== false)
    .catch(() => true)
  return embedCheck
}

function useEmbeddable() {
  const [embeddable, setEmbeddable] = useState(true)
  useEffect(() => {
    let active = true
    checkEmbeddable().then((result) => active && setEmbeddable(result))
    return () => {
      active = false
    }
  }, [])
  return embeddable
}

// Search Google and see the real results inside the card. Double-clicking
// the search bar (or the ↗ button) opens the same search in a full tab.
// If Google stops allowing results inside other sites, searching opens a
// new tab instead.
export default function SearchWidget() {
  const [text, setText] = useState('')
  const [query, setQuery] = useState('')
  const [loadedQuery, setLoadedQuery] = useState(null)
  const inputRef = useRef(null)
  const embeddable = useEmbeddable()

  function search(event) {
    event.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) {
      inputRef.current?.focus()
      return
    }
    if (embeddable) {
      setQuery(trimmed)
    } else {
      openInGoogle(trimmed)
      setText('')
    }
  }

  function clear() {
    setQuery('')
    setText('')
    inputRef.current?.focus()
  }

  // Double-click anywhere on our part of the card (not the text box) opens
  // Google in a new tab. stopPropagation keeps the card's own double-click
  // menu from opening too.
  function handleDoubleClick(event) {
    if (event.target.closest('input, button')) return
    event.stopPropagation()
    openInGoogle(query || text.trim())
  }

  const searchBox = (
    <form className="google-search search" onSubmit={search} role="search">
      <SearchIcon />
      <input
        ref={inputRef}
        type="search"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Ask Google"
        aria-label="Search Google"
      />
      {query && (
        <button type="button" className="google-icon-button" onClick={clear} aria-label="Clear search" title="Clear">
          ×
        </button>
      )}
      <button
        type="button"
        className="google-icon-button"
        onClick={() => openInGoogle(query || text.trim())}
        aria-label="Open in Google in a new tab"
        title="Open in Google (new tab)"
      >
        ↗
      </button>
    </form>
  )

  if (!query) {
    return (
      <div className="google" onDoubleClick={handleDoubleClick}>
        <div className="google-logo" aria-hidden="true">
          {LOGO.map(([letter, color], index) => (
            <span key={index} style={{ color }}>
              {letter}
            </span>
          ))}
        </div>
        {searchBox}
        {!embeddable && <p className="setup-note">Results open in a new tab.</p>}
      </div>
    )
  }

  return (
    <div className="google google-results">
      <div className="google-results-bar" onDoubleClick={handleDoubleClick} title="Double-click to open in Google">
        {searchBox}
      </div>
      {loadedQuery !== query && <p className="google-loading">Loading Google results…</p>}
      <iframe
        key={query}
        onLoad={() => setLoadedQuery(query)}
        title={`Google results for ${query}`}
        src={embeddedUrl(query)}
        // Google's page can run normally, but it can never take over the
        // dashboard tab itself; links that open new tabs still work.
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
      />
    </div>
  )
}
