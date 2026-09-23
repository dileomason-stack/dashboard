import { LEAGUES } from '../src/lib/sports.js'

// GET /api/teams?league=nfl  ->  { teams: [{ abbr, name, logo }] }
// ESPN's team list doesn't allow browser requests (no CORS header, unlike its
// scoreboard), so the Scores widget's team picker gets it through here.
// Only the leagues in LEAGUES are accepted. Cached for a day.

function json(status, body, cache = 'no-store') {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': cache },
  })
}

export async function GET(request) {
  const league = LEAGUES[new URL(request.url).searchParams.get('league')]
  if (!league) return json(400, { error: 'Unknown league.' })

  try {
    const response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${league.path}/teams?limit=1000`, {
      signal: AbortSignal.timeout(8000),
    })
    if (!response.ok) return json(502, { error: 'ESPN isn’t responding right now. Try again in a minute.' })
    const data = await response.json()
    const teams = (data.sports?.[0]?.leagues?.[0]?.teams ?? [])
      .map(({ team }) => ({ abbr: team.abbreviation, name: team.displayName, logo: team.logos?.[0]?.href ?? '' }))
      .sort((a, b) => a.name.localeCompare(b.name))
    return json(200, { teams }, 'public, max-age=3600, s-maxage=86400')
  } catch {
    return json(502, { error: 'Couldn’t reach ESPN. Try again in a minute.' })
  }
}
