import { useCallback, useEffect, useRef, useState } from 'react'
import { useStoreValue, widgetDataKey } from '../storage.js'

// Classic Snake on a 20×20 board. Arrow keys or WASD (click the card first),
// or the on-screen arrows. Eat apples to grow; it speeds up as you go.
// Settings: { best } (high score).
const SIZE = 20
const START_SPEED = 140 // ms per step
const MIN_SPEED = 60
const isSettings = (value) => value && typeof value === 'object'
const NO_SETTINGS = {}
const DIRECTIONS = {
  arrowup: [0, -1],
  w: [0, -1],
  arrowdown: [0, 1],
  s: [0, 1],
  arrowleft: [-1, 0],
  a: [-1, 0],
  arrowright: [1, 0],
  d: [1, 0],
}

function randomApple(snake) {
  for (;;) {
    const apple = [Math.floor(Math.random() * SIZE), Math.floor(Math.random() * SIZE)]
    if (!snake.some(([x, y]) => x === apple[0] && y === apple[1])) return apple
  }
}

function newGame() {
  const snake = [
    [8, 10],
    [7, 10],
    [6, 10],
  ]
  return { snake, direction: [1, 0], queued: [], apple: randomApple(snake), score: 0 }
}

export default function SnakeWidget({ id }) {
  const [settings, setSettings] = useStoreValue(widgetDataKey(id), NO_SETTINGS, isSettings)
  const [status, setStatus] = useState('ready') // ready | playing | paused | over
  const [score, setScore] = useState(0)
  const canvasRef = useRef(null)
  const gameRef = useRef(newGame())
  const best = settings.best ?? 0

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    const cell = canvas.width / SIZE
    context.fillStyle = '#1c2a1c'
    context.fillRect(0, 0, canvas.width, canvas.height)
    // Checkerboard
    context.fillStyle = '#213221'
    for (let x = 0; x < SIZE; x++) for (let y = 0; y < SIZE; y++) if ((x + y) % 2) context.fillRect(x * cell, y * cell, cell, cell)
    const { snake, apple } = gameRef.current
    context.fillStyle = '#ef4444'
    context.beginPath()
    context.arc((apple[0] + 0.5) * cell, (apple[1] + 0.5) * cell, cell * 0.38, 0, Math.PI * 2)
    context.fill()
    snake.forEach(([x, y], index) => {
      context.fillStyle = index === 0 ? '#86efac' : '#4ade80'
      context.fillRect(x * cell + 1, y * cell + 1, cell - 2, cell - 2)
    })
  }, [])

  useEffect(draw, [draw])

  // Game loop: one step every `speed` ms while playing.
  useEffect(() => {
    if (status !== 'playing') return
    const game = gameRef.current
    const speed = Math.max(MIN_SPEED, START_SPEED - game.score * 4)
    const timer = setInterval(() => {
      if (game.queued.length) game.direction = game.queued.shift()
      const [dx, dy] = game.direction
      const [hx, hy] = game.snake[0]
      const head = [hx + dx, hy + dy]
      const hitWall = head[0] < 0 || head[1] < 0 || head[0] >= SIZE || head[1] >= SIZE
      const hitSelf = game.snake.some(([x, y]) => x === head[0] && y === head[1])
      if (hitWall || hitSelf) {
        setStatus('over')
        if (game.score > best) setSettings((current) => ({ ...current, best: game.score }))
        return
      }
      game.snake.unshift(head)
      if (head[0] === game.apple[0] && head[1] === game.apple[1]) {
        game.score += 1
        setScore(game.score)
        game.apple = randomApple(game.snake)
      } else {
        game.snake.pop()
      }
      draw()
    }, speed)
    return () => clearInterval(timer)
  }, [status, score, best, draw, setSettings])

  function start() {
    gameRef.current = newGame()
    setScore(0)
    setStatus('playing')
    draw()
    canvasRef.current?.parentElement?.focus()
  }

  function turn(next) {
    if (status === 'ready' || status === 'over') start()
    const game = gameRef.current
    const last = game.queued.at(-1) ?? game.direction
    // No reversing straight into yourself; allow up to 2 queued turns.
    if (next[0] === -last[0] && next[1] === -last[1]) return
    if (next[0] === last[0] && next[1] === last[1]) return
    if (game.queued.length < 2) game.queued.push(next)
  }

  return (
    <div
      className="snake no-drag"
      tabIndex={0}
      onKeyDown={(event) => {
        const key = event.key.toLowerCase()
        if (DIRECTIONS[key]) {
          event.preventDefault()
          turn(DIRECTIONS[key])
        } else if (key === ' ') {
          event.preventDefault()
          if (status === 'playing') setStatus('paused')
          else if (status === 'paused') setStatus('playing')
          else start()
        }
      }}
      onBlur={() => status === 'playing' && setStatus('paused')}
    >
      <div className="snake-header">
        <span>
          Score <strong>{score}</strong>
        </span>
        <span>Best {best}</span>
      </div>
      <div className="snake-board">
        <canvas ref={canvasRef} width={400} height={400} />
        {status !== 'playing' && (
          <div className="snake-overlay">
            <p>{status === 'over' ? `Game over! Score ${score}` : status === 'paused' ? 'Paused' : 'Snake'}</p>
            <button type="button" className="primary" onClick={status === 'paused' ? () => setStatus('playing') : start}>
              {status === 'paused' ? 'Resume' : status === 'over' ? 'Play again' : 'Start'}
            </button>
            <span className="snake-hint">Arrow keys or WASD · Space to pause</span>
          </div>
        )}
      </div>
      <div className="snake-pad" aria-label="Direction buttons">
        <button type="button" onClick={() => turn([0, -1])} aria-label="Up">
          ▲
        </button>
        <button type="button" onClick={() => turn([-1, 0])} aria-label="Left">
          ◀
        </button>
        <button type="button" onClick={() => turn([0, 1])} aria-label="Down">
          ▼
        </button>
        <button type="button" onClick={() => turn([1, 0])} aria-label="Right">
          ▶
        </button>
      </div>
    </div>
  )
}
