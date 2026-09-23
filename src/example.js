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

export function sampleEvents(now = new Date()) {
  // A Mon/Wed/Fri + Tue/Thu class pattern, generated for the next 5 days.
  const events = []
  for (let days = 0; days < 5; days++) {
    const weekday = atTime(days, 0, 0, now).getDay()
    if (weekday === 0 || weekday === 6) {
      if (weekday === 6) events.push(['Farmers market with roommates', days, 10, 0, 12, 0])
      continue
    }
    if (weekday % 2 === 1) {
      events.push(['CSC 202 Lecture', days, 9, 10, 10, 0])
      events.push(['MATH 143', days, 11, 10, 12, 0])
    } else {
      events.push(['PSY 201', days, 10, 10, 11, 30])
      events.push(['ENGL 134', days, 13, 40, 15, 0])
    }
    if (weekday === 2) events.push(['CSC 202 Lab', days, 15, 10, 18, 0])
    if (weekday === 3) events.push(['Study group, Kennedy Library', days, 16, 0, 17, 30])
    if (weekday === 4) events.push(['Vibe coding club', days, 18, 0, 19, 0])
  }
  return events.map(([title, days, h1, m1, h2, m2], index) => ({
    id: `event-${index}`,
    title,
    start: atTime(days, h1, m1, now).toISOString(),
    end: atTime(days, h2, m2, now).toISOString(),
  }))
}

// Lofi Girl's "beats to relax/study to" playlist.
const EXAMPLE_PLAYLIST = 'https://open.spotify.com/playlist/0vvXsWCC9xrXsKd4FyS8kM'

export function exampleSeed() {
  // Alex's 🧰 Tools dashboard is the Tools template with fixed ids.
  const toolCount = {}
  const tools = TEMPLATES.tools.build((type) => {
    toolCount[type] = (toolCount[type] ?? 0) + 1
    return `ext-${type}-${toolCount[type]}`
  })
  const toolsData = Object.fromEntries(Object.entries(tools.data).map(([id, settings]) => [`widget:${id}`, settings]))
  // …and 🎮 Fun is the Fun template.
  const funCount = {}
  const fun = TEMPLATES.fun.build((type) => {
    funCount[type] = (funCount[type] ?? 0) + 1
    return `exf-${type}-${funCount[type]}`
  })
  const funData = Object.fromEntries(Object.entries(fun.data).map(([id, settings]) => [`widget:${id}`, settings]))

  return {
    // Alex's three dashboards. "main" uses the "layout" key.
    dashboards: {
      // Opens on Morning check: the clearest first impression. Everything
      // (the busiest view) comes last.
      list: [
        { id: 'morning', name: '☀️ Morning check' },
        { id: 'project', name: '💻 CSC 202 project' },
        { id: 'tools', name: '🧰 Tools' },
        { id: 'fun', name: '🎮 Fun' },
        { id: 'main', name: '⭐ Everything' },
      ],
      activeId: 'morning',
    },
    layout: {
      sidebarOpen: true,
      sidebarSize: 28,
      sidebar: [
        { id: 'ex-spotify', type: 'spotify' },
        { id: 'ex-todo', type: 'todo' },
        { id: 'ex-canvas', type: 'canvas' },
        { id: 'ex-calendar', type: 'calendar' },
      ],
      sidebarSizes: { 'ex-spotify': 20, 'ex-todo': 24, 'ex-canvas': 30, 'ex-calendar': 26 },
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
    'style:ex-sleeper': { background: '#18202f' },
    // ☀️ Morning check: what's today, what's due, and the news.
    'layout:morning': {
      sidebarOpen: true,
      sidebarSize: 28,
      sidebar: [
        { id: 'exm-todo', type: 'todo' },
        { id: 'exm-calendar', type: 'calendar' },
      ],
      sidebarSizes: { 'exm-todo': 40, 'exm-calendar': 60 },
      workspace: [
        { id: 'exm-canvas', type: 'canvas' },
        { id: 'exm-news', type: 'news' },
        { id: 'exm-scores', type: 'scores' },
        { id: 'exm-search', type: 'search' },
        { id: 'exm-mail', type: 'inbox' },
      ],
      grid: [
        { i: 'exm-canvas', x: 0, y: 0, w: 18, h: 42 },
        { i: 'exm-news', x: 18, y: 0, w: 16, h: 42 },
        { i: 'exm-scores', x: 34, y: 0, w: 14, h: 42 },
        { i: 'exm-search', x: 0, y: 42, w: 30, h: 36 },
        { i: 'exm-mail', x: 30, y: 42, w: 18, h: 36 },
      ],
      gridVersion: 2,
    },
    'widget:exm-todo': [
      { id: 'm1', text: 'Reply to group chat about Friday', done: false },
      { id: 'm2', text: 'Submit parking permit form', done: false },
      { id: 'm3', text: 'Refill water bottle', done: true },
    ],
    'widget:exm-calendar': { sample: true },
    'widget:exm-canvas': { sample: true, done: {} },
    'widget:exm-news': { source: 'npr' },
    'widget:exm-scores': { league: 'nfl', teams: ['SF'] },
    'widget:exm-mail': { sample: true, read: {} },
    // 💻 CSC 202 project: music, project tasks, and help when stuck.
    'layout:project': {
      sidebarOpen: true,
      sidebarSize: 26,
      sidebar: [
        { id: 'exp-spotify', type: 'spotify' },
        { id: 'exp-todo', type: 'todo' },
      ],
      sidebarSizes: { 'exp-spotify': 20, 'exp-todo': 80 },
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
    'layout:tools': tools.layout,
    ...toolsData,
    'layout:fun': fun.layout,
    ...funData,
    'widget:ext-notes-1':
      'CHEM 124 lab notes\n- Molar mass of NaCl: 58.44 g/mol\n- Remember sig figs on the final answer\n\nEssay intro draft goes here…',
  }
}
