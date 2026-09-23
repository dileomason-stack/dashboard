import { TOOLS } from '../lib/tools.js'
import { useStoreValue, widgetDataKey } from '../storage.js'

// Settings: { tool: 'graphing' }. Shows the chosen tool's real site inside
// the card; "Change tool" in the card menu goes back to the picker.
const isSettings = (value) => value && typeof value === 'object'
const NO_SETTINGS = {}

export default function ToolWidget({ id }) {
  const [settings, setSettings] = useStoreValue(widgetDataKey(id), NO_SETTINGS, isSettings)
  const tool = TOOLS[settings.tool]

  if (!tool) {
    return (
      <div className="tool-picker">
        <p className="link-setup-heading">Pick a tool to show here:</p>
        <div className="tool-grid">
          {Object.entries(TOOLS).map(([key, item]) => (
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
      <iframe title={tool.name} src={tool.url} loading="lazy" allow="clipboard-read; clipboard-write; fullscreen" />
    </div>
  )
}
