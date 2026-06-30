import type { Station, StationDetail, FuelReport, Stats, UserStats } from './types'

const BASE = '/api'

function generateId(): string {
  try {
    return crypto.randomUUID()
  } catch {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
    })
  }
}

export function getUserId(): string {
  let id = localStorage.getItem('benzina_user_id')
  if (!id) {
    id = generateId()
    localStorage.setItem('benzina_user_id', id)
  }
  return id
}

export async function fetchStations(search = '', userId = ''): Promise<Station[]> {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (userId) params.set('user_id', userId)
  const res = await fetch(`${BASE}/stations?${params}`)
  if (!res.ok) throw new Error('Failed to fetch stations')
  return res.json()
}

export async function fetchStation(id: number, userId = ''): Promise<StationDetail> {
  const params = userId ? `?user_id=${encodeURIComponent(userId)}` : ''
  const res = await fetch(`${BASE}/stations/${id}${params}`)
  if (!res.ok) throw new Error('Station not found')
  return res.json()
}

export async function submitReport(
  stationId: number,
  report: FuelReport & { user_id: string }
): Promise<void> {
  const res = await fetch(`${BASE}/stations/${stationId}/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(report),
  })
  if (res.status === 429) throw new Error('Можно отмечать раз в 10 минут')
  if (!res.ok) throw new Error('Ошибка отправки')
}

export async function fetchStats(): Promise<Stats> {
  const res = await fetch(`${BASE}/stats`)
  if (!res.ok) throw new Error('Failed to fetch stats')
  return res.json()
}

export async function fetchUserStats(userId: string): Promise<UserStats> {
  const res = await fetch(`${BASE}/user/stats?user_id=${encodeURIComponent(userId)}`)
  if (!res.ok) throw new Error('Failed to fetch user stats')
  return res.json()
}
