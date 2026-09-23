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

// ----- Alex's sample lineup (made-up players on real NFL teams) -----

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

const player = (id, name, pos, team, proj, pts, status) => ({ id, name, pos, team, proj, pts, status })

export const SAMPLE_PLAYERS = {
  qb1: player('qb1', 'Jalen Ward', 'QB', 'BUF', 21.4, 18.6, 'Final'),
  rb1: player('rb1', 'Marcus Hale', 'RB', 'SF', 15.2, 22.1, 'Q3 4:12'),
  rb2: player('rb2', 'Dante Brooks', 'RB', 'DET', 13.8, 9.4, 'Final'),
  wr1: player('wr1', 'Tyler Okafor', 'WR', 'MIA', 14.9, 16.2, 'Final'),
  wr2: player('wr2', 'Chris Delgado', 'WR', 'LAR', 12.7, 7.8, 'Q3 4:12'),
  te1: player('te1', 'Owen Price', 'TE', 'KC', 10.1, 11.5, 'Final'),
  wr3: player('wr3', 'Andre Simmons', 'WR', 'CIN', 11.6, 13.0, 'Final'),
  k1: player('k1', 'Luis Moreno', 'K', 'BAL', 8.2, 6.0, 'Final'),
  def1: player('def1', '49ers D/ST', 'DEF', 'SF', 7.5, 0, 'Q3 4:12'),
  rb3: player('rb3', 'Kevin Tran', 'RB', 'GB', 9.8, 12.4, 'Final'),
  wr4: player('wr4', 'Isaiah Ford', 'WR', 'SEA', 10.2, 14.8, 'Final'),
  qb2: player('qb2', 'Blake Carter', 'QB', 'NYJ', 16.3, 19.2, 'Final'),
  te2: player('te2', 'Sam Whitfield', 'TE', 'PHI', 6.4, 3.1, 'Final'),
  def2: player('def2', 'Cowboys D/ST', 'DEF', 'DAL', 6.8, 9.0, 'Final'),
}

// Starting slots in order, and who fills them; everyone else is on the bench.
export const SAMPLE_LINEUP = {
  slots: ['QB', 'RB', 'RB', 'WR', 'WR', 'TE', 'FLEX', 'K', 'DEF'],
  starters: ['qb1', 'rb1', 'rb2', 'wr1', 'wr2', 'te1', 'wr3', 'k1', 'def1'],
  bench: ['rb3', 'wr4', 'qb2', 'te2', 'def2'],
}

export const lineupPoints = (lineup) =>
  lineup.starters.reduce((sum, id) => sum + (SAMPLE_PLAYERS[id]?.pts ?? 0), 0)

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
