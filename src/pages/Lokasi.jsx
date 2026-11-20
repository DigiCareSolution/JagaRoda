import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import StatusBadge from '../components/StatusBadge'
import GoogleMapsView from '../components/GoogleMapsView'
import { hasValidDestination, openGoogleMapsRoadmap } from '../utils/googleMaps'

// Data armada & destinasi rental (Data simulasi/demo untuk pemantauan operasional)
const defaultVehicles = [
  {
    id: 'brio',
    name: 'Honda Brio Satya E',
    plate: 'L 2345 BC',
    type: 'Compact City',
    status: 'Bergerak • 35 km/h',
    statusVariant: 'success',
    isMoving: true,
    driver: 'Ahmad Faisal (Penyewa)',
    renter: 'Ahmad Faisal',
    bookingId: 'BK-003',
    rentalType: 'Lepas Kunci',
    period: '23 - 25 Okt 2026',
    notes: 'Operasional dinas dalam kota',
    destination: 'Jl. Raya Darmo No. 82, Surabaya Pusat',
    destinationCoordinates: { lat: -7.2892, lng: 112.7383 },
    location: 'Jl. Raya Darmo No. 82, Wonokromo, Surabaya Pusat',
    speed: '35 km/h',
    fuel: '65% Tangki',
    updated: '1 menit yang lalu',
    coords: { lat: -7.2892, lng: 112.7383 },
    image: 'https://images.unsplash.com/photo-1590362891988-f77804783182?auto=format&fit=crop&w=600&q=80',
    vehicleDetailId: 'k-brio',
  },
  {
    id: 'ertiga',
    name: 'Suzuki Ertiga Hybrid',
    plate: 'L 6789 FG',
    type: 'MPV Keluarga',
    status: 'Bergerak • 65 km/h',
    statusVariant: 'info',
    isMoving: true,
    driver: 'Bpk. Bambang (Driver)',
    renter: 'PT Nusantara Logistik',
    bookingId: 'BK-002',
    rentalType: 'Dengan Pengemudi',
    period: '24 - 25 Okt 2026',
    notes: 'Antar jemput tamu Bandara Juanda',
    destination: 'Tol Waru - Juanda KM 12, Sidoarjo',
    destinationCoordinates: { lat: -7.3524, lng: 112.7291 },
    location: 'Tol Waru - Juanda KM 12, Sidoarjo',
    speed: '65 km/h',
    fuel: '85% Tangki',
    updated: '2 menit yang lalu',
    coords: { lat: -7.3524, lng: 112.7291 },
    image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=600&q=80',
    vehicleDetailId: 'k-ertiga',
  },
  {
    id: 'innova',
    name: 'Toyota Innova Zenix',
    plate: 'L 1122 ZZ',
    type: 'Premium MPV',
    status: 'Parkir Standby',
    statusVariant: 'neutral',
    isMoving: false,
    driver: 'Standby Unit VIP',
    renter: '-',
    bookingId: '-',
    rentalType: '-',
    period: 'Tersedia di Pool',
    notes: 'Unit standby di Pool Gubeng Surabaya, belum ada booking aktif',
    destination: '',
    destinationCoordinates: null,
    location: 'Pool Gubeng Surabaya, Jl. Gubeng Masjid No. 1',
    speed: '0 km/h',
    fuel: '90% Tangki',
    updated: 'Baru saja',
    coords: { lat: -7.2655, lng: 112.7521 },
    image: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=600&q=80',
    vehicleDetailId: 'k-innova',
  },
  {
    id: 'avanza',
    name: 'Toyota Avanza 1.3 G',
    plate: 'L 1234 AB',
    type: 'MPV 7-Seater',
    status: 'Garasi Utama',
    statusVariant: 'success',
    isMoving: false,
    driver: 'Standby Garasi Barat',
    renter: '-',
    bookingId: '-',
    rentalType: '-',
    period: 'Tersedia di Pool',
    notes: 'Unit standby di Pool Barat Surabaya, belum ada booking aktif',
    destination: '',
    destinationCoordinates: null,
    location: 'Pool Barat Surabaya, Jl. Mayjen HR. Muhammad No. 45',
    speed: '0 km/h',
    fuel: '100% Tangki',
    updated: '5 menit yang lalu',
    coords: { lat: -7.2861, lng: 112.6934 },
    image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80',
    vehicleDetailId: 'k-avanza',
  },
  {
    id: 'xpander',
    name: 'Mitsubishi Xpander Ultimate',
    plate: 'W 3456 CD',
    type: 'Crossover MPV',
    status: 'Bergerak • 20 km/h',
    statusVariant: 'info',
    isMoving: true,
    driver: 'Hendra K. (Jemput Tamu)',
    renter: 'PT Cahaya Abadi',
    bookingId: 'BK-004',
    rentalType: 'Dengan Pengemudi',
    period: '24 - 26 Okt 2026',
    notes: 'Penjemputan klien VIP Bandara Juanda',
    destination: 'Terminal 1 Bandara Internasional Juanda, Sidoarjo',
    destinationCoordinates: { lat: -7.3798, lng: 112.7876 },
    location: 'Terminal 1 Bandara Internasional Juanda, Sidoarjo',
    speed: '20 km/h',
    fuel: '75% Tangki',
    updated: '3 menit yang lalu',
    coords: { lat: -7.3798, lng: 112.7876 },
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80',
    vehicleDetailId: 'k-xpander',
  },
  {
    id: 'calya',
    name: 'Toyota Calya 1.2 G',
    plate: 'L 4567 DE',
    type: 'Eco MPV',
    status: 'Garasi Rungkut',
    statusVariant: 'neutral',
    isMoving: false,
    driver: 'Standby Pool Rungkut',
    renter: '-',
    bookingId: '-',
    rentalType: '-',
    period: 'Tersedia di Pool',
    notes: 'Unit standby di Pool Rungkut Industri, siap disewakan',
    destination: '',
    destinationCoordinates: null,
    location: 'Pool Rungkut Industri, Jl. Rungkut Industri III No. 12',
    speed: '0 km/h',
    fuel: '80% Tangki',
    updated: '8 menit yang lalu',
    coords: { lat: -7.3278, lng: 112.7663 },
    image: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=600&q=80',
    vehicleDetailId: 'k-calya',
  },
]

export default function Lokasi() {
  const [filter, setFilter] = useState('all') // 'all' | 'moving' | 'parked'
  const [searchQuery, setSearchQuery] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [selectedPin, setSelectedPin] = useState('brio')
  const [locationFeedback, setLocationFeedback] = useState('')

  const vehicles = defaultVehicles

  const movingCount = useMemo(() => vehicles.filter((v) => v.isMoving).length, [vehicles])
  const parkedCount = useMemo(() => vehicles.filter((v) => !v.isMoving).length, [vehicles])
  const activeDestinationCount = useMemo(
    () => vehicles.filter((v) => Boolean(v.destination && v.destination.trim())).length,
    [vehicles]
  )

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const matchesFilter =
        filter === 'all' ||
        (filter === 'moving' && (v.isMoving || Boolean(v.destination))) ||
        (filter === 'parked' && (!v.isMoving && !v.destination))

      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        v.name.toLowerCase().includes(q) ||
        v.plate.toLowerCase().includes(q) ||
        (v.location && v.location.toLowerCase().includes(q)) ||
        (v.destination && v.destination.toLowerCase().includes(q)) ||
        (v.driver && v.driver.toLowerCase().includes(q)) ||
        (v.renter && v.renter.toLowerCase().includes(q)) ||
        (v.bookingId && v.bookingId.toLowerCase().includes(q))

      return matchesFilter && matchesSearch
    })
  }, [vehicles, filter, searchQuery])

  const activeVehicle = useMemo(() => {
    return vehicles.find((v) => v.id === selectedPin) || vehicles[0]
  }, [vehicles, selectedPin])

  const handleRefresh = () => {
    setIsUpdating(true)
    setTimeout(() => setIsUpdating(false), 700)
  }

  const handleOpenGoogleMaps = (vehicle) => {
    if (!hasValidDestination(vehicle)) {
      setLocationFeedback(`Lokasi belum tersedia untuk armada ${vehicle?.name || ''}.`)
      setTimeout(() => setLocationFeedback(''), 3500)
      return
    }

    openGoogleMapsRoadmap(vehicle, () => {
      setLocationFeedback(`Lokasi belum tersedia untuk armada ${vehicle?.name || ''}.`)
      setTimeout(() => setLocationFeedback(''), 3500)
    })
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-start bg-[#F5F7FA]">
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchPlaceholder="Cari plat nomor, unit, lokasi armada..."
        greeting="Lokasi &amp; GPS Armada"
        subtitle="Peta Lokasi &amp; Destinasi Rental Armada"
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
                Integrasi Google Maps &amp; Telematika Armada
              </span>
              <span className="text-[#94A3B8]">•</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FEF3C7] px-2 py-0.5 font-semibold text-[#B45309]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#B45309]" />
                Data Demo / Simulasi
              </span>
            </div>
            <h2 className="font-plusJakartaSans text-2xl font-bold tracking-tight text-[#111D23] sm:text-[26px]">
              Lokasi Armada &amp; Destinasi Rental
            </h2>
            <p className="max-w-2xl font-plusJakartaSans text-xs text-[#47607E] sm:text-sm">
              Visualisasi posisi kendaraan dan tujuan penyewa via Google Maps interaktif (Roadmap &amp; Satelit) untuk pemantauan operasional armada.
            </p>
          </div>

          {/* Filter Pills & Refresh */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1 rounded-xl border border-[#DDEAF2] bg-[#E9F6FD] p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`rounded-lg px-3 py-1.5 font-plusJakartaSans text-xs font-semibold transition-all cursor-pointer ${
                  filter === 'all'
                    ? 'bg-white text-[#0F766E] shadow-xs'
                    : 'text-[#47607E] hover:text-[#0F766E]'
                }`}
              >
                Semua Kendaraan ({vehicles.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('moving')}
                className={`rounded-lg px-3 py-1.5 font-plusJakartaSans text-xs font-semibold transition-all cursor-pointer ${
                  filter === 'moving'
                    ? 'bg-white text-[#0F766E] shadow-xs'
                    : 'text-[#47607E] hover:text-[#0F766E]'
                }`}
              >
                Aktif Bergerak ({movingCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter('parked')}
                className={`rounded-lg px-3 py-1.5 font-plusJakartaSans text-xs font-semibold transition-all cursor-pointer ${
                  filter === 'parked'
                    ? 'bg-white text-[#0F766E] shadow-xs'
                    : 'text-[#47607E] hover:text-[#0F766E]'
                }`}
              >
                Standby di Garasi ({parkedCount})
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
              <span>{isUpdating ? 'Sinkronisasi...' : 'Perbarui Tampilan'}</span>
            </button>
          </div>
        </div>

        {/* Informative Disclaimer Banner */}
        <div className="flex w-full items-center gap-3 rounded-xl border border-[#CCE3F0] bg-[#F0F7FB] px-4 py-2.5 text-xs text-[#204969] shadow-2xs">
          <span className="text-base">ℹ️</span>
          <p className="font-plusJakartaSans text-xs leading-relaxed">
            <span className="font-bold">Informasi:</span> Peta ini menampilkan visualisasi koordinat armada dan titik tujuan rental pelanggan (data simulasi/demo). Sistem tidak melakukan pelacakan GPS live dari perangkat keras telematika secara real-time.
          </p>
        </div>

        {/* Main Grid: Real Google Maps on Left, Fleet Telematics List on Right */}
        <div className="grid w-full grid-cols-1 items-start gap-6 xl:grid-cols-[1.4fr_1fr]">
          {/* Left Column: Interactive Google Maps Component & Telematics Stat Cards */}
          <div className="flex flex-col gap-6">
            {/* Google Maps Container Component */}
            <GoogleMapsView
              selectedVehicle={activeVehicle}
            />

            {/* 3 Rental Destination & Telematics Summary Cards */}
            <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-3.5 rounded-2xl border border-[#DDEAF2] bg-white p-4 shadow-xs">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E9F6FD] text-[#0F766E]">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <div>
                  <p className="font-plusJakartaSans text-[11px] font-bold uppercase tracking-wider text-[#47607E]">
                    Armada Aktif Bergerak
                  </p>
                  <p className="font-plusJakartaSans text-xl font-bold text-[#111D23]">
                    {movingCount} <span className="text-xs font-normal text-[#64748B]">Unit ({activeDestinationCount} Tujuan)</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 rounded-2xl border border-[#DDEAF2] bg-white p-4 shadow-xs">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E9F6FD] text-[#0F766E]">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 2v6h6" />
                    <path d="M3 13a9 9 0 1 0 3-7.7L3 8" />
                  </svg>
                </div>
                <div>
                  <p className="font-plusJakartaSans text-[11px] font-bold uppercase tracking-wider text-[#47607E]">
                    Bahan Bakar Rata-Rata
                  </p>
                  <p className="font-plusJakartaSans text-xl font-bold text-[#111D23]">
                    82% <span className="text-xs font-semibold text-[#15803D]">Optimal</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 rounded-2xl border border-[#DDEAF2] bg-white p-4 shadow-xs">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#DCFCE7] text-[#15803D]">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div>
                  <p className="font-plusJakartaSans text-[11px] font-bold uppercase tracking-wider text-[#47607E]">
                    Garasi &amp; Geofence
                  </p>
                  <p className="font-plusJakartaSans text-xl font-bold text-[#15803D]">
                    {parkedCount} Standby <span className="text-xs font-normal text-[#64748B]">(0 Pelanggaran)</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Fleet List (Interactive - Click centers map) */}
          <div className="flex flex-col gap-4 rounded-2xl border border-[#DDEAF2] bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#E3F0F8] pb-3">
              <div>
                <h3 className="font-plusJakartaSans text-base font-bold text-[#111D23]">
                  Daftar Armada &amp; Tujuan Rental
                </h3>
                <p className="font-plusJakartaSans text-xs text-[#47607E]">
                  Pilih kendaraan untuk menampilkan lokasinya di Google Maps
                </p>
              </div>
              <span className="font-plusJakartaSans text-[11px] font-medium text-[#64748B]">
                {filteredVehicles.length} Unit
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {filteredVehicles.map((v) => {
                const isSelected = selectedPin === v.id
                return (
                  <div
                    key={v.id}
                    onClick={() => setSelectedPin(v.id)}
                    className={`flex cursor-pointer flex-col gap-2.5 rounded-xl border p-3.5 transition-all ${
                      isSelected
                        ? 'border-[#0F766E] bg-[#F0FBF9] ring-2 ring-[#0F766E] shadow-sm'
                        : 'border-[#DDEAF2] bg-white hover:border-[#CBD5E1] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    {/* Card Header: Image, Name, Plate & StatusBadge */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={v.image}
                          alt={v.name}
                          className="h-9 w-11 rounded-lg border border-[#DDEAF2] object-cover"
                          onError={(e) => {
                            e.currentTarget.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="%23E9F6FD"/></svg>`
                          }}
                        />
                        <div className="flex flex-col">
                          <span className="font-plusJakartaSans text-sm font-bold text-[#111D23]">
                            {v.name}
                          </span>
                          <span className="font-liberationMono text-[11px] font-semibold text-[#0F766E]">
                            {v.plate}
                          </span>
                        </div>
                      </div>
                      <StatusBadge status={v.status} variant={v.statusVariant} size="sm" />
                    </div>

                    {/* Booking & Renter Info if active */}
                    {v.bookingId && v.bookingId !== '-' && (
                      <div className="flex items-center justify-between text-xs text-[#47607E]">
                        <span>Klien: <strong className="text-[#111D23]">{v.renter}</strong></span>
                        <span className="font-liberationMono text-[11px] font-semibold text-[#0F766E]">{v.bookingId}</span>
                      </div>
                    )}

                    {/* Location / Destination Row */}
                    {v.destination ? (
                      <div className="flex items-center gap-1.5 text-xs text-[#47607E]">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-[#0F766E]" aria-hidden="true">
                          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span className="truncate">
                          <span className="font-semibold text-[#0F766E]">Tujuan: </span>
                          {v.destination}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-[#47607E]">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-[#0F766E]" aria-hidden="true">
                          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span className="truncate">{v.location}</span>
                      </div>
                    )}

                    {/* Bottom Info: Driver/Period, Fuel, and Detail Link */}
                    <div className="flex items-center justify-between border-t border-[#E3F0F8]/80 pt-2 text-[11px] text-[#64748B]">
                      <span className="truncate max-w-[140px] sm:max-w-[170px]" title={v.driver}>
                        {v.driver}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#0F766E]">{v.fuel}</span>
                        <span className="text-[#CBD5E1]">•</span>
                        <Link
                          to={`/kendaraan/detail?id=${v.vehicleDetailId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-semibold text-[#0F766E] hover:underline"
                        >
                          Detail &rarr;
                        </Link>
                      </div>
                    </div>

                    {/* Quick Action when Selected: Buka Google Maps */}
                    {isSelected && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenGoogleMaps(v)
                          }}
                          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#0F766E] bg-[#0F766E]/10 py-1.5 px-3 font-plusJakartaSans text-xs font-semibold text-[#0F766E] hover:bg-[#0F766E] hover:text-white transition-all cursor-pointer"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                          <span>Buka di Google Maps Eksternal ↗</span>
                        </button>
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
