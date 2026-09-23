// Small tab icons (favicons) for each widget's browser tab.

export function GoogleIcon() {
  return (
    <svg viewBox="0 0 16 16" className="tab-icon" aria-hidden="true">
      <circle cx="8" cy="8" r="8" fill="#fff" />
      <text
        x="8"
        y="12"
        textAnchor="middle"
        fontSize="11.5"
        fontWeight="700"
        fontFamily="Arial, sans-serif"
        fill="#4285F4"
      >
        G
      </text>
    </svg>
  )
}

export function TodoIcon() {
  return (
    <svg viewBox="0 0 16 16" className="tab-icon" aria-hidden="true">
      <rect x="1" y="1" width="14" height="14" rx="3.5" fill="#2f6fed" />
      <path
        d="M4.5 8.2l2.3 2.3 4.7-4.9"
        fill="none"
        stroke="#fff"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="search-icon" aria-hidden="true">
      <path
        fill="currentColor"
        d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
      />
    </svg>
  )
}

export function LockIcon() {
  return (
    <svg viewBox="0 0 16 16" className="address-icon" aria-hidden="true">
      <path
        fill="currentColor"
        d="M11 6V4.5a3 3 0 0 0-6 0V6H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-1zM6.3 4.5a1.7 1.7 0 0 1 3.4 0V6H6.3V4.5z"
      />
    </svg>
  )
}

export function DeviceIcon() {
  return (
    <svg viewBox="0 0 16 16" className="address-icon" aria-hidden="true">
      <path
        fill="currentColor"
        d="M2 3.5A1.5 1.5 0 0 1 3.5 2h9A1.5 1.5 0 0 1 14 3.5V10a1.5 1.5 0 0 1-1.5 1.5h-3v1.3H11V14H5v-1.2h1.5v-1.3h-3A1.5 1.5 0 0 1 2 10V3.5zm1.5-.2a.2.2 0 0 0-.2.2V10c0 .1.1.2.2.2h9a.2.2 0 0 0 .2-.2V3.5a.2.2 0 0 0-.2-.2h-9z"
      />
    </svg>
  )
}

export function SpotifyIcon() {
  return (
    <svg viewBox="0 0 16 16" className="tab-icon" aria-hidden="true">
      <circle cx="8" cy="8" r="8" fill="#1DB954" />
      <g fill="none" stroke="#000" strokeLinecap="round">
        <path d="M4 6.2c2.7-.8 5.6-.6 8 .7" strokeWidth="1.4" />
        <path d="M4.5 8.6c2.2-.6 4.5-.4 6.5.6" strokeWidth="1.2" />
        <path d="M5 10.8c1.7-.4 3.4-.3 4.9.4" strokeWidth="1" />
      </g>
    </svg>
  )
}

export function CanvasIcon() {
  return (
    <svg viewBox="0 0 16 16" className="tab-icon" aria-hidden="true">
      <circle cx="8" cy="8" r="8" fill="#E4312B" />
      <circle cx="8" cy="8" r="3.2" fill="none" stroke="#fff" strokeWidth="1.6" />
      {[0, 60, 120, 180, 240, 300].map((angle) => (
        <circle
          key={angle}
          cx={8 + 5.6 * Math.cos((angle * Math.PI) / 180)}
          cy={8 + 5.6 * Math.sin((angle * Math.PI) / 180)}
          r="0.9"
          fill="#fff"
        />
      ))}
    </svg>
  )
}

export function CalendarIcon() {
  return (
    <svg viewBox="0 0 16 16" className="tab-icon" aria-hidden="true">
      <rect x="1" y="1.5" width="14" height="13.5" rx="2.5" fill="#fff" stroke="#4285F4" strokeWidth="1.2" />
      <rect x="1" y="1.5" width="14" height="4" rx="2" fill="#4285F4" />
      <text x="8" y="13" textAnchor="middle" fontSize="7" fontWeight="700" fontFamily="Arial, sans-serif" fill="#4285F4">
        {new Date().getDate()}
      </text>
    </svg>
  )
}

export function ClaudeIcon() {
  return (
    <svg viewBox="0 0 16 16" className="tab-icon" aria-hidden="true">
      <rect x="0" y="0" width="16" height="16" rx="4" fill="#D97757" />
      <g stroke="#fff" strokeWidth="1.5" strokeLinecap="round">
        {[0, 45, 90, 135].map((angle) => (
          <line
            key={angle}
            x1={8 - 4.5 * Math.cos((angle * Math.PI) / 180)}
            y1={8 - 4.5 * Math.sin((angle * Math.PI) / 180)}
            x2={8 + 4.5 * Math.cos((angle * Math.PI) / 180)}
            y2={8 + 4.5 * Math.sin((angle * Math.PI) / 180)}
          />
        ))}
      </g>
    </svg>
  )
}

export function ScoresIcon() {
  return (
    <svg viewBox="0 0 16 16" className="tab-icon" aria-hidden="true">
      <rect x="0" y="0" width="16" height="16" rx="4" fill="#d00" />
      <ellipse cx="8" cy="8" rx="5.2" ry="3.2" fill="#fff" transform="rotate(-35 8 8)" />
      <path d="M6.3 9.7l3.4-3.4M6.9 7.9l1.2 1.2M7.9 6.9l1.2 1.2" stroke="#d00" strokeWidth="0.9" strokeLinecap="round" />
    </svg>
  )
}

export function SleeperIcon() {
  return (
    <svg viewBox="0 0 16 16" className="tab-icon" aria-hidden="true">
      <rect x="0" y="0" width="16" height="16" rx="4" fill="#18202f" />
      <path d="M10.8 3.2a5 5 0 1 0 2 8.6 4.2 4.2 0 0 1-2-8.6z" fill="#1bd1c4" />
    </svg>
  )
}

export function NewsIcon() {
  return (
    <svg viewBox="0 0 16 16" className="tab-icon" aria-hidden="true">
      <rect x="1" y="2" width="14" height="12" rx="2.5" fill="#5f6368" />
      <rect x="3" y="4.5" width="4" height="3.5" rx="0.6" fill="#fff" />
      <path d="M8.5 5h4.5M8.5 7.5h4.5M3 10.5h10" stroke="#fff" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  )
}

export function ToolIcon() {
  return (
    <svg viewBox="0 0 16 16" className="tab-icon" aria-hidden="true">
      <rect x="0" y="0" width="16" height="16" rx="4" fill="#2d70b3" />
      <path d="M3.5 11.5l3-3.5 2 2 4-5" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function NotesIcon() {
  return (
    <svg viewBox="0 0 16 16" className="tab-icon" aria-hidden="true">
      <rect x="2" y="1" width="12" height="14" rx="2.5" fill="#f4b400" />
      <path d="M5 5h6M5 8h6M5 11h4" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

export function GameIcon() {
  return (
    <svg viewBox="0 0 16 16" className="tab-icon" aria-hidden="true">
      <rect x="0" y="0" width="16" height="16" rx="4" fill="#7c3aed" />
      <rect x="2.5" y="5" width="11" height="6.5" rx="3.2" fill="#fff" />
      <path d="M5.2 7v2.4M4 8.2h2.4" stroke="#7c3aed" strokeWidth="1.1" strokeLinecap="round" />
      <circle cx="10.4" cy="7.4" r="0.8" fill="#7c3aed" />
      <circle cx="11.6" cy="9" r="0.8" fill="#7c3aed" />
    </svg>
  )
}

export function WordIcon() {
  return (
    <svg viewBox="0 0 16 16" className="tab-icon" aria-hidden="true">
      <rect x="0.5" y="4.5" width="4.5" height="4.5" rx="1" fill="#6aaa64" />
      <rect x="5.75" y="4.5" width="4.5" height="4.5" rx="1" fill="#c9b458" />
      <rect x="11" y="4.5" width="4.5" height="4.5" rx="1" fill="#787c7e" />
      <rect x="0.5" y="9.75" width="4.5" height="4.5" rx="1" fill="#787c7e" />
      <rect x="5.75" y="9.75" width="4.5" height="4.5" rx="1" fill="#6aaa64" />
      <rect x="11" y="9.75" width="4.5" height="4.5" rx="1" fill="#6aaa64" />
    </svg>
  )
}

export function LinksIcon() {
  return (
    <svg viewBox="0 0 16 16" className="tab-icon" aria-hidden="true">
      <rect x="0" y="0" width="16" height="16" rx="4" fill="#0f9d58" />
      <path d="M6.8 9.2l2.4-2.4M7.3 5.6l1-1a2 2 0 012.9 2.9l-1 1M8.7 10.4l-1 1a2 2 0 01-2.9-2.9l1-1" fill="none" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

export function SnakeIcon() {
  return (
    <svg viewBox="0 0 16 16" className="tab-icon" aria-hidden="true">
      <rect x="0" y="0" width="16" height="16" rx="4" fill="#1c2a1c" />
      <path d="M3 12h5V8h5V4" fill="none" stroke="#4ade80" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12.5" cy="11.5" r="1.4" fill="#ef4444" />
    </svg>
  )
}

export function KeyboardIcon() {
  return (
    <svg viewBox="0 0 16 16" className="tab-icon" aria-hidden="true">
      <rect x="0.5" y="3.5" width="15" height="9" rx="2" fill="#374151" />
      <path d="M3 6.2h1M5.5 6.2h1M8 6.2h1M10.5 6.2h1M13 6.2h0.5M3 8.2h1M5.5 8.2h1M8 8.2h1M10.5 8.2h1M4.5 10.3h7" stroke="#fff" strokeWidth="1" strokeLinecap="round" />
    </svg>
  )
}
