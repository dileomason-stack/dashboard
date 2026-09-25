// ESPN's public scoreboard data (no key needed, readable from the browser).
export const LEAGUES = {
  nfl: { name: 'NFL', path: 'football/nfl' },
  cfb: { name: 'College football', path: 'football/college-football' },
  nba: { name: 'NBA', path: 'basketball/nba' },
  wnba: { name: 'WNBA', path: 'basketball/wnba' },
  mlb: { name: 'MLB', path: 'baseball/mlb' },
  nhl: { name: 'NHL', path: 'hockey/nhl' },
  mls: { name: 'MLS', path: 'soccer/usa.1' },
}

const BASE = 'https://site.api.espn.com/apis/site/v2/sports'

async function espn(url) {
  let response
  try {
    response = await fetch(url)
  } catch {
    throw new Error('You seem to be offline. Check your connection.')
  }
  if (!response.ok) throw new Error('ESPN isn’t responding right now. Try again in a minute.')
  return response.json()
}

export async function loadScoreboard(league) {
  const data = await espn(`${BASE}/${LEAGUES[league].path}/scoreboard`)
  return {
    label: data.week?.number ? `Week ${data.week.number}` : '',
    games: (data.events ?? []).map((event) => {
      const competition = event.competitions?.[0] ?? {}
      const side = (homeAway) => {
        const team = competition.competitors?.find((competitor) => competitor.homeAway === homeAway) ?? {}
        return {
          abbr: team.team?.abbreviation ?? '?',
          name: team.team?.displayName ?? '',
          logo: team.team?.logo ?? '',
          score: team.score ?? '',
          record: team.records?.[0]?.summary ?? '',
          winner: !!team.winner,
        }
      }
      return {
        id: event.id,
        date: event.date,
        state: event.status?.type?.state ?? 'pre', // pre | in | post
        status: event.status?.type?.shortDetail ?? '',
        away: side('away'),
        home: side('home'),
      }
    }),
  }
}

// ESPN's team list blocks browser requests, so this goes through api/teams.js.
export async function loadTeams(league) {
  let response
  try {
    response = await fetch(`/api/teams?league=${league}`)
  } catch {
    throw new Error('You seem to be offline. Check your connection.')
  }
  const data = await response.json().catch(() => null)
  if (!response.ok || !data) throw new Error(data?.error ?? 'Couldn’t load teams. Try again in a minute.')
  return data.teams
}

// ESPN and Sleeper spell a few NFL teams differently.
const SLEEPER_TEAM = { WSH: 'WAS' }

// NFL teams playing right now, by Sleeper team abbreviation:
// { GB: { clock: '4:32 - 1st', score: 'GB 7 – 3 ATL' }, ATL: { ... } }.
export async function loadLiveNflTeams() {
  const { games } = await loadScoreboard('nfl')
  const live = {}
  for (const game of games) {
    if (game.state !== 'in') continue
    const info = { clock: game.status, score: `${game.away.abbr} ${game.away.score} – ${game.home.score} ${game.home.abbr}` }
    for (const side of [game.away, game.home]) live[SLEEPER_TEAM[side.abbr] ?? side.abbr] = info
  }
  return live
}
