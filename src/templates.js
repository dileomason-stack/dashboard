// Starting points for a new dashboard (the + next to the dashboard tabs).
// Each build(idFor) returns a layout plus initial settings for its widgets.
// idFor(type) gives each widget its id: random for real dashboards, fixed
// for Alex's example. (No imports from the widget registry here, to keep the
// example data and the registry from importing each other.)

function blankLayout() {
  return { sidebarOpen: false, sidebarSize: 28, sidebar: [], sidebarSizes: {}, workspace: [], grid: [], gridVersion: 2 }
}

// sidebar: [[type, share %, settings]], workspace: [[type, x, y, w, h, settings]]
function assemble(idFor, { sidebarSize = 28, sidebar = [], workspace = [] }) {
  const data = {}
  const layout = { ...blankLayout(), sidebarOpen: sidebar.length > 0, sidebarSize }
  for (const [type, share, settings] of sidebar) {
    const id = idFor(type)
    layout.sidebar.push({ id, type })
    layout.sidebarSizes[id] = share
    if (settings !== undefined) data[id] = settings
  }
  for (const [type, x, y, w, h, settings] of workspace) {
    const id = idFor(type)
    layout.workspace.push({ id, type })
    layout.grid.push({ i: id, x, y, w, h })
    if (settings !== undefined) data[id] = settings
  }
  return { layout, data }
}

export const TEMPLATES = {
  blank: {
    label: 'Blank dashboard',
    name: 'New dashboard',
    build: () => ({ layout: blankLayout(), data: {} }),
  },
  tools: {
    label: '🧰 Tools: calculators, periodic table, whiteboard',
    name: '🧰 Tools',
    build: (idFor) =>
      assemble(idFor, {
        sidebarSize: 24,
        sidebar: [
          ['tool', 45, { tool: 'timer' }],
          ['notes', 55],
        ],
        workspace: [
          ['tool', 0, 0, 25, 56, { tool: 'graphing' }],
          ['tool', 25, 0, 23, 46, { tool: 'scientific' }],
          ['tool', 0, 56, 25, 44, { tool: 'whiteboard' }],
          ['tool', 25, 46, 23, 54, { tool: 'periodic' }],
        ],
      }),
  },
  fun: {
    label: '🎮 Fun: daily word, HoopGrids, Globle, chess, game links',
    name: '🎮 Fun',
    build: (idFor) =>
      assemble(idFor, {
        sidebarSize: 26,
        sidebar: [
          ['word', 68],
          [
            'links',
            32,
            {
              links: [
                ['Wordle', 'https://www.nytimes.com/games/wordle/index.html'],
                ['Connections', 'https://www.nytimes.com/games/connections'],
                ['Immaculate Grid', 'https://www.immaculategrid.com'],
                ['Poeltl', 'https://poeltl.nbpa.com'],
                ['Worldle', 'https://worldle.teuteuf.fr'],
                ['Travle', 'https://travle.earth'],
                ['Flagle', 'https://www.flagle.io'],
                ['Metazooa', 'https://www.metazooa.com'],
              ].map(([title, url], index) => ({ id: `game-link-${index}`, title, url })),
            },
          ],
        ],
        workspace: [
          ['game', 0, 0, 18, 58, { tool: 'hoopgrids' }],
          ['game', 18, 0, 15, 58, { tool: 'globle' }],
          ['game', 33, 0, 15, 58, { tool: 'chesspuzzle' }],
          ['game', 0, 58, 24, 52, { tool: 'costcodle' }],
          ['game', 24, 58, 24, 52, { tool: 'framed' }],
        ],
      }),
  },
  morning: {
    label: '☀️ Morning check: to-dos, calendar, due dates, news',
    name: '☀️ Morning check',
    build: (idFor) =>
      assemble(idFor, {
        sidebar: [
          ['todo', 40],
          ['calendar', 60],
        ],
        workspace: [
          ['canvas', 0, 0, 18, 52],
          ['news', 18, 0, 16, 52, { source: 'npr' }],
          ['scores', 34, 0, 14, 52],
          ['search', 0, 52, 34, 40],
        ],
      }),
  },
  project: {
    label: '💻 Project: music, tasks, notes, Claude',
    name: '💻 Project',
    build: (idFor) =>
      assemble(idFor, {
        sidebarSize: 26,
        sidebar: [
          ['spotify', 20],
          ['todo', 80],
        ],
        workspace: [
          ['claude', 0, 0, 22, 50],
          ['search', 22, 0, 26, 50],
          ['notes', 0, 50, 22, 44],
          ['canvas', 22, 50, 26, 44],
        ],
      }),
  },
}
