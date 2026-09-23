import { useEffect, useState } from 'react'
import { ANSWERS, dailyAnswer, scoreGuess, todayKey } from '../lib/dailyWords.js'
import { useStoreValue, widgetDataKey } from '../storage.js'

// A Wordle-style word game (the real Wordle can't be shown inside a card):
// guess the 5-letter word in 6 tries. Green = right spot, yellow = in the
// word, gray = not in it. One daily word for everyone, plus practice rounds.
// Settings: { mode, day, answer, guesses, practice } (today's game is kept).
const isSettings = (value) => value && typeof value === 'object'
const NO_SETTINGS = {}
const ROWS = 6
const KEYBOARD = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm']

let dictionary = null
function loadDictionary() {
  dictionary ??= fetch('/words5.txt')
    .then((response) => response.text())
    .then((text) => new Set(text.split('\n').filter(Boolean)))
    .catch(() => null)
  return dictionary
}

export default function DailyWordWidget({ id }) {
  const [settings, setSettings] = useStoreValue(widgetDataKey(id), NO_SETTINGS, isSettings)
  const [typed, setTyped] = useState('')
  const [message, setMessage] = useState('')
  const [shake, setShake] = useState(false)

  // A new day starts a new daily game (unless in practice mode).
  const today = todayKey()
  const game =
    settings.answer && (settings.practice || settings.day === today)
      ? settings
      : { day: today, answer: dailyAnswer(), guesses: [], practice: false }
  const { answer, guesses } = game
  const won = guesses.includes(answer)
  const over = won || guesses.length >= ROWS

  useEffect(() => {
    loadDictionary()
  }, [])

  async function submit() {
    if (typed.length < 5) return flash('Not enough letters')
    const words = await loadDictionary()
    if (words && !words.has(typed) && !ANSWERS.includes(typed)) return flash('Not in word list')
    const next = [...guesses, typed]
    setSettings({ ...game, guesses: next })
    setTyped('')
    if (next.includes(answer)) setMessage(['Genius!', 'Magnificent!', 'Impressive!', 'Splendid!', 'Great!', 'Phew!'][next.length - 1])
    else if (next.length >= ROWS) setMessage(`The word was ${answer.toUpperCase()}`)
  }

  function flash(text) {
    setMessage(text)
    setShake(true)
    setTimeout(() => setShake(false), 400)
  }

  function press(key) {
    if (over) return
    setMessage('')
    if (key === 'enter') submit()
    else if (key === 'back') setTyped((value) => value.slice(0, -1))
    else if (/^[a-z]$/.test(key) && typed.length < 5) setTyped((value) => value + key)
  }

  function practice() {
    const word = ANSWERS[Math.floor(Math.random() * ANSWERS.length)]
    setSettings({ day: today, answer: word, guesses: [], practice: true })
    setTyped('')
    setMessage('Practice word: not today’s daily')
  }

  function backToDaily() {
    setSettings({})
    setTyped('')
    setMessage('')
  }

  // Letter colors for the on-screen keyboard (best result so far wins).
  const keyState = {}
  const rank = { absent: 1, present: 2, correct: 3 }
  for (const guess of guesses) {
    scoreGuess(guess, answer).forEach((state, i) => {
      if ((rank[state] ?? 0) > (rank[keyState[guess[i]]] ?? 0)) keyState[guess[i]] = state
    })
  }

  const rows = Array.from({ length: ROWS }, (_, row) => {
    if (row < guesses.length) return { letters: guesses[row], states: scoreGuess(guesses[row], answer) }
    if (row === guesses.length && !over) return { letters: typed.padEnd(5), states: null, current: true }
    return { letters: '     ', states: null }
  })

  return (
    <div
      className="daily-word"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.metaKey || event.ctrlKey || event.altKey) return
        const key = event.key === 'Backspace' ? 'back' : event.key.toLowerCase()
        if (key === 'enter' || key === 'back' || /^[a-z]$/.test(key)) {
          event.preventDefault()
          press(key)
        }
      }}
    >
      <div className="word-header">
        <strong>{game.practice ? 'Practice word' : 'Daily word'}</strong>
        {game.practice ? (
          <button type="button" className="link-button" onClick={backToDaily}>
            Back to today’s
          </button>
        ) : (
          over && (
            <button type="button" className="link-button" onClick={practice}>
              Play a practice word
            </button>
          )
        )}
      </div>
      <div className="word-board">
        {rows.map((row, r) => (
          <div key={r} className={`word-row${row.current && shake ? ' shake' : ''}`}>
            {[...row.letters].map((letter, i) => (
              <span key={i} className={`word-tile${row.states ? ` ${row.states[i]}` : letter.trim() ? ' filled' : ''}`}>
                {letter.trim().toUpperCase()}
              </span>
            ))}
          </div>
        ))}
      </div>
      <p className="word-message" role="status">
        {message || (over ? '' : 'Click here and type, or use the keys below')}
      </p>
      <div className="word-keyboard">
        {KEYBOARD.map((line, i) => (
          <div key={line} className="key-row">
            {i === 2 && (
              <button type="button" className="key wide" onClick={() => press('enter')}>
                Enter
              </button>
            )}
            {[...line].map((letter) => (
              <button key={letter} type="button" className={`key ${keyState[letter] ?? ''}`} onClick={() => press(letter)}>
                {letter.toUpperCase()}
              </button>
            ))}
            {i === 2 && (
              <button type="button" className="key wide" onClick={() => press('back')} aria-label="Delete letter">
                ⌫
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
