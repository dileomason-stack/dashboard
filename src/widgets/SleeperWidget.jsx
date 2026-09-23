import { useMemo, useState } from 'react'
import {
  canPlay,
  checkUsername,
  lineupProjection,
  loadSleeper,
  SAMPLE_LINEUP,
  SAMPLE_PLAYERS,
  sampleSleeper,
  swapIntoSlot,
  teamLogo,
} from '../lib/sleeper.js'
import { useLoader } from '../lib/useFetch.js'
import { useStoreValue, widgetDataKey } from '../storage.js'
import LinkSetup from './LinkSetup.jsx'

// Settings: { username, leagueId } for a real account, or { sample: true,
// lineup } for Alex's example (lineup = his starters/bench after any swaps).
const isSettings = (value) => value && typeof value === 'object'
const NO_SETTINGS = {}

const record = (team) => `${team.wins}-${team.losses}${team.ties ? `-${team.ties}` : ''}`

// Alex's lineup: click a starter, then a highlighted bench player, to swap
// them (or the other way around). Only players who can play that slot light up.
function Lineup({ lineup, onChange }) {
  // { kind: 'slot', index } or { kind: 'bench', id }
  const [selected, setSelected] = useState(null)

  const eligible = (slotIndex, benchId) => canPlay(lineup.slots[slotIndex], benchId)
  const highlightSlot = (index) => selected?.kind === 'bench' && eligible(index, selected.id)
  const highlightBench = (id) => selected?.kind === 'slot' && eligible(selected.index, id)

  function clickSlot(index) {
    if (selected?.kind === 'bench' && eligible(index, selected.id)) {
      onChange(swapIntoSlot(lineup, index, selected.id))
      setSelected(null)
    } else {
      setSelected(selected?.kind === 'slot' && selected.index === index ? null : { kind: 'slot', index })
    }
  }

  function clickBench(id) {
    if (selected?.kind === 'slot' && eligible(selected.index, id)) {
      onChange(swapIntoSlot(lineup, selected.index, id))
      setSelected(null)
    } else {
      setSelected(selected?.kind === 'bench' && selected.id === id ? null : { kind: 'bench', id })
    }
  }

  const row = (id, label, isSelected, isTarget, onClick) => {
    const p = SAMPLE_PLAYERS[id]
    return (
      <li key={`${label}-${id}`}>
        <button
          type="button"
          className={`player-row${isSelected ? ' selected' : ''}${isTarget ? ' target' : ''}`}
          onClick={onClick}
          aria-pressed={isSelected}
        >
          <span className={`slot slot-${label}`}>{label}</span>
          <img className="player-logo" src={teamLogo(p.team)} alt="" width="26" height="26" loading="lazy" />
          <span className="player-name">
            <span>
              {p.name}
              {p.status && <span className="injury-tag">{p.status}</span>}
            </span>
            <span className="player-meta">
              {p.pos} · {p.team} · {p.game}
            </span>
          </span>
          <span className="player-points">
            {p.proj.toFixed(2)}
            <span className="player-proj">proj</span>
          </span>
        </button>
      </li>
    )
  }

  return (
    <div className="lineup">
      <p className="lineup-hint">
        {selected ? 'Now tap a highlighted player to swap them.' : 'Tap a player to swap them with someone on the bench.'}
      </p>
      <ul className="player-list">
        {lineup.starters.map((id, index) =>
          row(id, lineup.slots[index], selected?.kind === 'slot' && selected.index === index, highlightSlot(index), () =>
            clickSlot(index),
          ),
        )}
      </ul>
      <p className="bench-label">Bench</p>
      <ul className="player-list">
        {lineup.bench.map((id) =>
          row(id, 'BN', selected?.kind === 'bench' && selected.id === id, highlightBench(id), () => clickBench(id)),
        )}
      </ul>
    </div>
  )
}

function SleeperView({ data, onLeagueChange, lineup, onLineupChange }) {
  const [view, setView] = useState(lineup ? 'lineup' : 'league')
  const matchup = data.matchup && lineup ? { ...data.matchup, myPoints: lineupProjection(lineup) } : data.matchup
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
        <span className="toolbar-note">
          Week {data.week}
          {matchup?.projected && ' · projected'}
        </span>
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

      <div className="segmented-tabs" role="tablist">
        {[
          ['lineup', 'Lineup'],
          ['league', 'League'],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={view === key}
            className={view === key ? 'active' : undefined}
            onClick={() => setView(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {view === 'lineup' ? (
        lineup ? (
          <Lineup lineup={lineup} onChange={onLineupChange} />
        ) : (
          <p className="empty-state">
            Sleeper only lets other apps read league info, so set your lineup in the{' '}
            <a href="https://sleeper.com" target="_blank" rel="noopener noreferrer">
              Sleeper app
            </a>
            .
          </p>
        )
      ) : (
        <ol className="standings">
          {data.standings.map((team) => (
            <li key={team.name} className={team.isMe ? 'me' : undefined}>
              <span className="standings-name">{team.name}</span>
              <span className="standings-record">{record(team)}</span>
              <span className="standings-points">{team.points.toFixed(1)}</span>
            </li>
          ))}
        </ol>
      )}
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

  if (sample) {
    const lineup = settings.lineup?.starters ? settings.lineup : SAMPLE_LINEUP
    return (
      <SleeperView
        data={sample}
        onLeagueChange={() => {}}
        lineup={lineup}
        onLineupChange={(next) => setSettings((current) => ({ ...current, lineup: next }))}
      />
    )
  }

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
