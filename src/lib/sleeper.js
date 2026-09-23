// Sleeper's public read-only API (no sign-in, readable from the browser).
// https://docs.sleeper.com
const BASE = 'https://api.sleeper.app/v1'

async function get(path) {
  let response
  try {
    response = await fetch(`${BASE}${path}`)
  } catch {
    throw new Error('You seem to be offline. Check your connection.')
  }
  if (!response.ok) throw new Error('Sleeper isn’t responding right now. Try again in a minute.')
  return response.json()
}

export function checkUsername(input) {
  const text = String(input ?? '').trim()
  if (!text) return { ok: false, error: 'Type your Sleeper username first.' }
  if (!/^[A-Za-z0-9_]{2,40}$/.test(text)) {
    return { ok: false, error: 'Sleeper usernames are letters, numbers, and underscores (no spaces).' }
  }
  return { ok: true, username: text }
}

// Everything the widget shows for one user: their leagues, and for the chosen
// league this week's matchup and the standings.
export async function loadSleeper(username, leagueId) {
  const user = await get(`/user/${encodeURIComponent(username)}`)
  if (!user?.user_id) throw new Error(`No Sleeper account named “${username}”. Check the spelling.`)

  const state = await get('/state/nfl')
  const season = state.league_season ?? state.season
  const week = state.display_week || state.week || 1
  const leagues = (await get(`/user/${user.user_id}/leagues/nfl/${season}`)) ?? []
  if (leagues.length === 0) return { leagues: [], season, week }

  const league = leagues.find((item) => item.league_id === leagueId) ?? leagues[0]
  const [rosters, users, matchups] = await Promise.all([
    get(`/league/${league.league_id}/rosters`),
    get(`/league/${league.league_id}/users`),
    get(`/league/${league.league_id}/matchups/${week}`),
  ])

  const teams = rosters.map((roster) => {
    const owner = users.find((item) => item.user_id === roster.owner_id)
    return {
      rosterId: roster.roster_id,
      name: owner?.metadata?.team_name || owner?.display_name || `Team ${roster.roster_id}`,
      wins: roster.settings?.wins ?? 0,
      losses: roster.settings?.losses ?? 0,
      ties: roster.settings?.ties ?? 0,
      points: (roster.settings?.fpts ?? 0) + (roster.settings?.fpts_decimal ?? 0) / 100,
      isMe: roster.owner_id === user.user_id,
    }
  })
  const me = teams.find((team) => team.isMe)
  const myMatch = matchups?.find((item) => item.roster_id === me?.rosterId)
  const theirMatch = matchups?.find((item) => item.matchup_id === myMatch?.matchup_id && item.roster_id !== me?.rosterId)
  const opponent = teams.find((team) => team.rosterId === theirMatch?.roster_id)

  return {
    leagues: leagues.map((item) => ({ id: item.league_id, name: item.name })),
    leagueId: league.league_id,
    leagueName: league.name,
    season,
    week,
    matchup: me && myMatch ? { me, opponent, myPoints: myMatch.points ?? 0, theirPoints: theirMatch?.points ?? 0 } : null,
    standings: [...teams].sort((a, b) => b.wins - a.wins || b.points - a.points),
  }
}

// Alex's made-up league for the example dashboard.
export function sampleSleeper() {
  const team = (name, wins, losses, points, isMe = false) => ({ name, wins, losses, ties: 0, points, isMe })
  const me = team('Alex’s Avengers', 2, 0, 251.4, true)
  const opponent = team('Taco Tuesday FC', 1, 1, 233.9)
  return {
    leagues: [{ id: 'sample', name: 'Mustang Fantasy League' }],
    leagueId: 'sample',
    leagueName: 'Mustang Fantasy League',
    week: 3,
    matchup: { me, opponent, myPoints: 104.62, theirPoints: 98.18 },
    standings: [
      me,
      team('Brady’s Bunch', 2, 0, 244.1),
      team('Poly Pigskins', 2, 0, 219.7),
      opponent,
      team('The Fightin’ Mustangs', 1, 1, 228.3),
      team('Kennedy Library Legends', 1, 1, 201.5),
      team('SLO Motion', 0, 2, 190.2),
      team('Bishop Peak Bombers', 0, 2, 176.8),
    ],
  }
}
