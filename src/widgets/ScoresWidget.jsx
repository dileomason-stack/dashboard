import { useState } from 'react'
import { LEAGUES, loadScoreboard, loadTeams } from '../lib/sports.js'
import { useLoader } from '../lib/useFetch.js'
import { useStoreValue, widgetDataKey } from '../storage.js'

// Settings: { league: 'nfl', teams: ['SF'] }. Your teams' games are listed
// first and highlighted.
const isSettings = (value) => value && typeof value === 'object'
const DEFAULT_SETTINGS = { league: 'nfl', teams: [] }

function TeamPicker({ league, selected, onChange, onDone }) {
  const { data: teams, error, loading } = useLoader(`teams-${league}`, () => loadTeams(league))
  const [filter, setFilter] = useState('')

  if (error) return <p className="form-error">{error}</p>
  if (loading) return <p className="empty-state">Loading teams…</p>

  const shown = teams.filter((team) => team.name.toLowerCase().includes(filter.toLowerCase()))
  const toggle = (abbr) =>
    onChange(selected.includes(abbr) ? selected.filter((item) => item !== abbr) : [...selected, abbr])

  return (
    <div className="team-picker">
      <div className="inline-form">
        <input
          type="text"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Find a team…"
          aria-label="Find a team"
        />
        <button type="button" className="primary" onClick={onDone}>
          Done
        </button>
      </div>
      <ul className="team-list">
        {shown.map((team) => (
          <li key={team.abbr}>
            <label>
              <input type="checkbox" checked={selected.includes(team.abbr)} onChange={() => toggle(team.abbr)} />
              {team.logo && <img src={team.logo} alt="" width="20" height="20" loading="lazy" />}
              {team.name}
            </label>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ESPN's status text for upcoming games is in Eastern time ("9/27 - 4:05 PM
// EDT"); show the visitor's own time zone instead.
function gameStatus(game) {
  if (game.state !== 'pre' || !game.date) return game.status
  const date = new Date(game.date)
  const days = Math.round((date - new Date()) / (24 * 60 * 60 * 1000))
  const day =
    days < 6
      ? date.toLocaleDateString([], { weekday: 'short' })
      : date.toLocaleDateString([], { month: 'numeric', day: 'numeric' })
  return `${day} ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
}

function TeamLine({ team, showScore }) {
  return (
    <div className={`team-line${team.winner ? ' winner' : ''}`}>
      {team.logo ? <img src={team.logo} alt="" width="22" height="22" loading="lazy" /> : <span className="logo-blank" />}
      <span className="team-abbr" title={team.name}>
        {team.abbr}
      </span>
      {team.record && <span className="team-record">{team.record}</span>}
      {showScore && <span className="team-score">{team.score}</span>}
    </div>
  )
}

export default function ScoresWidget({ id }) {
  const [settings, setSettings] = useStoreValue(widgetDataKey(id), DEFAULT_SETTINGS, isSettings)
  const [picking, setPicking] = useState(false)
  const league = LEAGUES[settings.league] ? settings.league : 'nfl'
  const myTeams = Array.isArray(settings.teams) ? settings.teams : []
  // Refresh every minute; ESPN updates live scores continuously.
  const { data, error, loading, reload } = useLoader(league, () => loadScoreboard(league), 60 * 1000)

  const isMine = (game) => myTeams.includes(game.away.abbr) || myTeams.includes(game.home.abbr)
  const games = data ? [...data.games].sort((a, b) => isMine(b) - isMine(a)) : []

  return (
    <div className="scores">
      <div className="widget-toolbar">
        <select
          value={league}
          onChange={(event) => setSettings({ league: event.target.value, teams: [] })}
          aria-label="League"
        >
          {Object.entries(LEAGUES).map(([key, { name }]) => (
            <option key={key} value={key}>
              {name}
            </option>
          ))}
        </select>
        {data?.label && <span className="toolbar-note">{data.label}</span>}
        <button type="button" className="link-button" onClick={() => setPicking((value) => !value)}>
          {myTeams.length ? `★ My teams (${myTeams.length})` : '★ Pick your teams'}
        </button>
      </div>

      {picking ? (
        <TeamPicker
          league={league}
          selected={myTeams}
          onChange={(teams) => setSettings((current) => ({ ...current, league, teams }))}
          onDone={() => setPicking(false)}
        />
      ) : error ? (
        <div className="widget-message">
          <p className="form-error">{error}</p>
          <div className="button-row">
            <button type="button" onClick={reload}>
              Try again
            </button>
          </div>
        </div>
      ) : loading ? (
        <p className="empty-state">Loading scores…</p>
      ) : games.length === 0 ? (
        <p className="empty-state">No {LEAGUES[league].name} games scheduled right now.</p>
      ) : (
        <ul className="game-list">
          {games.map((game) => (
            <li key={game.id} className={[isMine(game) && 'mine', game.state === 'in' && 'live'].filter(Boolean).join(' ') || undefined}>
              <div className="game-teams">
                <TeamLine team={game.away} showScore={game.state !== 'pre'} />
                <TeamLine team={game.home} showScore={game.state !== 'pre'} />
              </div>
              <span className="game-status">
                {game.state === 'in' && <span className="live-dot" aria-hidden="true" />}
                {gameStatus(game)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
