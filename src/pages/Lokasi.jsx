import { useEffect, useRef, useState } from 'react'
import Header from '../components/Header'
import StatusBadge from '../components/StatusBadge'
import { hasValidDestination, isValidCoordinate, openGoogleMapsSatellite } from '../utils/googleMaps'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Tile Provider Configurations
const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'

// Esri World Imagery (ArcGIS Online)
const ESRI_TILE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
const ESRI_ATTRIBUTION = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'

function createCustomMarkerIcon(vehicle, isSelected) {
  return L.divIcon({
    className: 'jagaroda-map-marker',
    iconSize: [110, 32],
    iconAnchor: [55, 16],
    popupAnchor: [0, -20],
    html: `
      <div style="
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border-radius: 9999px;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
        user-select: none;
        white-space: nowrap;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
        transition: transform 0.15s ease, background-color 0.15s ease;
        ${
          isSelected
            ? 'background-color: #0F766E; color: #ffffff; transform: scale(1.12); box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.4), 0 6px 14px rgba(0,0,0,0.3);'
            : 'background-color: #17324D; color: #ffffff;'
        }
      ">
        <span style="display: flex; align-items: center; justify-content: center; width: 18px; height: 18px; border-radius: 9999px; background-color: rgba(255, 255, 255, 0.22); font-size: 10px;">
          📍
        </span>
        <span>${vehicle.plate}</span>
      </div>
    `,
  })
}

// Data pemesanan & destinasi rental (Data simulasi/demo untuk visualisasi tujuan)
const vehicles = [
  {
    id: 'brio',
    name: 'Honda Brio Satya E',
    plate: 'L 2345 BC',
    type: 'Compact City',
    status: 'Sedang Disewa',
    statusVariant: 'success',
    bookingId: 'BK-003',
    renter: 'Ahmad Faisal (Penyewa)',
    rentalType: 'Lepas Kunci',
    destination: 'Jl. Raya Darmo No. 82, Surabaya Pusat',
    destinationCoordinates: { lat: -7.2905, lng: 112.7412 },
    period: '23 - 25 Okt 2026',
    notes: 'Operasional dinas dalam kota',
    pinLabel: 'Tujuan: Darmo',
  },
  {
    id: 'ertiga',
    name: 'Suzuki Ertiga Hybrid',
    plate: 'L 6789 FG',
    type: 'MPV Keluarga',
    status: 'Sedang Disewa',
    statusVariant: 'info',
    bookingId: 'BK-002',
    renter: 'PT Nusantara Logistik (Driver: Bambang)',
    rentalType: 'Dengan Pengemudi',
    destination: 'Tol Waru - Juanda KM 12, Sidoarjo',
    destinationCoordinates: { lat: -7.3521, lng: 112.7689 },
    period: '24 - 25 Okt 2026',
    notes: 'Antar jemput tamu Bandara Juanda',
    pinLabel: 'Tujuan: Waru-Juanda',
  },
  {
    id: 'innova',
    name: 'Toyota Innova Zenix',
    plate: 'L 1122 ZZ',
    type: 'Premium MPV',
    status: 'Standby Garasi',
    statusVariant: 'neutral',
    bookingId: '-',
    renter: '-',
    rentalType: '-',
    destination: '', // Belum ada tujuan pemesanan
    destinationCoordinates: null,
    period: 'Tersedia di Pool',
    notes: 'Unit standby di Pool Gubeng Surabaya, belum ada booking aktif',
    pinLabel: 'Pool Gubeng',
  },
  {
    id: 'avanza',
    name: 'Toyota Avanza 1.3 G',
    plate: 'L 1234 AB',
    type: 'MPV 7-Seater',
    status: 'Standby Garasi',
    statusVariant: 'neutral',
    bookingId: '-',
    renter: '-',
    rentalType: '-',
    destination: '', // Belum ada tujuan pemesanan
    destinationCoordinates: null,
    period: 'Tersedia di Pool',
    notes: 'Unit standby di Pool Barat Surabaya, belum ada booking aktif',
    pinLabel: 'Pool Barat',
  },
]

export default function Lokasi() {
  const [destinationFilter, setDestinationFilter] = useState('all') // 'all' | 'rented' | 'garage'
  const [searchQuery, setSearchQuery] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [selectedPin, setSelectedPin] = useState('brio') // 'brio' | 'ertiga' | 'innova' | 'avanza'
  const [locationFeedback, setLocationFeedback] = useState('')
  const [mapMode, setMapMode] = useState('roadmap') // 'roadmap' | 'satellite'

  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const roadmapLayerRef = useRef(null)
  const satelliteLayerRef = useRef(null)
  const markersRef = useRef({})

  const activeVehicle = vehicles.find((v) => v.id === selectedPin) || vehicles[0]
  const activeHasDestination = hasValidDestination(activeVehicle)

  // 1. Initialize Leaflet Map Instance
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return

    // Center on Surabaya metropolitan area
    const initialCenter = [-7.315, 112.75]
    const initialZoom = 12

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: false, // Managed through custom buttons for unified UI
      attributionControl: true,
    })

    roadmapLayerRef.current = L.tileLayer(OSM_TILE_URL, {
      maxZoom: 19,
      attribution: OSM_ATTRIBUTION,
    })

    satelliteLayerRef.current = L.tileLayer(ESRI_TILE_URL, {
      maxZoom: 19,
      attribution: ESRI_ATTRIBUTION,
    })

    // Initial layer: Roadmap
    roadmapLayerRef.current.addTo(map)

    mapInstanceRef.current = map

    // Handle container resize cleanly
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize()
    })
    resizeObserver.observe(mapContainerRef.current)

    return () => {
      resizeObserver.disconnect()
      map.remove()
      mapInstanceRef.current = null
      markersRef.current = {}
    }
  }, [])

  // 2. Handle Layer Switching (Peta vs Satelit) without recreating map or losing zoom/center
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    if (mapMode === 'satellite') {
      if (roadmapLayerRef.current && map.hasLayer(roadmapLayerRef.current)) {
        map.removeLayer(roadmapLayerRef.current)
      }
      if (satelliteLayerRef.current && !map.hasLayer(satelliteLayerRef.current)) {
        map.addLayer(satelliteLayerRef.current)
      }
    } else {
      if (satelliteLayerRef.current && map.hasLayer(satelliteLayerRef.current)) {
        map.removeLayer(satelliteLayerRef.current)
      }
      if (roadmapLayerRef.current && !map.hasLayer(roadmapLayerRef.current)) {
        map.addLayer(roadmapLayerRef.current)
      }
    }
  }, [mapMode])

  // 3. Sync Booking Destination Markers on the Map
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    vehicles.forEach((v) => {
      const coords = v.destinationCoordinates
      // Do not fabricate coordinates: only place markers where valid coordinates exist
      if (!coords || !isValidCoordinate(coords.lat, coords.lng)) {
        if (markersRef.current[v.id]) {
          markersRef.current[v.id].remove()
          delete markersRef.current[v.id]
        }
        return
      }

      const isSelected = selectedPin === v.id
      const icon = createCustomMarkerIcon(v, isSelected)

      if (markersRef.current[v.id]) {
        markersRef.current[v.id].setIcon(icon)
        markersRef.current[v.id].setZIndexOffset(isSelected ? 1000 : 0)
      } else {
        const marker = L.marker([coords.lat, coords.lng], {
          icon,
          zIndexOffset: isSelected ? 1000 : 0,
        })
        marker.on('click', () => {
          setSelectedPin(v.id)
        })
        marker.addTo(map)
        markersRef.current[v.id] = marker
      }
    })
  }, [selectedPin])

  const filteredVehicles = vehicles.filter((v) => {
    const hasDest = Boolean(v.destination && v.destination.trim())
    const matchesFilter =
      destinationFilter === 'all' ||
      (destinationFilter === 'rented' && hasDest) ||
      (destinationFilter === 'garage' && !hasDest)

    const q = searchQuery.toLowerCase().trim()
    const matchesSearch =
      v.name.toLowerCase().includes(q) ||
      v.plate.toLowerCase().includes(q) ||
      (v.destination && v.destination.toLowerCase().includes(q)) ||
      (v.renter && v.renter.toLowerCase().includes(q))

    return matchesFilter && matchesSearch
  })

  const handleRefresh = () => {
    setIsUpdating(true)
    mapInstanceRef.current?.invalidateSize()
    setTimeout(() => setIsUpdating(false), 800)
  }

  const handleSelectVehicle = (vehicleId) => {
    setSelectedPin(vehicleId)
    const vehicle = vehicles.find((v) => v.id === vehicleId)
    if (vehicle?.destinationCoordinates && mapInstanceRef.current) {
      const { lat, lng } = vehicle.destinationCoordinates
      if (isValidCoordinate(lat, lng)) {
        mapInstanceRef.current.panTo([lat, lng], { animate: true, duration: 0.8 })
      }
    }
  }

  const handleOpenGoogleMaps = (vehicle) => {
    if (!hasValidDestination(vehicle)) {
      setLocationFeedback(`Lokasi tujuan belum tersedia untuk armada ${vehicle?.name || ''}.`)
      setTimeout(() => setLocationFeedback(''), 3500)
      return
    }

    openGoogleMapsSatellite(vehicle, () => {
      setLocationFeedback(`Lokasi tujuan belum tersedia untuk armada ${vehicle?.name || ''}.`)
      setTimeout(() => setLocationFeedback(''), 3500)
    })
  }

  const activeDestinationCount = vehicles.filter((v) => Boolean(v.destination && v.destination.trim())).length

  return (
    <div className="flex min-h-screen w-full flex-col items-start bg-[#F5F7FA]">
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchPlaceholder="Cari plat nomor, unit, tujuan penyewa..."
        greeting="Peta Lokasi &amp; Tujuan Rental"
        subtitle="Visualisasi Tujuan Pemesanan Armada (Leaflet Interactive Map)"
        onRefresh={handleRefresh}
        actionText="Tambah Booking"
        actionTo="/pemesanan/baru"
      />

      <div className="mx-auto flex w-full max-w-[1600px] flex-col items-start gap-6 p-4 sm:p-6 lg:gap-8 lg:p-8">
        {/* Subheader & Period Toolbar */}
        <div className="flex w-full flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex flex-col items-start gap-1">
            <div className="flex items-center gap-1.5 text-xs text-[#47607E]">
              <span className="font-plusJakartaSans font-bold uppercase tracking-wider text-[#0F766E]">
                Visualisasi Lokasi Tujuan
              </span>
              <span className="text-[#94A3B8]">•</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FEF3C7] px-2 py-0.5 font-semibold text-[#B45309]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#B45309]" />
                Data Demo / Simulasi
              </span>
            </div>
            <h2 className="font-plusJakartaSans text-2xl font-bold tracking-tight text-[#111D23] sm:text-[26px]">
              Peta Lokasi &amp; Destinasi Rental Armada
            </h2>
            <p className="max-w-2xl font-plusJakartaSans text-xs text-[#47607E] sm:text-sm">
              Visualisasi interaktif tujuan penyewa menggunakan Leaflet. Mendukung lapisan Peta (OpenStreetMap) dan Satelit (Esri World Imagery).
            </p>
          </div>

          {/* Filter Pills & Refresh */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1 rounded-xl border border-[#DDEAF2] bg-[#E9F6FD] p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setDestinationFilter('all')}
                className={`rounded-lg px-3 py-1.5 font-plusJakartaSans text-xs font-semibold transition-all cursor-pointer ${
                  destinationFilter === 'all'
                    ? 'bg-white text-[#0F766E] shadow-xs'
                    : 'text-[#47607E] hover:text-[#0F766E]'
                }`}
              >
                Semua Armada ({vehicles.length})
              </button>
              <button
                type="button"
                onClick={() => setDestinationFilter('rented')}
                className={`rounded-lg px-3 py-1.5 font-plusJakartaSans text-xs font-semibold transition-all cursor-pointer ${
                  destinationFilter === 'rented'
                    ? 'bg-white text-[#0F766E] shadow-xs'
                    : 'text-[#47607E] hover:text-[#0F766E]'
                }`}
              >
                Ada Tujuan Rental ({activeDestinationCount})
              </button>
              <button
                type="button"
                onClick={() => setDestinationFilter('garage')}
                className={`rounded-lg px-3 py-1.5 font-plusJakartaSans text-xs font-semibold transition-all cursor-pointer ${
                  destinationFilter === 'garage'
                    ? 'bg-white text-[#0F766E] shadow-xs'
                    : 'text-[#47607E] hover:text-[#0F766E]'
                }`}
              >
                Standby Garasi ({vehicles.length - activeDestinationCount})
              </button>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#DDEAF2] bg-white px-3.5 font-plusJakartaSans text-xs font-semibold text-[#17324D] shadow-xs transition-colors hover:bg-[#F8FAFC] cursor-pointer"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={isUpdating ? 'animate-spin text-[#0F766E]' : ''}
                aria-hidden="true"
              >
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
              <span>{isUpdating ? 'Memperbarui...' : 'Perbarui Tampilan'}</span>
            </button>
          </div>
        </div>

        {/* Informative Disclaimer Banner */}
        <div className="flex w-full items-center gap-3 rounded-xl border border-[#CCE3F0] bg-[#F0F7FB] px-4 py-2.5 text-xs text-[#204969] shadow-2xs">
          <span className="text-base">ℹ️</span>
          <p className="font-plusJakartaSans text-xs leading-relaxed">
            <span className="font-bold">Informasi:</span> Peta Leaflet ini menampilkan visualisasi titik tujuan rental pemesanan pelanggan (data demo). Sistem tidak melakukan pelacakan GPS live armada secara real-time.
          </p>
        </div>

        {/* Main Grid: Leaflet Map on Left, Vehicle List on Right */}
        <div className="grid w-full grid-cols-1 items-start gap-6 xl:grid-cols-[1.4fr_1fr]">
          {/* Left Column: Interactive Leaflet Map View & Stat Cards */}
          <div className="flex flex-col gap-6">
            {/* Map Container */}
            <div className="relative h-[480px] w-full overflow-hidden rounded-2xl border border-[#DDEAF2] bg-[#E2E8F0] shadow-xs sm:h-[540px]">
              {/* Actual Leaflet Map Canvas */}
              <div ref={mapContainerRef} className="h-full w-full z-0" tabIndex={0} />

              {/* Map Top Floating Controls (Layer Selector + Zoom) */}
              <div className="absolute left-3 right-3 top-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none z-[750]">
                {/* Region Badge */}
                <div className="flex items-center gap-2 rounded-full border border-white/80 bg-white/95 px-3.5 py-1.5 shadow-sm backdrop-blur-xs pointer-events-auto">
                  <span className="h-2 w-2 rounded-full bg-[#0F766E]" />
                  <span className="font-plusJakartaSans text-xs font-semibold text-[#111D23]">
                    Surabaya &amp; Sekitarnya
                  </span>
                  <span className="text-[11px] text-[#47607E]">• {mapMode === 'satellite' ? 'Esri Satellite' : 'OpenStreetMap'}</span>
                </div>

                {/* Right Top: Mode Selector (Peta / Satelit) + Zoom */}
                <div className="flex items-center gap-2 pointer-events-auto">
                  {/* Layer Selector */}
                  <div className="flex items-center gap-1 rounded-lg border border-white/80 bg-white/95 p-1 shadow-sm backdrop-blur-xs">
                    <button
                      type="button"
                      data-interaction-handled="true"
                      onClick={() => setMapMode('roadmap')}
                      title="Tampilkan peta jalan (OpenStreetMap)"
                      className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-plusJakartaSans text-xs font-semibold transition-all cursor-pointer ${
                        mapMode === 'roadmap'
                          ? 'bg-[#0F766E] text-white shadow-xs'
                          : 'text-[#47607E] hover:bg-[#E9F6FD] hover:text-[#0F766E]'
                      }`}
                    >
                      <span>🗺️</span>
                      <span>Peta</span>
                    </button>
                    <button
                      type="button"
                      data-interaction-handled="true"
                      onClick={() => setMapMode('satellite')}
                      title="Tampilkan citra satelit (Esri World Imagery)"
                      className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-plusJakartaSans text-xs font-semibold transition-all cursor-pointer ${
                        mapMode === 'satellite'
                          ? 'bg-[#0F766E] text-white shadow-xs'
                          : 'text-[#47607E] hover:bg-[#E9F6FD] hover:text-[#0F766E]'
                      }`}
                    >
                      <span>🛰️</span>
                      <span>Satelit</span>
                    </button>
                  </div>

                  {/* Zoom Controls */}
                  <div className="flex items-center gap-1 rounded-lg border border-white/80 bg-white/95 p-1 shadow-sm backdrop-blur-xs">
                    <button
                      type="button"
                      data-interaction-handled="true"
                      aria-label="Perbesar peta"
                      onClick={() => mapInstanceRef.current?.zoomIn()}
                      className="flex h-7 w-7 items-center justify-center rounded font-bold text-[#47607E] hover:bg-[#E9F6FD] cursor-pointer"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      data-interaction-handled="true"
                      aria-label="Perkecil peta"
                      onClick={() => mapInstanceRef.current?.zoomOut()}
                      className="flex h-7 w-7 items-center justify-center rounded font-bold text-[#47607E] hover:bg-[#E9F6FD] cursor-pointer"
                    >
                      &minus;
                    </button>
                  </div>
                </div>
              </div>

              {/* Selected Pin Details Popup Floating in Map */}
              <div className="absolute bottom-6 left-3 right-3 sm:right-auto sm:w-88 rounded-xl border border-white/80 bg-white/95 p-4 shadow-lg backdrop-blur-md z-[750]">
                <div className="flex items-center justify-between border-b border-[#E3F0F8] pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-plusJakartaSans text-xs font-bold text-[#111D23]">
                      {activeVehicle.name}
                    </span>
                    <span className="font-liberationMono text-[11px] font-semibold text-[#0F766E]">
                      {activeVehicle.plate}
                    </span>
                  </div>
                  <StatusBadge status={activeVehicle.status} variant={activeVehicle.statusVariant} size="sm" />
                </div>

                <div className="mt-2.5 flex flex-col gap-1.5 text-xs">
                  <div className="flex items-center justify-between text-[#47607E]">
                    <span>Penyewa / Klien:</span>
                    <span className="font-semibold text-[#111D23]">{activeVehicle.renter}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#47607E]">
                    <span>No. Pemesanan:</span>
                    <span className="font-semibold text-[#0F766E]">{activeVehicle.bookingId}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#47607E]">
                    <span>Paket Layanan:</span>
                    <span className="font-medium text-[#111D23]">{activeVehicle.rentalType}</span>
                  </div>
                  <div className="flex items-start justify-between text-[#47607E] pt-0.5">
                    <span className="shrink-0 font-medium">Tujuan Penyewa:</span>
                    {activeHasDestination ? (
                      <button
                        type="button"
                        data-interaction-handled="true"
                        onClick={() => handleOpenGoogleMaps(activeVehicle)}
                        title="Buka lokasi tujuan di Google Maps"
                        className="group inline-flex items-center gap-1 text-right font-semibold text-[#0F766E] max-w-[190px] hover:text-[#0D655E] transition-colors cursor-pointer"
                      >
                        <span className="truncate group-hover:underline">{activeVehicle.destination}</span>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-75 group-hover:opacity-100" aria-hidden="true">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </button>
                    ) : (
                      <span className="text-right text-[#94A3B8] italic">
                        Lokasi tujuan belum tersedia
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-between border-t border-[#E3F0F8] pt-2 text-[11px] text-[#64748B]">
                  <span>Periode: {activeVehicle.period}</span>
                  <span className="font-medium text-[#47607E]">{activeVehicle.type}</span>
                </div>

                {/* Designated Google Maps Satellite Button */}
                <div className="mt-3 border-t border-[#E3F0F8] pt-2.5">
                  {activeHasDestination ? (
                    <button
                      type="button"
                      data-interaction-handled="true"
                      onClick={() => handleOpenGoogleMaps(activeVehicle)}
                      title="Buka Google Maps dalam tampilan peta jalan (Roadmap)"
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0F766E] px-3.5 py-2 font-plusJakartaSans text-xs font-semibold text-white shadow-xs transition-all hover:bg-[#0D655E] active:scale-[0.99] cursor-pointer"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <span>Buka Google Maps</span>
                    </button>
                  ) : (
                    <div className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#DDEAF2] bg-[#F1F5F9] px-3.5 py-2 font-plusJakartaSans text-xs font-semibold text-[#94A3B8]">
                      <span>Lokasi tujuan belum tersedia</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 3 Rental Destination Summary Cards */}
            <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-3.5 rounded-xl border border-[#DDEAF2] bg-white p-4 shadow-xs">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#E9F6FD] text-[#0F766E]">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <div>
                  <p className="font-plusJakartaSans text-[11px] font-bold uppercase tracking-wider text-[#47607E]">
                    Tujuan Aktif Terdaftar
                  </p>
                  <p className="font-plusJakartaSans text-xl font-bold text-[#111D23]">
                    {activeDestinationCount} <span className="text-xs font-normal text-[#64748B]">Destinasi Pemesanan</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 rounded-xl border border-[#DDEAF2] bg-white p-4 shadow-xs">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#E9F6FD] text-[#0F766E]">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                    <path d="M2 12h20" />
                  </svg>
                </div>
                <div>
                  <p className="font-plusJakartaSans text-[11px] font-bold uppercase tracking-wider text-[#47607E]">
                    Peta Interaktif
                  </p>
                  <p className="font-plusJakartaSans text-xl font-bold text-[#111D23]">
                    Leaflet <span className="text-xs font-semibold text-[#0F766E]">2 Mode Layer</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 rounded-xl border border-[#DDEAF2] bg-white p-4 shadow-xs">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#DCFCE7] text-[#15803D]">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polygon points="12 2 19 21 12 17 5 21 12 2" />
                  </svg>
                </div>
                <div>
                  <p className="font-plusJakartaSans text-[11px] font-bold uppercase tracking-wider text-[#47607E]">
                    Provider Satelit
                  </p>
                  <p className="font-plusJakartaSans text-xl font-bold text-[#15803D]">
                    Esri <span className="text-xs font-normal text-[#64748B]">World Imagery</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Fleet & Destination List */}
          <div className="flex flex-col gap-4 rounded-xl border border-[#DDEAF2] bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#E3F0F8] pb-3">
              <div>
                <h3 className="font-plusJakartaSans text-base font-bold text-[#111D23]">
                  Daftar Armada &amp; Tujuan Rental
                </h3>
                <p className="font-plusJakartaSans text-xs text-[#47607E]">
                  Menampilkan {filteredVehicles.length} armada dengan tujuan pemesanan / penempatan garasi
                </p>
              </div>
              <span className="font-plusJakartaSans text-[11px] font-medium text-[#64748B]">
                Data Demo
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {filteredVehicles.map((v) => {
                const isSelected = selectedPin === v.id
                const hasDest = hasValidDestination(v)
                return (
                  <div
                    key={v.id}
                    onClick={() => handleSelectVehicle(v.id)}
                    className={`flex cursor-pointer flex-col gap-2.5 rounded-xl border p-4 transition-all ${
                      isSelected
                        ? 'border-[#0F766E] bg-[#F0FBF9] shadow-xs'
                        : 'border-[#DDEAF2] bg-white hover:border-[#CBD5E1] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-plusJakartaSans text-sm font-bold text-[#111D23]">
                          {v.name}
                        </span>
                        <span className="rounded bg-[#DDEAF2] px-2 py-0.5 font-liberationMono text-[11px] font-semibold text-[#17324D]">
                          {v.plate}
                        </span>
                      </div>
                      <StatusBadge status={v.status} variant={v.statusVariant} size="sm" />
                    </div>

                    {/* Booking & Customer Info */}
                    <div className="flex items-center justify-between text-xs text-[#47607E]">
                      <span>Klien: {v.renter}</span>
                      <span className="font-liberationMono text-[11px] font-semibold text-[#0F766E]">{v.bookingId}</span>
                    </div>

                    {/* Destination Row (Clickable if available) */}
                    {hasDest ? (
                      <button
                        type="button"
                        data-interaction-handled="true"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSelectVehicle(v.id)
                          handleOpenGoogleMaps(v)
                        }}
                        title="Buka lokasi tujuan di Google Maps"
                        className="group flex items-center justify-between gap-2 text-left text-xs text-[#47607E] hover:text-[#0F766E] transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-[#0F766E]" aria-hidden="true">
                            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          <span className="truncate group-hover:underline">
                            <span className="font-medium text-[#111D23]">Tujuan: </span>
                            {v.destination}
                          </span>
                        </div>
                        <span className="hidden sm:inline-flex items-center gap-1 rounded bg-[#E9F6FD] px-1.5 py-0.5 text-[10px] font-semibold text-[#0F766E] group-hover:bg-[#0F766E] group-hover:text-white transition-colors">
                          Maps ↗
                        </span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-[#94A3B8]" aria-hidden="true">
                          <rect width="16" height="20" x="4" y="2" rx="2" />
                          <line x1="8" x2="16" y1="6" y2="6" />
                          <line x1="8" x2="16" y1="10" y2="10" />
                        </svg>
                        <span className="italic">Lokasi tujuan belum tersedia</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between border-t border-[#E3F0F8]/60 pt-2 text-[11px] text-[#64748B]">
                      <span>Paket: {v.rentalType}</span>
                      <span>Periode: {v.period}</span>
                    </div>

                    {/* Designated Button for selected card */}
                    {isSelected && (
                      <div className="pt-1">
                        {hasDest ? (
                          <button
                            type="button"
                            data-interaction-handled="true"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenGoogleMaps(v)
                            }}
                            title="Buka Google Maps dalam tampilan peta jalan (Roadmap)"
                            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#0F766E] bg-[#0F766E]/10 py-1.5 px-3 font-plusJakartaSans text-xs font-semibold text-[#0F766E] hover:bg-[#0F766E] hover:text-white transition-all cursor-pointer"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            <span>Buka Google Maps</span>
                          </button>
                        ) : (
                          <div className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#DDEAF2] bg-[#F1F5F9] py-1.5 px-3 font-plusJakartaSans text-xs font-medium text-[#94A3B8]">
                            <span>Lokasi tujuan belum tersedia</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Graceful Feedback Notification Toast */}
      {locationFeedback && (
        <div
          role="alert"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800 shadow-lg animate-fade-in"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{locationFeedback}</span>
        </div>
      )}
    </div>
  )
}
