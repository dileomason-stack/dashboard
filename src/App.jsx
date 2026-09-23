import { useState } from 'react'
import Dashboard from './Dashboard.jsx'
import { exampleSeed } from './example.js'
import { createStore, readJSON, removeKey, StoreContext, writeJSON } from './storage.js'

// "example": Alex's sample dashboard (memory only, resets on reload).
// "own": the visitor's own dashboard, saved in this browser.
const MODE_KEY = 'dashboard:mode'
const HAS_OWN_KEY = 'dashboard:hasOwn'
const OWN_PREFIX = 'dashboard:own:'

// Layouts saved by earlier versions of the app.
removeKey('dashboard:v1')
removeKey('dashboard:v2')
removeKey('dashboard:widget:default-todo')

function storeFor(mode) {
  return mode === 'own' ? createStore({ prefix: OWN_PREFIX }) : createStore({ seed: exampleSeed(), example: true })
}

export default function App() {
  // Each switch creates a fresh store, so the example always starts clean.
  const [store, setStore] = useState(() => storeFor(readJSON(MODE_KEY, 'example') === 'own' ? 'own' : 'example'))
  // Bumped on every switch so the dashboard starts fresh (no leftover full-screen widget, etc.).
  const [generation, setGeneration] = useState(0)

  function switchTo(mode) {
    writeJSON(MODE_KEY, mode)
    if (mode === 'own') writeJSON(HAS_OWN_KEY, true)
    setStore(storeFor(mode))
    setGeneration((count) => count + 1)
    window.scrollTo(0, 0)
  }

  return (
    <StoreContext.Provider value={store}>
      <Dashboard
        key={generation}
        hasOwn={readJSON(HAS_OWN_KEY, false)}
        onBuildOwn={() => switchTo('own')}
        onViewExample={() => switchTo('example')}
        onResetExample={() => switchTo('example')}
      />
    </StoreContext.Provider>
  )
}
