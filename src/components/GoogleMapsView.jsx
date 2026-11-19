import { useState, useMemo } from 'react'

export default function GoogleMapsView({
  selectedVehicle,
}) {
  const [zoom, setZoom] = useState(15)
  const [mapType, setMapType] = useState('roadmap') // 'roadmap' | 'satellite'
  const [copied, setCopied] = useState(false)
  const [showApiInfo, setShowApiInfo] = useState(true)

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  const hasApiKey = Boolean(apiKey && apiKey.trim() !== '')

  const { lat, lng } = selectedVehicle.coords || { lat: -7.2892, lng: 112.7383 }
  const locationLabel = selectedVehicle.location || 'Surabaya, Jawa Timur'

  // Embed URL generation:
  // 1. If user provided a real Google Maps API Key: use Google Maps Embed API
  // 2. If no API key: use official Google Maps interactive embed iframe (real Google Maps engine)
  const embedUrl = useMemo(() => {
    if (hasApiKey) {
      const mode = mapType === 'satellite' ? '&maptype=satellite' : ''
      return `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(
        apiKey
      )}&q=${lat},${lng}&center=${lat},${lng}&zoom=${zoom}${mode}&language=id`
    }
    // Official Google Maps direct iframe format - 100% genuine Google Maps
    const tParam = mapType === 'satellite' ? '&t=k' : ''
    return `https://maps.google.com/maps?q=${lat},${lng}&hl=id&z=${zoom}${tParam}&output=embed`
  }, [hasApiKey, apiKey, lat, lng, zoom, mapType])

  // Direct Google Maps Search / Place URL
  const googleMapsWebUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`

  // Direct Google Maps Directions / Route URL
  const googleMapsRouteUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`

  const handleCopyCoords = () => {
    const text = `${lat}, ${lng}`
    navigator.clipboard?.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 1, 19))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 1, 11))
  }

  return (
    <div className="flex w-full flex-col gap-3">
      {/* Informative API Notification Banner */}
      {showApiInfo && (
        <div className="flex w-full items-start justify-between gap-3 rounded-xl border border-[#DDEAF2] bg-[#E9F6FD] p-3 text-xs">
          <div className="flex items-start gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#0F766E] text-white text-[11px] font-bold">
              🗺️
            </span>
            <div className="flex flex-col gap-0.5">
              <p className="font-plusJakartaSans font-bold text-[#17324D]">
                Integrasi Google Maps Aktif {hasApiKey ? '(Mode API Key)' : '(Mode Real Embed)'}
              </p>
              <p className="font-plusJakartaSans text-[11px] text-[#47607E]">
                {hasApiKey
                  ? 'Koneksi ke Google Maps API berhasil dikonfigurasi via environment variable VITE_GOOGLE_MAPS_API_KEY.'
                  : 'Peta menampilkan koordinat GPS presisi armada via Google Maps. Anda dapat menambahkan VITE_GOOGLE_MAPS_API_KEY di file .env untuk mengaktifkan API JavaScript lanjutan.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowApiInfo(false)}
            aria-label="Tutup pemberitahuan"
            className="text-[#64748B] hover:text-[#17324D] text-xs font-semibold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Map Container */}
      <div className="relative h-[490px] w-full overflow-hidden rounded-2xl border border-[#DDEAF2] bg-[#E2E8F0] shadow-sm sm:h-[550px]">
        {/* Genuine Google Maps Iframe */}
        <iframe
          key={`${lat}-${lng}-${zoom}-${mapType}`}
          title={`Google Maps - ${selectedVehicle.name} (${selectedVehicle.plate})`}
          src={embedUrl}
          className="h-full w-full border-0"
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />

        {/* Map Top Bar Controls (Floating inside map) */}
        <div className="absolute left-3 right-3 top-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          {/* Active Location Pill */}
          <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/80 bg-white/95 px-3.5 py-1.5 shadow-md backdrop-blur-md">
            <span className="h-2.5 w-2.5 rounded-full bg-[#0F766E] animate-pulse" />
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#111D23]">
              <span className="font-plusJakartaSans">{selectedVehicle.name}</span>
              <span className="font-liberationMono text-[#0F766E]">({selectedVehicle.plate})</span>
            </div>
            <span className="hidden text-[11px] text-[#64748B] sm:inline">• GPS ±3m</span>
          </div>

          {/* Map Controls: View Mode & Zoom */}
          <div className="pointer-events-auto flex items-center gap-1.5">
            {/* Map Type Toggle */}
            <div className="flex items-center rounded-lg border border-white/80 bg-white/95 p-0.5 shadow-md backdrop-blur-md">
              <button
                type="button"
                onClick={() => setMapType('roadmap')}
                className={`rounded-md px-2.5 py-1 font-plusJakartaSans text-xs font-semibold transition-all ${
                  mapType === 'roadmap'
                    ? 'bg-[#0F766E] text-white shadow-xs'
                    : 'text-[#47607E] hover:text-[#0F766E]'
                }`}
              >
                Peta
              </button>
              <button
                type="button"
                onClick={() => setMapType('satellite')}
                className={`rounded-md px-2.5 py-1 font-plusJakartaSans text-xs font-semibold transition-all ${
                  mapType === 'satellite'
                    ? 'bg-[#0F766E] text-white shadow-xs'
                    : 'text-[#47607E] hover:text-[#0F766E]'
                }`}
              >
                Satelit
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center rounded-lg border border-white/80 bg-white/95 p-1 shadow-md backdrop-blur-md">
              <button
                type="button"
                onClick={handleZoomIn}
                aria-label="Perbesar peta"
                title="Perbesar peta"
                className="flex h-7 w-7 items-center justify-center rounded font-bold text-[#17324D] hover:bg-[#E9F6FD] hover:text-[#0F766E]"
              >
                +
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                aria-label="Perkecil peta"
                title="Perkecil peta"
                className="flex h-7 w-7 items-center justify-center rounded font-bold text-[#17324D] hover:bg-[#E9F6FD] hover:text-[#0F766E]"
              >
                &minus;
              </button>
            </div>
          </div>
        </div>

        {/* Selected Vehicle Floating Telematics Card (Bottom left) */}
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:w-96 rounded-2xl border border-white/90 bg-white/95 p-4 shadow-xl backdrop-blur-md">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-[#E3F0F8] pb-2.5">
            <div className="flex items-center gap-2.5">
              <img
                src={selectedVehicle.image}
                alt={selectedVehicle.name}
                className="h-10 w-12 rounded-lg border border-[#DDEAF2] object-cover"
                onError={(e) => {
                  e.currentTarget.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="%23E9F6FD"/></svg>`
                }}
              />
              <div className="flex flex-col">
                <span className="font-plusJakartaSans text-xs font-bold text-[#111D23]">
                  {selectedVehicle.name}
                </span>
                <span className="font-liberationMono text-[11px] font-bold text-[#0F766E]">
                  {selectedVehicle.plate}
                </span>
              </div>
            </div>
            <span className={`rounded-md px-2 py-0.5 font-plusJakartaSans text-[10px] font-bold uppercase tracking-wider ${
              selectedVehicle.isMoving
                ? 'bg-[#DCFCE7] text-[#15803D]'
                : 'bg-[#E2E8F0] text-[#475569]'
            }`}>
              {selectedVehicle.status}
            </span>
          </div>

          {/* Telemetry info */}
          <div className="mt-2.5 flex flex-col gap-1.5 text-xs">
            <div className="flex items-start justify-between text-[#47607E]">
              <span className="shrink-0 font-medium">Alamat:</span>
              <span className="text-right font-semibold text-[#111D23] max-w-[210px] truncate" title={locationLabel}>
                {locationLabel}
              </span>
            </div>
            <div className="flex items-center justify-between text-[#47607E]">
              <span className="font-medium">Koordinat GPS:</span>
              <button
                type="button"
                onClick={handleCopyCoords}
                className="font-liberationMono text-[11px] font-semibold text-[#0F766E] hover:underline"
                title="Klik untuk salin koordinat"
              >
                {copied ? 'Tersalin!' : `${lat.toFixed(4)}, ${lng.toFixed(4)} 📋`}
              </button>
            </div>
            <div className="flex items-center justify-between text-[#47607E]">
              <span className="font-medium">Kecepatan:</span>
              <span className="font-bold text-[#0F766E]">{selectedVehicle.speed || '0 km/h'}</span>
            </div>
            <div className="flex items-center justify-between text-[#47607E]">
              <span className="font-medium">Pengemudi / Status:</span>
              <span className="font-medium text-[#111D23] truncate max-w-[190px]">
                {selectedVehicle.driver || 'Garasi Utama'}
              </span>
            </div>
          </div>

          {/* Action Buttons: Open in Google Maps & View Route */}
          <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-[#E3F0F8] pt-3">
            <a
              href={googleMapsWebUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#0F766E] px-3 py-2 font-plusJakartaSans text-xs font-bold text-white shadow-xs transition-colors hover:bg-[#0D655E]"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              <span>Buka Google Maps</span>
            </a>

            <a
              href={googleMapsRouteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#DDEAF2] bg-[#E9F6FD] px-3 py-2 font-plusJakartaSans text-xs font-bold text-[#17324D] transition-colors hover:bg-[#DDEAF2]"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#0F766E]">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>Petunjuk Rute</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
