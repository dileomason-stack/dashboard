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

// How hard each level is. Higher levels have more buses (so more of them box
// each other in), more colors, fewer boarding spots, and a more scrambled line.
function difficulty(level) {
  return {
    buses: Math.min(6 + level, 16),
    colors: Math.min(3 + Math.floor(level / 2), 6),
    spots: level <= 2 ? 4 : 3,
    scramble: Math.min(level, 12), // how far the line strays from an easy order
    // Which test players must LOSE for a layout to count as hard enough.
    mustBeat: level >= 7 ? ['simple', 'smart'] : level >= 4 ? ['simple'] : [],
  }
}

function randomLayout(settings) {
  const colors = Object.keys(COLORS).slice(0, settings.colors)
  const buses = []
  const taken = new Set()
  for (let tries = 0; tries < 800 && buses.length < settings.buses; tries++) {
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
  return buses.length === settings.buses ? buses : null
}

// A passenger line: start from an order the buses can leave in, then swap
// some buses further apart (more on harder levels) and shuffle neighbors.
function randomQueue(order, settings) {
  const sequence = [...order]
  for (let i = 0; i < settings.scramble; i++) {
    const a = Math.floor(Math.random() * sequence.length)
    const b = Math.min(sequence.length - 1, a + 1 + Math.floor(Math.random() * 4))
    ;[sequence[a], sequence[b]] = [sequence[b], sequence[a]]
  }
  const queue = []
  for (let i = 0; i < sequence.length; i += 2) {
    const passengers = sequence.slice(i, i + 2).flatMap((bus) => Array(CAPACITY).fill(bus.color))
    for (let j = passengers.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1))
      ;[passengers[j], passengers[k]] = [passengers[k], passengers[j]]
    }
    queue.push(...passengers)
  }
  return queue
}

// ----- Playing a level without a screen (for the solver and test players) -----

// Board passengers the same way the game does (first matching spot first).
function settle(slots, queue, index) {
  const next = [...slots]
  for (;;) {
    const spot = next.findIndex((slot) => slot && slot.color === queue[index] && slot.seats < CAPACITY)
    if (spot < 0) return { slots: next, index }
    const seats = next[spot].seats + 1
    next[spot] = seats >= CAPACITY ? null : { ...next[spot], seats }
    index++
  }
}

function driveOut(slots, bus) {
  const next = [...slots]
  next[next.indexOf(null)] = { color: bus.color, seats: 0 }
  return next
}

// Can this level be won at all? Tries every order of moves (remembering
// positions it has already seen), with a limit so it always finishes fast.
function solvable(buses, queue, spots, limit = 40000) {
  const seen = new Set()
  let steps = 0
  function search(remaining, slots, index) {
    ;({ slots, index } = settle(slots, queue, index))
    if (index >= queue.length) return true
    if (!slots.includes(null) || ++steps > limit) return false
    const key = `${remaining.map((bus) => bus.id).join(',')}|${slots.map((slot) => (slot ? slot.color + slot.seats : '-')).join(',')}|${index}`
    if (seen.has(key)) return false
    seen.add(key)
    return remaining.some(
      (bus) =>
        canExit(bus, remaining) &&
        search(
          remaining.filter((other) => other !== bus),
          driveOut(slots, bus),
          index,
        ),
    )
  }
  return search(buses, Array(spots).fill(null), 0)
}

// Test players. "simple" grabs a clear bus matching the front passenger (or
// any clear bus); "smart" otherwise picks the one whose color is needed soonest.
function testPlayerWins(buses, queue, spots, style) {
  let remaining = buses
  let slots = Array(spots).fill(null)
  let index = 0
  for (;;) {
    ;({ slots, index } = settle(slots, queue, index))
    if (index >= queue.length) return true
    if (!slots.includes(null)) return false
    const clear = remaining.filter((bus) => canExit(bus, remaining))
    const soonest = (bus) => {
      const at = queue.indexOf(bus.color, index)
      return at < 0 ? Infinity : at
    }
    const choice =
      clear.find((bus) => bus.color === queue[index]) ??
      (style === 'smart' ? [...clear].sort((a, b) => soonest(a) - soonest(b))[0] : clear[0])
    remaining = remaining.filter((bus) => bus !== choice)
    slots = driveOut(slots, choice)
  }
}

// A random level that can always be won, and on higher levels one that the
// test players lose (so it takes real planning). Gives up after a short time
// and uses the hardest winnable level it found.
export function newLevel(level) {
  const settings = difficulty(level)
  const deadline = Date.now() + 350
  let fallback = null
  while (Date.now() < deadline || !fallback) {
    const buses = randomLayout(settings)
    const order = buses && exitOrder(buses)
    if (!order) continue
    for (let attempt = 0; attempt < 8; attempt++) {
      const queue = randomQueue(order, settings)
      if (!solvable(buses, queue, settings.spots)) continue
      const level = { buses, queue, slots: Array(settings.spots).fill(null) }
      const beaten = settings.mustBeat.every((style) => !testPlayerWins(buses, queue, settings.spots, style))
      if (beaten) return level
      fallback ??= level
    }
    if (Date.now() > deadline + 1500 && fallback) break
  }
  return fallback
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
