import CalendarWidget from './CalendarWidget.jsx'
import CanvasWidget from './CanvasWidget.jsx'
import ClaudeWidget from './ClaudeWidget.jsx'
import NewsWidget from './NewsWidget.jsx'
import ScoresWidget from './ScoresWidget.jsx'
import SearchWidget from './SearchWidget.jsx'
import SleeperWidget from './SleeperWidget.jsx'
import SpotifyWidget from './SpotifyWidget.jsx'
import TodoWidget from './TodoWidget.jsx'
import {
  CalendarIcon,
  CanvasIcon,
  ClaudeIcon,
  GoogleIcon,
  NewsIcon,
  ScoresIcon,
  SleeperIcon,
  SpotifyIcon,
  TodoIcon,
} from './icons.jsx'

// Every widget type the dashboard knows about. Adding a new widget means
// writing its component and adding one entry here; the "Add widget" menu,
// sidebar, and workspace pick it up automatically.
//
// size: default and minimum size in the workspace grid, which is 48 columns
//   wide with 8px rows (see Workspace.jsx), so h: 50 is about 400px tall.
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
    size: { w: 16, h: 20, minW: 12, minH: 12 },
    tab: { title: 'Spotify', address: 'open.spotify.com', href: 'https://open.spotify.com', icon: SpotifyIcon },
  },
  todo: {
    title: 'To-do',
    description: 'A checklist saved in this browser',
    component: TodoWidget,
    size: { w: 16, h: 58, minW: 12, minH: 24 },
    tab: { title: 'To-do list', address: 'Saved in this browser', icon: TodoIcon },
  },
  canvas: {
    title: 'Canvas assignments',
    description: 'What’s due next across your classes',
    component: CanvasWidget,
    editLabel: 'Change Canvas feed',
    size: { w: 20, h: 65, minW: 12, minH: 24 },
    tab: { title: 'Canvas', address: 'canvas.calpoly.edu', href: 'https://canvas.calpoly.edu', icon: CanvasIcon },
  },
  calendar: {
    title: 'Google Calendar',
    description: 'Your calendar, or a sample week',
    component: CalendarWidget,
    editLabel: 'Change calendar',
    size: { w: 20, h: 65, minW: 12, minH: 30 },
    tab: {
      title: 'Google Calendar',
      address: 'calendar.google.com',
      href: 'https://calendar.google.com',
      icon: CalendarIcon,
    },
  },
  search: {
    title: 'Google Search',
    description: 'Real Google results right in the card',
    component: SearchWidget,
    size: { w: 24, h: 40, minW: 14, minH: 26 },
    tab: { title: 'Google', address: 'google.com', href: 'https://www.google.com', icon: GoogleIcon },
  },
  claude: {
    title: 'Claude',
    description: 'Ask Claude; opens with your question filled in',
    component: ClaudeWidget,
    size: { w: 20, h: 46, minW: 12, minH: 26 },
    tab: { title: 'Claude', address: 'claude.ai', href: 'https://claude.ai/new', icon: ClaudeIcon },
  },
  scores: {
    title: 'Sports scores',
    description: 'Live scores; your teams first',
    component: ScoresWidget,
    size: { w: 16, h: 52, minW: 12, minH: 24 },
    tab: { title: 'Scores', address: 'espn.com', href: 'https://www.espn.com', icon: ScoresIcon },
  },
  sleeper: {
    title: 'Sleeper fantasy',
    description: 'Your fantasy football matchup and standings',
    component: SleeperWidget,
    editLabel: 'Change Sleeper account',
    size: { w: 20, h: 52, minW: 12, minH: 30 },
    tab: { title: 'Sleeper', address: 'sleeper.com', href: 'https://sleeper.com', icon: SleeperIcon },
  },
  news: {
    title: 'News headlines',
    description: 'Latest headlines from NPR, Mustang News, and more',
    component: NewsWidget,
    size: { w: 20, h: 52, minW: 12, minH: 24 },
    tab: { title: 'News', address: 'Headlines', icon: NewsIcon },
  },
}

// "Build your own" starts blank: no widgets and the sidebar closed. The empty
// workspace offers one-click buttons to add each widget.
export const OWN_DEFAULT_LAYOUT = {
  sidebarOpen: false,
  sidebarSize: 28,
  sidebar: [],
  sidebarSizes: {},
  workspace: [],
  grid: [],
  gridVersion: 2,
}
