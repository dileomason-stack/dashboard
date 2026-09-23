import { useStoreValue, widgetDataKey } from '../storage.js'

// A scratchpad saved as you type, with a live word and character count.
const isText = (value) => typeof value === 'string'

function countWords(text) {
  const words = text.trim().match(/\S+/g)
  return words ? words.length : 0
}

export default function NotesWidget({ id }) {
  const [text, setText] = useStoreValue(widgetDataKey(id), '', isText)
  const words = countWords(text)

  return (
    <div className="notes">
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Type notes, an outline, or paste an essay paragraph to count its words…"
        aria-label="Notes"
        spellCheck
      />
      <div className="notes-footer">
        <span>
          {words} {words === 1 ? 'word' : 'words'} · {text.length} characters
        </span>
        <span>Saved in this browser</span>
      </div>
    </div>
  )
}
