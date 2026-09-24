// Bus Rush rules. A pile of buses sits in a parking lot, each pointing one of
// 8 directions. Tapping a bus drives it forward: if nothing is in its way it
// leaves the lot and parks in a boarding spot; if another bus is in the way it
// bumps into it and backs up. A crowd of passengers waits, and the people at
// the front board parked buses of their color. A full bus leaves.
//
// Positions are in "lot units": the lot is 100 × 100.

export const COLORS = {
  yellow: '#facc15',
  pink: '#ec4899',
  cyan: '#22d3ee',
  purple: '#a855f7',
  orange: '#f97316',
  green: '#22c55e',
}

const BUS_WIDTH = 9
const SIZES = [
  { len: 13, capacity: 6 },
  { len: 17, capacity: 9 },
  { len: 21, capacity: 12 },
]

// Angle 0 = up, going clockwise in 45° steps.
export const unitOf = (angle) => [Math.sin((angle * Math.PI) / 180), -Math.cos((angle * Math.PI) / 180)]

function corners(bus, extendFront = 0) {
  const [fx, fy] = unitOf(bus.angle) // forward
  const [sx, sy] = [-fy, fx] // sideways
  const back = bus.len / 2
  const front = bus.len / 2 + extendFront
  const half = BUS_WIDTH / 2
  return [
    [bus.x - fx * back - sx * half, bus.y - fy * back - sy * half],
    [bus.x - fx * back + sx * half, bus.y - fy * back + sy * half],
    [bus.x + fx * front + sx * half, bus.y + fy * front + sy * half],
    [bus.x + fx * front - sx * half, bus.y + fy * front - sy * half],
  ]
}

// The strip of road in front of a bus, `distance` long.
function roadAhead(bus, distance) {
  const [fx, fy] = unitOf(bus.angle)
  const shifted = { ...bus, x: bus.x + fx * (bus.len / 2 + distance / 2), y: bus.y + fy * (bus.len / 2 + distance / 2), len: distance }
  return corners(shifted)
}

// Do two convex shapes overlap? (Separating-axis test.)
function overlap(a, b) {
  for (const shape of [a, b]) {
    for (let i = 0; i < shape.length; i++) {
      const [x1, y1] = shape[i]
      const [x2, y2] = shape[(i + 1) % shape.length]
      const [nx, ny] = [y2 - y1, x1 - x2]
      const project = (points) => points.map(([x, y]) => x * nx + y * ny)
      const pa = project(a)
      const pb = project(b)
      if (Math.max(...pa) < Math.min(...pb) + 0.01 || Math.max(...pb) < Math.min(...pa) + 0.01) return false
    }
  }
  return true
}

// For each bus, which other buses stand in its way out. Buses never move
// except to leave, so this is worked out once per level.
export function blockersOf(buses) {
  const map = new Map()
  for (const bus of buses) {
    const road = roadAhead(bus, 250)
    map.set(
      bus.id,
      new Set(buses.filter((other) => other !== bus && overlap(road, corners(other))).map((other) => other.id)),
    )
  }
  return map
}

export function canExit(bus, remaining, blockers) {
  const ids = new Set(remaining.map((other) => other.id))
  return ![...blockers.get(bus.id)].some((id) => ids.has(id))
}

// How far a blocked bus drives before touching the first bus in its way
// (for the bump animation).
export function bumpDistance(bus, remaining) {
  const others = remaining.filter((other) => other !== bus).map((other) => corners(other))
  let low = 0
  let high = 250
  for (let i = 0; i < 16; i++) {
    const mid = (low + high) / 2
    if (others.some((shape) => overlap(roadAhead(bus, mid), shape))) high = mid
    else low = mid
  }
  return low
}

const pick = (list) => list[Math.floor(Math.random() * list.length)]

// How hard each level is: more buses crowded together, more colors, a more
// scrambled crowd, and (from level 4) test players that must lose.
function difficulty(level) {
  const buses = Math.min(8 + level * 2, 24)
  return {
    buses,
    colors: Math.min(3 + Math.floor(level / 2), 6),
    spots: 4,
    locked: 2, // "+" spots you can unlock during the level
    spread: Math.min(46, 20 + buses), // bigger piles get more room so they fit
    scramble: Math.min(2 + level * 2, 24),
    mustBeat: level >= 7 ? ['simple', 'smart'] : level >= 4 ? ['simple'] : [],
  }
}

function randomPile(settings) {
  const colors = Object.keys(COLORS).slice(0, settings.colors)
  const buses = []
  for (let tries = 0; tries < 3000 && buses.length < settings.buses; tries++) {
    const size = pick(SIZES)
    const bus = {
      id: buses.length + 1,
      angle: pick([0, 0, 45, 90, 135, 180, 225, 270, 315, 0, 90, 270]),
      x: 50 + (Math.random() * 2 - 1) * settings.spread,
      y: 50 + (Math.random() * 2 - 1) * settings.spread,
      len: size.len,
      capacity: size.capacity,
      color: pick(colors),
    }
    const shape = corners({ ...bus, len: bus.len + 1.5 })
    const inside = shape.every(([x, y]) => x > 2 && x < 98 && y > 2 && y < 98)
    if (inside && !buses.some((other) => overlap(shape, corners(other)))) buses.push(bus)
  }
  return buses.length === settings.buses ? buses : null
}

// An order in which every bus can leave, or null if some are stuck forever.
function exitOrder(buses, blockers) {
  let remaining = [...buses]
  const order = []
  while (remaining.length) {
    const next = remaining.find((bus) => canExit(bus, remaining, blockers))
    if (!next) return null
    order.push(next)
    remaining = remaining.filter((bus) => bus !== next)
  }
  return order
}

// The crowd: start from an order the buses can leave in, swap some buses
// apart (more on harder levels), and shuffle neighbors' passengers together.
function randomCrowd(order, settings) {
  const sequence = [...order]
  for (let i = 0; i < settings.scramble; i++) {
    const a = Math.floor(Math.random() * sequence.length)
    const b = Math.min(sequence.length - 1, a + 1 + Math.floor(Math.random() * 4))
    ;[sequence[a], sequence[b]] = [sequence[b], sequence[a]]
  }
  const crowd = []
  for (let i = 0; i < sequence.length; i += 2) {
    const people = sequence.slice(i, i + 2).flatMap((bus) => Array(bus.capacity).fill(bus.color))
    // Keep people in small same-color clumps, like a real crowd.
    const clumps = []
    for (let j = 0; j < people.length; j += 3) clumps.push(people.slice(j, j + 3))
    for (let j = clumps.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1))
      ;[clumps[j], clumps[k]] = [clumps[k], clumps[j]]
    }
    crowd.push(...clumps.flat())
  }
  return crowd
}

// ----- Playing a level without a screen (solver and test players) -----

// Board people the way the game does: the front person takes the first
// parked bus of their color with a free seat; full buses leave.
function settle(slots, crowd, index) {
  const next = [...slots]
  for (;;) {
    const spot = next.findIndex((slot) => slot && slot.color === crowd[index] && slot.seats < slot.capacity)
    if (spot < 0) return { slots: next, index }
    const seats = next[spot].seats + 1
    next[spot] = seats >= next[spot].capacity ? null : { ...next[spot], seats }
    index++
  }
}

function park(slots, bus) {
  const next = [...slots]
  next[next.indexOf(null)] = { color: bus.color, capacity: bus.capacity, seats: 0 }
  return next
}

// Can the level be won? Tries every order of moves (skipping positions it has
// already seen), with a step limit so it always finishes quickly.
function solvable(buses, blockers, crowd, spots, limit = 30000) {
  const seen = new Set()
  let steps = 0
  function search(remaining, slots, index) {
    ;({ slots, index } = settle(slots, crowd, index))
    if (index >= crowd.length) return true
    if (!slots.includes(null) || ++steps > limit) return false
    const key = `${remaining.map((bus) => bus.id).join(',')}|${slots.map((slot) => (slot ? slot.color + slot.seats : '-')).join(',')}|${index}`
    if (seen.has(key)) return false
    seen.add(key)
    return remaining.some(
      (bus) => canExit(bus, remaining, blockers) && search(remaining.filter((other) => other !== bus), park(slots, bus), index),
    )
  }
  return search(buses, Array(spots).fill(null), 0)
}

// "simple" drives out a clear bus matching the front person (else any clear
// bus); "smart" otherwise picks the clear bus whose color is needed soonest.
function testPlayerWins(buses, blockers, crowd, spots, style) {
  let remaining = buses
  let slots = Array(spots).fill(null)
  let index = 0
  for (;;) {
    ;({ slots, index } = settle(slots, crowd, index))
    if (index >= crowd.length) return true
    if (!slots.includes(null)) return false
    const clear = remaining.filter((bus) => canExit(bus, remaining, blockers))
    const soonest = (bus) => {
      const at = crowd.indexOf(bus.color, index)
      return at < 0 ? Infinity : at
    }
    const choice =
      clear.find((bus) => bus.color === crowd[index]) ??
      (style === 'smart' ? [...clear].sort((a, b) => soonest(a) - soonest(b))[0] : clear[0])
    remaining = remaining.filter((bus) => bus !== choice)
    slots = park(slots, choice)
  }
}

// A random level that can always be won; from level 4 one the test players
// lose. Uses the best level found within a short time.
export function newLevel(level) {
  const settings = difficulty(level)
  const started = Date.now()
  const deadline = started + 400
  let fallback = null
  while (Date.now() < deadline || !fallback) {
    // Safety net: if this level's settings are too tight to fill quickly,
    // use the previous level's instead so a level is always ready fast.
    if (Date.now() - started > 2500) return level > 1 ? newLevel(level - 1) : fallback
    const buses = randomPile(settings)
    if (!buses) continue
    const blockers = blockersOf(buses)
    const order = exitOrder(buses, blockers)
    if (!order) continue
    for (let attempt = 0; attempt < 6; attempt++) {
      const crowd = randomCrowd(order, settings)
      if (!solvable(buses, blockers, crowd, settings.spots)) continue
      const result = { buses, crowd, slots: Array(settings.spots).fill(null), locked: settings.locked }
      if (settings.mustBeat.every((style) => !testPlayerWins(buses, blockers, crowd, settings.spots, style))) return result
      fallback ??= result
    }
    if (Date.now() > deadline + 1500 && fallback) break
  }
  return fallback
}

// One person from the front of the crowd boards a parked bus of their color.
export function boardOne(state) {
  const front = state.crowd[0]
  const index = state.slots.findIndex((slot) => slot && slot.color === front && slot.seats < slot.capacity)
  if (index < 0) return state
  const slots = [...state.slots]
  const seats = slots[index].seats + 1
  slots[index] = seats >= slots[index].capacity ? null : { ...slots[index], seats }
  return { ...state, slots, crowd: state.crowd.slice(1) }
}
