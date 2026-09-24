// Bus Rush rules: a parking lot of buses, each facing a direction. A bus can
// drive out only if nothing is in front of it. Buses that leave wait in a few
// boarding spots, where the line of passengers boards buses of their color.

export const SIZE = 6 // the lot is SIZE × SIZE cells
export const CAPACITY = 3 // passengers per bus

export const COLORS = {
  red: '#ef4444',
  blue: '#3b82f6',
  yellow: '#eab308',
  green: '#22c55e',
  purple: '#a855f7',
  orange: '#f97316',
}

const STEP = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }

export function cellsOf(bus) {
  return Array.from({ length: bus.len }, (_, i) => (bus.horizontal ? [bus.x + i, bus.y] : [bus.x, bus.y + i]))
}

// The cells between a bus's front and the edge of the lot.
function pathOf(bus) {
  const [dx, dy] = STEP[bus.dir]
  let [x, y] = bus.dir === 'right' ? [bus.x + bus.len - 1, bus.y] : bus.dir === 'down' ? [bus.x, bus.y + bus.len - 1] : [bus.x, bus.y]
  const path = []
  for (;;) {
    x += dx
    y += dy
    if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return path
    path.push([x, y])
  }
}

export function canExit(bus, buses) {
  const taken = new Set(buses.filter((other) => other.id !== bus.id).flatMap((other) => cellsOf(other).map(String)))
  return pathOf(bus).every((cell) => !taken.has(String(cell)))
}

// An order in which every bus can drive out, or null if some are stuck.
function exitOrder(buses) {
  let remaining = [...buses]
  const order = []
  while (remaining.length) {
    const next = remaining.find((bus) => canExit(bus, remaining))
    if (!next) return null
    order.push(next)
    remaining = remaining.filter((bus) => bus !== next)
  }
  return order
}

const pick = (list) => list[Math.floor(Math.random() * list.length)]

// A random level that's guaranteed solvable: every bus can eventually leave,
// and the passenger line follows one order in which they can.
export function newLevel(level) {
  const colors = Object.keys(COLORS).slice(0, Math.min(3 + level, 6))
  const spots = level <= 2 ? 4 : 3
  const busCount = Math.min(5 + level, 13)
  for (let attempt = 0; attempt < 400; attempt++) {
    const buses = []
    const taken = new Set()
    for (let tries = 0; tries < 600 && buses.length < busCount; tries++) {
      const len = Math.random() < 0.65 ? 2 : 3
      const horizontal = Math.random() < 0.5
      const bus = {
        id: buses.length + 1,
        len,
        horizontal,
        dir: horizontal ? pick(['left', 'right']) : pick(['up', 'down']),
        x: Math.floor(Math.random() * (horizontal ? SIZE - len + 1 : SIZE)),
        y: Math.floor(Math.random() * (horizontal ? SIZE : SIZE - len + 1)),
        color: pick(colors),
      }
      const cells = cellsOf(bus).map(String)
      if (cells.some((cell) => taken.has(cell))) continue
      cells.forEach((cell) => taken.add(cell))
      buses.push(bus)
    }
    if (buses.length < busCount) continue
    const order = exitOrder(buses)
    if (!order) continue
    // The line follows the exit order, but the passengers of each group of
    // buses are shuffled together (bigger groups on later levels), so several
    // buses fill at once and boarding spots get tight. Still always solvable:
    // following the exit order needs at most `group` spots.
    const group = spots
    const queue = []
    for (let i = 0; i < order.length; i += group) {
      const passengers = order.slice(i, i + group).flatMap((bus) => Array(CAPACITY).fill(bus.color))
      for (let j = passengers.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1))
        ;[passengers[j], passengers[k]] = [passengers[k], passengers[j]]
      }
      queue.push(...passengers)
    }
    return { buses, queue, slots: Array(spots).fill(null) }
  }
  return newLevel(Math.max(1, level - 1))
}

// One passenger from the front of the line boards a waiting bus of their
// color, if there is one. A full bus leaves, freeing its spot.
export function boardOne(state) {
  const front = state.queue[0]
  const index = state.slots.findIndex((slot) => slot && slot.color === front && slot.seats < CAPACITY)
  if (index < 0) return state
  const slots = [...state.slots]
  const seats = slots[index].seats + 1
  slots[index] = seats >= CAPACITY ? null : { ...slots[index], seats }
  return { ...state, slots, queue: state.queue.slice(1) }
}
