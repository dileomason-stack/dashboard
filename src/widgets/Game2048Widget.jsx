import { ARROW_KEYS, useGameKeys } from '../lib/useGameKeys.js'
import { addTile, canMove, move, newBoard } from '../lib/game2048.js'
import { useStoreValue, widgetDataKey } from '../storage.js'

// 2048: slide tiles with the arrow keys / WASD (after clicking the game) or
// the buttons; equal tiles merge. Reach 2048 to win, then keep going.
// Settings: { board, score, best, keepGoing } (the game in progress is kept).
const isSettings = (value) => value && typeof value === 'object'
const NO_SETTINGS = {}
const DIRECTION = { ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down', ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right' }

export default function Game2048Widget({ id }) {
  const [settings, setSettings] = useStoreValue(widgetDataKey(id), NO_SETTINGS, isSettings)
  const board = Array.isArray(settings.board) && settings.board.length === 16 ? settings.board : null
  const score = settings.score ?? 0
  const best = settings.best ?? 0
  const won = board?.includes(2048) && !settings.keepGoing
  const over = board && !canMove(board)

  function play(direction) {
    setSettings((current) => {
      const start = Array.isArray(current.board) && current.board.length === 16 ? current.board : newBoard()
      if (!canMove(start) || (start.includes(2048) && !current.keepGoing)) return current
      const result = move(start, direction)
      if (!result.moved) return { ...current, board: start }
      const nextScore = (current.score ?? 0) + result.gained
      return { ...current, board: addTile(result.board), score: nextScore, best: Math.max(current.best ?? 0, nextScore) }
    })
  }

  const restart = () => setSettings((current) => ({ best: current.best ?? 0, board: newBoard(), score: 0 }))
  const { rootRef, active } = useGameKeys((key) => play(DIRECTION[key]), { keys: ARROW_KEYS })
  const cells = board ?? Array(16).fill(0)

  return (
    <div ref={rootRef} className={`g2048 no-drag${active ? ' armed' : ''}`}>
      <div className="g2048-header">
        <strong className="g2048-title">2048</strong>
        <span className="g2048-score">
          Score <strong>{score}</strong>
        </span>
        <span className="g2048-score">
          Best <strong>{best}</strong>
        </span>
        <button type="button" onClick={restart}>
          New game
        </button>
      </div>
      <div className="g2048-board">
        {cells.map((value, index) => (
          <div key={index} className={`g2048-tile v${Math.min(value, 4096)}`}>
            {value || ''}
          </div>
        ))}
        {(!board || won || over) && (
          <div className="g2048-overlay">
            <p>{!board ? '2048' : won ? 'You made 2048! 🎉' : 'No moves left'}</p>
            {won ? (
              <button type="button" className="primary" onClick={() => setSettings((current) => ({ ...current, keepGoing: true }))}>
                Keep going
              </button>
            ) : (
              <button type="button" className="primary" onClick={restart}>
                {board ? 'Try again' : 'Start'}
              </button>
            )}
            <span className="snake-hint">Arrow keys or WASD</span>
          </div>
        )}
      </div>
      <div className="snake-pad" aria-label="Move buttons">
        <button type="button" onClick={() => play('up')} aria-label="Up">
          ▲
        </button>
        <button type="button" onClick={() => play('left')} aria-label="Left">
          ◀
        </button>
        <button type="button" onClick={() => play('down')} aria-label="Down">
          ▼
        </button>
        <button type="button" onClick={() => play('right')} aria-label="Right">
          ▶
        </button>
      </div>
    </div>
  )
}
