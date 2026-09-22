import SearchWidget from './SearchWidget.jsx'
import TodoWidget from './TodoWidget.jsx'
import { GoogleIcon, TodoIcon } from './icons.jsx'

// Every widget type the dashboard knows about. Adding a new widget means
// writing its component and adding one entry here; the "Add widget" menu
// and the grid pick it up automatically.
// Sizes are in grid units: 12 columns wide, rows are ROW_HEIGHT px tall.
// `tab` is how the widget's browser-style frame looks: tab name and icon, and
// the address bar text. With `href`, clicking the address opens the real site.
export const WIDGETS = {
  search: {
    title: 'Search',
    description: 'Search Google in a new tab',
    component: SearchWidget,
    size: { w: 6, h: 6, minW: 4, minH: 5 },
    tab: { title: 'Google', address: 'google.com', href: 'https://www.google.com', icon: GoogleIcon },
  },
  todo: {
    title: 'To-do',
    description: 'A checklist saved in this browser',
    component: TodoWidget,
    size: { w: 4, h: 9, minW: 3, minH: 5 },
    tab: { title: 'To-do list', address: 'Saved in this browser', icon: TodoIcon },
  },
}

// What a first-time visitor sees. The fixed ids mean "Reset layout" keeps
// the data (like to-do items) of these default widgets.
export const DEFAULT_DASHBOARD = {
  widgets: [
    { id: 'default-search', type: 'search' },
    { id: 'default-todo', type: 'todo' },
  ],
  layout: [
    { i: 'default-search', x: 0, y: 0, w: 7, h: 7 },
    { i: 'default-todo', x: 7, y: 0, w: 5, h: 10 },
  ],
}
