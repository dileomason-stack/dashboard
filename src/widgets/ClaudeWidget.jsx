import { useRef, useState } from 'react'
import { openExternal } from '../lib/openExternal.js'

// A question box that opens an AI chat site (which can't be shown inside a
// card) in a new tab with the question filled in. Used by the Claude and
// ChatGPT cards; `variant` picks each site's look.
function AskBox({ name, urlFor, variant }) {
  const [question, setQuestion] = useState('')
  const inputRef = useRef(null)

  function ask(event) {
    event.preventDefault()
    const trimmed = question.trim()
    if (!trimmed) {
      inputRef.current?.focus()
      return
    }
    openExternal(urlFor(encodeURIComponent(trimmed)))
    setQuestion('')
  }

  return (
    <form className={`claude${variant ? ` ${variant}` : ''}`} onSubmit={ask}>
      <p className="claude-greeting">What can I help with?</p>
      <div className="claude-box">
        <textarea
          ref={inputRef}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => {
            // Enter sends, Shift+Enter makes a new line, like the chat sites.
            if (event.key === 'Enter' && !event.shiftKey) ask(event)
          }}
          placeholder={`Ask ${name} anything…`}
          aria-label={`Ask ${name}`}
          rows={3}
        />
        <div className="claude-actions">
          <span className="claude-hint">Opens in a new tab</span>
          <button type="submit" className="claude-send" disabled={!question.trim()} aria-label={`Ask ${name}`}>
            ↑
          </button>
        </div>
      </div>
    </form>
  )
}

// claude.ai/new?q= opens a new chat with the question filled in.
export default function ClaudeWidget() {
  return <AskBox name="Claude" urlFor={(question) => `https://claude.ai/new?q=${question}`} />
}

// chatgpt.com/?q= does the same for ChatGPT.
export function ChatGPTWidget() {
  return <AskBox name="ChatGPT" variant="chatgpt" urlFor={(question) => `https://chatgpt.com/?q=${question}`} />
}
