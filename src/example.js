import { TEMPLATES } from './templates.js'

// Everything a first-time visitor sees: a dashboard for Alex, a fictional
// Cal Poly student. Dates are relative to today, so something is always due
// soon no matter when the demo happens. None of this is saved.

export const EXAMPLE_PERSON = 'Alex Rivera'

// Local 11:59 PM, `days` from today.
function endOfDay(days, now = new Date()) {
  const date = new Date(now)
  date.setDate(date.getDate() + days)
  date.setHours(23, 59, 0, 0)
  return date
}

function atTime(days, hours, minutes, now = new Date()) {
  const date = new Date(now)
  date.setDate(date.getDate() + days)
  date.setHours(hours, minutes, 0, 0)
  return date
}

export function sampleAssignments(now = new Date()) {
  const items = [
    ['Lab 4: Linked Lists', 'CSC 202', 0],
    ['Reading Quiz: Ch. 6', 'PSY 201', 1],
    ['Problem Set 5', 'MATH 143', 2],
    ['Essay Draft: Rhetorical Analysis', 'ENGL 134', 3],
    ['Midterm Study Guide', 'PSY 201', 5],
    ['Project 1 Proposal', 'CSC 202', 8],
  ]
  return items.map(([title, course, days], index) => ({
    id: `sample-${index}`,
    title,
    course,
    due: endOfDay(days, now).toISOString(),
    allDay: false,
    url: '',
  }))
}

// Alex's calendar from a week ago to three weeks ahead, in the Day view's
// format: MWF and Tue/Thu classes (with rooms), clubs, a few one-offs that
// overlap a class, and Canvas due dates as all-day events.
export function sampleEvents(now = new Date()) {
  const events = []
  const add = (title, days, [h1, m1], [h2, m2], location = '') =>
    events.push({
      id: `event-${events.length}`,
      title,
      location,
      allDay: false,
      start: atTime(days, h1, m1, now).toISOString(),
      end: atTime(days, h2, m2, now).toISOString(),
    })
  const allDay = (title, days) => {
    const date = atTime(days, 0, 0, now)
    const next = atTime(days + 1, 0, 0, now)
    const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    events.push({ id: `event-${events.length}`, title, location: '', allDay: true, start: key(date), end: key(next) })
  }

  for (let days = -7; days <= 21; days++) {
    const weekday = atTime(days, 0, 0, now).getDay()
    if (weekday === 6) add('Farmers market with roommates', days, [10, 0], [12, 0], 'Downtown SLO')
    if (weekday === 0) add('Hike Bishop Peak', days, [9, 0], [11, 0])
    if (weekday === 0 || weekday === 6) continue
    if (weekday % 2 === 1) {
      add('CSC 202 Lecture', days, [9, 10], [10, 0], 'Bldg 14, Rm 256')
      add('MATH 143', days, [11, 10], [12, 0], 'Bldg 38, Rm 121')
      add('Lunch with Sam', days, [12, 10], [13, 0], 'Vista Grande')
    } else {
      add('PSY 201', days, [10, 10], [11, 30], 'Bldg 180, Rm 101')
      add('ENGL 134', days, [13, 40], [15, 0], 'Bldg 22, Rm 208')
      add('Office hours: Prof. Kim', days, [11, 0], [12, 0], 'Bldg 14, Rm 210')
    }
    if (weekday === 2) add('CSC 202 Lab', days, [15, 10], [18, 0], 'Bldg 20, Rm 127')
    if (weekday === 3) add('Study group', days, [16, 0], [17, 30], 'Kennedy Library')
    if (weekday === 4) add('Vibe coding club', days, [18, 0], [19, 0], 'Bldg 186')
    if (weekday === 5) add('Intramural soccer', days, [17, 0], [18, 30], 'Sports Complex')
  }
  // Canvas due dates (matching the Canvas card).
  allDay('Lab 4: Linked Lists due', 0)
  allDay('Reading Quiz: Ch. 6 due', 1)
  allDay('Problem Set 5 due', 2)
  return events
}

// Lofi Girl's "beats to relax/study to" playlist.
const EXAMPLE_PLAYLIST = 'https://open.spotify.com/playlist/0vvXsWCC9xrXsKd4FyS8kM'

export function exampleSeed() {
  // Alex's 🎮 Fun dashboard is the Fun template with fixed ids.
  const funCount = {}
  const fun = TEMPLATES.fun.build((type) => {
    funCount[type] = (funCount[type] ?? 0) + 1
    return `exf-${type}-${funCount[type]}`
  })
  const funData = Object.fromEntries(Object.entries(fun.data).map(([id, settings]) => [`widget:${id}`, settings]))
  // Alex's example is all white, like the other tabs (a new Fun dashboard made
  // from the template is still dark).
  fun.layout.theme = 'light'

  return {
    // Alex's dashboards. "main" uses the "layout" key.
    dashboards: {
      // Opens on Morning check: the clearest first impression. Everything
      // (the busiest view) comes last.
      list: [
        { id: 'morning', name: '☀️ Morning check' },
        { id: 'project', name: '💻 CSC 202 project' },
        { id: 'fun', name: '🎮 Fun' },
        { id: 'main', name: '⭐ Everything' },
      ],
      activeId: 'morning',
    },
    layout: {
      theme: 'light',
      sidebarOpen: true,
      sidebarSize: 28,
      sidebar: [
        { id: 'ex-spotify', type: 'spotify' },
        { id: 'ex-todo', type: 'todo' },
        { id: 'ex-canvas', type: 'canvas' },
        { id: 'ex-calendar', type: 'calendar' },
      ],
      sidebarSizes: { 'ex-spotify': 12, 'ex-todo': 26, 'ex-canvas': 33, 'ex-calendar': 29 },
      workspace: [
        { id: 'ex-search', type: 'search' },
        { id: 'ex-claude', type: 'claude' },
        { id: 'ex-scores', type: 'scores' },
        { id: 'ex-news', type: 'news' },
        { id: 'ex-sleeper', type: 'sleeper' },
      ],
      grid: [
        { i: 'ex-search', x: 0, y: 0, w: 20, h: 46 },
        { i: 'ex-claude', x: 20, y: 0, w: 12, h: 46 },
        { i: 'ex-scores', x: 32, y: 0, w: 16, h: 46 },
        { i: 'ex-news', x: 0, y: 46, w: 28, h: 52 },
        { i: 'ex-sleeper', x: 28, y: 46, w: 20, h: 52 },
      ],
      gridVersion: 2,
    },
    'widget:ex-spotify': { url: EXAMPLE_PLAYLIST },
    'widget:ex-todo': [
      { id: 't1', text: 'Email Prof. Kim about lab partners', done: true },
      { id: 't2', text: 'Book a study room for Thursday', done: false },
      { id: 't3', text: 'Pick up textbook from El Corral', done: false },
      { id: 't4', text: 'Call mom back', done: true },
      { id: 't5', text: 'Start CSC 202 project proposal', done: false },
    ],
    'widget:ex-canvas': { sample: true, done: {} },
    'widget:ex-calendar': { sample: true },
    // Alex roots for the 49ers and reads the Cal Poly student paper.
    'widget:ex-scores': { league: 'nfl', teams: ['SF'] },
    'widget:ex-news': { source: 'mustang' },
    'widget:ex-sleeper': { sample: true },
    // Sleeper's card wears Sleeper's own navy.
    // ☀️ Morning check: what's today, what's due, and the news.
    // ☀️ Morning check: school stuff down the sidebar, AI helpers and search in
    // the middle, a doc and fantasy football on the right.
    'layout:morning': {
      theme: 'light',
      sidebarOpen: true,
      sidebarSize: 27,
      sidebar: [
        { id: 'exm-canvas', type: 'canvas' },
        { id: 'exm-spotify', type: 'spotify' },
        { id: 'exm-calendar', type: 'calendar' },
        { id: 'exm-mail', type: 'inbox' },
      ],
      sidebarSizes: { 'exm-canvas': 24, 'exm-spotify': 13, 'exm-calendar': 51, 'exm-mail': 12, 'sidebar-space': 0 },
      workspace: [
        { id: 'exm-chatgpt', type: 'chatgpt' },
        { id: 'exm-claude', type: 'claude' },
        { id: 'exm-search', type: 'search' },
        { id: 'exm-doc', type: 'googlefile' },
        { id: 'exm-sleeper', type: 'sleeper' },
      ],
      grid: [
        { i: 'exm-chatgpt', x: 0, y: 0, w: 16, h: 32 },
        { i: 'exm-claude', x: 0, y: 32, w: 16, h: 34 },
        { i: 'exm-search', x: 0, y: 66, w: 16, h: 30 },
        { i: 'exm-doc', x: 16, y: 0, w: 32, h: 60 },
        { i: 'exm-sleeper', x: 16, y: 60, w: 32, h: 44 },
      ],
      gridVersion: 2,
    },
    'widget:exm-canvas': { sample: true, done: {} },
    'widget:exm-spotify': { url: EXAMPLE_PLAYLIST },
    'widget:exm-calendar': { sample: true },
    'widget:exm-mail': { sample: true, read: {} },
    'widget:exm-sleeper': { sample: true },
    // Real shared class notes ("Anyone with the link" can view).
    'widget:exm-doc': { url: 'https://docs.google.com/document/d/1SvlWrpX5kxDIx_D9QJfH7iP6KKnoNao-eCAoJJH0-p8/edit' },
    // 💻 CSC 202 project: music, project tasks, and help when stuck.
    'layout:project': {
      theme: 'light',
      sidebarOpen: true,
      sidebarSize: 26,
      sidebar: [
        { id: 'exp-spotify', type: 'spotify' },
        { id: 'exp-todo', type: 'todo' },
      ],
      sidebarSizes: { 'exp-spotify': 12, 'exp-todo': 88 },
      workspace: [
        { id: 'exp-claude', type: 'claude' },
        { id: 'exp-search', type: 'search' },
        { id: 'exp-canvas', type: 'canvas' },
        { id: 'exp-drive', type: 'googlefile' },
      ],
      grid: [
        { i: 'exp-claude', x: 0, y: 0, w: 22, h: 50 },
        { i: 'exp-search', x: 22, y: 0, w: 26, h: 50 },
        { i: 'exp-canvas', x: 0, y: 50, w: 22, h: 44 },
        { i: 'exp-drive', x: 22, y: 50, w: 26, h: 44 },
      ],
      gridVersion: 2,
    },
    'widget:exp-spotify': { url: EXAMPLE_PLAYLIST },
    'widget:exp-todo': [
      { id: 'p1', text: 'Read the project spec', done: true },
      { id: 'p2', text: 'Implement the LinkedList class', done: false },
      { id: 'p3', text: 'Write test cases for remove()', done: false },
      { id: 'p4', text: 'Office hours Thursday 2pm', done: false },
      { id: 'p5', text: 'Push to GitHub before 11:59', done: false },
    ],
    'widget:exp-canvas': { sample: true, done: {} },
    // A real shared Google Drive folder ("Anyone with the link" can view).
    'widget:exp-drive': { url: 'https://drive.google.com/drive/folders/13uCwzCKaJvj9dXLJOqZotZX4Zpdk3reb' },
    'layout:fun': fun.layout,
    ...funData,
  }
}
