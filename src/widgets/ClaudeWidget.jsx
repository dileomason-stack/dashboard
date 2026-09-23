import { useRef, useState } from 'react'

export default function ClaudeWidget() {
  const [question, setQuestion] = useState('')
  const inputRef = useRef(null)

  function ask(event) {
    event.preventDefault()
    const trimmed = question.trim()
    if (!trimmed) {
      inputRef.current?.focus()
      return
    }
    // claude.ai/new?q= opens a new chat with the question filled in.
    window.open(`https://claude.ai/new?q=${encodeURIComponent(trimmed)}`, '_blank', 'noopener,noreferrer')
    setQuestion('')
  }

  return (
    <form className="claude" onSubmit={ask}>
      <p className="claude-greeting">What can I help with?</p>
      <div className="claude-box">
        <textarea
          ref={inputRef}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => {
            // Enter sends, Shift+Enter makes a new line, like Claude itself.
            if (event.key === 'Enter' && !event.shiftKey) ask(event)
          }}
          placeholder="Ask Claude anything…"
          aria-label="Ask Claude"
          rows={3}
        />
        <div className="claude-actions">
          <span className="claude-hint">Opens in a new tab</span>
          <button type="submit" className="claude-send" disabled={!question.trim()} aria-label="Ask Claude">
            ↑
          </button>
        </div>
      </div>
    </form>
  )
}
