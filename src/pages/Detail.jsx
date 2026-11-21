import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Header from '../components/Header'
import StatusBadge from '../components/StatusBadge'
import VehicleGallery from '../components/VehicleGallery'
import { vehiclesData, getVehicleById } from '../data/vehicles'
import {
  deleteVehicle,
  deleteVehiclePhoto,
  fetchVehicleById,
  getAuthToken,
  updateVehicle,
  uploadVehiclePhoto,
} from '../services/vehicleApi'

const DEFAULT_FALLBACK_IMAGE =
  '/Ab6axua4c7ktwfv2kggaukyyw6w0mube8oidcbk100iqx7tw88d3stqxfjop0vgedgj0p98yi23s_ssymy9vuknwuzqgkam52ekbgnpehxbt4izq7nltsb1y9yw_1cwwsyi3cvaysb0gz2thbratlsy4_qncajlhslrbqxvhkwcpy0b2css1ubppa8idvy77eg9wmzbzpykiuos4mzxyb_vwms19zbiutulwmrppbb3ta0xyonnckspvg.png'

export default function Detail() {
  const navigate = useNavigate()
  const { id: paramId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryId = searchParams.get('id')
  const vehicleId = queryId || paramId

  // Data statis dipertahankan untuk pilihan cepat dan galeri desain frontend.
  // Detail utama tetap menggunakan data terbaru dari backend.
  const activeVehicle = useMemo(
    () => getVehicleById(queryId) || vehiclesData[0],
    [queryId]
  )

  const handleSwitchVehicle = (newId) => {
    setSearchParams({ id: newId })
  }

  const [vehicle, setVehicle] = useState(null)
  const [isLoading, setIsLoading] = useState(Boolean(vehicleId))
  const [errorMsg, setErrorMsg] = useState('')
  const [actionFeedback, setActionFeedback] = useState('')
  const [copied, setCopied] = useState(false)

  // Status edit state
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)

  const loadVehicleDetail = useCallback(async () => {
    if (!vehicleId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setErrorMsg('')
    try {
      const res = await fetchVehicleById(vehicleId)
      if (res && res.data) {
        setVehicle(res.data)
      }
    } catch (err) {
      console.error('Error fetching vehicle detail:', err)
      setErrorMsg(err.message || 'Kendaraan tidak ditemukan di backend.')
    } finally {
      setIsLoading(false)
    }
  }, [vehicleId])

  useEffect(() => {
    loadVehicleDetail()
  }, [loadVehicleDetail])

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleStatusChange = async (newStatus) => {
    if (!vehicleId) return
    const token = getAuthToken()
    if (!token) {
      alert('Anda harus Sign In terlebih dahulu untuk mengubah status.')
      return
    }

    setIsUpdatingStatus(true)
    try {
      await updateVehicle(vehicleId, { status: newStatus })
      setActionFeedback(`Status berhasil diubah menjadi "${newStatus}"`)
      await loadVehicleDetail()
      setTimeout(() => setActionFeedback(''), 3000)
    } catch (err) {
      alert(err.message || 'Gagal memperbarui status kendaraan.')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !vehicleId) return
    const token = getAuthToken()
    if (!token) {
      alert('Anda harus Sign In terlebih dahulu untuk mengunggah foto.')
      return
    }

    setIsUploadingPhoto(true)
    try {
      await uploadVehiclePhoto(vehicleId, file, 'Exterior')
      setActionFeedback('Foto kendaraan berhasil diunggah ke Cloudflare R2!')
      await loadVehicleDetail()
      setTimeout(() => setActionFeedback(''), 3000)
    } catch (err) {
      alert(err.message || 'Gagal mengunggah foto.')
    } finally {
      setIsUploadingPhoto(false)
      e.target.value = ''
    }
  }

  const handlePhotoDelete = async (photoId) => {
    if (!confirm('Apakah Anda yakin ingin menghapus foto ini?')) return
    try {
      await deleteVehiclePhoto(vehicleId, photoId)
      setActionFeedback('Foto berhasil dihapus.')
      await loadVehicleDetail()
      setTimeout(() => setActionFeedback(''), 3000)
    } catch (err) {
      alert(err.message || 'Gagal menghapus foto.')
    }
  }

  const handleDeleteVehicle = async () => {
    if (!confirm(`Hapus permanen unit ${vehicle?.merk} ${vehicle?.tipe} (${vehicle?.plat_nomor})?`)) return
    setIsDeleting(true)
    try {
      await deleteVehicle(vehicleId)
      alert('Kendaraan berhasil dihapus.')
      navigate('/kendaraan')
    } catch (err) {
      alert(err.message || 'Gagal menghapus kendaraan.')
      setIsDeleting(false)
    }
  }

  // Fallback demo data jika tidak ada ID atau gagal
  const vehicleName = vehicle
    ? `${vehicle.merk} ${vehicle.tipe}`
    : 'Toyota Avanza 1.3 G'
  const vehiclePlate = vehicle ? vehicle.plat_nomor : 'L 1234 AB'
  const vehicleStatus = vehicle ? vehicle.status : 'Available'
  const vehicleDesc =
    vehicle?.deskripsi ||
    'Kondisi prima siap operasional jarak dekat maupun luar kota. Dikelola berkala via bengkel mitra dengan riwayat pemeliharaan terpantau penuh.'

  const isAvailable =
    vehicleStatus === 'Available' || vehicleStatus === 'Tersedia'
  const isRented = vehicleStatus === 'Rented' || vehicleStatus === 'Disewa'
  const statusBadgeVariant = isAvailable
    ? 'success'
    : isRented
      ? 'info'
      : 'warning'
  const statusBadgeLabel = isAvailable
    ? 'Tersedia'
    : isRented
      ? 'Sedang Disewa'
      : 'Perlu Servis'

  const photos =
    vehicle?.vehicle_photos && vehicle.vehicle_photos.length > 0
      ? vehicle.vehicle_photos
      : [{ photo_url: DEFAULT_FALLBACK_IMAGE, photo_id: null }]

  const activePhotoUrl =
    photos[selectedPhotoIndex]?.photo_url || DEFAULT_FALLBACK_IMAGE

  const specs = [
    { label: 'Nomor Polisi', value: vehiclePlate, isMono: true },
    {
      label: 'Tahun Rilis',
      value: vehicle?.tahun ? String(vehicle.tahun) : '2022',
    },
    { label: 'Warna Bodi', value: vehicle?.warna || 'Putih Metalik' },
    { label: 'Transmisi', value: vehicle?.transmisi || vehicle?.transmission || 'Manual' },
    { label: 'Odometer', value: vehicle?.odometer || vehicle?.kilometer || '40.120 km', isMono: true },
    { label: 'Bahan Bakar', value: vehicle?.bahan_bakar || vehicle?.fuel || 'Bensin' },
    { label: 'Kapasitas Kursi', value: vehicle?.kapasitas_kursi || vehicle?.seats || '7' },
    { label: 'Depo Penempatan', value: vehicle?.depo || vehicle?.pool || 'Depo Utama' },
    {
      label: 'Tarif Sewa',
      value: `Rp ${Number(vehicle?.tarif_per_hari || 350000).toLocaleString('id-ID')} / hari`,
    },
    { label: 'Nomor STNK', value: vehicle?.nomor_stnk || 'STNK-123456' },
    { label: 'Status Operasional', value: statusBadgeLabel },
    {
      label: 'ID Sistem',
      value: vehicle?.vehicle_id ? `#${vehicle.vehicle_id}` : '#AVZ-2022-09',
      isMono: true,
    },
    {
      label: 'Tanggal Terdaftar',
      value: vehicle?.created_at
        ? new Date(vehicle.created_at).toLocaleDateString('id-ID')
        : '24 Okt 2026',
    },
  ]

  const componentHealth = [
    {
      name: 'Mesin',
      status: 'Sangat Baik',
      score: 94,
      desc: 'Kompresi silinder stabil, sensor O2 optimal, temperatur idle 88°C.',
      color: 'bg-[#0F766E]',
    },
    {
      name: 'Ban',
      status: 'Kondisi Baik - Tekanan 33 PSI',
      score: 82,
      desc: 'Ketebalan tapak 6.2mm rata seluruh sisi. Rotasi ban berkala.',
      color: 'bg-[#15803D]',
    },
    {
      name: 'Rem',
      status: 'Perlu Dicek Dalam 2.000 km',
      score: 68,
      desc: 'Tromol belakang mulai aus normal. Cakram depan dalam batas toleransi aman.',
      color: 'bg-[#B45309]',
    },
    {
      name: 'Oli Mesin',
      status: 'Penggantian teratur',
      score: 75,
      desc: 'Viskositas sintetis terpantau jernih. Sisa estimasi pakai aman.',
      color: 'bg-[#0F766E]',
    },
  ]

  const serviceHistory = [
    {
      date: '15 Jun 2026',
      type: 'Ganti Kampas Rem & Tune Up',
      odometer: '40.120 km',
      workshop: 'AutoCare Kenjeran',
      cost: 'Rp 1.450.000',
    },
    {
      date: '12 Jan 2026',
      type: 'Servis Berkala 30.000 km',
      odometer: '30.050 km',
      workshop: 'Bengkel Resmi Mitra',
      cost: 'Rp 980.000',
    },
  ]

  return (
    <div className="flex min-h-screen w-full flex-col items-start bg-[#F5F7FA]">
      <Header
        greeting="Detail Armada"
        subtitle={`${vehicleName} • ${vehiclePlate}`}
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
                Detail Kendaraan — {vehicleName}
              </h2>
              <StatusBadge status={statusBadgeLabel} variant={statusBadgeVariant} size="md" />
            </div>
            <p className="font-plusJakartaSans text-xs text-[#47607E] sm:text-sm">
              Informasi lengkap spesifikasi teknis, data Supabase, galeri R2, dan kontrol operasional.
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
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#DDEAF2] bg-white px-3.5 font-plusJakartaSans text-xs font-semibold text-[#17324D] shadow-xs transition-colors hover:bg-[#F8FAFC] hover:border-[#0F766E] cursor-pointer"
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
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#DDEAF2] bg-white px-3.5 font-plusJakartaSans text-xs font-semibold text-[#17324D] shadow-xs transition-colors hover:bg-[#F8FAFC] hover:border-[#0F766E] cursor-pointer"
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
            {vehicleId && (
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteVehicle}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#FECDD3] bg-white px-3 font-plusJakartaSans text-xs font-semibold text-[#BA1A1A] shadow-xs transition-colors hover:bg-[#FFF1F2] cursor-pointer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                <span>{isDeleting ? 'Menghapus...' : 'Hapus Unit'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Feedback Alert */}
        {actionFeedback && (
          <div className="w-full rounded-lg border border-[#BFE8E2] bg-[#F0FBF9] p-3 text-xs font-semibold text-[#0F625C]">
            {actionFeedback}
          </div>
        )}

        {/* Loading / Error States */}
        {isLoading ? (
          <div className="flex h-64 w-full flex-col items-center justify-center rounded-xl border border-[#DDEAF2] bg-white">
            <svg
              className="h-8 w-8 animate-spin text-[#0F766E]"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              ></path>
            </svg>
            <p className="mt-3 font-plusJakartaSans text-sm text-[#47607E]">
              Memuat detail kendaraan #{vehicleId}...
            </p>
          </div>
        ) : errorMsg ? (
          <div className="w-full rounded-xl border border-[#FECDD3] bg-[#FFF1F2] p-6 text-center text-[#BA1A1A]">
            <p className="font-plusJakartaSans text-base font-bold">{errorMsg}</p>
            <p className="mt-1 font-plusJakartaSans text-xs text-[#991B1B]">
              Periksa ID kendaraan atau kembali ke daftar armada.
            </p>
            <Link
              to="/kendaraan"
              className="mt-4 inline-block rounded-lg bg-[#0F766E] px-4 py-2 text-xs font-bold text-white hover:bg-[#0D655E]"
            >
              Kembali ke Daftar Armada
            </Link>
          </div>
        ) : (
          <>
            {/* Hero Card: Vehicle Overview */}
            <div className="w-full rounded-xl border border-[#DDEAF2] bg-white p-5 shadow-xs sm:p-6">
              <div className="grid w-full grid-cols-1 items-start gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                {/* Left Column: Title, Description, Specs Grid, CTAs */}
                <div className="flex flex-col items-start gap-4">
                  <div className="flex w-full flex-col items-start gap-1">
                    <div className="flex w-full items-center justify-between">
                      <span className="font-plusJakartaSans text-[11px] font-bold uppercase tracking-wider text-[#47607E]">
                        UNIT ARMADA JAGARODA
                      </span>
                      <StatusBadge status={statusBadgeLabel} variant={statusBadgeVariant} />
                    </div>
                    <h3 className="font-plusJakartaSans text-2xl font-bold tracking-tight text-[#263238]">
                      {vehicleName}
                    </h3>
                    <p className="mt-1 font-plusJakartaSans text-xs leading-relaxed text-[#3E4947] sm:text-sm">
                      {vehicleDesc}
                    </p>
                  </div>

                  {/* Specs Grid */}
                  <div className="grid w-full grid-cols-2 gap-2.5 sm:grid-cols-4">
                    {specs.map(({ label, value, isMono }) => (
                      <div
                        key={label}
                        className="flex flex-col items-start rounded-lg border border-[#DDEAF2]/60 bg-[#E9F6FD]/60 p-2.5"
                      >
                        <span className="font-plusJakartaSans text-[11px] font-medium leading-none text-[#47607E]">
                          {label}
                        </span>
                        <span
                          className={`mt-1.5 font-semibold text-[#263238] ${isMono
                            ? 'font-liberationMono text-xs'
                            : 'font-plusJakartaSans text-xs'
                            }`}
                        >
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Kontrol Status Cepat (PUT /vehicle/{id}) */}
                  {vehicleId && (
                    <div className="flex w-full flex-wrap items-center gap-2 rounded-lg border border-[#DDEAF2] bg-[#F8FAFC] p-3 text-xs">
                      <span className="font-semibold text-[#17324D]">
                        Ubah Status Armada:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={isUpdatingStatus || vehicleStatus === 'Available'}
                          onClick={() => handleStatusChange('Available')}
                          className={`rounded-md px-2.5 py-1 font-semibold transition-colors cursor-pointer ${vehicleStatus === 'Available'
                            ? 'bg-[#DCFCE7] text-[#15803D]'
                            : 'bg-white border border-[#C7D6E3] text-[#47607E] hover:bg-[#E9F6FD]'
                            }`}
                        >
                          Tersedia
                        </button>
                        <button
                          type="button"
                          disabled={isUpdatingStatus || vehicleStatus === 'Rented'}
                          onClick={() => handleStatusChange('Rented')}
                          className={`rounded-md px-2.5 py-1 font-semibold transition-colors cursor-pointer ${vehicleStatus === 'Rented'
                            ? 'bg-[#DBEAFE] text-[#2563EB]'
                            : 'bg-white border border-[#C7D6E3] text-[#47607E] hover:bg-[#E9F6FD]'
                            }`}
                        >
                          Disewa
                        </button>
                        <button
                          type="button"
                          disabled={
                            isUpdatingStatus || vehicleStatus === 'In Maintenance'
                          }
                          onClick={() => handleStatusChange('In Maintenance')}
                          className={`rounded-md px-2.5 py-1 font-semibold transition-colors cursor-pointer ${vehicleStatus === 'In Maintenance'
                            ? 'bg-[#FEF3C7] text-[#B45309]'
                            : 'bg-white border border-[#C7D6E3] text-[#47607E] hover:bg-[#E9F6FD]'
                            }`}
                        >
                          Maintenance
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons Row */}
                  <div className="flex w-full flex-wrap items-center gap-2.5 pt-2">
                    <Link
                      to="/pemesanan/baru"
                      className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#0F766E] px-4 font-plusJakartaSans text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#0D655E]"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <span>Sewa Unit Ini</span>
                    </Link>
                    <Link
                      to="/maintenance"
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#DDEAF2] bg-[#E3F0F8] px-4 font-plusJakartaSans text-xs font-semibold text-[#17324D] transition-colors hover:bg-[#D4E8F5]"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                      </svg>
                      <span>Jadwalkan Servis</span>
                    </Link>
                    <Link
                      to="/lokasi"
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#DDEAF2] bg-white px-4 font-plusJakartaSans text-xs font-semibold text-[#47607E] transition-colors hover:bg-[#F8FAFC]"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <span>Pantau GPS</span>
                    </Link>
                  </div>
                </div>

                {/* Right Column: Vehicle Image & Badges & R2 Gallery */}
                <div className="flex flex-col gap-3">
                  <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-xl border border-[#DDEAF2] bg-[#E9F6FD]">
                    <img
                      src={activePhotoUrl}
                      className="h-64 w-full object-cover sm:h-72"
                      alt={vehicleName}
                      onError={(e) => {
                        e.currentTarget.src = DEFAULT_FALLBACK_IMAGE
                      }}
                    />
                    <div className="absolute left-3 top-3">
                      <StatusBadge status={statusBadgeLabel} variant={statusBadgeVariant} />
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
                      <span className="rounded-md bg-[#111D23]/80 px-2.5 py-1 font-plusJakartaSans text-[11px] font-medium text-white backdrop-blur-xs">
                        ID: #{vehicle?.vehicle_id || 'AVZ-2022-09'}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-[#0F766E]/90 px-2.5 py-1 font-plusJakartaSans text-[11px] font-medium text-white backdrop-blur-xs">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {vehicle?.nomor_stnk ? 'STNK Terdata' : 'Dokumen Lengkap'}
                      </span>
                    </div>
                  </div>

                  {/* Thumbnail Galeri Foto Cloudflare R2 & Upload Foto */}
                  {vehicleId && (
                    <div className="flex flex-col gap-2 rounded-xl border border-[#DDEAF2] bg-white p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-plusJakartaSans text-xs font-bold text-[#111D23]">
                          Galeri Foto (Cloudflare R2)
                        </span>
                        <label className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-[#0F766E] hover:underline">
                          <span>{isUploadingPhoto ? 'Mengunggah...' : '+ Unggah Foto'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={isUploadingPhoto}
                            onChange={handlePhotoUpload}
                            className="hidden"
                          />
                        </label>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {photos.map((p, idx) => (
                          <div
                            key={p.photo_id || idx}
                            className="group relative h-16 w-16 overflow-hidden rounded-lg border border-[#C7D6E3]"
                          >
                            <img
                              src={p.photo_url}
                              alt={`Foto ${idx + 1}`}
                              onClick={() => setSelectedPhotoIndex(idx)}
                              className={`h-full w-full object-cover cursor-pointer ${selectedPhotoIndex === idx
                                ? 'ring-2 ring-[#0F766E]'
                                : 'opacity-80 hover:opacity-100'
                                }`}
                            />
                            {p.photo_id && (
                              <button
                                type="button"
                                title="Hapus foto ini"
                                onClick={() => handlePhotoDelete(p.photo_id)}
                                className="absolute right-0.5 top-0.5 hidden rounded bg-red-600 p-0.5 text-white group-hover:block"
                              >
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                  <line x1="18" y1="6" x2="6" y2="18" />
                                  <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Galeri visual dari desain frontend tetap dipertahankan.
                      Foto kendaraan aktual dari backend tetap tersedia di galeri R2 di atas. */}
                  {activeVehicle && (
                    <VehicleGallery
                      images={activeVehicle.images}
                      vehicleName={activeVehicle.name}
                      plate={activeVehicle.plate}
                      category={activeVehicle.category}
                      statusBadge={
                        <StatusBadge
                          status={activeVehicle.status}
                          variant={activeVehicle.statusVariant}
                          size="sm"
                        />
                      }
                    />
                  )}
                </div >
              </div >
            </div >

    {/* Two-Column Detail Section: Component Health & Service History */ }
    < div className = "grid w-full grid-cols-1 items-start gap-6 xl:grid-cols-2" >
      {/* Component Health Card */ }
      < div className = "flex flex-col gap-5 rounded-xl border border-[#DDEAF2] bg-white p-5 shadow-xs sm:p-6" >
        <div className="flex items-center justify-between border-b border-[#E3F0F8] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#E3F0F8] text-[#0F766E]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <div>
              <h4 className="font-plusJakartaSans text-base font-bold text-[#263238]">
                Status Kesehatan Komponen
              </h4>
              <p className="font-plusJakartaSans text-[11px] text-[#47607E]">
                Telemetri real-time On-Board Diagnostic (OBD-II)
              </p>
            </div>
          </div>
          <span className="rounded-md bg-[#E9F6FD] px-2.5 py-1 font-plusJakartaSans text-[11px] font-medium text-[#47607E]">
            Update otomatis
          </span>
        </div>

  {/* Health Bars */ }
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

  {/* Overall Score Banner */ }
  <div className="mt-2 flex items-center justify-between rounded-lg border border-[#DDEAF2] bg-[#E9F6FD] p-3.5">
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
                    {activeVehicle?.healthPercent ?? 88.5} / 100
                  </span >
                </div >
              </div >

    {/* Service History & Maintenance Card */ }
    < div className = "flex flex-col gap-5 rounded-xl border border-[#DDEAF2] bg-white p-5 shadow-xs sm:p-6" >
      <div className="flex items-center justify-between border-b border-[#E3F0F8] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#E3F0F8] text-[#0F766E]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          </div>
          <div>
            <h4 className="font-plusJakartaSans text-base font-bold text-[#263238]">
              Jadwal Servis &amp; Riwayat
            </h4>
            <p className="font-plusJakartaSans text-[11px] text-[#47607E]">
              Histori pemeliharaan dan inspeksi armada
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

                {/* Next Service Alert dari tampilan frontend */}
                <div className="flex items-center justify-between gap-3 rounded-xl border border-[#DDEAF2] bg-[#E9F6FD] p-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-plusJakartaSans text-[11px] font-semibold uppercase tracking-wider text-[#0F766E]">
                      Jadwal Servis Berkala Berikutnya
                    </span>
                    <span className="font-plusJakartaSans text-base font-bold text-[#263238]">
                      {activeVehicle?.nextService || '18 Oktober 2026'}
                    </span>
                    <span className="font-plusJakartaSans text-xs text-[#47607E]">
                      Servis Berkala di Bengkel Resmi {activeVehicle?.depot || ''}
                    </span>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#D1E4FF] px-3 py-1 font-plusJakartaSans text-xs font-semibold text-[#001D36]">
                    Jadwal berikutnya
                  </span>
                </div>

  {/* Condition Note */ }
  <div className="flex items-start gap-2.5 rounded-lg border border-[#DDEAF2] bg-[#F8FAFC] p-3 text-xs text-[#3E4947]">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-[#0F766E]" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
    <div>
      <span className="font-semibold text-[#17324D]">Catatan Pemeliharaan: </span>
      {vehicle?.deskripsi || 'Unit dalam kondisi siap pakai, rem dan sistem bahan bakar prima.'}
    </div>
  </div>

  {/* Service History Table */ }
  <div className="flex flex-col gap-2">
    <span className="font-plusJakartaSans text-[11px] font-bold uppercase tracking-wider text-[#47607E]">
      Entri Servis Berkala
    </span>
    <div className="overflow-x-auto rounded-lg border border-[#DDEAF2]">
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
          {serviceHistory.map((item, idx) => (
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
          ))}
        </tbody>
      </table>
    </div>
  </div>
              </div >
            </div >
          </>
        )
}
      </div >
    </div >
  )
}
