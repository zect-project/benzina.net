import { useState, useEffect, useCallback } from 'react'
import type { Station, StationDetail, UserStats } from '../types'
import { fetchStation, getUserId } from '../api'
import StationListItem from './StationListItem'
import StationDetails from './StationDetails'

interface Props {
  stations: Station[]
  loading: boolean
  search: string
  onSearchChange: (val: string) => void
  selectedId: number | null
  onSelect: (s: Station | null) => void
  onReport: (s: Station) => void
  userStats: UserStats | null
  onRefresh: () => void
}

type Mode = 'list' | 'details'

export default function BottomPanel({
  stations, loading, search, onSearchChange,
  selectedId, onSelect, onReport, userStats, onRefresh,
}: Props) {
  const [mode, setMode] = useState<Mode>('list')
  const [expanded, setExpanded] = useState(false)
  const [detail, setDetail] = useState<StationDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    if (!selectedId || mode !== 'list') return
    setMode('details')
    setExpanded(true)
    setDetailLoading(true)
    const uid = getUserId()
    fetchStation(selectedId, uid)
      .then(setDetail)
      .catch(console.error)
      .finally(() => setDetailLoading(false))
  }, [selectedId, mode])

  const handleSelect = useCallback((s: Station) => {
    onSelect(s)
  }, [onSelect])

  const handleBack = useCallback(() => {
    setMode('list')
    setDetail(null)
    setExpanded(true)
    onSelect(null)
  }, [onSelect])

  const handleCollapse = useCallback(() => {
    setExpanded(false)
    setMode('list')
    onSelect(null)
    setDetail(null)
  }, [onSelect])

  const toggleExpand = useCallback(() => {
    setExpanded((prev) => !prev)
  }, [])

  const listHeight = expanded ? '65vh' : '60px'

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        background: '#fff',
        borderRadius: '16px 16px 0 0',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
        height: mode === 'details' ? (detailLoading ? '40vh' : '75vh') : listHeight,
        transition: 'height .25s ease',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        touchAction: 'pan-y',
      }}
    >
      {mode === 'list' && (
        <>
          <div
            onClick={toggleExpand}
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <div style={{
              width: 40, height: 4, background: '#cbd5e1', borderRadius: 2,
              margin: '0 auto',
            }} />
            {!expanded && (
              <div style={{
                textAlign: 'center', fontSize: 12, color: '#64748b', marginTop: 4,
              }}>
                {stations.length} заправок — нажмите для списка
              </div>
            )}
          </div>

          {expanded && (
            <div style={{
              padding: '0 16px 8px',
              display: 'flex', gap: 8, alignItems: 'center',
            }}>
              <input
                type="text"
                placeholder="Поиск по названию, адресу..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                style={{
                  flex: 1, padding: '9px 12px', fontSize: 14,
                  border: '1px solid #e2e8f0', borderRadius: 10,
                  boxSizing: 'border-box', outline: 'none',
                }}
              />
            </div>
          )}

          {expanded && (
            <div style={{ flex: 1, overflow: 'auto' }}>
              {loading ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                  Загрузка...
                </div>
              ) : stations.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                  Ничего не найдено
                </div>
              ) : (
                stations.map((s) => (
                  <StationListItem
                    key={s.id}
                    station={s}
                    onClick={() => handleSelect(s)}
                  />
                ))
              )}
            </div>
          )}
        </>
      )}

      {mode === 'details' && (
        <>
          <div
            onClick={handleCollapse}
            style={{ padding: '8px 16px', cursor: 'pointer', userSelect: 'none' }}
          >
            <div style={{
              width: 40, height: 4, background: '#cbd5e1', borderRadius: 2,
              margin: '0 auto',
            }} />
          </div>
          {detailLoading ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>
              Загрузка...
            </div>
          ) : detail ? (
            <StationDetails
              station={detail}
              onBack={handleBack}
              onReport={() => onReport(detail)}
            />
          ) : (
            <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>
              Ошибка загрузки
            </div>
          )}
        </>
      )}
    </div>
  )
}
