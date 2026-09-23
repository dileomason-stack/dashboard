import { useState } from 'react'
import { newId } from '../lib/id.js'
import { useStoreValue, widgetDataKey } from '../storage.js'

const isTodoList = (value) =>
  Array.isArray(value) &&
  value.every((item) => item && typeof item.id === 'string' && typeof item.text === 'string')

const NO_ITEMS = []

export default function TodoWidget({ id }) {
  const [items, setItems] = useStoreValue(widgetDataKey(id), NO_ITEMS, isTodoList)
  const [text, setText] = useState('')

  const doneCount = items.filter((item) => item.done).length

  function addItem(event) {
    event.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    setItems((current) => [...current, { id: newId(), text: trimmed, done: false }])
    setText('')
  }

  function toggleItem(itemId) {
    setItems((current) =>
      current.map((item) => (item.id === itemId ? { ...item, done: !item.done } : item)),
    )
  }

  function deleteItem(itemId) {
    setItems((current) => current.filter((item) => item.id !== itemId))
  }

  function clearDone() {
    setItems((current) => current.filter((item) => !item.done))
  }

  return (
    <div className="todo">
      <form className="inline-form" onSubmit={addItem}>
        <input
          type="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Add a task…"
          maxLength={200}
          aria-label="New task"
        />
        <button type="submit" disabled={!text.trim()}>
          Add
        </button>
      </form>

      {items.length === 0 ? (
        <p className="empty-state">Nothing on your list. Add your first task above.</p>
      ) : (
        <>
          <ul className="todo-list">
            {items.map((item) => (
              <li key={item.id} className={item.done ? 'done' : undefined}>
                <label>
                  <input
                    type="checkbox"
                    checked={!!item.done}
                    onChange={() => toggleItem(item.id)}
                  />
                  <span>{item.text}</span>
                </label>
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => deleteItem(item.id)}
                  aria-label={`Delete "${item.text}"`}
                  title="Delete"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          <div className="todo-footer">
            <span>
              {doneCount} of {items.length} done
            </span>
            {doneCount > 0 && (
              <button type="button" className="link-button" onClick={clearDone}>
                Clear completed
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
