import { createContext, useContext, useMemo, useState } from 'react'
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
import { useScoringFeed } from '../lib/useScoringFeed.js'
import { loadLiveNflTeams } from '../lib/sports.js'
import { useLoader } from '../lib/useFetch.js'
import { useStoreValue, widgetDataKey } from '../storage.js'
import LinkSetup from './LinkSetup.jsx'

// Settings: { username, leagueId } for a real account, or { sample: true,
// lineup } for Alex's example (lineup = his starters/bench after any swaps).
const isSettings = (value) => value && typeof value === 'object'
const NO_SETTINGS = {}

// NFL teams in a game right now (see loadLiveNflTeams); their players' rows
// are highlighted with the game clock and score.
const LiveTeams = createContext({})
// This week's live stats by Sleeper ID, and which points field to read.
const LiveStats = createContext({ stats: {}, pointsKey: 'pts_ppr' })

// Scoring updates, newest first, like the Sleeper app's notifications:
// the newest one shows as a banner; click it to see the rest.
function ScoringTicker({ updates, liveTeams }) {
  const [open, setOpen] = useState(false)
  if (updates.length === 0) return null
  const line = (update) => (
    <>
      <strong>{update.name}</strong>{' '}
      <span className={update.points < 0 ? 'ticker-points down' : 'ticker-points'}>
        {update.total ? '' : update.points > 0 ? '+' : ''}
        {update.points.toFixed(1)} pts
      </span>
      {update.detail && <span className="ticker-detail"> · {update.detail}</span>}
      {update.total && <span className="ticker-detail"> · {liveTeams[update.team] ? 'so far' : 'final'}</span>}
    </>
  )
  const [latest, ...rest] = updates
  return (
    <div className={`scoring-ticker${open ? ' open' : ''}`}>
      <button type="button" className="ticker-latest" onClick={() => setOpen(!open)} aria-expanded={open} key={latest.key}>
        {liveTeams[latest.team] && <span className="live-tag" aria-hidden="true" />}
        <span className="ticker-line">{line(latest)}</span>
        {rest.length > 0 && <span className="ticker-more">{open ? 'Hide' : `+${rest.length}`}</span>}
      </button>
      {open && (
        <ul className="ticker-list">
          {rest.map((update) => (
            <li key={update.key}>{line(update)}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

function LiveNote({ game }) {
  return (
    <>
      <span className="live-tag">LIVE</span> {game.clock} · {game.score}
    </>
  )
}

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

  const liveTeams = useContext(LiveTeams)
  const { stats, pointsKey } = useContext(LiveStats)

  const row = (id, label, isSelected, isTarget, onClick) => {
    const p = SAMPLE_PLAYERS[id]
    const game = liveTeams[p.team]
    return (
      <li key={`${label}-${id}`}>
        <button
          type="button"
          className={`player-row${isSelected ? ' selected' : ''}${isTarget ? ' target' : ''}${game ? ' live' : ''}`}
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
              {p.pos} · {p.team} · {game ? <LiveNote game={game} /> : p.game}
            </span>
          </span>
          <span className="player-points">
            {stats[p.sleeperId] ? (stats[p.sleeperId][pointsKey] ?? 0).toFixed(2) : p.proj.toFixed(2)}
            <span className="player-proj">{stats[p.sleeperId] ? 'pts' : 'proj'}</span>
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

const SLEEPER_APP = 'https://sleeper.com'

function formatAdds(count) {
  return count >= 1000000 ? `${(count / 1000000).toFixed(1)}M` : count >= 1000 ? `${Math.round(count / 1000)}K` : `${count}`
}

// One read-only player row (real accounts): slot, logo, name + injury,
// position/team/opponent, and live points or projection.
function PlayerRow({ label, player: listed, extra }) {
  const game = useContext(LiveTeams)[listed.team]
  const { stats, pointsKey } = useContext(LiveStats)
  // The stats feed is checked more often than the league, so its points are fresher.
  const player = stats[listed.id] ? { ...listed, points: stats[listed.id][pointsKey] ?? 0 } : listed
  const empty = player.id === '0'
  const hasPoints = player.points !== null && player.points !== undefined && (player.points > 0 || !!stats[player.id])
  return (
    <li>
      <div className={`player-row static${game ? ' live' : ''}`}>
        <span className={`slot slot-${label}`}>{label}</span>
        {player.team ? (
          <img className="player-logo" src={teamLogo(player.team)} alt="" width="26" height="26" loading="lazy" />
        ) : (
          <span className="player-logo" />
        )}
        <span className="player-name">
          <span>
            {player.name}
            {player.injury && <span className="injury-tag">{player.injury.toUpperCase().slice(0, 4)}</span>}
          </span>
          {!empty && (
            <span className="player-meta">
              {[player.pos, player.team, !game && player.opponent && `vs ${player.opponent}`, extra].filter(Boolean).join(' · ')}
              {game && (
                <>
                  {' · '}
                  <LiveNote game={game} />
                </>
              )}
            </span>
          )}
        </span>
        {!empty && (
          <span className="player-points">
            {hasPoints ? player.points.toFixed(2) : player.proj !== null ? player.proj.toFixed(2) : '–'}
            <span className="player-proj">{hasPoints ? 'pts' : player.proj !== null ? 'proj' : ''}</span>
          </span>
        )}
      </div>
    </li>
  )
}

function MyTeam({ roster }) {
  return (
    <div className="lineup">
      <p className="lineup-hint">
        Sleeper only lets other apps read your team.{' '}
        <a href={SLEEPER_APP} target="_blank" rel="noopener noreferrer">
          Set your lineup in Sleeper ↗
        </a>
      </p>
      <ul className="player-list">
        {roster.starters.map(({ slot, player }, index) => (
          <PlayerRow key={`${index}-${player.id}`} label={slot} player={player} />
        ))}
      </ul>
      {roster.bench.length > 0 && (
        <>
          <p className="bench-label">Bench</p>
          <ul className="player-list">
            {roster.bench.map((player) => (
              <PlayerRow key={player.id} label="BN" player={player} />
            ))}
          </ul>
        </>
      )}
      {roster.reserve.length > 0 && (
        <>
          <p className="bench-label">Injured reserve</p>
          <ul className="player-list">
            {roster.reserve.map((player) => (
              <PlayerRow key={player.id} label="IR" player={player} />
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

function Waivers({ waivers }) {
  return (
    <div className="lineup">
      <p className="lineup-hint">
        Most-added players on Sleeper today who are still available in your league.{' '}
        <a href={SLEEPER_APP} target="_blank" rel="noopener noreferrer">
          Claim in Sleeper ↗
        </a>
      </p>
      {waivers.length === 0 ? (
        <p className="empty-state">Every trending player is already on a team in your league.</p>
      ) : (
        <ul className="player-list">
          {waivers.map((player) => (
            <PlayerRow key={player.id} label={player.pos || 'FA'} player={player} extra={`+${formatAdds(player.adds)} adds`} />
          ))}
        </ul>
      )}
    </div>
  )
}

function SleeperView({ data, onLeagueChange, lineup, onLineupChange }) {
  const views = lineup
    ? [
        ['lineup', 'Lineup'],
        ['league', 'League'],
      ]
    : [
        ['team', 'My team'],
        ['waivers', 'Waivers'],
        ['league', 'League'],
      ]
  const [view, setView] = useState(views[0][0])
  const matchup = data.matchup && lineup ? { ...data.matchup, myPoints: lineupProjection(lineup) } : data.matchup
  const winning = matchup && matchup.myPoints >= matchup.theirPoints
  // Checked every minute; if ESPN can't be reached, nothing is highlighted.
  const { data: liveTeams } = useLoader('nfl-live', loadLiveNflTeams, 60 * 1000)

  // Everyone on the roster (Alex's players carry their real Sleeper IDs).
  const players = useMemo(
    () =>
      lineup
        ? [...lineup.starters, ...lineup.bench].map((id) => ({ ...SAMPLE_PLAYERS[id], id: SAMPLE_PLAYERS[id].sleeperId }))
        : data.roster
          ? [...data.roster.starters.map((slot) => slot.player), ...data.roster.bench].filter((player) => player.id !== '0')
          : [],
    [lineup, data.roster],
  )
  const feed = useScoringFeed(players, {
    season: data.season,
    week: data.week,
    scoring: data.scoring,
    gamesLive: Object.keys(liveTeams ?? {}).length > 0,
  })

  return (
    <LiveTeams.Provider value={liveTeams ?? {}}>
      <LiveStats.Provider value={feed}>
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

          <ScoringTicker updates={feed.updates} liveTeams={liveTeams ?? {}} />

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
            {views.map(([key, label]) => (
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

          {view === 'lineup' && lineup ? (
            <Lineup lineup={lineup} onChange={onLineupChange} />
          ) : view === 'team' && data.roster ? (
            <MyTeam roster={data.roster} />
          ) : view === 'waivers' && data.waivers ? (
            <Waivers waivers={data.waivers} />
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
      </LiveStats.Provider>
    </LiveTeams.Provider>
  )
}

export default function SleeperWidget({ id }) {
  const [settings, setSettings] = useStoreValue(widgetDataKey(id), NO_SETTINGS, isSettings)
  const sample = useMemo(() => (settings.sample ? sampleSleeper() : null), [settings.sample])
  const key = settings.username ? `${settings.username}|${settings.leagueId ?? ''}` : null
  const { data, error, loading, reload } = useLoader(key, () => loadSleeper(settings.username, settings.leagueId), 2 * 60 * 1000)

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
        <p>
          No {data.season} NFL leagues found for {settings.username}.
        </p>
        <button type="button" onClick={() => setSettings({})}>
          Use a different username
        </button>
      </div>
    )
  }

  return <SleeperView data={data} onLeagueChange={(leagueId) => setSettings((current) => ({ ...current, leagueId }))} />
}
