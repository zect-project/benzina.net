import type { Station } from '../types'
import { STATUS_COLORS, FUEL_LABELS } from '../types'

interface Props {
  station: Station
  onClick: () => void
}

export default function StationListItem({ station, onClick }: Props) {
  const color = STATUS_COLORS[station.status]
  const details = station.fuel_details

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 16px',
        cursor: 'pointer',
        borderBottom: '1px solid #f1f5f9',
        transition: 'background .1s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
      onMouseLeave={(e) => (e.currentTarget.style.background = '')}
    >
      <div style={{
        width: 14, height: 14, borderRadius: '50%',
        background: color, flexShrink: 0,
        border: '2px solid white',
        boxShadow: '0 0 0 1px #e2e8f0',
        opacity: station.status === 'unknown' ? 0.4 : 1,
      }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>
          {station.name || station.brand || station.operator || 'АЗС'}
        </div>
        {station.address && (
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {station.address}
          </div>
        )}
        {details && (
          <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
            {Object.entries(FUEL_LABELS).map(([key, label]) => {
              const val = details[key as keyof typeof details]
              if (!val || val === 'unknown') return null
              const c = val === 'available' ? '#16a34a' : val === 'limited' ? '#ca8a04' : '#dc2626'
              const bg = val === 'available' ? '#f0fdf4' : val === 'limited' ? '#fefce8' : '#fef2f2'
              return (
                <span
                  key={key}
                  style={{
                    fontSize: 10, padding: '1px 5px', borderRadius: 4,
                    background: bg, color: c, fontWeight: 600,
                  }}
                >
                  {label}
                </span>
              )
            })}
          </div>
        )}
      </div>

      <div style={{
        fontSize: 12, fontWeight: 500, color: color, flexShrink: 0,
      }}>
        {station.status === 'unknown' ? '—' :
         station.status === 'available' ? '✓' :
         station.status === 'partial' ? '~' : '✗'}
      </div>
    </div>
  )
}
