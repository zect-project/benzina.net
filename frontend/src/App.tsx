import { useState, useCallback } from 'react'
import type { Station } from './types'
import { useStations } from './hooks/useStations'
import MapView from './components/MapView'
import BottomPanel from './components/BottomPanel'
import ReportForm from './components/ReportForm'

export default function App() {
  const { stations, stats, userStats, loading, search, setSearch, refresh } = useStations()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [reportStation, setReportStation] = useState<Station | null>(null)

  const handleSelect = useCallback((s: Station | null) => {
    setSelectedId(s ? s.id : null)
  }, [])

  return (
    <div style={{
      width: '100%', height: '100%', overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      position: 'relative',
    }}>
      <header style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
        padding: '8px 14px', paddingTop: 'calc(env(safe-area-inset-top) + 8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        pointerEvents: 'none',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(8px)',
          padding: '6px 14px', borderRadius: 12,
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
          pointerEvents: 'auto',
        }}>
          <span style={{ fontWeight: 400, fontSize: 16, color: '#0f172a', letterSpacing: '-0.3px' }}>
            benzina.net
          </span>
        </div>

      </header>

      <div style={{ position: 'absolute', inset: 0 }}>
        <MapView
          stations={stations}
          selectedId={selectedId}
          onSelect={handleSelect}
        />
      </div>

      <BottomPanel
        stations={stations}
        loading={loading}
        search={search}
        onSearchChange={setSearch}
        selectedId={selectedId}
        onSelect={handleSelect}
        onReport={setReportStation}
        userStats={userStats}
        onRefresh={refresh}
      />

      {reportStation && userStats && (
        <ReportForm
          station={reportStation}
          userStats={userStats}
          onClose={() => setReportStation(null)}
          onSuccess={() => {
            setReportStation(null)
            refresh()
          }}
        />
      )}
    </div>
  )
}
