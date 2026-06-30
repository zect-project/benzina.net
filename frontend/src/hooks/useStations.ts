import { useState, useEffect, useCallback } from 'react'
import type { Station, Stats, UserStats } from '../types'
import { fetchStations, fetchStats, fetchUserStats, getUserId } from '../api'

export function useStations() {
  const [stations, setStations] = useState<Station[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const userId = getUserId()

  const load = useCallback(async (q: string) => {
    setLoading(true)
    try {
      const [s, st, us] = await Promise.all([
        fetchStations(q, userId),
        q ? null : fetchStats(),
        fetchUserStats(userId),
      ])
      setStations(s)
      if (st) setStats(st)
      setUserStats(us)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    load(search)
  }, [load, search])

  const refresh = useCallback(() => load(search), [load, search])

  return { stations, stats, userStats, loading, search, setSearch, refresh }
}
