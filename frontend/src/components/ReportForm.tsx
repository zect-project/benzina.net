import { useState } from 'react'
import type { Station, UserStats } from '../types'
import { FUEL_LABELS, STATUS_OPTIONS, STATUS_LABELS } from '../types'
import { submitReport, getUserId } from '../api'

interface Props {
  station: Station
  userStats: UserStats
  onClose: () => void
  onSuccess: () => void
}

const initialFuels = () => ({
  fuel_92: 'unknown' as string,
  fuel_95: 'unknown' as string,
  fuel_98: 'unknown' as string,
  fuel_diesel: 'unknown' as string,
})

export default function ReportForm({ station, userStats, onClose, onSuccess }: Props) {
  const [fuels, setFuels] = useState<Record<string, string>>(initialFuels())
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const updateFuel = (key: string, val: string) => {
    setFuels((prev) => ({ ...prev, [key]: val }))
  }

  const handleSubmit = async () => {
    setSending(true)
    setError('')
    try {
      await submitReport(station.id, {
        ...fuels as any,
        user_id: getUserId(),
      })
      onSuccess()
    } catch (e: any) {
      setError(e.message || 'Ошибка')
    } finally {
      setSending(false)
    }
  }

  const hasAnyFuel = Object.values(fuels).some((v) => v !== 'unknown')
  const canVote = userStats.weight > 0

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'flex-end', zIndex: 2000,
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 420, margin: '0 auto',
          background: '#fff', borderRadius: '16px 16px 0 0',
          maxHeight: '90vh', overflow: 'auto',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
        }}
      >
        <div style={{ padding: '16px 20px 0' }}>
          <div style={{
            width: 40, height: 4, background: '#cbd5e1', borderRadius: 2,
            margin: '0 auto 12px',
          }} />

          <h3 style={{ margin: '0 0 2px', fontSize: 17, color: '#0f172a' }}>
            {station.name || 'АЗС'}
          </h3>
          {station.address && (
            <p style={{ margin: '0 0 12px', fontSize: 13, color: '#64748b' }}>
              {station.address}
            </p>
          )}

          <div style={{
            display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14,
            padding: '8px 12px', background: '#f8fafc', borderRadius: 8,
            fontSize: 12, color: '#475569',
          }}>
            <span>Ваш вес:</span>
            <span style={{ fontWeight: 700, color: canVote ? '#2563eb' : '#94a3b8' }}>
              {userStats.weight}
            </span>
            <span style={{ color: '#94a3b8' }}>
              ({userStats.reports_count} отметок{userStats.reports_count === 1 ? 'а' : ''})
            </span>
            {!canVote && (
              <span style={{ color: '#ca8a04', marginLeft: 4 }}>
                — нужно 5 отметок
              </span>
            )}
          </div>
        </div>

        <div style={{ padding: '0 20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(FUEL_LABELS).map(([key, label]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 48, fontSize: 14, fontWeight: 500, color: '#334155' }}>
                  {label}
                </span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => updateFuel(key, opt)}
                      style={{
                        padding: '5px 12px', fontSize: 13, borderRadius: 8,
                        border: fuels[key] === opt ? '2px solid #2563eb' : '1px solid #e2e8f0',
                        background: fuels[key] === opt ? '#eff6ff' : '#fff',
                        cursor: 'pointer', fontWeight: fuels[key] === opt ? 600 : 400,
                        color: fuels[key] === opt ? '#1d4ed8' : '#475569',
                        transition: 'all .1s',
                      }}
                    >
                      {STATUS_LABELS[opt]}
                    </button>
                  ))}
                  {fuels[key] !== 'unknown' && (
                    <button
                      onClick={() => updateFuel(key, 'unknown')}
                      style={{
                        padding: '5px 8px', fontSize: 12, borderRadius: 8,
                        border: '1px solid #e2e8f0', background: '#fff',
                        cursor: 'pointer', color: '#94a3b8', lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div style={{
              color: '#dc2626', fontSize: 13, marginTop: 8, padding: '8px 12px',
              background: '#fef2f2', borderRadius: 8,
            }}>
              {error}
            </div>
          )}
        </div>

        <div style={{
          display: 'flex', gap: 8, padding: '12px 20px 20px',
        }}>
          <button
            onClick={handleSubmit}
            disabled={sending || !hasAnyFuel}
            style={{
              flex: 1, padding: '12px 0', fontSize: 15, fontWeight: 600,
              background: !hasAnyFuel ? '#e2e8f0' : '#2563eb',
              color: !hasAnyFuel ? '#94a3b8' : '#fff',
              border: 'none', borderRadius: 10, cursor: sending || !hasAnyFuel ? 'default' : 'pointer',
              opacity: sending ? 0.6 : 1,
            }}
          >
            {sending ? 'Отправка...' : 'Отправить'}
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '12px 20px', fontSize: 15,
              border: '1px solid #e2e8f0', borderRadius: 10,
              background: '#fff', cursor: 'pointer', color: '#475569',
            }}
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  )
}
