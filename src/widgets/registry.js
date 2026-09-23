import CalendarWidget from './CalendarWidget.jsx'
import CanvasWidget from './CanvasWidget.jsx'
import ClaudeWidget from './ClaudeWidget.jsx'
import SearchWidget from './SearchWidget.jsx'
import SpotifyWidget from './SpotifyWidget.jsx'
import TodoWidget from './TodoWidget.jsx'
import { CalendarIcon, CanvasIcon, ClaudeIcon, GoogleIcon, SpotifyIcon, TodoIcon } from './icons.jsx'

// Every widget type the dashboard knows about. Adding a new widget means
// writing its component and adding one entry here; the "Add widget" menu,
// sidebar, and workspace pick it up automatically.
//
// size: default size in the workspace grid (12 columns wide, rows are
//   ROW_HEIGHT px tall).
// sidebarHeight: fixed card height (px) in the sidebar, for embeds that only
//   come in set sizes.
// colorable: false hides "Card color…" (the Spotify player covers its card).
// editLabel: menu item that clears the widget's settings so it shows its
//   setup screen again (e.g. to paste a different link).
// tab: how the widget's browser-style frame looks: tab name and icon, and
//   the address bar text. With `href`, clicking the address or double-clicking
//   the tab bar opens the real site.
export const WIDGETS = {
  spotify: {
    title: 'Spotify',
    description: 'A playlist, album, or podcast player',
    component: SpotifyWidget,
    editLabel: 'Change playlist',
    // Spotify's embed has fixed layouts; 80px is the compact player.
    sidebarHeight: 80,
    colorable: false,
    size: { w: 4, h: 8, minW: 3, minH: 5 },
    tab: { title: 'Spotify', address: 'open.spotify.com', href: 'https://open.spotify.com', icon: SpotifyIcon },
  },
  todo: {
    title: 'To-do',
    description: 'A checklist saved in this browser',
    component: TodoWidget,
    size: { w: 4, h: 9, minW: 3, minH: 5 },
    tab: { title: 'To-do list', address: 'Saved in this browser', icon: TodoIcon },
  },
  canvas: {
    title: 'Canvas assignments',
    description: 'What’s due next across your classes',
    component: CanvasWidget,
    editLabel: 'Change Canvas feed',
    size: { w: 5, h: 10, minW: 3, minH: 5 },
    tab: { title: 'Canvas', address: 'canvas.calpoly.edu', href: 'https://canvas.calpoly.edu', icon: CanvasIcon },
  },
  calendar: {
    title: 'Google Calendar',
    description: 'Your calendar, or a sample week',
    component: CalendarWidget,
    editLabel: 'Change calendar',
    size: { w: 5, h: 10, minW: 3, minH: 6 },
    tab: {
      title: 'Google Calendar',
      address: 'calendar.google.com',
      href: 'https://calendar.google.com',
      icon: CalendarIcon,
    },
  },
  search: {
    title: 'Google Search',
    description: 'Search Google in a new tab',
    component: SearchWidget,
    size: { w: 6, h: 6, minW: 4, minH: 5 },
    tab: { title: 'Google', address: 'google.com', href: 'https://www.google.com', icon: GoogleIcon },
  },
  claude: {
    title: 'Claude',
    description: 'Ask Claude; opens with your question filled in',
    component: ClaudeWidget,
    size: { w: 5, h: 7, minW: 3, minH: 5 },
    tab: { title: 'Claude', address: 'claude.ai', href: 'https://claude.ai/new', icon: ClaudeIcon },
  },
}

// "Build your own" starts with the same layout as the example, but every
// widget empty and showing its setup screen.
export const OWN_DEFAULT_LAYOUT = {
  sidebarOpen: true,
  sidebarSize: 28,
  sidebar: [
    { id: 'my-spotify', type: 'spotify' },
    { id: 'my-todo', type: 'todo' },
    { id: 'my-canvas', type: 'canvas' },
    { id: 'my-calendar', type: 'calendar' },
  ],
  sidebarSizes: { 'my-spotify': 22, 'my-todo': 24, 'my-canvas': 28, 'my-calendar': 26 },
  workspace: [
    { id: 'my-search', type: 'search' },
    { id: 'my-claude', type: 'claude' },
  ],
  grid: [
    { i: 'my-search', x: 0, y: 0, w: 7, h: 8 },
    { i: 'my-claude', x: 7, y: 0, w: 5, h: 8 },
  ],
}
