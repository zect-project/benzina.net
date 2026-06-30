import type { StationDetail, ReportItem } from '../types'
import { STATUS_COLORS, STATUS_LABELS, FUEL_LABELS } from '../types'

interface Props {
  station: StationDetail
  onBack: () => void
  onReport: () => void
}

export default function StationDetails({ station, onBack, onReport }: Props) {
  const color = STATUS_COLORS[station.status]
  const details = station.fuel_details

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '12px 16px', borderBottom: '1px solid #e2e8f0',
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'none', border: 'none', fontSize: 20, cursor: 'pointer',
            padding: '4px 8px 4px 0', color: '#475569', lineHeight: 1,
          }}
        >
          ←
        </button>
        <div style={{ fontWeight: 600, fontSize: 15, color: '#0f172a', flex: 1 }}>
          {station.name || station.brand || station.operator || 'АЗС'}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {station.address && (
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>
            {station.address}
          </div>
        )}

        {station.operator && (
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>
            {station.operator}
          </div>
        )}

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '6px 14px', borderRadius: 20,
          background: color + '20', color: color,
          fontWeight: 600, fontSize: 13, marginBottom: 12,
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
          {STATUS_LABELS[station.status]}
        </div>

        {details && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 8 }}>
              Наличие топлива
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {Object.entries(FUEL_LABELS).map(([key, label]) => {
                const val = details[key as keyof typeof details] || 'unknown'
                const c = val === 'available' ? '#16a34a' : val === 'none' ? '#dc2626' : '#94a3b8'
                const bg = val === 'available' ? '#f0fdf4' : val === 'none' ? '#fef2f2' : '#f8fafc'
                return (
                  <div
                    key={key}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '6px 10px', borderRadius: 8, background: bg,
                    }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#334155' }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: c }}>
                      {STATUS_LABELS[val]}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {station.report_count > 0 && (
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>
            {station.report_count} отметк{station.report_count === 1 ? 'а' : 'и'}
          </div>
        )}

        {station.reports.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 8 }}>
              История отметок
            </div>
            {station.reports.map((r: ReportItem) => (
              <div
                key={r.id}
                style={{
                  padding: '10px 12px', marginBottom: 8,
                  background: '#f8fafc', borderRadius: 8,
                  border: '1px solid #f1f5f9',
                }}
              >
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>
                  {new Date(r.created_at).toLocaleString('ru-RU')}
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
                  {Object.entries(FUEL_LABELS).map(([key, label]) => {
                    const val = r.fuels[key as keyof typeof r.fuels]
                    if (!val || val === 'unknown') return null
                    const c = val === 'available' ? '#16a34a' : '#dc2626'
                    const bg = val === 'available' ? '#f0fdf4' : '#fef2f2'
                    return (
                      <span key={key} style={{
                        fontSize: 10, padding: '1px 5px', borderRadius: 4,
                        background: bg, color: c, fontWeight: 600,
                      }}>
                        {label}: {STATUS_LABELS[val]}
                      </span>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '12px 16px', borderTop: '1px solid #e2e8f0' }}>
        <button
          onClick={onReport}
          style={{
            width: '100%', padding: '12px 0', fontSize: 15, fontWeight: 600,
            background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10,
            cursor: 'pointer',
          }}
        >
          Отметить наличие топлива
        </button>
      </div>
    </div>
  )
}
