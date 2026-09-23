// Card background colors: readable text choice, and a color picked from a
// Spotify cover.

function hexToRgb(hex) {
  const value = parseInt(hex.slice(1), 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

function rgbToHex([r, g, b]) {
  return `#${[r, g, b].map((part) => Math.round(part).toString(16).padStart(2, '0')).join('')}`
}

export function isValidHex(value) {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)
}

// True when white text reads better than dark text on this background.
export function isDark(hex) {
  const [r, g, b] = hexToRgb(hex).map((part) => {
    const c = part / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.35
}

function rgbToHsl([r, g, b]) {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return [h / 6, s, l]
}

function hslToRgb([h, s, l]) {
  if (s === 0) return [l * 255, l * 255, l * 255]
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const channel = (t) => {
    t = (t + 1) % 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  return [channel(h + 1 / 3) * 255, channel(h) * 255, channel(h - 1 / 3) * 255]
}

// Spotify's player background is a dark, muted version of the cover's main
// color. Approximate that: average the cover (favoring colorful pixels), then
// darken and soften it.
export async function colorFromSpotify(embedUrl) {
  const pageUrl = embedUrl.replace('/embed/', '/').split('?')[0]
  const response = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(pageUrl)}`)
  if (!response.ok) throw new Error('Spotify didn’t return that playlist.')
  const { thumbnail_url: thumbnail } = await response.json()

  const image = new Image()
  image.crossOrigin = 'anonymous'
  image.src = thumbnail
  await image.decode()

  const size = 32
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  context.drawImage(image, 0, 0, size, size)
  const { data } = context.getImageData(0, 0, size, size)

  const total = [0, 0, 0]
  let weights = 0
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]]
    const max = Math.max(r, g, b)
    const saturation = max === 0 ? 0 : (max - Math.min(r, g, b)) / max
    const weight = 0.15 + saturation ** 2
    total[0] += r * weight
    total[1] += g * weight
    total[2] += b * weight
    weights += weight
  }
  const [h, s, l] = rgbToHsl(total.map((part) => part / weights))
  return rgbToHex(hslToRgb([h, Math.min(s, 0.5), Math.min(Math.max(l, 0.18), 0.3)]))
}
