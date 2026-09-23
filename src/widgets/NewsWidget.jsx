import { getJSON, timeAgo, useLoader } from '../lib/useFetch.js'
import { NEWS_SOURCES } from '../lib/newsSources.js'
import { useStoreValue, widgetDataKey } from '../storage.js'

const isSettings = (value) => value && typeof value === 'object'
const DEFAULT_SETTINGS = { source: 'npr' }

// Latest headlines from a chosen news site. Articles open in a new tab
// (news sites don't allow being shown inside other pages).
export default function NewsWidget({ id }) {
  const [settings, setSettings] = useStoreValue(widgetDataKey(id), DEFAULT_SETTINGS, isSettings)
  const source = NEWS_SOURCES[settings.source] ? settings.source : 'npr'
  const { data, error, loading, reload } = useLoader(
    source,
    () => getJSON(`/api/news?source=${source}`),
    15 * 60 * 1000,
  )

  return (
    <div className="news">
      <div className="widget-toolbar">
        <select
          value={source}
          onChange={(event) => setSettings({ source: event.target.value })}
          aria-label="News source"
        >
          {Object.entries(NEWS_SOURCES).map(([key, { name }]) => (
            <option key={key} value={key}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <div className="widget-message">
          <p className="form-error">{error}</p>
          <div className="button-row">
            <button type="button" onClick={reload}>
              Try again
            </button>
          </div>
        </div>
      ) : loading ? (
        <p className="empty-state">Loading headlines…</p>
      ) : (
        <ul className="news-list">
          {data.items.map((item) => (
            <li key={item.link}>
              <a href={item.link} target="_blank" rel="noopener noreferrer">
                {item.title}
              </a>
              {item.published && <span className="news-time">{timeAgo(item.published)}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
