import SearchWidget from './SearchWidget.jsx'
import TodoWidget from './TodoWidget.jsx'

// Every widget type the dashboard knows about. Adding a new widget means
// writing its component and adding one entry here; the "Add widget" menu
// and the grid pick it up automatically.
// Sizes are in grid units: 12 columns wide, rows are ROW_HEIGHT px tall.
export const WIDGETS = {
  search: {
    title: 'Search',
    description: 'Search Google in a new tab',
    component: SearchWidget,
    size: { w: 6, h: 2, minW: 3, minH: 2 },
  },
  todo: {
    title: 'To-do',
    description: 'A checklist saved in this browser',
    component: TodoWidget,
    size: { w: 4, h: 8, minW: 3, minH: 4 },
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
    { i: 'default-search', x: 0, y: 0, w: 6, h: 2 },
    { i: 'default-todo', x: 0, y: 2, w: 4, h: 8 },
  ],
}
