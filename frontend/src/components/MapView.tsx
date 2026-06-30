import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import type { Station } from '../types'
import { STATUS_COLORS } from '../types'

interface MapViewProps {
  stations: Station[]
  selectedId: number | null
  onSelect: (station: Station) => void
}

function createIcon(color: string, selected: boolean, hasData: boolean): L.DivIcon {
  const size = selected ? 18 : 12
  const border = selected ? '3px solid #1d4ed8' : '2px solid white'
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};
      border:${border};
      border-radius:50%;
      box-shadow:0 1px 4px rgba(0,0,0,0.3);
      cursor:pointer;
      opacity:${hasData ? 1 : 0.4};
    "></div>`,
    iconSize: [size + 4, size + 4],
    iconAnchor: [(size + 4) / 2, (size + 4) / 2],
  })
}

function createUserIcon(heading: number | null): L.DivIcon {
  const rotation = heading != null ? `transform:rotate(${heading}deg)` : ''
  return L.divIcon({
    className: '',
    html: `<div style="
      width:32px;height:32px;
      display:flex;align-items:center;justify-content:center;
      ${rotation}
    ">
      <img src="/strelka.png" style="width:32px;height:32px;object-fit:contain;" />
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })
}

export default function MapView({ stations, selectedId, onSelect }: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<number, L.Marker>>(new Map())
  const containerRef = useRef<HTMLDivElement>(null)
  const userMarkerRef = useRef<L.Marker | null>(null)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [userHeading, setUserHeading] = useState<number | null>(null)

  useEffect(() => {
    if (mapRef.current) return

    const map = L.map(containerRef.current!, {
      center: [55.03, 82.92],
      zoom: 12,
      zoomControl: false,
      attributionControl: false,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map)

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!navigator.geolocation) return
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude])
        if (pos.coords.heading != null) setUserHeading(pos.coords.heading)
      },
      () => {},
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !userLocation) return

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng(userLocation)
      userMarkerRef.current.setIcon(createUserIcon(userHeading))
      return
    }

    const marker = L.marker(userLocation, {
      icon: createUserIcon(userHeading),
      zIndexOffset: 2000,
    })
    marker.addTo(map)
    userMarkerRef.current = marker
  }, [userLocation, userHeading])

  const handleLocate = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.setView(userLocation, 15, { animate: true })
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude]
          setUserLocation(loc)
          if (pos.coords.heading != null) setUserHeading(pos.coords.heading)
          mapRef.current?.setView(loc, 15, { animate: true })
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000 }
      )
    }
  }

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const markers = markersRef.current
    const seen = new Set<number>()

    stations.forEach((s) => {
      seen.add(s.id)
      const color = STATUS_COLORS[s.status]
      const isSelected = s.id === selectedId
      const icon = createIcon(color, isSelected, s.status !== 'unknown')

      if (markers.has(s.id)) {
        const m = markers.get(s.id)!
        m.setIcon(icon)
        m.setZIndexOffset(isSelected ? 1000 : 0)
        return
      }

      const marker = L.marker([s.lat, s.lng], { icon })
      marker.on('click', () => onSelect(s))
      marker.addTo(map)
      markers.set(s.id, marker)
    })

    markers.forEach((m, id) => {
      if (!seen.has(id)) {
        map.removeLayer(m)
        markers.delete(id)
      }
    })
  }, [stations, selectedId, onSelect])

  useEffect(() => {
    if (!selectedId) return
    const station = stations.find((s) => s.id === selectedId)
    if (station && mapRef.current) {
      mapRef.current.setView([station.lat, station.lng], 15, { animate: true })
    }
  }, [selectedId, stations])

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
      <div style={{
        position: 'absolute',
        right: 10,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 1000,
      }} className="leaflet-bar leaflet-control">
        <a className="leaflet-control-zoom-in" role="button" href="#"
          onClick={(e) => { e.preventDefault(); mapRef.current?.zoomIn() }}
        >+</a>
        <a className="leaflet-control-zoom-out" role="button" href="#"
          onClick={(e) => { e.preventDefault(); mapRef.current?.zoomOut() }}
        >−</a>
        <a className="leaflet-control-locate" role="button" href="#"
          onClick={(e) => { e.preventDefault(); handleLocate() }}
          title="Моё местоположение"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="#2563eb">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            <circle cx="12" cy="9" r="3" fill="white"/>
          </svg>
        </a>
      </div>
    </div>
  )
}
