import { useMemo } from 'react'
import { checkUsername, loadSleeper, sampleSleeper } from '../lib/sleeper.js'
import { useLoader } from '../lib/useFetch.js'
import { useStoreValue, widgetDataKey } from '../storage.js'
import LinkSetup from './LinkSetup.jsx'

// Settings: { username, leagueId } for a real account, or { sample: true }.
const isSettings = (value) => value && typeof value === 'object'
const NO_SETTINGS = {}

const record = (team) => `${team.wins}-${team.losses}${team.ties ? `-${team.ties}` : ''}`

function SleeperView({ data, onLeagueChange }) {
  const { matchup } = data
  const winning = matchup && matchup.myPoints >= matchup.theirPoints

  return (
    <div className="sleeper">
      <div className="widget-toolbar">
        {data.leagues.length > 1 ? (
          <select value={data.leagueId} onChange={(event) => onLeagueChange(event.target.value)} aria-label="League">
            {data.leagues.map((league) => (
              <option key={league.id} value={league.id}>
                {league.name}
              </option>
            ))}
          </select>
        ) : (
          <strong className="sleeper-league">{data.leagueName}</strong>
        )}
        <span className="toolbar-note">Week {data.week}</span>
      </div>

      {matchup ? (
        <div className="matchup">
          <div className={`matchup-side${winning ? ' ahead' : ''}`}>
            <span className="matchup-name">{matchup.me.name}</span>
            <span className="matchup-record">{record(matchup.me)}</span>
            <span className="matchup-points">{matchup.myPoints.toFixed(2)}</span>
          </div>
          <span className="matchup-vs">vs</span>
          <div className={`matchup-side${!winning ? ' ahead' : ''}`}>
            <span className="matchup-name">{matchup.opponent?.name ?? 'Bye week'}</span>
            <span className="matchup-record">{matchup.opponent ? record(matchup.opponent) : ''}</span>
            <span className="matchup-points">{matchup.theirPoints.toFixed(2)}</span>
          </div>
        </div>
      ) : (
        <p className="empty-state">No matchup this week.</p>
      )}

      <ol className="standings">
        {data.standings.map((team) => (
          <li key={team.name} className={team.isMe ? 'me' : undefined}>
            <span className="standings-name">{team.name}</span>
            <span className="standings-record">{record(team)}</span>
            <span className="standings-points">{team.points.toFixed(1)}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

export default function SleeperWidget({ id }) {
  const [settings, setSettings] = useStoreValue(widgetDataKey(id), NO_SETTINGS, isSettings)
  const sample = useMemo(() => (settings.sample ? sampleSleeper() : null), [settings.sample])
  const key = settings.username ? `${settings.username}|${settings.leagueId ?? ''}` : null
  const { data, error, loading, reload } = useLoader(
    key,
    () => loadSleeper(settings.username, settings.leagueId),
    2 * 60 * 1000,
  )

  if (sample) return <SleeperView data={sample} onLeagueChange={() => {}} />

  if (!settings.username) {
    return (
      <LinkSetup
        heading="See your Sleeper fantasy football matchup and standings."
        steps={['Type your Sleeper username (not your email)', 'No password needed: this only reads public league info']}
        placeholder="Sleeper username"
        check={checkUsername}
        onSave={(result) => setSettings({ username: result.username })}
        extra={
          <button type="button" className="link-button" onClick={() => setSettings({ sample: true })}>
            Or show a sample league
          </button>
        }
      />
    )
  }

  if (error) {
    return (
      <div className="widget-message">
        <p className="form-error">{error}</p>
        <div className="button-row">
          <button type="button" onClick={reload}>
            Try again
          </button>
          <button type="button" onClick={() => setSettings({})}>
            Use a different username
          </button>
        </div>
      </div>
    )
  }
  if (loading) return <p className="empty-state">Loading your leagues…</p>
  if (data.leagues.length === 0) {
    return (
      <div className="widget-message">
        <p>No {data.season} NFL leagues found for {settings.username}.</p>
        <button type="button" onClick={() => setSettings({})}>
          Use a different username
        </button>
      </div>
    )
  }

  return <SleeperView data={data} onLeagueChange={(leagueId) => setSettings((current) => ({ ...current, leagueId }))} />
}
