import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

// Full-screen "try it yourself" card: the link in big letters and a QR code
// people can scan from the audience. Closes on Esc or a click outside.
export default function ShareDialog({ onClose }) {
  const url = window.location.origin
  const [qr, setQr] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // Loaded only when Share is opened, to keep the first page load small.
    import('qrcode')
      .then(({ default: QRCode }) => QRCode.toDataURL(url, { width: 640, margin: 1, color: { dark: '#111111', light: '#ffffff' } }))
      .then(setQr)
      .catch(() => setQr(null))
    const onKey = (event) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [url, onClose])

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard blocked: the link is on screen to copy by hand.
    }
  }

  return createPortal(
    <div className="share-layer" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="share-card" role="dialog" aria-label="Share Homeroom">
        <p className="share-kicker">Try it yourself</p>
        {qr && <img className="share-qr" src={qr} alt={`QR code for ${url}`} />}
        <p className="share-url">{url.replace(/^https?:\/\//, '')}</p>
        <p className="share-note">Free · no login · works in any browser</p>
        <div className="button-row">
          <button type="button" className="primary" onClick={copy}>
            {copied ? 'Copied!' : 'Copy link'}
          </button>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
