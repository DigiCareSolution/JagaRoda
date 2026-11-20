import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import StatusBadge from '../components/StatusBadge'
import GoogleMapsView from '../components/GoogleMapsView'

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
  const [locationFilter, setLocationFilter] = useState('all') // 'all' | 'moving' | 'parked'
  const [searchQuery, setSearchQuery] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [selectedPin, setSelectedPin] = useState('brio')

  const vehicles = defaultVehicles

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const matchesFilter =
        locationFilter === 'all' ||
        (locationFilter === 'moving' && v.isMoving) ||
        (locationFilter === 'parked' && !v.isMoving)

      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        v.name.toLowerCase().includes(q) ||
        v.plate.toLowerCase().includes(q) ||
        v.location.toLowerCase().includes(q) ||
        v.driver.toLowerCase().includes(q)

      return matchesFilter && matchesSearch
    })
  }, [vehicles, locationFilter, searchQuery])

  const activeVehicle = useMemo(() => {
    return vehicles.find((v) => v.id === selectedPin) || vehicles[0]
  }, [vehicles, selectedPin])

  const handleRefresh = () => {
    setIsUpdating(true)
    setTimeout(() => setIsUpdating(false), 700)
  }

  const movingCount = vehicles.filter((v) => v.isMoving).length
  const parkedCount = vehicles.filter((v) => !v.isMoving).length

  return (
    <div className="flex min-h-screen w-full flex-col items-start bg-[#F5F7FA]">
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchPlaceholder="Cari plat nomor, unit, lokasi armada..."
        greeting="Lokasi &amp; GPS Armada"
        subtitle="Senin, 24 Oktober 2024 • Shift Pagi Ops"
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
                Integrasi Telematika GPS &amp; Google Maps
              </span>
              <span className="text-[#94A3B8]">•</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#DCFCE7] px-2 py-0.5 font-semibold text-[#15803D]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#15803D] animate-ping" />
                Live Feed
              </span>
            </div>
            <h2 className="font-plusJakartaSans text-2xl font-bold tracking-tight text-[#111D23] sm:text-[26px]">
              Lokasi Armada &amp; Pelacakan Real-Time
            </h2>
            <p className="max-w-2xl font-plusJakartaSans text-xs text-[#47607E] sm:text-sm">
              Pelacakan posisi kendaraan sewa via Google Maps secara akurat untuk memantau keamanan armada dan estimasi rute perjalanan.
            </p>
          </div>

          {/* Filter Pills & Refresh */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1 rounded-xl border border-[#DDEAF2] bg-[#E9F6FD] p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setLocationFilter('all')}
                className={`rounded-lg px-3 py-1.5 font-plusJakartaSans text-xs font-semibold transition-all ${
                  locationFilter === 'all'
                    ? 'bg-white text-[#0F766E] shadow-xs'
                    : 'text-[#47607E] hover:text-[#0F766E]'
                }`}
              >
                Semua Kendaraan ({vehicles.length})
              </button>
              <button
                type="button"
                onClick={() => setLocationFilter('moving')}
                className={`rounded-lg px-3 py-1.5 font-plusJakartaSans text-xs font-semibold transition-all ${
                  locationFilter === 'moving'
                    ? 'bg-white text-[#0F766E] shadow-xs'
                    : 'text-[#47607E] hover:text-[#0F766E]'
                }`}
              >
                Aktif Bergerak ({movingCount})
              </button>
              <button
                type="button"
                onClick={() => setLocationFilter('parked')}
                className={`rounded-lg px-3 py-1.5 font-plusJakartaSans text-xs font-semibold transition-all ${
                  locationFilter === 'parked'
                    ? 'bg-white text-[#0F766E] shadow-xs'
                    : 'text-[#47607E] hover:text-[#0F766E]'
                }`}
              >
                Parkir di Garasi ({parkedCount})
              </button>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#DDEAF2] bg-white px-3.5 font-plusJakartaSans text-xs font-semibold text-[#17324D] shadow-xs transition-colors hover:bg-[#F8FAFC]"
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
              <span>{isUpdating ? 'Sinkronisasi...' : 'Perbarui GPS'}</span>
            </button>
          </div>
        </div>

        {/* Main Grid: Real Google Maps on Left, Fleet Telematics List on Right */}
        <div className="grid w-full grid-cols-1 items-start gap-6 xl:grid-cols-[1.4fr_1fr]">
          {/* Left Column: Interactive Google Maps Component & Telematics Stat Cards */}
          <div className="flex flex-col gap-6">
            {/* Google Maps Container Component */}
            <GoogleMapsView
              selectedVehicle={activeVehicle}
            />

            {/* 3 Telematics Stat Cards */}
            <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-3.5 rounded-2xl border border-[#DDEAF2] bg-white p-4 shadow-xs">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E9F6FD] text-[#0F766E]">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 14 14" />
                  </svg>
                </div>
                <div>
                  <p className="font-plusJakartaSans text-[11px] font-bold uppercase tracking-wider text-[#47607E]">
                    Kecepatan Rata-Rata
                  </p>
                  <p className="font-plusJakartaSans text-xl font-bold text-[#111D23]">
                    48.2 <span className="text-xs font-normal text-[#64748B]">km/h</span>
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
                    Bahan Bakar Armada
                  </p>
                  <p className="font-plusJakartaSans text-xl font-bold text-[#111D23]">
                    78% <span className="text-xs font-semibold text-[#15803D]">Optimal</span>
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
                    Geofence Garasi
                  </p>
                  <p className="font-plusJakartaSans text-xl font-bold text-[#15803D]">
                    Aman <span className="text-xs font-normal text-[#64748B]">(0 Pelanggaran)</span>
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
                  Daftar Armada Terkini
                </h3>
                <p className="font-plusJakartaSans text-xs text-[#47607E]">
                  Pilih kendaraan untuk mengarahkan Google Maps ke lokasinya
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

                    <div className="flex items-center gap-1.5 text-xs text-[#47607E]">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-[#0F766E]" aria-hidden="true">
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <span className="truncate">{v.location}</span>
                    </div>

                    <div className="flex items-center justify-between border-t border-[#E3F0F8]/80 pt-2 text-[11px] text-[#64748B]">
                      <span>{v.driver}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#0F766E]">{v.fuel}</span>
                        <Link
                          to={`/kendaraan/detail?id=${v.vehicleDetailId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[#0F766E] hover:underline font-semibold"
                        >
                          Detail &rarr;
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
