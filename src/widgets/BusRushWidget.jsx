import { useEffect, useState } from 'react'
import { blockersOf, boardOne, bumpDistance, canExit, COLORS, newLevel, unitOf } from '../lib/busRush.js'
import { useStoreValue, widgetDataKey } from '../storage.js'

// Bus Rush: tap a bus in the pile and it drives the way its arrow points. If
// the road is clear it leaves the lot and parks at the top; if another bus is
// in the way it bumps into it and backs up. The crowd boards parked buses of
// its color (the number under a parked bus is its empty seats). If every spot
// fills with buses nobody at the front wants, it's a jam, unless you unlock
// a "+" spot. Levels get harder (see difficulty() in busRush.js), and every
// level is checked to be winnable. Settings: { level, best }.
const isSettings = (value) => value && typeof value === 'object'
const NO_SETTINGS = {}
const DRIVE_MS = 420
const BUMP_MS = 180
const BOARD_MS = 45
const SHOWN_PEOPLE = 180

function startLevel(level) {
  const layout = newLevel(level)
  return { ...layout, blockers: blockersOf(layout.buses), status: 'play', moving: null, note: '' }
}

export default function BusRushWidget({ id }) {
  const [settings, setSettings] = useStoreValue(widgetDataKey(id), NO_SETTINGS, isSettings)
  const level = settings.level ?? 1
  const [game, setGame] = useState(() => startLevel(level))

  // One person boards at a time (so you can watch the seats fill), then check
  // for a win (everyone boarded) or a jam (every spot full, nobody fits).
  useEffect(() => {
    if (game.status !== 'play' || game.moving) return
    const front = game.crowd[0]
    const fits = game.slots.some((slot) => slot && slot.color === front && slot.seats < slot.capacity)
    let next = null
    if (front === undefined) next = (current) => ({ ...current, status: 'won' })
    else if (fits) next = boardOne
    else if (game.slots.every(Boolean)) next = (current) => ({ ...current, status: 'jam' })
    if (!next) return
    const timer = setTimeout(() => setGame(next), fits ? BOARD_MS : 350)
    return () => clearTimeout(timer)
  }, [game])

  useEffect(() => {
    if (game.status === 'won' && level + 1 > (settings.best ?? 1)) setSettings((current) => ({ ...current, best: level + 1 }))
  }, [game.status]) // eslint-disable-line react-hooks/exhaustive-deps

  function tap(bus) {
    if (game.status !== 'play' || game.moving) return
    if (!canExit(bus, game.buses, game.blockers)) {
      // Drive up to the bus in the way, bump, and back up.
      const distance = Math.max(1, bumpDistance(bus, game.buses) - 0.5)
      setGame((current) => ({ ...current, moving: { id: bus.id, distance }, note: '' }))
      setTimeout(() => setGame((current) => ({ ...current, moving: { id: bus.id, distance: 0 } })), BUMP_MS)
      setTimeout(() => setGame((current) => ({ ...current, moving: null })), BUMP_MS * 2)
      return
    }
    const spot = game.slots.indexOf(null)
    if (spot < 0) {
      setGame((current) => ({ ...current, note: 'Every parking spot is full!' }))
      return
    }
    setGame((current) => ({ ...current, moving: { id: bus.id, distance: 160, leaving: true }, note: '' }))
    setTimeout(() => {
      setGame((current) => {
        const slots = [...current.slots]
        slots[spot] = { color: bus.color, capacity: bus.capacity, seats: 0 }
        return { ...current, slots, buses: current.buses.filter((other) => other.id !== bus.id), moving: null }
      })
    }, DRIVE_MS)
  }

  // "+" spots: an extra parking spot, a few times per level (also rescues a jam).
  function unlockSpot() {
    setGame((current) =>
      current.locked > 0
        ? { ...current, locked: current.locked - 1, slots: [...current.slots, null], status: current.status === 'jam' ? 'play' : current.status }
        : current,
    )
  }

  function start(nextLevel) {
    if (nextLevel !== level) setSettings((current) => ({ ...current, level: nextLevel }))
    setGame(startLevel(nextLevel))
  }

  const people = game.crowd.slice(0, SHOWN_PEOPLE)

  return (
    <div className="bus-rush no-drag">
      <div className="bus-header">
        <strong>🚌 Bus Rush</strong>
        <span>
          Level {level}
          {level >= 7 ? ' · 🔥 Expert' : level >= 4 ? ' · ⭐ Tricky' : ''}
        </span>
        <span>{game.crowd.length} waiting</span>
        <button type="button" onClick={() => start(level)}>
          ↻ Restart
        </button>
      </div>

      <div className="bus-crowd" aria-label={`${game.crowd.length} people waiting`}>
        {people.map((color, index) => (
          <span key={game.crowd.length - index} className="person" style={{ background: COLORS[color] }} />
        ))}
        {game.crowd.length > people.length && <span className="bus-more">+{game.crowd.length - people.length}</span>}
      </div>

      <div className="bus-spots" aria-label="Parking spots">
        {game.slots.map((slot, index) => (
          <div key={index} className="bus-spot">
            {slot ? (
              <>
                <div className="spot-bus" style={{ '--bus-color': COLORS[slot.color] }} />
                <span className="spot-count">{slot.capacity - slot.seats}</span>
              </>
            ) : (
              <span className="spot-empty">P</span>
            )}
          </div>
        ))}
        {Array.from({ length: game.locked }, (_, index) => (
          <button key={`lock-${index}`} type="button" className="bus-spot locked" onClick={unlockSpot} title="Unlock an extra parking spot">
            +
          </button>
        ))}
      </div>

      <div className="bus-lot">
        {game.buses.map((bus) => {
          const moving = game.moving?.id === bus.id ? game.moving : null
          const [dx, dy] = unitOf(bus.angle)
          const distance = moving?.distance ?? 0
          return (
            <button
              key={bus.id}
              type="button"
              className={`lot-bus${moving?.leaving ? ' leaving' : ''}`}
              style={{
                left: `${bus.x}%`,
                top: `${bus.y}%`,
                width: `${bus.len}%`,
                '--bus-color': COLORS[bus.color],
                transform: `translate(-50%, -50%) translate(${dx * distance}cqw, ${dy * distance}cqh) rotate(${bus.angle - 90}deg)`,
              }}
              onClick={() => tap(bus)}
              aria-label={`${bus.color} bus`}
            >
              <span className="lot-bus-arrow">➜</span>
            </button>
          )
        })}
        {game.status !== 'play' && (
          <div className="bus-overlay">
            <p>{game.status === 'won' ? `Level ${level} cleared! 🎉` : 'Parking jam! 🚧'}</p>
            {game.status === 'jam' && game.locked > 0 && (
              <button type="button" onClick={unlockSpot}>
                Use a + spot ({game.locked} left)
              </button>
            )}
            <button type="button" className="primary" onClick={() => start(game.status === 'won' ? level + 1 : level)}>
              {game.status === 'won' ? `Play level ${level + 1}` : 'Try again'}
            </button>
          </div>
        )}
      </div>

      <p className="bus-note" role="status">
        {game.note ||
          (level >= 4
            ? 'Look ahead in the crowd, and free the buses they’ll need before the spots fill up.'
            : 'Tap a bus: it drives the way its arrow points.')}
      </p>
    </div>
  )
}
