import { useEffect, useState } from 'react'
import { boardOne, canExit, CAPACITY, COLORS, newLevel, SIZE } from '../lib/busRush.js'
import { useStoreValue, widgetDataKey } from '../storage.js'

// Bus Rush: tap a bus to drive it out of the lot (only if nothing's in front
// of it). It waits in a boarding spot, and passengers at the front of the line
// board buses of their color. Don't fill every spot with buses nobody wants!
// Levels get harder (see difficulty() in busRush.js): from level 4 a simple
// strategy loses, and from level 7 even a smarter one does, but every level
// is checked to be winnable. Settings: { level, best } (level is remembered).
const isSettings = (value) => value && typeof value === 'object'
const NO_SETTINGS = {}
const EXIT_MS = 320
const BOARD_MS = 140
const ARROW = { up: '▲', down: '▼', left: '◀', right: '▶' }

export default function BusRushWidget({ id }) {
  const [settings, setSettings] = useStoreValue(widgetDataKey(id), NO_SETTINGS, isSettings)
  const level = settings.level ?? 1
  const [game, setGame] = useState(() => ({ ...newLevel(level), status: 'play', exiting: null, shaking: null, note: '' }))

  // Board one passenger at a time (so you see it happen); then check for a win
  // (everyone boarded) or a jam (every spot full, nobody at the front fits).
  useEffect(() => {
    if (game.status !== 'play' || game.exiting) return
    const front = game.queue[0]
    const fits = game.slots.some((slot) => slot && slot.color === front && slot.seats < CAPACITY)
    let next = null
    if (front === undefined) next = (current) => ({ ...current, status: 'won' })
    else if (fits) next = boardOne
    else if (game.slots.every(Boolean)) next = (current) => ({ ...current, status: 'lost' })
    if (!next) return
    const timer = setTimeout(() => setGame(next), front === undefined || !fits ? 250 : BOARD_MS)
    return () => clearTimeout(timer)
  }, [game])

  useEffect(() => {
    if (game.status === 'won' && level + 1 > (settings.best ?? 1)) {
      setSettings((current) => ({ ...current, best: level + 1 }))
    }
  }, [game.status]) // eslint-disable-line react-hooks/exhaustive-deps

  function tap(bus) {
    if (game.status !== 'play' || game.exiting) return
    if (!canExit(bus, game.buses)) {
      setGame((current) => ({ ...current, shaking: bus.id, note: 'Something’s in the way!' }))
      setTimeout(() => setGame((current) => ({ ...current, shaking: null })), 350)
      return
    }
    const spot = game.slots.indexOf(null)
    if (spot < 0) {
      setGame((current) => ({ ...current, note: 'All boarding spots are full.' }))
      return
    }
    setGame((current) => ({ ...current, exiting: bus.id, note: '' }))
    setTimeout(() => {
      setGame((current) => {
        const slots = [...current.slots]
        slots[spot] = { color: bus.color, seats: 0 }
        return { ...current, slots, buses: current.buses.filter((other) => other.id !== bus.id), exiting: null }
      })
    }, EXIT_MS)
  }

  function start(nextLevel) {
    if (nextLevel !== level) setSettings((current) => ({ ...current, level: nextLevel }))
    setGame({ ...newLevel(nextLevel), status: 'play', exiting: null, shaking: null, note: '' })
  }

  const cell = 100 / SIZE
  const visibleQueue = game.queue.slice(0, 14)

  return (
    <div className="bus-rush no-drag">
      <div className="bus-header">
        <strong>🚌 Bus Rush</strong>
        <span>
          Level {level}
          {level >= 7 ? ' · 🔥 Expert' : level >= 4 ? ' · ⭐ Tricky' : ''}
        </span>
        <span>{game.queue.length} waiting</span>
        <button type="button" onClick={() => start(level)}>
          Restart
        </button>
      </div>

      <div className="bus-queue" aria-label="Passengers waiting">
        {visibleQueue.map((color, index) => (
          <span key={`${game.queue.length}-${index}`} className={`passenger${index === 0 ? ' front' : ''}`} style={{ background: COLORS[color] }} />
        ))}
        {game.queue.length > visibleQueue.length && <span className="bus-more">+{game.queue.length - visibleQueue.length}</span>}
      </div>

      <div className="bus-spots" aria-label="Boarding spots">
        {game.slots.map((slot, index) => (
          <div key={index} className="bus-spot">
            {slot ? (
              <div className="spot-bus" style={{ background: COLORS[slot.color] }}>
                {Array.from({ length: CAPACITY }, (_, seat) => (
                  <span key={seat} className={seat < slot.seats ? 'seat filled' : 'seat'} />
                ))}
              </div>
            ) : (
              <span className="spot-empty">P</span>
            )}
          </div>
        ))}
      </div>

      <div className="bus-lot">
        <div className="bus-lot-inner">
          {game.buses.map((bus) => {
            const exiting = game.exiting === bus.id
            const [dx, dy] = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[bus.dir]
            return (
              <button
                key={bus.id}
                type="button"
                className={`bus${bus.horizontal ? ' horizontal' : ''}${exiting ? ' exiting' : ''}${game.shaking === bus.id ? ' shaking' : ''}`}
                style={{
                  left: `${bus.x * cell}%`,
                  top: `${bus.y * cell}%`,
                  width: `${(bus.horizontal ? bus.len : 1) * cell}%`,
                  height: `${(bus.horizontal ? 1 : bus.len) * cell}%`,
                  '--bus-color': COLORS[bus.color],
                  transform: exiting ? `translate(${dx * 700}%, ${dy * 700}%)` : undefined,
                }}
                onClick={() => tap(bus)}
                aria-label={`${bus.color} bus facing ${bus.dir}`}
              >
                <span className="bus-arrow">{ARROW[bus.dir]}</span>
              </button>
            )
          })}
        </div>
        {game.status !== 'play' && (
          <div className="bus-overlay">
            <p>{game.status === 'won' ? `Level ${level} cleared! 🎉` : 'Parking jam! 🚧'}</p>
            <button type="button" className="primary" onClick={() => start(game.status === 'won' ? level + 1 : level)}>
              {game.status === 'won' ? `Play level ${level + 1}` : 'Try again'}
            </button>
          </div>
        )}
      </div>
      <p className="bus-note" role="status">
        {game.note ||
          (level >= 4
            ? 'Plan ahead: park buses you’ll need soon, and don’t fill every spot.'
            : 'Tap a bus that has a clear road ahead.')}
      </p>
    </div>
  )
}
