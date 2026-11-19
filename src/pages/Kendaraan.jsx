import { useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import StatusBadge from '../components/StatusBadge'
import { vehiclesData } from '../data/vehicles'

export default function Kendaraan() {
  const [activeStatus, setActiveStatus] = useState('Semua')
  const [searchQuery, setSearchQuery] = useState('')
  const [activePage, setActivePage] = useState(1)

  const vehicles = vehiclesData.map((v) => ({
    id: v.id,
    name: v.name,
    plate: v.plate,
    year: `Tahun ${v.year}`,
    status: v.status,
    statusBadgeBg: v.status === 'Tersedia' ? 'bg-[#DCFCE7]' : v.status === 'Disewa' ? 'bg-[#DBEAFE]' : 'bg-[#FEF3C7]',
    statusBadgeText: v.status === 'Tersedia' ? 'text-[#15803D]' : v.status === 'Disewa' ? 'text-[#2563EB]' : 'text-[#B45309]',
    statusDotBg: v.status === 'Tersedia' ? 'bg-[#15803D]' : v.status === 'Disewa' ? 'bg-[#2563EB]' : 'bg-[#B45309]',
    image: v.images[0]?.url,
    mileage: v.mileage,
    metaTag: v.metaTag,
    infoBoxBg: v.infoBoxBg,
    infoBoxText: v.infoBoxText,
    infoBoxDesc: v.infoBoxDesc,
    infoIconColor: v.infoIconColor,
    footerLabel: v.footerLabel,
    footerIconType: v.footerIconType,
    detailUrl: `/kendaraan/detail?id=${v.id}`,
  }))

  const handleSearchChange = (query) => {
    setSearchQuery(query)
    setActivePage(1)
  }

  const handleStatusChange = (status) => {
    setActiveStatus(status)
    setActivePage(1)
  }

  const filteredVehicles = vehicles.filter((v) => {
    const matchesStatus =
      activeStatus === 'Semua' || v.status === activeStatus
    const q = searchQuery.trim().toLowerCase()
    const matchesSearch =
      !q ||
      v.name.toLowerCase().includes(q) ||
      v.plate.toLowerCase().includes(q) ||
      v.infoBoxDesc.toLowerCase().includes(q) ||
      v.metaTag.toLowerCase().includes(q)

    return matchesStatus && matchesSearch
  })

  const countSemua = vehicles.length
  const countTersedia = vehicles.filter((v) => v.status === 'Tersedia').length
  const countDisewa = vehicles.filter((v) => v.status === 'Disewa').length
  const countMaintenance = vehicles.filter((v) => v.status === 'Maintenance').length

  return (
    <div className="flex min-h-screen w-full flex-col items-start bg-[#F5F7FA]">
      <Header
        searchQuery={searchQuery}
        setSearchQuery={handleSearchChange}
        searchPlaceholder="Cari kendaraan, nomor polisi, atau model..."
        greeting="Manajemen Kendaraan"
        subtitle="Senin, 24 Oktober 2024 • Shift Pagi Ops"
        actionText="Tambah Unit"
        actionTo="/pemesanan/baru"
      />

      <div className="mx-auto flex w-full max-w-[1600px] flex-col items-start gap-6 p-4 sm:p-6 lg:gap-8 lg:p-8">
        {/* Subheader & Breadcrumbs */}
        <div className="flex w-full flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex flex-col items-start gap-1">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#47607E]">
              <span className="font-plusJakartaSans font-medium">Operasional Rental</span>
              <span className="text-[#94A3B8]">/</span>
              <span className="font-plusJakartaSans font-semibold text-[#0F766E]">Kendaraan</span>
            </nav>
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <h2 className="font-plusJakartaSans text-2xl font-bold tracking-tight text-[#111D23] sm:text-[26px]">
                Daftar Armada Rental
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E3F0F8] px-2.5 py-0.5 font-plusJakartaSans text-[11px] font-semibold text-[#0F766E]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0F766E] animate-pulse" />
                {countSemua} Unit Terdaftar
              </span>
            </div>
            <p className="font-plusJakartaSans text-xs text-[#47607E] sm:text-sm">
              Kelola status operasional, kesiapan unit, riwayat perawatan, dan jadwal sewa kendaraan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/lokasi"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#DDEAF2] bg-white px-3.5 font-plusJakartaSans text-xs font-semibold text-[#17324D] shadow-xs transition-colors hover:bg-[#F8FAFC]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>Pantau Peta GPS</span>
            </Link>
            <Link
              to="/pemesanan"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#DDEAF2] bg-white px-3.5 font-plusJakartaSans text-xs font-semibold text-[#17324D] shadow-xs transition-colors hover:bg-[#F8FAFC]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>Cek Kalender</span>
            </Link>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex w-full flex-col items-stretch justify-between gap-3.5 rounded-xl border border-[#DDEAF2] bg-white p-3.5 shadow-xs sm:flex-row sm:items-center">
          {/* Search Box */}
          <div className="relative flex-1 sm:max-w-md">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#47607E]">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="search"
              aria-label="Cari kendaraan, nomor polisi, atau model"
              placeholder="Cari kendaraan, nomor polisi, atau model..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full rounded-lg border border-[#DDEAF2] bg-[#E9F6FD] py-2 pl-9 pr-3 font-plusJakartaSans text-xs text-[#263238] transition-colors outline-none placeholder:text-[#47607E] focus:border-[#0F766E] focus:bg-white focus:ring-1 focus:ring-[#0F766E] sm:text-[13px]"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              aria-pressed={activeStatus === 'Semua'}
              onClick={() => handleStatusChange('Semua')}
              className={`cursor-pointer rounded-full px-3.5 py-1.5 font-plusJakartaSans text-xs font-semibold transition-colors sm:text-[13px] ${
                activeStatus === 'Semua'
                  ? 'bg-[#0F766E] text-white shadow-xs'
                  : 'bg-[#E9F6FD] text-[#47607E] hover:bg-[#D4E6F2]'
              }`}
            >
              Semua ({countSemua})
            </button>
            <button
              type="button"
              aria-pressed={activeStatus === 'Tersedia'}
              onClick={() => handleStatusChange('Tersedia')}
              className={`cursor-pointer rounded-full px-3.5 py-1.5 font-plusJakartaSans text-xs font-semibold transition-colors sm:text-[13px] ${
                activeStatus === 'Tersedia'
                  ? 'bg-[#0F766E] text-white shadow-xs'
                  : 'bg-[#E9F6FD] text-[#47607E] hover:bg-[#D4E6F2]'
              }`}
            >
              Tersedia ({countTersedia})
            </button>
            <button
              type="button"
              aria-pressed={activeStatus === 'Disewa'}
              onClick={() => handleStatusChange('Disewa')}
              className={`cursor-pointer rounded-full px-3.5 py-1.5 font-plusJakartaSans text-xs font-semibold transition-colors sm:text-[13px] ${
                activeStatus === 'Disewa'
                  ? 'bg-[#0F766E] text-white shadow-xs'
                  : 'bg-[#E9F6FD] text-[#47607E] hover:bg-[#D4E6F2]'
              }`}
            >
              Disewa ({countDisewa})
            </button>
            <button
              type="button"
              aria-pressed={activeStatus === 'Maintenance'}
              onClick={() => handleStatusChange('Maintenance')}
              className={`cursor-pointer rounded-full px-3.5 py-1.5 font-plusJakartaSans text-xs font-semibold transition-colors sm:text-[13px] ${
                activeStatus === 'Maintenance'
                  ? 'bg-[#0F766E] text-white shadow-xs'
                  : 'bg-[#E9F6FD] text-[#47607E] hover:bg-[#D4E6F2]'
              }`}
            >
              Maintenance ({countMaintenance})
            </button>
          </div>
        </div>

        {/* Grid Kartu Kendaraan */}
        {activePage === 1 ? (
          <div className="grid w-full grid-cols-1 items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredVehicles.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-[#DDEAF2] bg-white p-12 text-center font-plusJakartaSans text-sm text-[#47607E]">
                <p className="font-bold text-[#17324D] text-base">Tidak ada kendaraan ditemukan</p>
                <p className="mt-1">Coba sesuaikan kata kunci pencarian atau ubah filter status di atas.</p>
              </div>
            ) : (
              filteredVehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-[#E3F0F8] bg-white shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  {/* Gambar Unit & Badges */}
                  <div className="relative flex h-52 w-full items-center justify-center overflow-hidden bg-[#0F172A]">
                    <img
                      src={vehicle.image}
                      alt={vehicle.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.src = `data:image/svg+xml,${encodeURIComponent(
                          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 360"><rect width="600" height="360" fill="#E9F6FD"/><path d="M0 260 L600 160" stroke="#FFFFFF" stroke-width="60"/><text x="300" y="200" text-anchor="middle" font-family="sans-serif" font-size="20" font-weight="bold" fill="#0F766E">${vehicle.name}</text></svg>`
                        )}`
                      }}
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                    <div className="absolute right-3 top-3">
                      <StatusBadge
                        status={vehicle.status === 'Tersedia' ? 'success' : vehicle.status === 'Disewa' ? 'info' : 'warning'}
                        label={vehicle.status === 'Maintenance' ? 'Perlu Servis' : vehicle.status === 'Disewa' ? 'Sedang Disewa' : vehicle.status}
                        size="sm"
                      />
                    </div>
                    <span className="absolute bottom-3 left-3 rounded-md bg-black/65 px-2.5 py-1 font-liberationMono text-[11px] font-semibold tracking-wider text-white shadow-xs backdrop-blur-xs">
                      {vehicle.plate}
                    </span>
                  </div>

                  {/* Body Konten */}
                  <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
                    <div className="flex flex-col gap-3">
                      {/* Judul & Tahun */}
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className="font-plusJakartaSans text-base font-bold leading-tight text-[#263238]">
                          {vehicle.name}
                        </h3>
                        <span className="shrink-0 font-plusJakartaSans text-xs font-medium text-[#47607E]">
                          {vehicle.year}
                        </span>
                      </div>

                      {/* Baris Metrik (Jarak Tempuh & Tag) */}
                      <div className="flex items-center gap-3 text-xs text-[#47607E]">
                        <div className="flex items-center gap-1 font-medium">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#0F766E]">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 14 14" />
                          </svg>
                          <span className="font-plusJakartaSans">{vehicle.mileage}</span>
                        </div>
                        <span className="text-[#CBD5E1]">•</span>
                        <span className="font-plusJakartaSans font-medium text-[#47607E]">
                          {vehicle.metaTag}
                        </span>
                      </div>

                      {/* Box Info Tambahan */}
                      <div className={`flex items-start gap-2.5 rounded-xl p-3 ${vehicle.infoBoxBg}`}>
                        <div className={`shrink-0 pt-0.5 ${vehicle.infoIconColor}`}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="16" x2="12" y2="12" />
                            <line x1="12" y1="8" x2="12.01" y2="8" />
                          </svg>
                        </div>
                        <p className={`font-plusJakartaSans text-[12px] leading-snug sm:text-[13px] ${vehicle.infoBoxText}`}>
                          {vehicle.infoBoxDesc}
                        </p>
                      </div>
                    </div>

                    {/* Footer Kartu */}
                    <div className="mt-4 flex items-center justify-between border-t border-[#DDEAF2] pt-3.5">
                      <div className="flex items-center gap-1.5 font-plusJakartaSans text-[11px] font-medium text-[#47607E]">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#0F766E]">
                          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span>{vehicle.footerLabel}</span>
                      </div>

                      <Link
                        to={vehicle.detailUrl}
                        className="inline-flex items-center gap-1 font-plusJakartaSans text-xs font-bold text-[#0F766E] transition-colors hover:text-[#0D655E]"
                      >
                        <span>Lihat detail &amp; galeri</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="w-full rounded-2xl border border-[#DDEAF2] bg-white p-8 text-center shadow-xs">
            <p className="font-plusJakartaSans text-base font-semibold text-[#263238]">
              Data kendaraan halaman berikutnya belum tersedia.
            </p>
            <p className="mt-1 font-plusJakartaSans text-sm text-[#47607E]">
              Daftar pada halaman ini merupakan data contoh lokal armada aktif JagaRoda.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
