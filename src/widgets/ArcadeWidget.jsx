import { GAMES } from '../lib/tools.js'
import { useStoreValue, widgetDataKey } from '../storage.js'
import BusRushWidget from './BusRushWidget.jsx'
import Game2048Widget from './Game2048Widget.jsx'
import SnakeWidget from './SnakeWidget.jsx'
import TypingWidget from './TypingWidget.jsx'

// One big game screen with a row of game buttons, instead of many game cards
// with clashing designs. Embedded sites and our own games (Snake, Typing)
// share the screen; the last game played is remembered. 2048 is our own
// version (the 2048.org site wasn't reliable).
// Settings: { current }. Built-in games keep their own saved data (best
// scores) under "<this widget's id>-<game>".
const isSettings = (value) => value && typeof value === 'object'
const NO_SETTINGS = {}

const ARCADE = [
  ['hoopgrids', '🏀', 'HoopGrids'],
  ['globle', '🌍', 'Globle'],
  ['chesspuzzle', '♟️', 'Chess puzzle'],
  ['busrush', '🚌', 'Bus Rush'],
  ['g2048', '🔢', '2048'],
  ['snake', '🐍', 'Snake'],
  ['typing', '⌨️', 'Typing test'],
  ['solitaire', '🃏', 'Solitaire'],
  ['minesweeper', '💣', 'Minesweeper'],
  ['dino', '🦖', 'Dino'],
  ['semantle', '🧠', 'Semantle'],
  ['sporcle', '❓', 'Sporcle'],
  ['chesstv', '📺', 'Live chess'],
  ['coolmath', '🎮', 'Coolmath'],
]

const BUILT_IN = { busrush: BusRushWidget, g2048: Game2048Widget, snake: SnakeWidget, typing: TypingWidget }

export default function ArcadeWidget({ id }) {
  const [settings, setSettings] = useStoreValue(widgetDataKey(id), NO_SETTINGS, isSettings)
  const current = ARCADE.some(([key]) => key === settings.current) ? settings.current : ARCADE[0][0]
  const BuiltIn = BUILT_IN[current]
  const embedded = GAMES[current]

  return (
    <div className="arcade">
      <nav className="arcade-games" aria-label="Games">
        {ARCADE.map(([key, emoji, name]) => (
          <button
            key={key}
            type="button"
            className={key === current ? 'active' : undefined}
            aria-pressed={key === current}
            onClick={() => setSettings((value) => ({ ...value, current: key }))}
          >
            <span aria-hidden="true">{emoji}</span> {name}
          </button>
        ))}
      </nav>
      <div className="arcade-screen">
        {BuiltIn ? (
          <div className="arcade-builtin">
            <BuiltIn id={`${id}-${current}`} />
          </div>
        ) : (
          <iframe
            key={current}
            title={embedded.name}
            src={embedded.url}
            loading="lazy"
            allow="clipboard-read; clipboard-write; fullscreen"
          />
        )}
      </div>
    </div>
  )
}
