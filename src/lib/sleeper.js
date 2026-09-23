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
    // Week 3 hasn't been played: these are projected points.
    matchup: { me, opponent, myPoints: 0, theirPoints: 131.45, projected: true },
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

// ----- Alex's sample lineup (a real roster, week 3 projections) -----

// Which positions each starting slot accepts.
export const SLOT_POSITIONS = {
  QB: ['QB'],
  RB: ['RB'],
  WR: ['WR'],
  TE: ['TE'],
  FLEX: ['RB', 'WR', 'TE'],
  K: ['K'],
  DEF: ['DEF'],
}

// status: injury tag shown next to the name (e.g. 'QUES' = questionable).
const player = (id, name, pos, team, proj, game, status = '') => ({ id, name, pos, team, proj, game, status })

export const SAMPLE_PLAYERS = {
  lawrence: player('lawrence', 'Trevor Lawrence', 'QB', 'JAX', 18.98, 'Sun 10:00 AM vs NE'),
  hampton: player('hampton', 'Omarion Hampton', 'RB', 'LAC', 14.32, 'Sun 10:00 AM @ BUF'),
  barkley: player('barkley', 'Saquon Barkley', 'RB', 'PHI', 15.92, 'Mon 5:15 PM @ CHI', 'QUES'),
  stbrown: player('stbrown', 'Amon-Ra St. Brown', 'WR', 'DET', 19.55, 'Sun 10:00 AM vs NYJ'),
  jwilliams: player('jwilliams', 'Jameson Williams', 'WR', 'DET', 12.6, 'Sun 10:00 AM vs NYJ'),
  kraft: player('kraft', 'Tucker Kraft', 'TE', 'GB', 11.49, 'Thu 5:15 PM vs ATL'),
  mcconkey: player('mcconkey', 'Ladd McConkey', 'WR', 'LAC', 13.77, 'Sun 10:00 AM @ BUF'),
  hubbard: player('hubbard', 'Chuba Hubbard', 'RB', 'CAR', 14.17, 'Sun 10:00 AM @ CLE'),
  mcpherson: player('mcpherson', 'Evan McPherson', 'K', 'CIN', 7.6, 'Sun 10:00 AM @ PIT'),
  texans: player('texans', 'Houston Texans', 'DEF', 'HOU', 7.86, 'Sun 10:00 AM @ IND'),
  prescott: player('prescott', 'Dak Prescott', 'QB', 'DAL', 18.58, 'Sun 1:25 PM vs BAL'),
  monangai: player('monangai', 'Kyle Monangai', 'RB', 'CHI', 7.05, 'Mon 5:15 PM vs PHI'),
  warren: player('warren', 'Jaylen Warren', 'RB', 'PIT', 13.39, 'Sun 10:00 AM vs CIN'),
  tucker: player('tucker', 'Tre Tucker', 'WR', 'LV', 8.99, 'Sun 1:25 PM @ NO'),
  mitchell: player('mitchell', 'Adonai Mitchell', 'WR', 'NYJ', 9.2, 'Sun 10:00 AM @ DET'),
  ferguson: player('ferguson', 'Jake Ferguson', 'TE', 'DAL', 9.29, 'Sun 1:25 PM vs BAL'),
}

// Starting slots in order, and who fills them; everyone else is on the bench.
export const SAMPLE_LINEUP = {
  slots: ['QB', 'RB', 'RB', 'WR', 'WR', 'TE', 'FLEX', 'FLEX', 'K', 'DEF'],
  starters: ['lawrence', 'hampton', 'barkley', 'stbrown', 'jwilliams', 'kraft', 'mcconkey', 'hubbard', 'mcpherson', 'texans'],
  bench: ['prescott', 'monangai', 'warren', 'tucker', 'mitchell', 'ferguson'],
}

// Games haven't started, so the matchup compares projected points.
export const lineupProjection = (lineup) =>
  lineup.starters.reduce((sum, id) => sum + (SAMPLE_PLAYERS[id]?.proj ?? 0), 0)

export const teamLogo = (team) => `https://a.espncdn.com/i/teamlogos/nfl/500/${team.toLowerCase()}.png`

export const canPlay = (slot, playerId) => SLOT_POSITIONS[slot]?.includes(SAMPLE_PLAYERS[playerId]?.pos)

// Swap a starter (by slot index) with a bench player, if the bench player can
// play that slot. Returns the new lineup, or the same one if not allowed.
export function swapIntoSlot(lineup, slotIndex, benchId) {
  if (!canPlay(lineup.slots[slotIndex], benchId)) return lineup
  const starters = [...lineup.starters]
  const outgoing = starters[slotIndex]
  starters[slotIndex] = benchId
  return { ...lineup, starters, bench: lineup.bench.map((id) => (id === benchId ? outgoing : id)) }
}
