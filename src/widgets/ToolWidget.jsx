import { GAMES, TOOLS } from '../lib/tools.js'
import { useStoreValue, widgetDataKey } from '../storage.js'

// Settings: { tool: 'graphing' }. Shows the chosen site inside the card;
// "Change tool" / "Change game" in the card menu goes back to the picker.
// Used for both the Academic tool and Game widgets, with different catalogs.
const isSettings = (value) => value && typeof value === 'object'
const NO_SETTINGS = {}

function EmbedPicker({ id, catalog, heading }) {
  const [settings, setSettings] = useStoreValue(widgetDataKey(id), NO_SETTINGS, isSettings)
  const tool = catalog[settings.tool]

  if (!tool) {
    return (
      <div className="tool-picker">
        <p className="link-setup-heading">{heading}</p>
        <div className="tool-grid">
          {Object.entries(catalog).map(([key, item]) => (
            <button key={key} type="button" onClick={() => setSettings({ tool: key })}>
              {item.name}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="tool-embed">
      <div className="tool-frame" style={{ '--zoom': tool.zoom ?? 1 }}>
        <iframe title={tool.name} src={tool.url} loading="lazy" allow="clipboard-read; clipboard-write; fullscreen" />
      </div>
    </div>
  )
}

export default function ToolWidget({ id }) {
  return <EmbedPicker id={id} catalog={TOOLS} heading="Pick a tool to show here:" />
}

export function GameWidget({ id }) {
  return <EmbedPicker id={id} catalog={GAMES} heading="Pick a game to play here:" />
}
