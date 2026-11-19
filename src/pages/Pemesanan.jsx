import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import StatusBadge from '../components/StatusBadge'
import {
  getEventsForDate,
  formatIndonesianDate,
} from '../data/calendarEvents'

// Booking events for the calendar month cells
const defaultCalendarDays = [
  { day: 28, isPrevMonth: true },
  { day: 29, isPrevMonth: true },
  { day: 30, isPrevMonth: true },
  { day: 1, bookings: [{ car: 'Avanza', client: 'PT Megah', tone: 'bg-[#C2DCFF] text-[#1E3A8A]' }] },
  { day: 2, bookings: [{ car: 'Avanza', client: 'PT Megah', tone: 'bg-[#C2DCFF] text-[#1E3A8A]' }] },
  { day: 3, bookings: [{ car: 'Brio', client: 'Bpk. Dimas', tone: 'bg-[#DCFCE7] text-[#15803D]' }] },
  { day: 4, bookings: [{ car: 'Brio', client: 'Bpk. Dimas', tone: 'bg-[#DCFCE7] text-[#15803D]' }] },
  { day: 5, bookings: [{ car: 'Xpander', client: 'Sewa Wisata', tone: 'bg-[#FEF3C7] text-[#B45309]' }] },
  { day: 6 },
  { day: 7, bookings: [{ car: 'Calya', client: 'Bpk. Bambang', tone: 'bg-[#DCFCE7] text-[#15803D]' }] },
  { day: 8, bookings: [{ car: 'Calya', client: 'Bpk. Bambang', tone: 'bg-[#DCFCE7] text-[#15803D]' }] },
  { day: 9 },
  { day: 10 },
  { day: 11, bookings: [{ car: 'Innova', client: 'Ibu Ratna', tone: 'bg-[#C2DCFF] text-[#1E3A8A]' }] },
  { day: 12, bookings: [{ car: 'Innova', client: 'Ibu Ratna', tone: 'bg-[#C2DCFF] text-[#1E3A8A]' }] },
  { day: 13 },
  {
    day: 14,
    isConflict: true,
    bookings: [
      { car: 'Avanza', client: 'Hendra G.', tone: 'bg-[#FEE2E2] text-[#B91C1C]' },
      { car: 'Avanza', client: 'PT Maju', tone: 'bg-[#FEE2E2] text-[#B91C1C]' },
    ],
  },
  {
    day: 15,
    isConflict: true,
    bookings: [
      { car: 'Avanza', client: 'Hendra G.', tone: 'bg-[#FEE2E2] text-[#B91C1C]' },
      { car: 'Avanza', client: 'PT Maju', tone: 'bg-[#FEE2E2] text-[#B91C1C]' },
    ],
  },
  {
    day: 16,
    isConflict: true,
    bookings: [{ car: 'Avanza', client: 'Konflik Sewa', tone: 'bg-[#FEE2E2] text-[#B91C1C]' }],
  },
  { day: 17 },
  { day: 18, bookings: [{ car: 'Mobilio', client: 'PT Surya', tone: 'bg-[#C2DCFF] text-[#1E3A8A]' }] },
  { day: 19, bookings: [{ car: 'Mobilio', client: 'PT Surya', tone: 'bg-[#C2DCFF] text-[#1E3A8A]' }] },
  { day: 20 },
  { day: 21 },
  { day: 22, bookings: [{ car: 'Calya', client: 'Keluarga Budi', tone: 'bg-[#DCFCE7] text-[#15803D]' }] },
  { day: 23, bookings: [{ car: 'Calya', client: 'Keluarga Budi', tone: 'bg-[#DCFCE7] text-[#15803D]' }] },
  { day: 24, isToday: true, bookings: [{ car: 'Ertiga', client: 'PT Nusantara', tone: 'bg-[#0F766E] text-white' }] },
  { day: 25, bookings: [{ car: 'Ertiga', client: 'PT Nusantara', tone: 'bg-[#0F766E] text-white' }] },
  { day: 26 },
  { day: 27 },
  { day: 28 },
  { day: 29, bookings: [{ car: 'Xpander', client: 'Weekend Trip', tone: 'bg-[#FEF3C7] text-[#B45309]' }] },
  { day: 30, bookings: [{ car: 'Avanza', client: 'PT Wira', tone: 'bg-[#C2DCFF] text-[#1E3A8A]' }] },
  { day: 31, bookings: [{ car: 'Avanza', client: 'PT Wira', tone: 'bg-[#C2DCFF] text-[#1E3A8A]' }] },
  { day: 1, isNextMonth: true },
]

export default function Pemesanan() {
  const [viewMode, setViewMode] = useState('monthly') // 'monthly' | 'weekly' | 'daily'
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFleet, setSelectedFleet] = useState('all')
  const [conflictResolved, setConflictResolved] = useState(false)
  const [selectedDay, setSelectedDay] = useState(24) // Default 24 Oktober 2026
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState('')

  const calendarDays = defaultCalendarDays

  // Retrieve full detailed events for the currently selected date
  const selectedDateEvents = useMemo(() => {
    return getEventsForDate(selectedDay)
  }, [selectedDay])

  const formattedSelectedDate = useMemo(() => {
    return formatIndonesianDate(selectedDay, 9, 2026)
  }, [selectedDay])

  const handleSelectDay = (day, isMuted) => {
    if (isMuted) return
    setSelectedDay(day)
    setFeedbackMsg(`Menampilkan agenda untuk ${day} Oktober 2026`)
    setTimeout(() => setFeedbackMsg(''), 2500)
  }

  // Filter for fleet select
  const filteredCalendarDays = useMemo(() => {
    if (selectedFleet === 'all') return calendarDays
    return calendarDays.map((cDay) => {
      if (!cDay.bookings) return cDay
      const filtered = cDay.bookings.filter((b) =>
        b.car.toLowerCase().includes(selectedFleet.toLowerCase())
      )
      return { ...cDay, bookings: filtered }
    })
  }, [selectedFleet, calendarDays])

  return (
    <div className="flex min-h-screen w-full flex-col items-start bg-[#F5F7FA]">
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchPlaceholder="Cari jadwal, plat nomor, penyewa..."
        greeting="Kalender Pemesanan"
        subtitle="Senin, 24 Oktober 2024 • Shift Pagi Ops"
        actionText="Tambah Booking"
        actionTo="/pemesanan/baru"
      />

      <div className="mx-auto flex w-full max-w-[1600px] flex-col items-start gap-6 p-4 sm:p-6 lg:gap-8 lg:p-8">
        {/* Subheader & Breadcrumbs */}
        <div className="flex w-full flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex flex-col items-start gap-1">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#47607E]">
              <span className="font-plusJakartaSans font-medium">Operasional Rental</span>
              <span className="text-[#94A3B8]">/</span>
              <span className="font-plusJakartaSans font-semibold text-[#0F766E]">Pemesanan</span>
            </nav>
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <h2 className="font-plusJakartaSans text-2xl font-bold tracking-tight text-[#111D23] sm:text-[26px]">
                Kalender Pemesanan Armada
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E3F0F8] px-2.5 py-0.5 font-plusJakartaSans text-[11px] font-semibold text-[#0F766E]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0F766E] animate-pulse" />
                Fleet Live Sync
              </span>
            </div>
            <p className="font-plusJakartaSans text-xs text-[#47607E] sm:text-sm">
              Klik tanggal mana saja pada kalender untuk melihat rincian aktivitas armada, status sewa, pengembalian, dan jadwal servis.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#DDEAF2] bg-white px-3.5 font-plusJakartaSans text-xs font-semibold text-[#17324D] shadow-xs transition-colors hover:bg-[#F8FAFC]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Ekspor Jadwal</span>
            </button>
            <Link
              to="/pemesanan/baru"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#0F766E] px-4 font-plusJakartaSans text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#0D655E]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Tambah Pemesanan</span>
            </Link>
          </div>
        </div>

        {/* Conflict Warning Alert */}
        {!conflictResolved && (
          <div className="flex w-full flex-col items-start justify-between gap-4 rounded-xl border border-[#F0D2CF] border-l-4 border-l-[#BA1A1A] bg-white p-4 shadow-xs sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#FEE2E2] text-[#BA1A1A]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-plusJakartaSans text-xs font-bold uppercase tracking-wider text-[#BA1A1A]">
                    Terdeteksi 1 Jadwal Bertabrakan (Konflik Booking)
                  </span>
                  <span className="rounded-full bg-[#BA1A1A] px-2 py-0.5 font-plusJakartaSans text-[10px] font-semibold text-white">
                    Prioritas Tinggi
                  </span>
                </div>
                <p className="font-plusJakartaSans text-xs font-semibold text-[#111D23] sm:text-[13px]">
                  Toyota Avanza (L 1234 AB) dipesan ganda pada rentang 14–16 Okt 2026 antara penyewa Bpk. Hendra Gunawan dan PT Maju Sentosa.
                </p>
                <p className="mt-0.5 font-plusJakartaSans text-xs text-[#0F766E]">
                  Saran sistem: Alihkan booking PT Maju Sentosa ke Suzuki Ertiga (L 6789 FG) yang 100% Tersedia di tanggal yang sama.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedDay(14)
                  setConflictResolved(true)
                }}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#0F766E] px-3 font-plusJakartaSans text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#0D655E]"
              >
                <span>Lihat Tanggal Konflik</span>
              </button>
              <button
                type="button"
                onClick={() => setConflictResolved(true)}
                className="inline-flex h-8 items-center rounded-lg border border-[#DDEAF2] bg-white px-3 font-plusJakartaSans text-xs font-medium text-[#47607E] transition-colors hover:bg-[#F8FAFC]"
              >
                <span>Tutup</span>
              </button>
            </div>
          </div>
        )}

        {/* Feedback message banner */}
        {feedbackMsg && (
          <div className="flex w-full items-center justify-between rounded-lg bg-[#E6F4F2] px-4 py-2 font-plusJakartaSans text-xs font-semibold text-[#0F766E] transition-all animate-in fade-in">
            <div className="flex items-center gap-2">
              <span>📅</span>
              <span>{feedbackMsg}</span>
            </div>
            <span className="text-[11px] text-[#47607E]">Klik pada panel sebelah kanan untuk aksi</span>
          </div>
        )}

        {/* Calendar Control Toolbar */}
        <div className="flex w-full flex-wrap items-center justify-between gap-4 rounded-xl border border-[#DDEAF2] bg-white p-3.5 shadow-xs">
          {/* View Tabs */}
          <div className="flex items-center gap-1 rounded-lg bg-[#E3F0F8] p-1">
            <button
              type="button"
              onClick={() => setViewMode('monthly')}
              className={`rounded-md px-3.5 py-1.5 font-plusJakartaSans text-xs font-semibold transition-all ${
                viewMode === 'monthly'
                  ? 'bg-[#0F766E] text-white shadow-xs'
                  : 'text-[#47607E] hover:text-[#0F766E]'
              }`}
            >
              Bulanan
            </button>
            <button
              type="button"
              onClick={() => setViewMode('weekly')}
              className={`rounded-md px-3.5 py-1.5 font-plusJakartaSans text-xs font-semibold transition-all ${
                viewMode === 'weekly'
                  ? 'bg-[#0F766E] text-white shadow-xs'
                  : 'text-[#47607E] hover:text-[#0F766E]'
              }`}
            >
              Mingguan
            </button>
            <button
              type="button"
              onClick={() => setViewMode('daily')}
              className={`rounded-md px-3.5 py-1.5 font-plusJakartaSans text-xs font-semibold transition-all ${
                viewMode === 'daily'
                  ? 'bg-[#0F766E] text-white shadow-xs'
                  : 'text-[#47607E] hover:text-[#0F766E]'
              }`}
            >
              Harian
            </button>
          </div>

          {/* Month Navigator */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedDay(1)
                setFeedbackMsg('Menampilkan awal bulan Oktober 2026')
              }}
              aria-label="Bulan sebelumnya"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#DDEAF2] bg-white text-[#47607E] transition-colors hover:bg-[#E9F6FD]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div className="flex items-center gap-2 rounded-lg bg-[#E9F6FD] px-3.5 py-1.5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#0F766E]" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span className="font-plusJakartaSans text-sm font-bold text-[#17324D]">
                Oktober 2026
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedDay(31)
                setFeedbackMsg('Menampilkan akhir bulan Oktober 2026')
              }}
              aria-label="Bulan berikutnya"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#DDEAF2] bg-white text-[#47607E] transition-colors hover:bg-[#E9F6FD]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedDay(24)
                setFeedbackMsg('Kembali ke hari ini: 24 Oktober 2026')
              }}
              className="cursor-pointer rounded-lg border border-[#DDEAF2] bg-white px-3 py-1.5 font-plusJakartaSans text-xs font-semibold text-[#47607E] transition-colors hover:bg-[#E9F6FD] hover:text-[#0F766E]"
            >
              Hari Ini (24 Okt)
            </button>
          </div>

          {/* Filter Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={selectedFleet}
              onChange={(e) => setSelectedFleet(e.target.value)}
              aria-label="Filter armada"
              className="h-9 rounded-lg border border-[#DDEAF2] bg-[#F8FAFC] px-3 font-plusJakartaSans text-xs font-medium text-[#17324D] outline-none focus:border-[#0F766E]"
            >
              <option value="all">Semua Armada (24 Unit)</option>
              <option value="avanza">Toyota Avanza</option>
              <option value="brio">Honda Brio</option>
              <option value="xpander">Mitsubishi Xpander</option>
              <option value="calya">Toyota Calya</option>
              <option value="ertiga">Suzuki Ertiga</option>
              <option value="innova">Toyota Innova</option>
            </select>
          </div>
        </div>

        {/* Main Grid: Interactive Calendar on Left, Dynamic Date Activity Panel on Right */}
        <div className="grid w-full grid-cols-1 items-start gap-6 lg:grid-cols-[1.5fr_1.1fr]">
          {/* Left Column: Responsive Interactive Calendar Grid */}
          <div className="flex flex-col gap-4 rounded-2xl border border-[#DDEAF2] bg-white p-4 shadow-xs sm:p-5">
            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1 border-b border-[#E3F0F8] pb-2.5 text-center font-plusJakartaSans text-xs font-bold text-[#47607E]">
              <span>Sen</span>
              <span>Sel</span>
              <span>Rab</span>
              <span>Kam</span>
              <span>Jum</span>
              <span className="text-[#BA1A1A]">Sab</span>
              <span className="text-[#BA1A1A]">Min</span>
            </div>

            {/* Calendar Cells Grid - Every cell is fully clickable and interactive */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {filteredCalendarDays.map((cDay, idx) => {
                const isMuted = cDay.isPrevMonth || cDay.isNextMonth
                const isSelected = !isMuted && cDay.day === selectedDay
                const hasEvents = !isMuted && getEventsForDate(cDay.day).length > 0
                const dayEvents = !isMuted ? getEventsForDate(cDay.day) : []

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isMuted}
                    onClick={() => handleSelectDay(cDay.day, isMuted)}
                    aria-pressed={isSelected}
                    aria-label={`Tanggal ${cDay.day} Oktober 2026, ${dayEvents.length} aktivitas`}
                    className={`group relative flex min-h-[92px] cursor-pointer flex-col justify-between rounded-xl border p-2 text-left transition-all sm:min-h-[110px] sm:p-2.5 focus:outline-none ${
                      isMuted
                        ? 'cursor-not-allowed border-transparent bg-[#F8FAFC]/50 text-[#CBD5E1]'
                        : isSelected
                        ? 'border-[#0F766E] bg-[#F0FBF9] ring-2 ring-[#0F766E] shadow-sm'
                        : cDay.isConflict
                        ? 'border-[#FECACA] bg-[#FEF2F2] hover:border-[#F87171]'
                        : cDay.isToday
                        ? 'border-[#0F766E]/60 bg-[#F4FBFA] hover:border-[#0F766E]'
                        : 'border-[#E3F0F8] bg-white hover:border-[#0F766E]/50 hover:bg-[#F8FAFC]'
                    }`}
                  >
                    {/* Top Row: Date Number and Status Dots */}
                    <div className="flex w-full items-center justify-between">
                      <span
                        className={`font-plusJakartaSans text-xs font-bold ${
                          cDay.isToday
                            ? 'flex h-5.5 w-5.5 items-center justify-center rounded-full bg-[#0F766E] text-white text-[11px]'
                            : isSelected
                            ? 'flex h-5.5 w-5.5 items-center justify-center rounded-full bg-[#111D23] text-white text-[11px]'
                            : isMuted
                            ? 'text-[#CBD5E1]'
                            : 'text-[#263238]'
                        }`}
                      >
                        {cDay.day}
                      </span>

                      {/* Visual indicator badges for activities */}
                      <div className="flex items-center gap-1">
                        {cDay.isConflict && (
                          <span
                            className="h-2 w-2 rounded-full bg-[#DC2626] animate-pulse"
                            title="Konflik booking terjadwal"
                          />
                        )}
                        {hasEvents && !cDay.isConflict && (
                          <span
                            className={`h-2 w-2 rounded-full ${
                              cDay.isToday ? 'bg-[#0F766E]' : 'bg-[#0284C7]'
                            }`}
                            title={`${dayEvents.length} aktivitas terjadwal`}
                          />
                        )}
                      </div>
                    </div>

                    {/* Event Pills preview */}
                    <div className="flex w-full flex-col gap-1 overflow-hidden">
                      {cDay.bookings?.slice(0, 2).map((b, bIdx) => (
                        <div
                          key={bIdx}
                          className={`truncate rounded px-1.5 py-0.5 font-plusJakartaSans text-[10px] font-semibold leading-tight shadow-2xs ${b.tone}`}
                          title={`${b.car} - ${b.client}`}
                        >
                          {b.car} • {b.client}
                        </div>
                      ))}
                      {cDay.bookings && cDay.bookings.length > 2 && (
                        <span className="font-plusJakartaSans text-[9px] font-bold text-[#0F766E]">
                          +{cDay.bookings.length - 2} lagi
                        </span>
                      )}
                    </div>

                    {/* Bottom active marker */}
                    {isSelected && (
                      <div className="h-0.5 w-full rounded-full bg-[#0F766E]" />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Active Rental Live Indicator Footnote */}
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#DDEAF2] bg-[#E9F6FD] p-3.5">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#0F766E] shadow-2xs">
                  🚗
                </span>
                <div>
                  <p className="font-plusJakartaSans text-xs font-bold text-[#17324D]">
                    Suzuki Ertiga Hybrid (L 6789 FG)
                  </p>
                  <p className="font-plusJakartaSans text-[11px] text-[#47607E]">
                    Penyewa: PT Nusantara Logistik • Operasional Aktif 24–25 Okt 2026
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status="Aktif Disewa" variant="success" size="sm" />
                <Link
                  to="/lokasi"
                  className="rounded-lg bg-white px-2.5 py-1 font-plusJakartaSans text-[11px] font-semibold text-[#0F766E] shadow-2xs hover:bg-slate-50"
                >
                  GPS &rarr;
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: DYNAMIC Selected Date Detail Panel */}
          <div className="flex flex-col gap-5">
            {/* Date Details Card Header */}
            <div className="flex flex-col gap-4 rounded-2xl border border-[#DDEAF2] bg-white p-5 shadow-xs">
              <div className="flex items-start justify-between border-b border-[#E3F0F8] pb-3.5">
                <div className="flex flex-col">
                  <span className="font-plusJakartaSans text-[11px] font-bold uppercase tracking-wider text-[#0F766E]">
                    Rincian Tanggal Dipilih
                  </span>
                  <h3 className="font-plusJakartaSans text-base font-bold text-[#111D23] sm:text-lg">
                    {formattedSelectedDate}
                  </h3>
                  <p className="font-plusJakartaSans text-xs text-[#47607E]">
                    {selectedDateEvents.length > 0
                      ? `${selectedDateEvents.length} aktivitas terdaftar pada tanggal ini`
                      : 'Tidak ada agenda terjadwal'}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#DDEAF2] bg-[#E9F6FD] px-2.5 font-plusJakartaSans text-xs font-semibold text-[#0F766E] transition-colors hover:bg-[#DDEAF2]"
                    title="Buka pratinjau modal"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 3 21 3 21 9" />
                      <polyline points="9 21 3 21 3 15" />
                      <line x1="21" y1="3" x2="14" y2="10" />
                      <line x1="3" y1="21" x2="10" y2="14" />
                    </svg>
                    <span>Perbesar</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Activities List */}
              <div className="flex flex-col gap-3">
                {selectedDateEvents.length > 0 ? (
                  selectedDateEvents.map((act) => (
                    <div
                      key={act.id}
                      className={`flex flex-col gap-2.5 rounded-xl border p-4 transition-all ${
                        act.statusVariant === 'danger'
                          ? 'border-[#FECACA] bg-[#FEF2F2]'
                          : act.statusVariant === 'warning'
                          ? 'border-[#FED7AA] bg-[#FFFBEB]'
                          : 'border-[#DDEAF2] bg-[#F8FAFC] hover:border-[#0F766E]'
                      }`}
                    >
                      {/* Title & Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-2xs text-sm">
                            {act.type === 'maintenance'
                              ? '🔧'
                              : act.type === 'conflict'
                              ? '⚠️'
                              : act.type === 'return'
                              ? '🔄'
                              : '🚗'}
                          </span>
                          <div>
                            <h4 className="font-plusJakartaSans text-sm font-bold text-[#111D23]">
                              {act.title}
                            </h4>
                            <div className="flex items-center gap-2 pt-0.5 text-xs text-[#47607E]">
                              <span className="font-semibold text-[#0F766E]">{act.time}</span>
                              <span>•</span>
                              <span>{act.location}</span>
                            </div>
                          </div>
                        </div>

                        <StatusBadge
                          status={act.status}
                          variant={act.statusVariant}
                          size="sm"
                        />
                      </div>

                      {/* Vehicle & Client Info */}
                      <div className="grid grid-cols-2 gap-2 rounded-lg bg-white p-2.5 text-xs">
                        <div>
                          <span className="text-[10px] font-medium text-[#64748B]">Armada</span>
                          <p className="font-bold text-[#111D23] truncate">{act.vehicleName}</p>
                          <span className="font-liberationMono text-[11px] font-semibold text-[#0F766E]">
                            {act.plate}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-medium text-[#64748B]">Pihak Terkait</span>
                          <p className="font-bold text-[#111D23] truncate">{act.client}</p>
                          <p className="font-liberationMono text-[11px] text-[#47607E]">{act.contact}</p>
                        </div>
                      </div>

                      {/* Notes / Keterangan */}
                      {act.notes && (
                        <div className="rounded-md bg-white/70 p-2 text-[11px] text-[#334155]">
                          <span className="font-semibold text-[#111D23]">Catatan: </span>
                          {act.notes}
                        </div>
                      )}

                      {/* Quick Action Links */}
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <Link
                          to={`/kendaraan/detail?id=${act.vehicleId}`}
                          className="inline-flex items-center gap-1 font-plusJakartaSans text-xs font-semibold text-[#0F766E] hover:underline"
                        >
                          <span>Detail Kendaraan</span>
                          <span aria-hidden="true">&rarr;</span>
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  /* Friendly Empty State When No Event on this Date */
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-8 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E9F6FD] text-[#0F766E]">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                        <path d="m9 16 2 2 4-4" />
                      </svg>
                    </div>
                    <h4 className="mt-3 font-plusJakartaSans text-sm font-bold text-[#17324D]">
                      Tidak Ada Aktivitas Terjadwal
                    </h4>
                    <p className="mt-1 max-w-xs font-plusJakartaSans text-xs text-[#64748B]">
                      Seluruh 24 unit armada di pool tersedia penuh untuk penyewaan atau jadwal perawatan baru pada {formattedSelectedDate}.
                    </p>
                    <Link
                      to={`/pemesanan/baru?date=2026-10-${String(selectedDay).padStart(2, '0')}`}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#0F766E] px-3.5 py-2 font-plusJakartaSans text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#0D655E]"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      <span>Buat Booking Tanggal Ini</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Check Form Card (Preserved from existing UI) */}
            <div className="flex flex-col gap-4 rounded-2xl border border-[#DDEAF2] bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#E3F0F8] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E3F0F8] text-[#0F766E]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </div>
                  <h3 className="font-plusJakartaSans text-sm font-bold text-[#17324D]">
                    Cek Cepat Ketersediaan
                  </h3>
                </div>
                <span className="rounded-full bg-[#DCFCE7] px-2.5 py-0.5 font-plusJakartaSans text-[10px] font-semibold text-[#15803D]">
                  Instant Check
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="font-plusJakartaSans text-[11px] font-medium text-[#47607E]">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    defaultValue={`2026-10-${String(selectedDay).padStart(2, '0')}`}
                    className="mt-1 w-full rounded-lg border border-[#DDEAF2] bg-[#F8FAFC] px-3 py-1.5 font-plusJakartaSans text-xs text-[#17324D] outline-none focus:border-[#0F766E]"
                  />
                </div>
                <div>
                  <label className="font-plusJakartaSans text-[11px] font-medium text-[#47607E]">
                    Tanggal Selesai
                  </label>
                  <input
                    type="date"
                    defaultValue="2026-10-26"
                    className="mt-1 w-full rounded-lg border border-[#DDEAF2] bg-[#F8FAFC] px-3 py-1.5 font-plusJakartaSans text-xs text-[#17324D] outline-none focus:border-[#0F766E]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-plusJakartaSans text-[11px] font-medium text-[#47607E]">
                    Pilih Tipe Kendaraan
                  </label>
                  <select className="mt-1 w-full rounded-lg border border-[#DDEAF2] bg-[#F8FAFC] px-3 py-1.5 font-plusJakartaSans text-xs text-[#17324D] outline-none focus:border-[#0F766E]">
                    <option>MPV (Avanza, Xenia, Ertiga)</option>
                    <option>City Car (Brio, Agya)</option>
                    <option>SUV / Crossover (Xpander, Rush)</option>
                    <option>Premium VIP (Innova Zenix)</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <Link
                    to="/pemesanan/baru"
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#0F766E] py-2 font-plusJakartaSans text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#0D655E]"
                  >
                    <span>Lanjutkan ke Formulir Sewa</span>
                    <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Detail Pop-up Aktivitas */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#DDEAF2] bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#E3F0F8] bg-[#F8FAFC] px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E3F0F8] text-[#0F766E]">
                  📅
                </div>
                <div>
                  <h3 className="font-plusJakartaSans text-base font-bold text-[#111D23]">
                    Agenda Aktivitas — {formattedSelectedDate}
                  </h3>
                  <p className="font-plusJakartaSans text-xs text-[#47607E]">
                    Rincian operasional armada, penyewa, dan status jadwal JagaRoda
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Tutup modal"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#111D23]"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex flex-col gap-3 overflow-y-auto p-6 scrollbar-thin">
              {selectedDateEvents.length > 0 ? (
                selectedDateEvents.map((act) => (
                  <div
                    key={act.id}
                    className="flex flex-col gap-3 rounded-xl border border-[#DDEAF2] bg-[#F8FAFC] p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col">
                        <span className="font-plusJakartaSans text-xs font-bold text-[#0F766E]">
                          {act.time} • {act.location}
                        </span>
                        <h4 className="font-plusJakartaSans text-base font-bold text-[#111D23]">
                          {act.title}
                        </h4>
                      </div>
                      <StatusBadge status={act.status} variant={act.statusVariant} size="sm" />
                    </div>

                    <div className="grid grid-cols-2 gap-3 rounded-lg bg-white p-3 text-xs">
                      <div>
                        <span className="text-[11px] text-[#64748B]">Kendaraan &amp; Plat</span>
                        <p className="font-bold text-[#111D23]">{act.vehicleName}</p>
                        <p className="font-liberationMono text-[#0F766E]">{act.plate}</p>
                      </div>
                      <div>
                        <span className="text-[11px] text-[#64748B]">Penyewa / Mitra</span>
                        <p className="font-bold text-[#111D23]">{act.client}</p>
                        <p className="font-liberationMono text-[#47607E]">{act.contact}</p>
                      </div>
                    </div>

                    {act.notes && (
                      <p className="rounded-md bg-white p-2.5 text-xs text-[#334155]">
                        <strong className="text-[#111D23]">Keterangan: </strong>
                        {act.notes}
                      </p>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <Link
                        to={`/kendaraan/detail?id=${act.vehicleId}`}
                        onClick={() => setIsModalOpen(false)}
                        className="rounded-lg border border-[#DDEAF2] bg-white px-3 py-1.5 font-plusJakartaSans text-xs font-semibold text-[#0F766E] hover:bg-slate-50"
                      >
                        Lihat Profil Unit &rarr;
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-sm text-[#47607E]">
                  Tidak ada agenda terjadwal pada tanggal ini.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-[#E3F0F8] bg-[#F8FAFC] px-6 py-3.5">
              <span className="font-plusJakartaSans text-xs text-[#64748B]">
                ID Sinkronisasi: #CAL-2026-10-{selectedDay}
              </span>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg bg-[#0F766E] px-4 py-2 font-plusJakartaSans text-xs font-semibold text-white shadow-xs hover:bg-[#0D655E]"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
