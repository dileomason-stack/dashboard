import { newId } from './lib/id.js'
import { useStore, useStoreValue, widgetDataKey } from './storage.js'

// The list of dashboards and which one is showing. Each dashboard's layout is
// stored separately (see layoutKeyFor), and every widget has its own data key,
// so dashboards never share cards or to-do lists.
const DEFAULT = { list: [{ id: 'main', name: 'My dashboard' }], activeId: 'main' }

const isDashboards = (value) =>
  value &&
  Array.isArray(value.list) &&
  value.list.length > 0 &&
  value.list.every((item) => item && typeof item.id === 'string' && typeof item.name === 'string')

// The first dashboard keeps the original "layout" key, so layouts saved
// before multiple dashboards existed simply become "My dashboard".
export const layoutKeyFor = (id) => (id === 'main' ? 'layout' : `layout:${id}`)

export const MAX_NAME_LENGTH = 30

export function useDashboards() {
  const store = useStore()
  const [state, setState] = useStoreValue('dashboards', DEFAULT, isDashboards)
  const active = state.list.find((item) => item.id === state.activeId) ?? state.list[0]

  return {
    list: state.list,
    active,
    select: (id) => setState((current) => ({ ...current, activeId: id })),
    create() {
      const id = `dash-${newId()}`
      setState((current) => ({ list: [...current.list, { id, name: 'New dashboard' }], activeId: id }))
      return id
    },
    rename(id, name) {
      const trimmed = name.trim().slice(0, MAX_NAME_LENGTH)
      if (!trimmed) return
      setState((current) => ({
        ...current,
        list: current.list.map((item) => (item.id === id ? { ...item, name: trimmed } : item)),
      }))
    },
    remove(id) {
      if (state.list.length <= 1) return
      // Delete the dashboard's widgets' data along with its layout.
      const layout = store.get(layoutKeyFor(id))
      for (const widget of [...(layout?.sidebar ?? []), ...(layout?.workspace ?? [])]) {
        store.remove(widgetDataKey(widget.id))
        store.remove(`style:${widget.id}`)
      }
      store.remove(layoutKeyFor(id))
      setState((current) => {
        const list = current.list.filter((item) => item.id !== id)
        return { list, activeId: current.activeId === id ? list[0].id : current.activeId }
      })
    },
  }
}
