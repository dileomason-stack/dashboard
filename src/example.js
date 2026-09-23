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
  return {
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
      ],
      grid: [
        { i: 'ex-search', x: 0, y: 0, w: 7, h: 8 },
        { i: 'ex-claude', x: 7, y: 0, w: 5, h: 8 },
      ],
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
  }
}
