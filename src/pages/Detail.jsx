import { useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Header from '../components/Header'
import StatusBadge from '../components/StatusBadge'
import VehicleGallery from '../components/VehicleGallery'
import { vehiclesData, getVehicleById } from '../data/vehicles'

export default function Detail() {
  const [searchParams, setSearchParams] = useSearchParams()
  const vehicleIdParam = searchParams.get('id') || 'k-avanza'
  const [copied, setCopied] = useState(false)

  const activeVehicle = useMemo(() => {
    return getVehicleById(vehicleIdParam)
  }, [vehicleIdParam])

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleSwitchVehicle = (newId) => {
    setSearchParams({ id: newId })
  }

  const specs = activeVehicle.specs || [
    { label: 'Nomor Polisi', value: activeVehicle.plate, isMono: true },
    { label: 'Tahun Rilis', value: activeVehicle.year },
    { label: 'Transmisi', value: activeVehicle.transmission },
    { label: 'Warna Bodi', value: activeVehicle.color },
    { label: 'Odometer', value: activeVehicle.mileage, isMono: true },
    { label: 'Bahan Bakar', value: activeVehicle.fuel },
    { label: 'Kapasitas Kursi', value: activeVehicle.seats },
    { label: 'Depo Penempatan', value: activeVehicle.depot || activeVehicle.pool },
  ]

  const componentHealth = activeVehicle.componentHealth || []
  const serviceHistory = activeVehicle.serviceHistory || []

  return (
    <div className="flex min-h-screen w-full flex-col items-start bg-[#F5F7FA]">
      <Header
        greeting="Detail Armada"
        subtitle={`${activeVehicle.name} • ${activeVehicle.plate}`}
        showSearch={false}
        showAction={false}
      />

      <div className="mx-auto flex w-full max-w-[1600px] flex-col items-start gap-6 p-4 sm:p-6 lg:gap-8 lg:p-8">
        {/* Top Navigation & Breadcrumb */}
        <div className="flex w-full flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex flex-col items-start gap-1">
            <Link
              to="/kendaraan"
              className="inline-flex items-center gap-1.5 font-plusJakartaSans text-xs font-semibold text-[#0F766E] transition-colors hover:text-[#0B625C]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Kembali ke daftar kendaraan</span>
            </Link>
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <h2 className="font-plusJakartaSans text-2xl font-bold tracking-tight text-[#111D23] sm:text-[26px]">
                Detail Kendaraan — {activeVehicle.name}
              </h2>
              <StatusBadge
                status={activeVehicle.status}
                variant={activeVehicle.statusVariant}
                size="md"
              />
            </div>
            <p className="font-plusJakartaSans text-xs text-[#47607E] sm:text-sm">
              Informasi lengkap spesifikasi teknis, galeri multi-sudut &amp; interior, kondisi kelayakan, riwayat perawatan, dan jadwal operasional.
            </p>
          </div>

          {/* Quick Vehicle Switcher & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Switch Dropdown */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="vehicle-select" className="sr-only">Pilih Unit Kendaraan</label>
              <select
                id="vehicle-select"
                value={activeVehicle.id}
                onChange={(e) => handleSwitchVehicle(e.target.value)}
                className="h-9 rounded-lg border border-[#DDEAF2] bg-white px-3 font-plusJakartaSans text-xs font-medium text-[#17324D] shadow-xs outline-none focus:border-[#0F766E]"
              >
                {vehiclesData.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.plate})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              aria-label="Cetak lembar unit"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#DDEAF2] bg-white px-3.5 font-plusJakartaSans text-xs font-semibold text-[#17324D] shadow-xs transition-colors hover:bg-[#F8FAFC] hover:border-[#0F766E]"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              <span>Cetak Lembar</span>
            </button>
            <button
              type="button"
              onClick={handleShare}
              aria-label="Bagikan informasi kendaraan"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#DDEAF2] bg-white px-3.5 font-plusJakartaSans text-xs font-semibold text-[#17324D] shadow-xs transition-colors hover:bg-[#F8FAFC] hover:border-[#0F766E]"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              <span>{copied ? 'Tersalin!' : 'Bagikan'}</span>
            </button>
            <Link
              to="/pemesanan/baru"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#0F766E] px-4 font-plusJakartaSans text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#0D655E]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Buat Rental Baru</span>
            </Link>
          </div>
        </div>

        {/* Hero Card: Vehicle Overview with Photo Gallery */}
        <div className="w-full rounded-2xl border border-[#DDEAF2] bg-white p-5 shadow-xs sm:p-6 lg:p-7">
          <div className="grid w-full grid-cols-1 items-start gap-8 xl:grid-cols-[1fr_1.15fr]">
            {/* Left Column: Title, Description, Specs Grid, CTAs */}
            <div className="flex flex-col items-start gap-4">
              <div className="flex w-full flex-col items-start gap-1">
                <div className="flex w-full items-center justify-between">
                  <span className="font-plusJakartaSans text-[11px] font-bold uppercase tracking-wider text-[#47607E]">
                    {activeVehicle.category}
                  </span>
                  <StatusBadge status={activeVehicle.status} variant={activeVehicle.statusVariant} />
                </div>
                <h3 className="font-plusJakartaSans text-2xl font-bold tracking-tight text-[#263238] sm:text-3xl">
                  {activeVehicle.name}
                </h3>
                <p className="mt-1 font-plusJakartaSans text-xs leading-relaxed text-[#3E4947] sm:text-sm">
                  {activeVehicle.infoBoxDesc ||
                    'Kondisi prima siap operasional jarak dekat maupun luar kota. Dikelola berkala dengan riwayat pemeliharaan terpantau penuh.'}
                </p>
              </div>

              {/* Specs Grid */}
              <div className="grid w-full grid-cols-2 gap-2.5 sm:grid-cols-4">
                {specs.map(({ label, value, isMono }) => (
                  <div
                    key={label}
                    className="flex flex-col items-start rounded-xl border border-[#DDEAF2]/70 bg-[#F8FAFC] p-3 transition-colors hover:border-[#0F766E]/40"
                  >
                    <span className="font-plusJakartaSans text-[11px] font-medium leading-none text-[#47607E]">
                      {label}
                    </span>
                    <span
                      className={`mt-1.5 font-semibold text-[#17324D] ${
                        isMono ? 'font-liberationMono text-xs' : 'font-plusJakartaSans text-xs'
                      }`}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Action Buttons Row */}
              <div className="flex w-full flex-wrap items-center gap-2.5 pt-2">
                <Link
                  to="/pemesanan/baru"
                  className="inline-flex h-9.5 items-center gap-2 rounded-lg bg-[#0F766E] px-4 font-plusJakartaSans text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#0D655E]"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span>Sewa Unit Ini</span>
                </Link>
                <Link
                  to="/maintenance"
                  className="inline-flex h-9.5 items-center gap-2 rounded-lg border border-[#DDEAF2] bg-[#E3F0F8] px-4 font-plusJakartaSans text-xs font-semibold text-[#17324D] transition-colors hover:bg-[#D4E8F5]"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                  </svg>
                  <span>Jadwalkan Servis</span>
                </Link>
                <Link
                  to="/lokasi"
                  className="inline-flex h-9.5 items-center gap-2 rounded-lg border border-[#DDEAF2] bg-white px-4 font-plusJakartaSans text-xs font-semibold text-[#47607E] transition-colors hover:bg-[#F8FAFC]"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>Pantau GPS</span>
                </Link>
              </div>

              {/* Extra Highlights */}
              <div className="flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border border-[#DDEAF2] bg-[#E9F6FD] p-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0F766E] text-white text-[11px] font-bold">
                    ✓
                  </span>
                  <span className="font-plusJakartaSans font-medium text-[#17324D]">
                    STNK &amp; Asuransi All Risk Aktif s/d 2027
                  </span>
                </div>
                <span className="font-plusJakartaSans font-bold text-[#0F766E]">
                  Rp {activeVehicle.dailyRate.toLocaleString('id-ID')} / hari
                </span>
              </div>
            </div>

            {/* Right Column: Interactive Image Carousel / Slider Gallery */}
            <div className="flex w-full flex-col">
              <VehicleGallery
                images={activeVehicle.images}
                vehicleName={activeVehicle.name}
                plate={activeVehicle.plate}
                category={activeVehicle.category}
                statusBadge={<StatusBadge status={activeVehicle.status} variant={activeVehicle.statusVariant} size="sm" />}
              />
            </div>
          </div>
        </div>

        {/* Two-Column Detail Section: Component Health & Service History */}
        <div className="grid w-full grid-cols-1 items-start gap-6 xl:grid-cols-2">
          {/* Component Health Card */}
          <div className="flex flex-col gap-5 rounded-2xl border border-[#DDEAF2] bg-white p-5 shadow-xs sm:p-6">
            <div className="flex items-center justify-between border-b border-[#E3F0F8] pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E3F0F8] text-[#0F766E]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-plusJakartaSans text-base font-bold text-[#263238]">
                    Status Kesehatan Komponen
                  </h4>
                  <p className="font-plusJakartaSans text-[11px] text-[#47607E]">
                    Telemetri On-Board Diagnostic (OBD-II) &amp; Sensor Real-Time
                  </p>
                </div>
              </div>
              <span className="rounded-md bg-[#E9F6FD] px-2.5 py-1 font-plusJakartaSans text-[11px] font-medium text-[#47607E]">
                Update 10m lalu
              </span>
            </div>

            {/* Health Bars */}
            <div className="flex flex-col gap-4">
              {componentHealth.map((item) => (
                <div key={item.name} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-plusJakartaSans font-semibold text-[#263238]">
                      {item.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-plusJakartaSans text-[11px] text-[#47607E]">
                        {item.status}
                      </span>
                      <span className="font-plusJakartaSans font-bold text-[#0F766E]">
                        {item.score}%
                      </span>
                    </div>
                  </div>
                  {/* Fluid Progress Bar */}
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#DDEAF2]">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                  <p className="font-plusJakartaSans text-[11px] text-[#64748B]">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Overall Score Banner */}
            <div className="mt-2 flex items-center justify-between rounded-xl border border-[#DDEAF2] bg-[#E9F6FD] p-3.5">
              <div className="flex items-center gap-2.5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#0F766E]" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                <span className="font-plusJakartaSans text-xs font-semibold text-[#263238]">
                  Skor Kelayakan Operasi Keseluruhan
                </span>
              </div>
              <span className="font-plusJakartaSans text-base font-bold text-[#0F766E]">
                {activeVehicle.healthPercent} / 100
              </span>
            </div>
          </div>

          {/* Service History & Maintenance Card */}
          <div className="flex flex-col gap-5 rounded-2xl border border-[#DDEAF2] bg-white p-5 shadow-xs sm:p-6">
            <div className="flex items-center justify-between border-b border-[#E3F0F8] pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E3F0F8] text-[#0F766E]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-plusJakartaSans text-base font-bold text-[#263238]">
                    Jadwal Servis &amp; Riwayat
                  </h4>
                  <p className="font-plusJakartaSans text-[11px] text-[#47607E]">
                    Histori pemeliharaan dan inspeksi armada {activeVehicle.shortName}
                  </p>
                </div>
              </div>
              <Link
                to="/maintenance"
                className="inline-flex items-center gap-1 font-plusJakartaSans text-xs font-semibold text-[#0F766E] transition-colors hover:text-[#0B625C]"
              >
                <span>Lihat Semua</span>
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>

            {/* Next Service Alert */}
            <div className="flex items-center justify-between rounded-xl border border-[#DDEAF2] bg-[#E9F6FD] p-4">
              <div className="flex flex-col gap-0.5">
                <span className="font-plusJakartaSans text-[11px] font-semibold uppercase tracking-wider text-[#0F766E]">
                  Jadwal Servis Berkala Berikutnya
                </span>
                <span className="font-plusJakartaSans text-base font-bold text-[#263238]">
                  {activeVehicle.nextService || '18 Oktober 2026'}
                </span>
                <span className="font-plusJakartaSans text-xs text-[#47607E]">
                  Servis Berkala di Bengkel Resmi {activeVehicle.depot}
                </span>
              </div>
              <span className="shrink-0 rounded-full bg-[#D1E4FF] px-3 py-1 font-plusJakartaSans text-xs font-semibold text-[#001D36]">
                Tersisa 24 Hari
              </span>
            </div>

            {/* Condition Note */}
            <div className="flex items-start gap-2.5 rounded-xl border border-[#DDEAF2] bg-[#F8FAFC] p-3 text-xs text-[#3E4947]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-[#0F766E]" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div>
                <span className="font-semibold text-[#17324D]">Catatan Pemeliharaan: </span>
                Tidak ada kerusakan aktif. Terakhir servis pada {activeVehicle.lastService}. Seluruh wiper, lampu, dan sistem telematika GPS aktif normal.
              </div>
            </div>

            {/* Service History Table */}
            <div className="flex flex-col gap-2">
              <span className="font-plusJakartaSans text-[11px] font-bold uppercase tracking-wider text-[#47607E]">
                Entri Servis Terakhir
              </span>
              <div className="overflow-x-auto rounded-xl border border-[#DDEAF2]">
                <table className="w-full text-left font-plusJakartaSans text-xs">
                  <thead className="border-b border-[#E3F0F8] bg-[#F8FAFC] text-[11px] font-bold uppercase tracking-wider text-[#47607E]">
                    <tr>
                      <th className="px-3.5 py-2.5">Tanggal</th>
                      <th className="px-3.5 py-2.5">Jenis Servis</th>
                      <th className="px-3.5 py-2.5">Bengkel</th>
                      <th className="px-3.5 py-2.5 text-right">Biaya</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E3F0F8] text-[#263238]">
                    {serviceHistory.length > 0 ? (
                      serviceHistory.map((item, idx) => (
                        <tr key={idx} className="hover:bg-[#F8FAFC]">
                          <td className="px-3.5 py-2.5 font-liberationMono whitespace-nowrap">
                            {item.date}
                          </td>
                          <td className="px-3.5 py-2.5">
                            <p className="font-semibold text-[#17324D]">{item.type}</p>
                            <p className="text-[11px] text-[#64748B]">Odo: {item.odometer}</p>
                          </td>
                          <td className="px-3.5 py-2.5 text-[#47607E] whitespace-nowrap">
                            {item.workshop}
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-liberationMono font-semibold text-[#0F766E] whitespace-nowrap">
                            {item.cost}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-3.5 py-3 text-center text-[#47607E]">
                          Belum ada riwayat perbaikan besar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
