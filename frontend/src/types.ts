export interface Station {
  id: number
  osm_id: string
  brand: string | null
  name: string | null
  operator: string | null
  address: string
  lat: number
  lng: number
  status: 'available' | 'partial' | 'none' | 'unknown'
  fuel_details: FuelReport | null
  report_count: number
  user_weight: number
  created_at: string
}

export interface StationDetail extends Station {
  reports: ReportItem[]
}

export interface FuelReport {
  fuel_92: string
  fuel_95: string
  fuel_98: string
  fuel_diesel: string
}

export interface ReportItem {
  id: number
  station_id: number
  user_id: string
  fuels: FuelReport
  created_at: string
}

export interface Stats {
  total_stations: number
  reported_stations: number
  fuel_available: number
  fuel_partial: number
  fuel_none: number
  total_users: number
}

export interface UserStats {
  user_id: string
  reports_count: number
  weight: number
}

export const FUEL_LABELS: Record<string, string> = {
  fuel_92: 'АИ-92',
  fuel_95: 'АИ-95',
  fuel_98: 'АИ-98',
  fuel_diesel: 'ДТ',
}

export const FUEL_KEYS = ['fuel_92', 'fuel_95', 'fuel_98', 'fuel_diesel'] as const

export const STATUS_OPTIONS = ['available', 'none'] as const

export const STATUS_LABELS: Record<string, string> = {
  available: 'Есть',
  limited: 'Ограничено',
  none: 'Нет',
  unknown: 'Неизвестно',
}

export const STATUS_COLORS: Record<string, string> = {
  available: '#22c55e',
  partial: '#eab308',
  none: '#ef4444',
  unknown: '#94a3b8',
}

export const STATUS_BG: Record<string, string> = {
  available: '#dcfce7',
  partial: '#fef9c3',
  none: '#fee2e2',
  unknown: '#f1f5f9',
}
