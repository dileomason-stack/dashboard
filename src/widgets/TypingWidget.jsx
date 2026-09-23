import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useStoreValue, widgetDataKey } from '../storage.js'

// Typing speed test: type the words shown as fast and accurately as you can
// for 30 or 60 seconds. WPM counts correctly typed characters (5 = 1 word).
// Settings: { seconds, best } (best WPM per length).
const isSettings = (value) => value && typeof value === 'object'
const NO_SETTINGS = {}

const WORDS = `the be to of and a in that have it for not on with he as you do at this but his by from they we say her she or an will my one all would there their what so up out if about who get which go me when make can like time no just him know take people into year your good some could them see other than then now look only come its over think also back after use two how our work first well way even new want because any these give day most us great where through long little world school still between last never life home thought head under story found while along might close something seem next hard open example begin family group often run important until children side feet car mile night walk white sea began grow took river four carry state once book hear stop without second later miss idea enough eat face watch far really almost let above girl sometimes mountain cut young talk soon list song being leave study learn plant cover food sun between country picture answer class practice question science history project campus library coffee exam notes essay paper`.split(/\s+/)

const pickWords = (count) => Array.from({ length: count }, () => WORDS[Math.floor(Math.random() * WORDS.length)]).join(' ')

export default function TypingWidget({ id }) {
  const [settings, setSettings] = useStoreValue(widgetDataKey(id), NO_SETTINGS, isSettings)
  const seconds = settings.seconds === 60 ? 60 : 30
  const [text, setText] = useState(() => pickWords(80))
  const [typed, setTyped] = useState('')
  const [startedAt, setStartedAt] = useState(null)
  const [now, setNow] = useState(0)
  const [finished, setFinished] = useState(false)
  const inputRef = useRef(null)
  const cursorRef = useRef(null)
  // How far the text is scrolled, in pixels. It moves down one line only when
  // the cursor reaches the third visible line, so the text never slides sideways.
  const [scrollTop, setScrollTop] = useState(0)

  useLayoutEffect(() => {
    const cursor = cursorRef.current
    if (!cursor) return
    // Use the paragraph's line height (a letter's own box is shorter).
    const lineHeight = parseFloat(getComputedStyle(cursor.parentElement).lineHeight) || cursor.offsetHeight || 1
    // Cursor's distance from the top of the paragraph (the scroll shifts both equally).
    const fromTop = cursor.getBoundingClientRect().top - cursor.parentElement.getBoundingClientRect().top
    const line = Math.floor((fromTop + lineHeight / 2) / lineHeight)
    const target = Math.max(0, line - 1) * lineHeight
    if (target !== scrollTop) setScrollTop(target)
  }, [typed, text, scrollTop])

  const elapsed = startedAt ? Math.min(seconds, (now - startedAt) / 1000) : 0
  const remaining = Math.ceil(seconds - elapsed)
  let correct = 0
  for (let i = 0; i < typed.length; i++) if (typed[i] === text[i]) correct++
  const wpm = elapsed > 0 ? Math.round(correct / 5 / (elapsed / 60)) : 0
  const accuracy = typed.length ? Math.round((correct / typed.length) * 100) : 100
  const best = settings.best?.[seconds] ?? 0

  // Tick while running; stop at the time limit and keep the best score.
  useEffect(() => {
    if (!startedAt || finished) return
    const timer = setInterval(() => {
      const current = Date.now()
      setNow(current)
      if ((current - startedAt) / 1000 >= seconds) setFinished(true)
    }, 200)
    return () => clearInterval(timer)
  }, [startedAt, finished, seconds])

  useEffect(() => {
    if (finished && wpm > best) setSettings((current) => ({ ...current, best: { ...current.best, [seconds]: wpm } }))
    // Only when a run finishes.
  }, [finished]) // eslint-disable-line react-hooks/exhaustive-deps

  function reset(nextSeconds = seconds) {
    if (nextSeconds !== seconds) setSettings((current) => ({ ...current, seconds: nextSeconds }))
    setText(pickWords(nextSeconds === 60 ? 140 : 80))
    setTyped('')
    setStartedAt(null)
    setFinished(false)
    setScrollTop(0)
    inputRef.current?.focus()
  }

  return (
    <div className="typing no-drag" onClick={() => inputRef.current?.focus()}>
      <div className="typing-header">
        <div className="segmented-tabs">
          {[30, 60].map((length) => (
            <button
              key={length}
              type="button"
              className={seconds === length ? 'active' : undefined}
              onClick={(event) => {
                event.stopPropagation()
                reset(length)
              }}
            >
              {length}s
            </button>
          ))}
        </div>
        <span className="typing-timer">{finished ? 'Done!' : `${remaining}s`}</span>
      </div>

      <div className="typing-text" aria-label="Text to type">
        <p style={{ transform: `translateY(${-scrollTop}px)` }}>
          {[...text].map((char, index) => {
            const state =
              index < typed.length ? (typed[index] === char ? 'right' : 'wrong') : index === typed.length ? 'cursor' : ''
            return (
              <span key={index} className={state} ref={index === typed.length ? cursorRef : undefined}>
                {char}
              </span>
            )
          })}
        </p>
      </div>

      <input
        ref={inputRef}
        type="text"
        className="typing-input"
        value={typed}
        disabled={finished}
        onChange={(event) => {
          if (!startedAt) {
            setStartedAt(Date.now())
            setNow(Date.now())
          }
          setTyped(event.target.value.slice(0, text.length))
        }}
        onPaste={(event) => event.preventDefault()}
        placeholder={startedAt ? (finished ? 'Time’s up!' : 'Keep typing…') : 'Click here and start typing to begin…'}
        aria-label="Type here"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />

      <div className="typing-stats">
        <span>
          <strong>{wpm}</strong> WPM
        </span>
        <span>
          <strong>{accuracy}%</strong> accuracy
        </span>
        <span>Best {best} WPM</span>
        <button
          type="button"
          className="link-button"
          onClick={(event) => {
            event.stopPropagation()
            reset()
          }}
        >
          {finished ? 'Try again' : 'Restart'}
        </button>
      </div>
    </div>
  )
}
