import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { colorFromSpotify } from './lib/colors.js'

const PRESETS = [
  ['#2b2b2b', 'Charcoal'],
  ['#1e3a5f', 'Navy'],
  ['#1f4a3a', 'Forest'],
  ['#154734', 'Cal Poly green'],
  ['#4a2545', 'Plum'],
  ['#5c2a1e', 'Rust'],
  ['#f4ead5', 'Sand'],
  ['#dcecfb', 'Sky'],
  ['#f9e0e3', 'Blush'],
  ['#e3f4e1', 'Mint'],
]

// Popover for choosing a card's background: presets, any color, a color
// from the Spotify playlist, or back to the default. Rendered at the page
// level (a portal) so it never picks up the card's own colors.
// Swatches and Match Spotify close it; "Any color…" keeps it open while the
// color is being adjusted.
export default function ColorPicker({ x, y, value, spotifyEmbedUrl, onChange, onClose }) {
  const ref = useRef(null)
  const [position, setPosition] = useState({ left: x, top: y })
  const [matching, setMatching] = useState(false)
  const [error, setError] = useState('')

  useLayoutEffect(() => {
    const rect = ref.current.getBoundingClientRect()
    setPosition({
      left: Math.max(8, Math.min(x, window.innerWidth - rect.width - 8)),
      top: Math.max(8, Math.min(y, window.innerHeight - rect.height - 8)),
    })
  }, [x, y])

  useEffect(() => {
    const onPointer = (event) => !ref.current?.contains(event.target) && onClose()
    const onKey = (event) => event.key === 'Escape' && onClose()
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  async function matchSpotify() {
    setMatching(true)
    setError('')
    try {
      onChange(await colorFromSpotify(spotifyEmbedUrl))
      onClose()
    } catch {
      setError('Couldn’t get the colors from Spotify. Try again, or pick a color.')
      setMatching(false)
    }
  }

  const choose = (next) => {
    onChange(next)
    onClose()
  }

  return createPortal(
    <div ref={ref} className="color-picker" style={position} role="dialog" aria-label="Card color">
      <p className="color-picker-title">Card color</p>
      <div className="swatches">
        <button
          type="button"
          className={`swatch swatch-default${!value ? ' selected' : ''}`}
          onClick={() => choose(null)}
          title="Default"
          aria-label="Default color"
        />
        {PRESETS.map(([hex, name]) => (
          <button
            key={hex}
            type="button"
            className={`swatch${value === hex ? ' selected' : ''}`}
            style={{ background: hex }}
            onClick={() => choose(hex)}
            title={name}
            aria-label={name}
          />
        ))}
      </div>
      <label className="custom-color">
        <input type="color" value={value ?? '#ffffff'} onChange={(event) => onChange(event.target.value)} />
        Any color…
      </label>
      {spotifyEmbedUrl && (
        <button type="button" className="match-spotify" onClick={matchSpotify} disabled={matching}>
          {matching ? 'Matching…' : '🎵 Match Spotify playlist'}
        </button>
      )}
      {error && <p className="form-error">{error}</p>}
    </div>,
    document.body,
  )
}
