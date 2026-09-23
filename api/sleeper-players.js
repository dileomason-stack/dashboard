// GET /api/sleeper-players?ids=4984,7547,HOU&season=2026&week=3
//   ->  { players: { [id]: { name, pos, team, injury, opponent, proj: { ppr, half, std } } } }
// Sleeper's full player list is ~15 MB and its projections ~2 MB, far too
// much for every visitor's browser. This fetches them server-side (kept in
// memory for a few hours between requests) and returns only the players asked
// for. Only api.sleeper.app is ever contacted.

const PLAYERS_TTL = 6 * 60 * 60 * 1000
const PROJECTIONS_TTL = 30 * 60 * 1000
const MAX_IDS = 120

let playersCache = null
const projectionsCache = new Map()

function json(status, body, cache = 'no-store') {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': cache },
  })
}

async function loadPlayers() {
  if (playersCache && Date.now() - playersCache.at < PLAYERS_TTL) return playersCache.byId
  const response = await fetch('https://api.sleeper.app/v1/players/nfl', { signal: AbortSignal.timeout(20000) })
  if (!response.ok) throw new Error('players')
  const all = await response.json()
  const byId = {}
  for (const [id, p] of Object.entries(all)) {
    byId[id] = {
      name: p.full_name || [p.first_name, p.last_name].filter(Boolean).join(' ') || id,
      pos: p.position ?? '',
      team: p.team ?? '',
      injury: p.injury_status ?? '',
    }
  }
  playersCache = { at: Date.now(), byId }
  return byId
}

// Sleeper's projections endpoint isn't officially documented, so failures
// here just mean "no projections" rather than an error.
async function loadProjections(season, week) {
  const key = `${season}-${week}`
  const cached = projectionsCache.get(key)
  if (cached && Date.now() - cached.at < PROJECTIONS_TTL) return cached.byId
  try {
    const positions = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'].map((pos) => `position%5B%5D=${pos}`).join('&')
    const response = await fetch(
      `https://api.sleeper.app/projections/nfl/${season}/${week}?season_type=regular&${positions}&order_by=ppr`,
      { signal: AbortSignal.timeout(15000) },
    )
    if (!response.ok) return {}
    const byId = {}
    for (const row of await response.json()) {
      const stats = row.stats ?? {}
      if (stats.pts_ppr === undefined) continue
      byId[row.player_id] = {
        proj: { ppr: stats.pts_ppr ?? 0, half: stats.pts_half_ppr ?? 0, std: stats.pts_std ?? 0 },
        opponent: row.opponent ?? '',
      }
    }
    projectionsCache.set(key, { at: Date.now(), byId })
    return byId
  } catch {
    return {}
  }
}

export async function GET(request) {
  const params = new URL(request.url).searchParams
  const ids = [...new Set((params.get('ids') ?? '').split(','))].filter((id) => /^[A-Za-z0-9]{1,12}$/.test(id)).slice(0, MAX_IDS)
  const season = /^\d{4}$/.test(params.get('season') ?? '') ? params.get('season') : null
  const week = Number(params.get('week'))
  if (ids.length === 0) return json(400, { error: 'No players asked for.' })

  let players
  try {
    players = await loadPlayers()
  } catch {
    return json(502, { error: 'Sleeper isn’t responding right now. Try again in a minute.' })
  }
  const projections = season && week >= 1 && week <= 22 ? await loadProjections(season, week) : {}

  const result = {}
  for (const id of ids) {
    if (!players[id]) continue
    result[id] = { ...players[id], opponent: projections[id]?.opponent ?? '', proj: projections[id]?.proj ?? null }
  }
  return json(200, { players: result }, 'public, max-age=120, s-maxage=600')
}
