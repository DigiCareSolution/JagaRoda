import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import StatusBadge from '../components/StatusBadge'
import {
  createVehicle,
  fetchVehicles,
  getAuthToken,
  uploadVehiclePhoto,
} from '../services/vehicleApi'

const DEFAULT_FALLBACK_IMAGE =
  '/Ab6axua7enflctrgawzxbuaxw0vvkga8l5ontrgzgjdvwbsjdgrahbmateoa2kjg_tqafywm4gthvmwr9uislxzo3obancdzvtkywbhzlbku9bx1itb91dtst0c0lwlhzygcbhu0raeac8qxpb1biaarqokmfdgs64rfup0azjbrngwrwnvsydqr9normwepupyn9ikntq3hv_p4og1u0tiap7gloxe0gi1hxasrubwyy3zahbczsq.png'

export default function Kendaraan() {
  const [vehicles, setVehicles] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [apiError, setApiError] = useState('')
  const [activeStatus, setActiveStatus] = useState('Semua')
  const [searchQuery, setSearchQuery] = useState('')
  const [activePage, setActivePage] = useState(1)

  // Modal Tambah Kendaraan State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [modalFeedback, setModalFeedback] = useState({ type: '', message: '' })
  const [newVehicle, setNewVehicle] = useState(() => ({
    plat_nomor: '',
    merk: '',
    tipe: '',
    tahun: new Date().getFullYear(),
    warna: '',
    nomor_stnk: '',
    tarif_per_hari: 350000,
    status: 'Available',
    deskripsi: '',
  }))
  const [selectedPhoto, setSelectedPhoto] = useState(null)

  const loadVehicles = useCallback(async () => {
    setIsLoading(true)
    setApiError('')
    try {
      const response = await fetchVehicles({ limit: 100, offset: 0 })
      if (response && Array.isArray(response.data)) {
        setVehicles(response.data)
      } else {
        setVehicles([])
      }
    } catch (err) {
      console.error('Error fetching vehicles:', err)
      setApiError(err.message || 'Gagal memuat data kendaraan dari backend.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadVehicles()
  }, [loadVehicles])

  const handleSearchChange = (query) => {
    setSearchQuery(query)
    setActivePage(1)
  }

  const handleStatusChange = (status) => {
    setActiveStatus(status)
    setActivePage(1)
  }

  // Menghitung statistik berdasarkan data kendaraan yang dimuat
  const totalArmada = vehicles.length
  const totalAvailable = vehicles.filter(
    (v) => v.status === 'Available' || v.status === 'Tersedia'
  ).length
  const totalRented = vehicles.filter(
    (v) => v.status === 'Rented' || v.status === 'Disewa'
  ).length
  const totalMaintenance = vehicles.filter(
    (v) => v.status === 'In Maintenance' || v.status === 'Maintenance'
  ).length
  const utilizationRate =
    totalArmada > 0 ? ((totalRented / totalArmada) * 100).toFixed(1) : '0.0'

  // Filter kendaraan
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      let matchesStatus = true
      if (activeStatus === 'Tersedia') {
        matchesStatus = v.status === 'Available' || v.status === 'Tersedia'
      } else if (activeStatus === 'Disewa') {
        matchesStatus = v.status === 'Rented' || v.status === 'Disewa'
      } else if (activeStatus === 'Maintenance') {
        matchesStatus =
          v.status === 'In Maintenance' || v.status === 'Maintenance'
      }

      const q = searchQuery.trim().toLowerCase()
      const matchesSearch =
        !q ||
        (v.merk && v.merk.toLowerCase().includes(q)) ||
        (v.tipe && v.tipe.toLowerCase().includes(q)) ||
        (v.plat_nomor && v.plat_nomor.toLowerCase().includes(q)) ||
        (v.deskripsi && v.deskripsi.toLowerCase().includes(q))

      return matchesStatus && matchesSearch
    })
  }, [vehicles, activeStatus, searchQuery])

  // Paginasi (6 item per halaman)
  const itemsPerPage = 6
  const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage) || 1
  const displayedVehicles = useMemo(() => {
    const startIndex = (activePage - 1) * itemsPerPage
    return filteredVehicles.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredVehicles, activePage])

  // Form handler untuk menambah kendaraan
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewVehicle((prev) => ({
      ...prev,
      [name]:
        name === 'tahun' || name === 'tarif_per_hari'
          ? Number(value) || value
          : value,
    }))
  }

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedPhoto(e.target.files[0])
    }
  }

  const handleAddSubmit = async (e) => {
    e.preventDefault()
    setModalFeedback({ type: '', message: '' })

    const token = getAuthToken()
    if (!token) {
      setModalFeedback({
        type: 'error',
        message: 'Anda harus Sign In terlebih dahulu untuk menambahkan armada.',
      })
      return
    }

    if (!newVehicle.plat_nomor.trim() || !newVehicle.merk.trim() || !newVehicle.tipe.trim()) {
      setModalFeedback({
        type: 'error',
        message: 'Plat nomor, merk, dan tipe kendaraan wajib diisi.',
      })
      return
    }

    setIsSubmitting(true)
    try {
      // 1. Simpan data kendaraan ke backend (POST /vehicle)
      const res = await createVehicle({
        plat_nomor: newVehicle.plat_nomor.trim().toUpperCase(),
        merk: newVehicle.merk.trim(),
        tipe: newVehicle.tipe.trim(),
        tahun: Number(newVehicle.tahun) || undefined,
        warna: newVehicle.warna.trim() || undefined,
        nomor_stnk: newVehicle.nomor_stnk.trim() || undefined,
        tarif_per_hari: Number(newVehicle.tarif_per_hari) || 0,
        status: newVehicle.status,
        deskripsi: newVehicle.deskripsi.trim() || undefined,
      })

      const createdVehicleId = res?.data?.vehicle_id

      // 2. Jika ada file foto, upload ke Cloudflare R2 via backend (POST /vehicle/{id}/photos)
      if (selectedPhoto && createdVehicleId) {
        try {
          await uploadVehiclePhoto(createdVehicleId, selectedPhoto, 'Exterior')
        } catch (photoErr) {
          console.warn('Gagal mengunggah foto:', photoErr)
        }
      }

      setModalFeedback({
        type: 'success',
        message: 'Kendaraan berhasil ditambahkan!',
      })

      // Reset form
      setNewVehicle({
        plat_nomor: '',
        merk: '',
        tipe: '',
        tahun: new Date().getFullYear(),
        warna: '',
        nomor_stnk: '',
        tarif_per_hari: 350000,
        status: 'Available',
        deskripsi: '',
      })
      setSelectedPhoto(null)

      // Refresh list
      await loadVehicles()

      setTimeout(() => {
        setIsModalOpen(false)
        setModalFeedback({ type: '', message: '' })
      }, 1000)
    } catch (err) {
      console.error('Error creating vehicle:', err)
      setModalFeedback({
        type: 'error',
        message: err.message || 'Gagal menambahkan kendaraan.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const todayFormatted = useMemo(() => {
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date())
  }, [])

  return (
    <div className="flex min-h-screen w-full flex-col items-start bg-[#F5F7FA]">
      {/* Top Header Terpadu */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={handleSearchChange}
        searchPlaceholder="Cari kendaraan, nomor polisi..."
        greeting="Data Kendaraan"
        subtitle={`${todayFormatted} • Manajemen Armada`}
        showAction={true}
        actionText="Tambah Armada"
        onActionClick={() => {
          setModalFeedback({ type: '', message: '' })
          setIsModalOpen(true)
        }}
        onRefresh={loadVehicles}
      />

      {/* Main Content */}
      <div className="mx-auto flex w-full max-w-[1600px] flex-col items-start gap-6 p-4 sm:p-6 lg:gap-8 lg:p-8">
        {/* Banner Subheader & Statistik Cepat */}
        <div className="flex w-full flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-1.5">
              <svg
                width="14"
                height="12"
                viewBox="0 0 14 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="shrink-0 text-[#005C55]"
              >
                <path
                  d="M2.25 10.5V11.25C2.25 11.4625 2.17812 11.6406 2.03437 11.7844C1.89062 11.9281 1.7125 12 1.5 12H0.75C0.5375 12 0.359375 11.9281 0.215625 11.7844C0.071875 11.6406 0 11.4625 0 11.25V5.25L1.575 0.75C1.65 0.525 1.78437 0.34375 1.97812 0.20625C2.17188 0.06875 2.3875 0 2.625 0H10.875C11.1125 0 11.3281 0.06875 11.5219 0.20625C11.7156 0.34375 11.85 0.525 11.925 0.75L13.5 5.25V11.25C13.5 11.4625 13.4281 11.6406 13.2844 11.7844C13.1406 11.9281 12.9625 12 12.75 12H12C11.7875 12 11.6094 11.9281 11.4656 11.7844C11.3219 11.6406 11.25 11.4625 11.25 11.25V10.5H2.25V10.5M2.1 3.75H11.4L10.6125 1.5H2.8875L2.1 3.75V3.75M1.5 5.25V5.25V9V9V5.25V5.25M3.375 8.25C3.6875 8.25 3.95312 8.14062 4.17188 7.92188C4.39062 7.70312 4.5 7.4375 4.5 7.125C4.5 6.8125 4.39062 6.54688 4.17188 6.32812C3.95312 6.10938 3.6875 6 3.375 6C3.0625 6 2.79688 6.10938 2.57812 6.32812C2.35938 6.54688 2.25 6.8125 2.25 7.125C2.25 7.4375 2.35938 7.70312 2.57812 7.92188C2.79688 8.14062 3.0625 8.25 3.375 8.25V8.25M10.125 8.25C10.4375 8.25 10.7031 8.14062 10.9219 7.92188C11.1406 7.70312 11.25 7.4375 11.25 7.125C11.25 6.8125 11.1406 6.54688 10.9219 6.32812C10.7031 6.10938 10.4375 6 10.125 6C9.8125 6 9.54688 6.10938 9.32812 6.32812C9.10938 6.54688 9 6.8125 9 7.125C9 7.4375 9.10938 7.70312 9.32812 7.92188C9.54688 8.14062 9.8125 8.25 10.125 8.25V8.25M1.5 9H12V5.25H1.5V9V9"
                  fill="currentColor"
                />
              </svg>
              <p className="font-plusJakartaSans text-[11px] font-semibold tracking-wider text-[#005C55]">
                KATALOG INVENTARIS UNIT
              </p>
            </div>
            <h2 className="mt-1 font-plusJakartaSans text-2xl font-bold tracking-tight text-[#111D23] sm:text-[26px]">
              Kendaraan
            </h2>
            <p className="mt-0.5 font-plusJakartaSans text-sm text-[#47607E]">
              Semua unit kendaraan rental operasional terhubung langsung dengan backend FastAPI & Supabase.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex w-full flex-wrap items-center gap-2 rounded-xl border border-[#E3F0F8] bg-white p-1.5 shadow-xs md:w-fit">
            <div className="flex flex-col border-r border-[#E3F0F8] px-4 py-1">
              <span className="font-plusJakartaSans text-[11px] font-medium text-[#47607E]">
                Total Armada
              </span>
              <span className="font-plusJakartaSans text-base font-bold text-[#111D23]">
                {totalArmada} Unit
              </span>
            </div>
            <div className="flex flex-col border-r border-[#E3F0F8] px-4 py-1">
              <span className="font-plusJakartaSans text-[11px] font-medium text-[#47607E]">
                Tingkat Utilisasi
              </span>
              <span className="font-plusJakartaSans text-base font-bold text-[#005C55]">
                {utilizationRate}%
              </span>
            </div>
            <div className="flex flex-col px-4 py-1">
              <span className="font-plusJakartaSans text-[11px] font-medium text-[#47607E]">
                Siap Sewa
              </span>
              <span className="font-plusJakartaSans text-base font-bold text-[#111D23]">
                {totalAvailable} Unit
              </span>
            </div>
          </div>
        </div>

        {/* Notifikasi API Error jika ada */}
        {apiError && (
          <div className="flex w-full items-center justify-between rounded-xl border border-[#FECDD3] bg-[#FFF1F2] p-4 text-xs font-medium text-[#BA1A1A]">
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{apiError}</span>
            </div>
            <button
              type="button"
              onClick={loadVehicles}
              className="font-bold underline hover:text-[#991B1B] cursor-pointer"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Filter Card: In-Page Search & Filter Pills */}
        <div className="flex w-full flex-col items-stretch gap-3 rounded-xl border border-[#E3F0F8] bg-white p-4 shadow-xs md:flex-row md:items-center md:justify-between">
          {/* In-Page Search */}
          <div className="relative flex w-full max-w-md items-center">
            <span className="pointer-events-none absolute left-3.5 flex items-center text-[#47607E]">
              <svg
                width="15"
                height="15"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M13.8333 15L8.58333 9.75C8.16667 10.0833 7.6875 10.3472 7.14583 10.5417C6.60417 10.7361 6.02778 10.8333 5.41667 10.8333C3.90278 10.8333 2.62153 10.309 1.57292 9.26042C0.524305 8.21181 0 6.93056 0 5.41667C0 3.90278 0.524305 2.62153 1.57292 1.57292C2.62153 0.524305 3.90278 0 5.41667 0C6.93056 0 8.21181 0.524305 9.26042 1.57292C10.309 2.62153 10.8333 3.90278 10.8333 5.41667C10.8333 6.02778 10.7361 6.60417 10.5417 7.14583C10.3472 7.6875 10.0833 8.16667 9.75 8.58333L15 13.8333L13.8333 15V15M5.41667 9.16667C6.45833 9.16667 7.34375 8.80208 8.07292 8.07292C8.80208 7.34375 9.16667 6.45833 9.16667 5.41667C9.16667 4.375 8.80208 3.48958 8.07292 2.76042C7.34375 2.03125 6.45833 1.66667 5.41667 1.66667C4.375 1.66667 3.48958 2.03125 2.76042 2.76042C2.03125 3.48958 1.66667 4.375 1.66667 5.41667C1.66667 6.45833 2.03125 7.34375 2.76042 8.07292C3.48958 8.80208 4.375 9.16667 5.41667 9.16667V9.16667"
                  fill="currentColor"
                />
              </svg>
            </span>
            <input
              type="search"
              aria-label="Cari kendaraan, nomor polisi, atau model"
              placeholder="Cari kendaraan, nomor polisi, atau model..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full rounded-lg border border-[#DDEAF2] bg-[#E9F6FD] py-2 pl-10 pr-3 font-plusJakartaSans text-xs text-[#263238] transition-colors outline-none placeholder:text-[#47607E] focus:border-[#0F766E] focus:bg-white focus:ring-1 focus:ring-[#0F766E] sm:text-[13px]"
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
              Semua ({totalArmada})
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
              Tersedia ({totalAvailable})
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
              Disewa ({totalRented})
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
              Maintenance ({totalMaintenance})
            </button>
          </div>
        </div>

        {/* Loading State */}
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
              Memuat data kendaraan dari backend...
            </p>
          </div>
        ) : (
          /* Grid Kartu Kendaraan */
          <div className="grid w-full grid-cols-1 items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {displayedVehicles.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center rounded-xl border border-dashed border-[#C7D6E3] bg-white p-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E9F6FD] text-[#0F766E]">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 9h18M9 21V9" />
                  </svg>
                </div>
                <h4 className="mt-3 font-plusJakartaSans text-base font-bold text-[#111D23]">
                  {searchQuery || activeStatus !== 'Semua'
                    ? 'Tidak ada kendaraan yang cocok'
                    : 'Belum ada armada terdaftar'}
                </h4>
                <p className="mt-1 max-w-md font-plusJakartaSans text-xs text-[#47607E] sm:text-sm">
                  {searchQuery || activeStatus !== 'Semua'
                    ? 'Coba sesuaikan kata kunci pencarian atau ubah filter status di atas.'
                    : 'Database kendaraan masih kosong. Tambahkan unit armada pertama Anda ke sistem JagaRoda sekarang.'}
                </p>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#0F766E] px-4 py-2 font-plusJakartaSans text-xs font-semibold text-white shadow-xs hover:bg-[#0D655E] cursor-pointer"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>Tambah Armada Baru</span>
                </button>
              </div>
            ) : (
              displayedVehicles.map((vehicle) => {
                const photoUrl =
                  vehicle.vehicle_photos && vehicle.vehicle_photos.length > 0
                    ? vehicle.vehicle_photos[0].photo_url
                    : DEFAULT_FALLBACK_IMAGE

                const isAvailable =
                  vehicle.status === 'Available' || vehicle.status === 'Tersedia'
                const isRented =
                  vehicle.status === 'Rented' || vehicle.status === 'Disewa'
                const statusType = isAvailable
                  ? 'success'
                  : isRented
                  ? 'info'
                  : 'warning'
                const statusLabel = isAvailable
                  ? 'Tersedia'
                  : isRented
                  ? 'Sedang Disewa'
                  : 'Perlu Servis'

                const vehicleName = `${vehicle.merk} ${vehicle.tipe}`

                return (
                  <div
                    key={vehicle.vehicle_id}
                    className="flex flex-col justify-between overflow-hidden rounded-xl border border-[#E3F0F8] bg-white shadow-xs transition-shadow hover:shadow-md"
                  >
                    {/* Gambar Unit & Badges */}
                    <div className="relative flex h-48 w-full items-center justify-center overflow-hidden bg-[#E3F0F8]">
                      <img
                        src={photoUrl}
                        alt={vehicleName}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = DEFAULT_FALLBACK_IMAGE
                        }}
                      />
                      <div className="absolute right-3 top-3">
                        <StatusBadge
                          status={statusType}
                          label={statusLabel}
                          size="sm"
                        />
                      </div>
                      <span className="absolute bottom-3 left-3 rounded bg-[#263238]/85 px-2.5 py-0.5 font-liberationMono text-[11px] font-medium tracking-wider text-white shadow-xs">
                        {vehicle.plat_nomor}
                      </span>
                    </div>

                    {/* Body Konten */}
                    <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
                      <div className="flex flex-col gap-3">
                        {/* Judul & Tahun */}
                        <div className="flex items-baseline justify-between gap-2">
                          <h3 className="font-plusJakartaSans text-base font-semibold leading-tight text-[#263238]">
                            {vehicleName}
                          </h3>
                          <span className="shrink-0 font-plusJakartaSans text-xs font-medium text-[#47607E]">
                            {vehicle.tahun ? `Tahun ${vehicle.tahun}` : '-'}
                          </span>
                        </div>

                        {/* Baris Tarif & Spesifikasi */}
                        <div className="flex items-center gap-2 text-xs text-[#47607E]">
                          <span className="font-plusJakartaSans font-bold text-[#0F766E]">
                            Rp {Number(vehicle.tarif_per_hari || 0).toLocaleString('id-ID')}
                          </span>
                          <span className="text-[#94A3B8]">/ hari</span>
                          {vehicle.warna && (
                            <>
                              <span className="text-[#CBD5E1]">•</span>
                              <span className="font-plusJakartaSans font-medium text-[#47607E]">
                                {vehicle.warna}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Box Deskripsi */}
                        <div className="flex items-start gap-2 rounded-lg bg-[#E9F6FD] p-2.5">
                          <p className="line-clamp-2 font-plusJakartaSans text-[12px] leading-snug text-[#3E4947]">
                            {vehicle.deskripsi ||
                              `Kondisi prima siap operasional. STNK: ${
                                vehicle.nomor_stnk || 'Aktif'
                              }.`}
                          </p>
                        </div>
                      </div>

                      {/* Footer Kartu */}
                      <div className="mt-4 flex items-center justify-between border-t border-[#DDEAF2] pt-3.5">
                        <div className="flex items-center gap-1.5 font-plusJakartaSans text-[11px] font-medium text-[#47607E]">
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 12 12"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M6 10C5.175 10 4.475 9.70833 3.9 9.125C3.325 8.54167 3.0375 7.84167 3.0375 7.025C3.0375 6.20833 3.325 5.50833 3.9 4.925C4.475 4.34167 5.175 4.05 6 4.05C6.825 4.05 7.525 4.34167 8.1 4.925C8.675 5.50833 8.9625 6.20833 8.9625 7.025C8.9625 7.84167 8.675 8.54167 8.1 9.125C7.525 9.70833 6.825 10 6 10ZM6 9C6.55 9 7.01667 8.80833 7.4 8.425C7.78333 8.04167 7.975 7.575 7.975 7.025C7.975 6.475 7.78333 6.00833 7.4 5.625C7.01667 5.24167 6.55 5.05 6 5.05C5.45 5.05 4.98333 5.24167 4.6 5.625C4.21667 6.00833 4.025 6.475 4.025 7.025C4.025 7.575 4.21667 8.04167 4.6 8.425C4.98333 8.80833 5.45 9 6 9Z"
                              fill="currentColor"
                            />
                          </svg>
                          <span>ID: #{vehicle.vehicle_id}</span>
                        </div>

                        <Link
                          to={`/kendaraan/detail?id=${vehicle.vehicle_id}`}
                          className="flex items-center gap-1 font-plusJakartaSans text-xs font-semibold text-[#0F766E] transition-colors hover:text-[#0D655E]"
                        >
                          <span>Lihat detail</span>
                          <svg
                            width="11"
                            height="11"
                            viewBox="0 0 11 11"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M8.11667 6H0V4.66667H8.11667L4.38333 0.933333L5.33333 0L10.6667 5.33333L5.33333 10.6667L4.38333 9.73333L8.11667 6V6"
                              fill="currentColor"
                            />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Footer & Paginasi */}
        <div className="flex w-full flex-col items-center justify-between gap-4 border-t border-[#E3F0F8] pt-4 sm:flex-row">
          <p className="font-plusJakartaSans text-xs text-[#47607E] sm:text-[13px]">
            Menampilkan {displayedVehicles.length} dari {filteredVehicles.length} kendaraan operasional
          </p>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label="Halaman sebelumnya"
                disabled={activePage === 1}
                onClick={() => setActivePage((prev) => Math.max(1, prev - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E9F6FD] text-[#47607E] transition-colors hover:bg-[#D4E6F2] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg
                  width="7"
                  height="10"
                  viewBox="0 0 7 10"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5 10L0 5L5 0L6.16667 1.16667L2.33333 5L6.16667 8.83333L5 10V10"
                    fill="currentColor"
                  />
                </svg>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  aria-current={activePage === page ? 'page' : undefined}
                  aria-label={`Halaman ${page}`}
                  onClick={() => setActivePage(page)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg font-plusJakartaSans text-xs font-semibold transition-colors sm:text-[13px] ${
                    activePage === page
                      ? 'bg-[#0F766E] text-white'
                      : 'bg-[#E9F6FD] text-[#47607E] hover:bg-[#D4E6F2]'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                aria-label="Halaman berikutnya"
                disabled={activePage === totalPages}
                onClick={() =>
                  setActivePage((prev) => Math.min(totalPages, prev + 1))
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E9F6FD] text-[#47607E] transition-colors hover:bg-[#D4E6F2] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg
                  width="7"
                  height="10"
                  viewBox="0 0 7 10"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3.83333 5L0 1.16667L1.16667 0L6.16667 5L1.16667 10L0 8.83333L3.83333 5V5"
                    fill="currentColor"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal Tambah Kendaraan */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#DDEAF2] pb-4">
              <div>
                <h3 className="font-plusJakartaSans text-lg font-bold text-[#111D23]">
                  Tambah Kendaraan Baru
                </h3>
                <p className="font-plusJakartaSans text-xs text-[#47607E]">
                  Menyimpan unit armada ke Supabase & Cloudflare R2
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-[#47607E] hover:bg-[#E9F6FD] hover:text-[#111D23] cursor-pointer"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {modalFeedback.message && (
              <div
                className={`mt-4 rounded-lg p-3 text-xs font-semibold ${
                  modalFeedback.type === 'success'
                    ? 'border border-[#BFE8E2] bg-[#F0FBF9] text-[#0F625C]'
                    : 'border border-[#FECDD3] bg-[#FFF1F2] text-[#BA1A1A]'
                }`}
              >
                {modalFeedback.message}
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="font-plusJakartaSans text-xs font-semibold text-[#17324D]">
                    Plat Nomor *
                  </label>
                  <input
                    type="text"
                    name="plat_nomor"
                    required
                    placeholder="Contoh: B 1234 ABC"
                    value={newVehicle.plat_nomor}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-lg border border-[#C7D6E3] px-3 py-2 font-liberationMono text-xs uppercase outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]"
                  />
                </div>

                <div>
                  <label className="font-plusJakartaSans text-xs font-semibold text-[#17324D]">
                    Merk Kendaraan *
                  </label>
                  <input
                    type="text"
                    name="merk"
                    required
                    placeholder="Contoh: Toyota"
                    value={newVehicle.merk}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-lg border border-[#C7D6E3] px-3 py-2 font-plusJakartaSans text-xs outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="font-plusJakartaSans text-xs font-semibold text-[#17324D]">
                    Tipe / Model *
                  </label>
                  <input
                    type="text"
                    name="tipe"
                    required
                    placeholder="Contoh: Avanza 1.3 G M/T"
                    value={newVehicle.tipe}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-lg border border-[#C7D6E3] px-3 py-2 font-plusJakartaSans text-xs outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]"
                  />
                </div>

                <div>
                  <label className="font-plusJakartaSans text-xs font-semibold text-[#17324D]">
                    Tahun
                  </label>
                  <input
                    type="number"
                    name="tahun"
                    min="1990"
                    max="2099"
                    value={newVehicle.tahun}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-lg border border-[#C7D6E3] px-3 py-2 font-plusJakartaSans text-xs outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="font-plusJakartaSans text-xs font-semibold text-[#17324D]">
                    Warna Bodi
                  </label>
                  <input
                    type="text"
                    name="warna"
                    placeholder="Contoh: Putih Metalik"
                    value={newVehicle.warna}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-lg border border-[#C7D6E3] px-3 py-2 font-plusJakartaSans text-xs outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]"
                  />
                </div>

                <div>
                  <label className="font-plusJakartaSans text-xs font-semibold text-[#17324D]">
                    Nomor STNK
                  </label>
                  <input
                    type="text"
                    name="nomor_stnk"
                    placeholder="STNK-XXXXXX"
                    value={newVehicle.nomor_stnk}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-lg border border-[#C7D6E3] px-3 py-2 font-plusJakartaSans text-xs outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="font-plusJakartaSans text-xs font-semibold text-[#17324D]">
                    Tarif Sewa (per Hari)
                  </label>
                  <input
                    type="number"
                    name="tarif_per_hari"
                    min="0"
                    step="10000"
                    value={newVehicle.tarif_per_hari}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-lg border border-[#C7D6E3] px-3 py-2 font-plusJakartaSans text-xs outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]"
                  />
                </div>

                <div>
                  <label className="font-plusJakartaSans text-xs font-semibold text-[#17324D]">
                    Status Armada
                  </label>
                  <select
                    name="status"
                    value={newVehicle.status}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-lg border border-[#C7D6E3] bg-white px-3 py-2 font-plusJakartaSans text-xs outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]"
                  >
                    <option value="Available">Available (Tersedia)</option>
                    <option value="Rented">Rented (Sedang Disewa)</option>
                    <option value="In Maintenance">In Maintenance (Perlu Servis)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-plusJakartaSans text-xs font-semibold text-[#17324D]">
                  Foto Eksterior Armada (Opsional)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handlePhotoChange}
                  className="mt-1 w-full rounded-lg border border-[#C7D6E3] bg-[#F8FAFC] px-3 py-1.5 font-plusJakartaSans text-xs text-[#47607E] file:mr-3 file:rounded-md file:border-0 file:bg-[#0F766E] file:px-3 file:py-1 file:font-plusJakartaSans file:text-xs file:font-semibold file:text-white hover:file:bg-[#0D655E]"
                />
              </div>

              <div>
                <label className="font-plusJakartaSans text-xs font-semibold text-[#17324D]">
                  Deskripsi / Catatan Unit
                </label>
                <textarea
                  name="deskripsi"
                  rows={2}
                  placeholder="Kondisi mesin, jadwal perawatan, atau fasilitas..."
                  value={newVehicle.deskripsi}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-lg border border-[#C7D6E3] px-3 py-2 font-plusJakartaSans text-xs outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#DDEAF2]">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-[#DDEAF2] px-4 py-2 font-plusJakartaSans text-xs font-semibold text-[#47607E] hover:bg-[#F8FAFC] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-[#0F766E] px-4 py-2 font-plusJakartaSans text-xs font-bold text-white shadow-xs hover:bg-[#0D655E] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Kendaraan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
