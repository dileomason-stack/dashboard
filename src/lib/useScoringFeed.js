import { useEffect, useRef, useState } from 'react'
import { loadWeekStats, POINTS_KEY, shortName, statWords } from './sleeper.js'

// Live points and a feed of scoring updates for a set of players, like the
// Sleeper app's "Kraft +1.3 pts" notifications. Sleeper's stats are checked
// every 30 seconds while any game is on (every 5 minutes otherwise); each
// time a player's points change, an update is added to the top of the feed.
// When the card first loads, each player who has already played this week
// gets one line with their total so far.
//
// players: [{ id (Sleeper ID), name, team }]
export function useScoringFeed(players, { season, week, scoring = 'ppr', gamesLive }) {
  const [stats, setStats] = useState({})
  // Tagged with what they're for, so switching leagues never shows old updates.
  const [feed, setFeed] = useState({ key: null, updates: [] })
  const previous = useRef(null)
  const pointsKey = POINTS_KEY[scoring] ?? POINTS_KEY.ppr
  const ids = players.map((player) => player.id).join(',')
  const feedKey = `${season}|${week}|${ids}|${pointsKey}`
  // Read the latest list inside the timer without restarting it.
  const playersRef = useRef(players)
  useEffect(() => {
    playersRef.current = players
  })

  useEffect(() => {
    if (!season || !week || !ids) return
    let cancelled = false
    // Start over only for different players/week (not when a game starts or ends).
    if (previous.current?.feedKey !== feedKey) previous.current = null

    async function check() {
      let next
      try {
        next = await loadWeekStats(season, week)
      } catch {
        return // try again next time
      }
      if (cancelled) return
      const before = previous.current?.stats
      const now = Date.now()
      const fresh = []
      for (const player of playersRef.current) {
        const after = next[player.id]
        if (!after) continue
        const points = after[pointsKey] ?? 0
        if (!before) {
          if (points || statWords(after)) {
            fresh.push({
              key: `${player.id}-total`,
              name: shortName(player.name),
              team: player.team,
              points,
              detail: statWords(after),
              total: true,
              at: now,
            })
          }
          continue
        }
        const change = Math.round((points - (before[player.id]?.[pointsKey] ?? 0)) * 100) / 100
        if (change !== 0) {
          fresh.push({
            key: `${player.id}-${now}`,
            name: shortName(player.name),
            team: player.team,
            points: change,
            detail: statWords(after, before[player.id]),
            at: now,
          })
        }
      }
      previous.current = { feedKey, stats: next }
      setStats(next)
      if (fresh.length)
        setFeed((current) => ({
          key: feedKey,
          updates: [
            ...fresh.sort((a, b) => Math.abs(b.points) - Math.abs(a.points)),
            ...(current.key === feedKey ? current.updates : []),
          ].slice(0, 30),
        }))
    }

    check()
    const timer = setInterval(check, gamesLive ? 30 * 1000 : 5 * 60 * 1000)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [season, week, ids, pointsKey, gamesLive, feedKey])

  return { stats, updates: feed.key === feedKey ? feed.updates : [], pointsKey }
}
