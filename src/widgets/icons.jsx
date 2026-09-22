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
