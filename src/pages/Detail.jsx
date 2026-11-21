import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Header from '../components/Header'
import StatusBadge from '../components/StatusBadge'
import VehicleGallery from '../components/VehicleGallery'
import {
  deleteVehicle,
  deleteVehiclePhoto,
  fetchVehicleById,
  getAuthToken,
  updateVehicle,
  uploadVehiclePhoto,
} from '../services/vehicleApi'

const DEFAULT_FALLBACK_IMAGE =
  '/Ab6axua7enflctrgawzxbuaxw0vvkga8l5ontrgzgjdvwbsjdgrahbmateoa2kjg_tqafywm4gthvmwr9uislxzo3obancdzvtkywbhzlbku9bx1itb91dtst0c0lwlhzygcbhu0raeac8qxpb1biaarqokmfdgs64rfup0azjbrngwrwnvsydqr9normwepupyn9ikntq3hv_p4og1u0tiap7gloxe0gi1hxasrubwyy3zahbczsq.png'

export default function Detail() {
  const navigate = useNavigate()
  const { id: paramId } = useParams()
  const [searchParams] = useSearchParams()
  const queryId = searchParams.get('id')
  const vehicleId = queryId || paramId

  const [vehicle, setVehicle] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [actionFeedback, setActionFeedback] = useState('')
  const [copied, setCopied] = useState(false)

  // Status edit state
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadVehicleDetail = useCallback(async () => {
    if (!vehicleId) {
      setIsLoading(false)
      setVehicle(null)
      setErrorMsg('ID kendaraan tidak ditentukan. Silakan pilih unit dari daftar armada.')
      return
    }

    setIsLoading(true)
    setErrorMsg('')
    try {
      const res = await fetchVehicleById(vehicleId)
      if (res && res.data) {
        setVehicle(res.data)
      } else {
        setVehicle(null)
        setErrorMsg('Data unit armada tidak ditemukan di database backend.')
      }
    } catch (err) {
      console.error('Error fetching vehicle detail:', err)
      setVehicle(null)
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
      setActionFeedback(`Status armada berhasil diubah menjadi "${newStatus}"`)
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

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file foto maksimal 5MB.')
      e.target.value = ''
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
      setActionFeedback('Foto berhasil dihapus dari Cloudflare R2.')
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

  // Real vehicle data mappings
  const vehicleName = vehicle ? `${vehicle.merk} ${vehicle.tipe}` : ''
  const vehiclePlate = vehicle?.plat_nomor || ''
  const vehicleStatus = vehicle?.status || 'Available'
  const vehicleDesc = vehicle?.deskripsi || 'Tidak ada deskripsi tambahan untuk unit armada ini.'

  const isAvailable = vehicleStatus === 'Available' || vehicleStatus === 'Tersedia'
  const isRented = vehicleStatus === 'Rented' || vehicleStatus === 'Disewa'
  const statusBadgeVariant = isAvailable ? 'success' : isRented ? 'info' : 'warning'
  const statusBadgeLabel = isAvailable ? 'Tersedia' : isRented ? 'Sedang Disewa' : 'Perlu Servis'

  // Gallery slider images mapped from real Cloudflare R2 database records
  const galleryImages = useMemo(() => {
    const list = vehicle?.vehicle_photos
    if (Array.isArray(list) && list.length > 0) {
      return list.map((p, idx) => ({
        id: p.photo_id || idx,
        url: p.photo_url,
        title: `Foto ${p.photo_type || 'Armada'} (${idx + 1})`,
        category: p.photo_type || 'Eksterior',
        caption: `Dokumentasi resmi unit ${vehicleName} di Cloudflare R2`,
      }))
    }
    return [
      {
        id: 'default',
        url: DEFAULT_FALLBACK_IMAGE,
        title: 'Foto Default',
        category: 'Eksterior',
        caption: 'Belum ada foto yang diunggah ke Cloudflare R2 untuk armada ini.',
      },
    ]
  }, [vehicle?.vehicle_photos, vehicleName])

  const photos = useMemo(() => {
    return Array.isArray(vehicle?.vehicle_photos) ? vehicle.vehicle_photos : []
  }, [vehicle?.vehicle_photos])

  const specs = vehicle
    ? [
        { label: 'Nomor Polisi', value: vehicle.plat_nomor || '-', isMono: true },
        {
          label: 'Tahun Pembuatan',
          value: vehicle.tahun ? String(vehicle.tahun) : '-',
        },
        { label: 'Warna Bodi', value: vehicle.warna || '-' },
        { label: 'Merk Kendaraan', value: vehicle.merk || '-' },
        { label: 'Tipe / Model', value: vehicle.tipe || '-' },
        {
          label: 'Tarif Sewa',
          value: `Rp ${Number(vehicle.tarif_per_hari || 0).toLocaleString('id-ID')} / hari`,
        },
        { label: 'Nomor STNK', value: vehicle.nomor_stnk || '-' },
        { label: 'Status Operasional', value: statusBadgeLabel },
        {
          label: 'ID Sistem',
          value: `#${vehicle.vehicle_id}`,
          isMono: true,
        },
        {
          label: 'Tanggal Terdaftar',
          value: vehicle.created_at
            ? new Date(vehicle.created_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
            : '-',
        },
      ]
    : []

  return (
    <div className="flex min-h-screen w-full flex-col items-start bg-[#F5F7FA]">
      <Header
        greeting="Detail Armada"
        subtitle={vehicle ? `${vehicleName} • ${vehiclePlate}` : 'Informasi Armada'}
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
                {vehicle ? `Detail Kendaraan — ${vehicleName}` : 'Detail Kendaraan'}
              </h2>
              {vehicle && <StatusBadge status={statusBadgeLabel} variant={statusBadgeVariant} size="md" />}
            </div>
            <p className="font-plusJakartaSans text-xs text-[#47607E] sm:text-sm">
              Informasi lengkap spesifikasi teknis, data Supabase, galeri R2, dan kontrol operasional armada.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
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
            {vehicle && (
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

        {/* Loading / Error / Content States */}
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
        ) : errorMsg || !vehicle ? (
          <div className="flex w-full flex-col items-center justify-center rounded-xl border border-[#FECDD3] bg-[#FFF1F2] p-8 text-center text-[#BA1A1A]">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FFE4E6] text-[#BA1A1A]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <p className="mt-3 font-plusJakartaSans text-base font-bold text-[#111D23]">
              {errorMsg || 'Kendaraan Tidak Ditemukan'}
            </p>
            <p className="mt-1 max-w-md font-plusJakartaSans text-xs text-[#47607E]">
              Data unit armada yang Anda cari tidak tersedia di database atau koneksi server terputus.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <button
                type="button"
                onClick={loadVehicleDetail}
                className="rounded-lg bg-[#0F766E] px-4 py-2 font-plusJakartaSans text-xs font-bold text-white shadow-xs hover:bg-[#0D655E] cursor-pointer"
              >
                Coba Lagi
              </button>
              <Link
                to="/kendaraan"
                className="rounded-lg border border-[#C7D6E3] bg-white px-4 py-2 font-plusJakartaSans text-xs font-bold text-[#17324D] shadow-xs hover:bg-[#F8FAFC]"
              >
                Kembali ke Daftar Armada
              </Link>
            </div>
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
                          className={`mt-1.5 font-semibold text-[#263238] ${
                            isMono
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
                  <div className="flex w-full flex-wrap items-center gap-2 rounded-lg border border-[#DDEAF2] bg-[#F8FAFC] p-3 text-xs">
                    <span className="font-semibold text-[#17324D]">
                      Ubah Status Armada:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={isUpdatingStatus || vehicleStatus === 'Available'}
                        onClick={() => handleStatusChange('Available')}
                        className={`rounded-md px-2.5 py-1 font-semibold transition-colors cursor-pointer ${
                          vehicleStatus === 'Available'
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
                        className={`rounded-md px-2.5 py-1 font-semibold transition-colors cursor-pointer ${
                          vehicleStatus === 'Rented'
                            ? 'bg-[#DBEAFE] text-[#2563EB]'
                            : 'bg-white border border-[#C7D6E3] text-[#47607E] hover:bg-[#E9F6FD]'
                        }`}
                      >
                        Disewa
                      </button>
                      <button
                        type="button"
                        disabled={isUpdatingStatus || vehicleStatus === 'In Maintenance'}
                        onClick={() => handleStatusChange('In Maintenance')}
                        className={`rounded-md px-2.5 py-1 font-semibold transition-colors cursor-pointer ${
                          vehicleStatus === 'In Maintenance'
                            ? 'bg-[#FEF3C7] text-[#B45309]'
                            : 'bg-white border border-[#C7D6E3] text-[#47607E] hover:bg-[#E9F6FD]'
                        }`}
                      >
                        Maintenance
                      </button>
                    </div>
                  </div>

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

                {/* Right Column: Real Cloudflare R2 Gallery & Photo Management */}
                <div className="flex flex-col gap-3">
                  {/* Photo Upload & R2 Management Bar */}
                  <div className="flex items-center justify-between rounded-xl border border-[#DDEAF2] bg-[#F8FAFC] p-3">
                    <div>
                      <span className="font-plusJakartaSans text-xs font-bold text-[#111D23]">
                        Dokumentasi Foto Armada
                      </span>
                      <p className="font-plusJakartaSans text-[11px] text-[#47607E]">
                        Tersimpan di Cloudflare R2 ({photos.length} foto)
                      </p>
                    </div>
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#0F766E] px-3 py-1.5 font-plusJakartaSans text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#0D655E]">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      <span>{isUploadingPhoto ? 'Mengunggah...' : 'Unggah Foto'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingPhoto}
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Real R2 Photo Gallery Slider */}
                  <VehicleGallery
                    images={galleryImages}
                    vehicleName={vehicleName}
                    plate={vehiclePlate}
                    category={`${vehicle.merk} ${vehicle.tipe}`}
                    statusBadge={
                      <StatusBadge
                        status={statusBadgeLabel}
                        variant={statusBadgeVariant}
                        size="sm"
                      />
                    }
                  />

                  {/* Thumbnail Delete Actions */}
                  {photos.length > 0 && (
                    <div className="flex flex-col gap-1.5 rounded-xl border border-[#DDEAF2] bg-white p-3">
                      <span className="font-plusJakartaSans text-[11px] font-bold uppercase tracking-wider text-[#47607E]">
                        Kelola Foto Tersimpan ({photos.length})
                      </span>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {photos.map((p, idx) => (
                          <div
                            key={p.photo_id || idx}
                            className="group relative h-14 w-16 overflow-hidden rounded-lg border border-[#C7D6E3]"
                          >
                            <img
                              src={p.photo_url}
                              alt={`Foto ${idx + 1}`}
                              className="h-full w-full object-cover"
                            />
                            {p.photo_id && (
                              <button
                                type="button"
                                title="Hapus foto ini dari R2"
                                onClick={() => handlePhotoDelete(p.photo_id)}
                                className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-red-400">
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
                </div>
              </div>
            </div>

            {/* Information Notice for IoT Telematics & Maintenance Modules */}
            <div className="grid w-full grid-cols-1 items-start gap-6 xl:grid-cols-2">
              <div className="flex flex-col gap-3 rounded-xl border border-[#DDEAF2] bg-white p-5 shadow-xs sm:p-6">
                <div className="flex items-center gap-3 border-b border-[#E3F0F8] pb-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E3F0F8] text-[#0F766E]">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-plusJakartaSans text-sm font-bold text-[#263238]">
                      Status Telemetri &amp; Kesehatan OBD-II
                    </h4>
                    <p className="font-plusJakartaSans text-[11px] text-[#47607E]">
                      Sensor kecepatan, bahan bakar, dan diagnostik mesin
                    </p>
                  </div>
                </div>
                <div className="rounded-lg bg-[#F8FAFC] p-3.5 text-xs text-[#47607E]">
                  <p className="font-semibold text-[#17324D]">Modul Telematika IoT:</p>
                  <p className="mt-1 leading-relaxed">
                    Telemetri OBD-II terintegrasi akan menampilkan kondisi mesin, tekanan ban, dan oli real-time setelah modul sensor GPS/telematika diaktifkan pada armada ini.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 rounded-xl border border-[#DDEAF2] bg-white p-5 shadow-xs sm:p-6">
                <div className="flex items-center gap-3 border-b border-[#E3F0F8] pb-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E3F0F8] text-[#0F766E]">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-plusJakartaSans text-sm font-bold text-[#263238]">
                      Jadwal Servis &amp; Pemeliharaan
                    </h4>
                    <p className="font-plusJakartaSans text-[11px] text-[#47607E]">
                      Histori servis bengkel resmi dan kartu perawatan
                    </p>
                  </div>
                </div>
                <div className="rounded-lg bg-[#F8FAFC] p-3.5 text-xs text-[#47607E]">
                  <p className="font-semibold text-[#17324D]">Riwayat Pemeliharaan:</p>
                  <p className="mt-1 leading-relaxed">
                    {vehicle.deskripsi || 'Unit dalam kondisi siap beroperasi. Riwayat transaksi bengkel akan tercatat secara otomatis pada modul Maintenance.'}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
