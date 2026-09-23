// 2048 rules on a 4×4 board stored as an array of 16 numbers (0 = empty).

const SIZE = 4

export function addTile(board) {
  const empty = board.flatMap((value, index) => (value ? [] : [index]))
  if (empty.length === 0) return board
  const next = [...board]
  next[empty[Math.floor(Math.random() * empty.length)]] = Math.random() < 0.9 ? 2 : 4
  return next
}

export const newBoard = () => addTile(addTile(Array(SIZE * SIZE).fill(0)))

// Slide one row to the left, merging equal neighbors once.
function slideRow(row) {
  const tiles = row.filter(Boolean)
  const out = []
  let gained = 0
  for (let i = 0; i < tiles.length; i++) {
    if (tiles[i] === tiles[i + 1]) {
      out.push(tiles[i] * 2)
      gained += tiles[i] * 2
      i++
    } else {
      out.push(tiles[i])
    }
  }
  while (out.length < SIZE) out.push(0)
  return { row: out, gained }
}

// Index of cell (row r, position i along the move direction).
const cellIndex = {
  left: (r, i) => r * SIZE + i,
  right: (r, i) => r * SIZE + (SIZE - 1 - i),
  up: (r, i) => i * SIZE + r,
  down: (r, i) => (SIZE - 1 - i) * SIZE + r,
}

// Returns { board, gained, moved }.
export function move(board, direction) {
  const at = cellIndex[direction]
  const next = [...board]
  let gained = 0
  for (let r = 0; r < SIZE; r++) {
    const line = Array.from({ length: SIZE }, (_, i) => board[at(r, i)])
    const result = slideRow(line)
    gained += result.gained
    result.row.forEach((value, i) => (next[at(r, i)] = value))
  }
  return { board: next, gained, moved: next.some((value, i) => value !== board[i]) }
}

export const canMove = (board) => ['left', 'right', 'up', 'down'].some((direction) => move(board, direction).moved)
