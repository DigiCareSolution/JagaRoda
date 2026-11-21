import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import StatusBadge from '../components/StatusBadge'
import { fetchVehicles } from '../services/vehicleApi'

const API_BASE = import.meta.env.VITE_API_BASE
const DEFAULT_FALLBACK_IMAGE =
  '/Ab6axua7enflctrgawzxbuaxw0vvkga8l5ontrgzgjdvwbsjdgrahbmateoa2kjg_tqafywm4gthvmwr9uislxzo3obancdzvtkywbhzlbku9bx1itb91dtst0c0lwlhzygcbhu0raeac8qxpb1biaarqokmfdgs64rfup0azjbrngwrwnvsydqr9normwepupyn9ikntq3hv_p4og1u0tiap7gloxe0gi1hxasrubwyy3zahbczsq.png'

export default function Dashboard() {
  const navigate = useNavigate()
  const [activeVehicleStatus, setActiveVehicleStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // State User dari Backend API (/user/me & /user)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user') || sessionStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [userList, setUserList] = useState([])
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [userError, setUserError] = useState('')

  // State Kendaraan dari Backend API (/vehicle)
  const [vehicles, setVehicles] = useState([])
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true)
  const [vehicleError, setVehicleError] = useState('')

  const fetchUserData = useCallback(async () => {
    setIsLoadingUser(true)
    setUserError('')
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token')

    if (!token) {
      setIsLoadingUser(false)
      setUserError('Token autentikasi tidak ditemukan. Silakan sign in terlebih dahulu.')
      return
    }

    try {
      // 1. Ambil profil user saat ini (/user/me)
      const meRes = await fetch(`${API_BASE}/user/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (meRes.status === 401) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        sessionStorage.removeItem('access_token')
        sessionStorage.removeItem('refresh_token')
        sessionStorage.removeItem('user')
        navigate('/signin')
        return
      }

      if (meRes.ok) {
        const meData = await meRes.json()
        if (meData.data) {
          setCurrentUser(meData.data)
          if (localStorage.getItem('access_token')) {
            localStorage.setItem('user', JSON.stringify(meData.data))
          } else {
            sessionStorage.setItem('user', JSON.stringify(meData.data))
          }
        }
      } else {
        const errData = await meRes.json().catch(() => ({}))
        setUserError(errData.detail || errData.message || 'Gagal memuat profil pengguna.')
      }

      // 2. Ambil daftar staf / user terdaftar (/user)
      const listRes = await fetch(`${API_BASE}/user?limit=6&offset=0`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (listRes.ok) {
        const listData = await listRes.json()
        if (Array.isArray(listData.data)) {
          setUserList(listData.data)
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard user data:', err)
      setUserError('Tidak dapat terhubung ke server backend.')
    } finally {
      setIsLoadingUser(false)
    }
  }, [navigate])

  const loadVehicles = useCallback(async () => {
    setIsLoadingVehicles(true)
    setVehicleError('')
    try {
      const res = await fetchVehicles({ limit: 100, offset: 0 })
      if (res && Array.isArray(res.data)) {
        setVehicles(res.data)
      } else {
        setVehicles([])
      }
    } catch (err) {
      console.error('Error fetching vehicles on dashboard:', err)
      setVehicleError(err.message || 'Gagal memuat armada dari backend.')
    } finally {
      setIsLoadingVehicles(false)
    }
  }, [])

  useEffect(() => {
    fetchUserData()
    loadVehicles()
  }, [fetchUserData, loadVehicles])

  const handleRefreshAll = useCallback(() => {
    fetchUserData()
    loadVehicles()
  }, [fetchUserData, loadVehicles])

  const todayFormatted = useMemo(() => {
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date())
  }, [])

  // Kalkulasi statistik armada dinamis dari database live
  const totalKendaraan = vehicles.length
  const totalTersedia = vehicles.filter(
    (v) => v.status === 'Available' || v.status === 'Tersedia'
  ).length
  const totalDisewa = vehicles.filter(
    (v) => v.status === 'Rented' || v.status === 'Disewa'
  ).length
  const totalMaintenance = vehicles.filter(
    (v) => v.status === 'In Maintenance' || v.status === 'Maintenance'
  ).length
  const pctTersedia =
    totalKendaraan > 0 ? ((totalTersedia / totalKendaraan) * 100).toFixed(1) : '0'
  const pctDisewa =
    totalKendaraan > 0 ? ((totalDisewa / totalKendaraan) * 100).toFixed(1) : '0'
  const pctMaintenance =
    totalKendaraan > 0 ? ((totalMaintenance / totalKendaraan) * 100).toFixed(1) : '0'

  // Filter kendaraan untuk bagian "Kondisi Kendaraan"
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      let matchesFilter = true
      if (activeVehicleStatus === 'available') {
        matchesFilter = v.status === 'Available' || v.status === 'Tersedia'
      } else if (activeVehicleStatus === 'rented') {
        matchesFilter = v.status === 'Rented' || v.status === 'Disewa'
      } else if (activeVehicleStatus === 'maintenance') {
        matchesFilter =
          v.status === 'In Maintenance' || v.status === 'Maintenance'
      }

      const q = searchQuery.trim().toLowerCase()
      const matchesSearch =
        !q ||
        (v.merk && v.merk.toLowerCase().includes(q)) ||
        (v.tipe && v.tipe.toLowerCase().includes(q)) ||
        (v.plat_nomor && v.plat_nomor.toLowerCase().includes(q)) ||
        (v.deskripsi && v.deskripsi.toLowerCase().includes(q))
      return matchesFilter && matchesSearch
    })
  }, [vehicles, activeVehicleStatus, searchQuery])

  // Kendaraan dengan status Maintenance dari database
  const maintenanceList = useMemo(() => {
    return vehicles.filter(
      (v) => v.status === 'In Maintenance' || v.status === 'Maintenance'
    )
  }, [vehicles])

  return (
    <div className="flex min-h-screen w-full flex-col items-start bg-[#F5F7FA]">
      {/* Top Header Terpadu */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchPlaceholder="Cari kendaraan, nomor polisi..."
        greeting={`Selamat Datang, ${currentUser?.username || 'Pengelola'}`}
        subtitle={`${todayFormatted} • Shift ${currentUser?.role || 'Staff'} Ops`}
        user={currentUser}
        onRefresh={handleRefreshAll}
      />

      {/* Main Content */}
      <div className="mx-auto flex w-full max-w-[1600px] flex-col items-start gap-6 p-4 sm:p-6 lg:gap-8 lg:p-8">
        {/* Banner Selamat Datang & Subheader */}
        <div className="flex w-full flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-1.5">
              <svg
                width="12"
                height="15"
                viewBox="0 0 12 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="shrink-0"
              >
                <path
                  d="M5.2125 10.1625L9.45 5.925L8.38125 4.85625L5.2125 8.025L3.6375 6.45L2.56875 7.51875L5.2125 10.1625V10.1625M6 15C4.2625 14.5625 2.82812 13.5656 1.69687 12.0094C0.565625 10.4531 0 8.725 0 6.825V2.25L6 0L12 2.25V6.825C12 8.725 11.4344 10.4531 10.3031 12.0094C9.17188 13.5656 7.7375 14.5625 6 15V15M6 13.425C7.3 13.0125 8.375 12.1875 9.225 10.95C10.075 9.7125 10.5 8.3375 10.5 6.825V3.28125L6 1.59375L1.5 3.28125V6.825C1.5 8.3375 1.925 9.7125 2.775 10.95C3.625 12.1875 4.7 13.0125 6 13.425V13.425M6 7.5V7.5V7.5V7.5V7.5V7.5V7.5V7.5V7.5V7.5"
                  fill="#005C55"
                />
              </svg>
              <p className="font-plusJakartaSans text-[12px] font-semibold tracking-wider text-[#005C55]">
                SISTEM MANAJEMEN ARMADA AKTIF
              </p>
            </div>
            <h2 className="mt-1 font-plusJakartaSans text-2xl font-bold tracking-tight text-[#111D23] sm:text-[26px]">
              Halo, {currentUser?.username || 'Pengelola'}!
            </h2>
            <p className="mt-0.5 font-plusJakartaSans text-sm text-[#47607E]">
              {currentUser ? (
                <>
                  Masuk sebagai <strong className="text-[#0F766E]">{currentUser.role}</strong>
                  {currentUser.phone ? ` • No. HP: ${currentUser.phone}` : ''}
                </>
              ) : (
                'Ringkasan operasional dan kelaikan kendaraan rental hari ini.'
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 rounded-lg bg-[#DDEAF2] px-3.5 py-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${currentUser ? 'bg-[#15803D]' : 'bg-[#B45309]'}`}
              ></span>
              <p className="font-plusJakartaSans text-xs font-semibold text-[#3E4947] sm:text-[13px]">
                {currentUser ? `${currentUser.username} (${currentUser.role})` : 'Tamu'}
              </p>
            </div>
            {currentUser?.role === 'Admin' && (
              <Link
                to="/admin/dashboard"
                className="flex items-center gap-1.5 rounded-lg border border-[#0F766E] bg-white px-3.5 py-2 text-xs font-semibold text-[#0F766E] shadow-xs transition-colors hover:bg-[#F0FBF9] sm:text-[13px]"
              >
                Panel Admin
              </Link>
            )}
            <Link
              to="/kendaraan"
              className="flex items-center gap-1.5 rounded-lg bg-[#0F766E] px-3.5 py-2 text-white shadow-xs transition-colors hover:bg-[#0D655E]"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 1v10M1 6h10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <span className="font-plusJakartaSans text-xs font-semibold sm:text-[13px]">
                Kelola Armada
              </span>
            </Link>
          </div>
        </div>

        {/* Notifikasi / Error State */}
        {userError && (
          <div className="flex w-full items-center justify-between rounded-xl border border-[#FECDD3] bg-[#FFF1F2] p-4 text-xs font-medium text-[#BA1A1A]">
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{userError}</span>
            </div>
            <Link to="/signin" className="font-bold underline hover:text-[#991B1B]">
              Sign In Sekarang
            </Link>
          </div>
        )}

        {vehicleError && (
          <div className="flex w-full items-center justify-between rounded-xl border border-[#FEF3C7] bg-[#FFFBEB] p-4 text-xs font-medium text-[#B45309]">
            <span>{vehicleError}</span>
            <button
              type="button"
              onClick={loadVehicles}
              className="font-bold underline hover:text-[#92400E] cursor-pointer"
            >
              Muat Ulang
            </button>
          </div>
        )}

        {/* 4 Kartu Metrik Utama (Data Realtime dari GET /vehicle) */}
        <div className="grid w-full grid-cols-1 items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* Card 1: Total Kendaraan */}
          <div className="flex flex-col justify-between rounded-xl border border-[#E3F0F8] bg-white p-5 shadow-xs transition-shadow hover:shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-plusJakartaSans text-[13px] font-medium text-[#47607E]">
                Total Kendaraan
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E3F0F8] text-[#47607E]">
                <svg
                  width="17"
                  height="15"
                  viewBox="0 0 17 15"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2.75 12.8333V13.75C2.75 14.0097 2.66215 14.2274 2.48646 14.4031C2.31076 14.5788 2.09306 14.6667 1.83333 14.6667H0.916667C0.656944 14.6667 0.439236 14.5788 0.263542 14.4031C0.0878472 14.2274 0 14.0097 0 13.75V6.41667L1.925 0.916667C2.01667 0.641667 2.1809 0.420139 2.41771 0.252083C2.65451 0.0840278 2.91806 0 3.20833 0H13.2917C13.5819 0 13.8455 0.0840278 14.0823 0.252083C14.3191 0.420139 14.4833 0.641667 14.575 0.916667L16.5 6.41667V13.75C16.5 14.0097 16.4122 14.2274 16.2365 14.4031C16.0608 14.5788 15.8431 14.6667 15.5833 14.6667H14.6667C14.4069 14.6667 14.1892 14.5788 14.0135 14.4031C13.8378 14.2274 13.75 14.0097 13.75 13.75V12.8333H2.75V12.8333M2.56667 4.58333H13.9333L12.9708 1.83333H3.52917L2.56667 4.58333V4.58333M1.83333 6.41667V6.41667V11V11V6.41667V6.41667M4.125 10.0833C4.50694 10.0833 4.8316 9.94965 5.09896 9.68229C5.36632 9.41493 5.5 9.09028 5.5 8.70833C5.5 8.32639 5.36632 8.00174 5.09896 7.73438C4.8316 7.46701 4.50694 7.33333 4.125 7.33333C3.74306 7.33333 3.4184 7.46701 3.15104 7.73438C2.88368 8.00174 2.75 8.32639 2.75 8.70833C2.75 9.09028 2.88368 9.41493 3.15104 9.68229C3.4184 9.94965 3.74306 10.0833 4.125 10.0833V10.0833M12.375 10.0833C12.7569 10.0833 13.0816 9.94965 13.349 9.68229C13.6163 9.41493 13.75 9.09028 13.75 8.70833C13.75 8.32639 13.6163 8.00174 13.349 7.73438C13.0816 7.46701 12.7569 7.33333 12.375 7.33333C11.9931 7.33333 11.6684 7.46701 11.401 7.73438C11.1337 8.00174 11 8.32639 11 8.70833C11 9.09028 11.1337 9.41493 11.401 9.68229C11.6684 9.94965 11.9931 10.0833 12.375 10.0833V10.0833M1.83333 11H14.6667V6.41667H1.83333V11V11"
                    fill="currentColor"
                  />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="font-plusJakartaSans text-3xl font-bold tracking-tight text-[#111D23]">
                {isLoadingVehicles ? '...' : totalKendaraan}
              </span>
              <span className="rounded-full bg-[#DDEAF2] px-2.5 py-1 font-plusJakartaSans text-[11px] font-semibold text-[#47607E]">
                {totalKendaraan > 0 ? `${totalKendaraan} Unit` : '0 Unit'}
              </span>
            </div>
            <div className="mt-3.5 h-1.5 w-full overflow-hidden rounded-full bg-[#E3F0F8]">
              <div
                className="h-full rounded-full bg-[#47607E]"
                style={{ width: totalKendaraan > 0 ? '100%' : '0%' }}
              />
            </div>
          </div>

          {/* Card 2: Tersedia */}
          <div className="flex flex-col justify-between rounded-xl border border-[#E3F0F8] bg-white p-5 shadow-xs transition-shadow hover:shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-plusJakartaSans text-[13px] font-medium text-[#47607E]">
                Tersedia
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#DCFCE7] text-[#15803D]">
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 19 19"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M7.88333 13.3833L14.3458 6.92083L13.0625 5.6375L7.88333 10.8167L5.27083 8.20417L3.9875 9.4875L7.88333 13.3833V13.3833M9.16667 18.3333C7.89861 18.3333 6.70694 18.0927 5.59167 17.6115C4.47639 17.1302 3.50625 16.4771 2.68125 15.6521C1.85625 14.8271 1.20312 13.8569 0.721875 12.7417C0.240625 11.6264 0 10.4347 0 9.16667C0 7.89861 0.240625 6.70694 0.721875 5.59167C1.20312 4.47639 1.85625 3.50625 2.68125 2.68125C3.50625 1.85625 4.47639 1.20312 5.59167 0.721875C6.70694 0.240625 7.89861 0 9.16667 0C10.4347 0 11.6264 0.240625 12.7417 0.721875C13.8569 1.20312 14.8271 1.85625 15.6521 2.68125C16.4771 3.50625 17.1302 4.47639 17.6115 5.59167C18.0927 6.70694 18.3333 7.89861 18.3333 9.16667C18.3333 10.4347 18.0927 11.6264 17.6115 12.7417C17.1302 13.8569 16.4771 14.8271 15.6521 15.6521C14.8271 16.4771 13.8569 17.1302 12.7417 17.6115C11.6264 18.0927 10.4347 18.3333 9.16667 18.3333V18.3333M9.16667 16.5C11.2139 16.5 12.9479 15.7896 14.3687 14.3687C15.7896 12.9479 16.5 11.2139 16.5 9.16667C16.5 7.11944 15.7896 5.38542 14.3687 3.96458C12.9479 2.54375 11.2139 1.83333 9.16667 1.83333C7.11944 1.83333 5.38542 2.54375 3.96458 3.96458C2.54375 5.38542 1.83333 7.11944 1.83333 9.16667C1.83333 11.2139 2.54375 12.9479 3.96458 14.3687C5.38542 15.7896 7.11944 16.5 9.16667 16.5V16.5M9.16667 9.16667V9.16667V9.16667V9.16667V9.16667V9.16667V9.16667V9.16667V9.16667V9.16667"
                    fill="currentColor"
                  />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="font-plusJakartaSans text-3xl font-bold tracking-tight text-[#111D23]">
                {isLoadingVehicles ? '...' : totalTersedia}
              </span>
              <span className="rounded-full bg-[#DCFCE7] px-2.5 py-1 font-plusJakartaSans text-[11px] font-semibold text-[#15803D]">
                {pctTersedia}% Siap Sewa
              </span>
            </div>
            <div className="mt-3.5 h-1.5 w-full overflow-hidden rounded-full bg-[#E3F0F8]">
              <div
                className="h-full rounded-full bg-[#15803D]"
                style={{ width: `${pctTersedia}%` }}
              />
            </div>
          </div>

          {/* Card 3: Sedang Disewa */}
          <div className="flex flex-col justify-between rounded-xl border border-[#E3F0F8] bg-white p-5 shadow-xs transition-shadow hover:shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-plusJakartaSans text-[13px] font-medium text-[#47607E]">
                Sedang Disewa
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#DBEAFE] text-[#2563EB]">
                <svg
                  width="22"
                  height="11"
                  viewBox="0 0 22 11"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5.5 7.33333C4.99583 7.33333 4.56424 7.15382 4.20521 6.79479C3.84618 6.43576 3.66667 6.00417 3.66667 5.5C3.66667 4.99583 3.84618 4.56424 4.20521 4.20521C4.56424 3.84618 4.99583 3.66667 5.5 3.66667C6.00417 3.66667 6.43576 3.84618 6.79479 4.20521C7.15382 4.56424 7.33333 4.99583 7.33333 5.5C7.33333 6.00417 7.15382 6.43576 6.79479 6.79479C6.43576 7.15382 6.00417 7.33333 5.5 7.33333V7.33333M5.5 11C3.97222 11 2.67361 10.4653 1.60417 9.39583C0.534722 8.32639 0 7.02778 0 5.5C0 3.97222 0.534722 2.67361 1.60417 1.60417C2.67361 0.534722 3.97222 0 5.5 0C6.52361 0 7.45174 0.252083 8.28438 0.75625C9.11701 1.26042 9.77778 1.925 10.2667 2.75H18.3333L21.0833 5.5L16.9583 9.625L15.125 8.25L13.2917 9.625L11.3438 8.25H10.2667C9.77778 9.075 9.11701 9.73958 8.28438 10.2437C7.45174 10.7479 6.52361 11 5.5 11V11M5.5 9.16667C6.35556 9.16667 7.10799 8.90694 7.75729 8.3875C8.4066 7.86806 8.83819 7.21111 9.05208 6.41667H11.9167L13.2458 7.35625L15.125 5.95833L16.7521 7.21875L18.4708 5.5L17.5542 4.58333H9.05208C8.83819 3.78889 8.4066 3.13194 7.75729 2.6125C7.10799 2.09306 6.35556 1.83333 5.5 1.83333C4.49167 1.83333 3.62847 2.19236 2.91042 2.91042C2.19236 3.62847 1.83333 4.49167 1.83333 5.5C1.83333 6.50833 2.19236 7.37153 2.91042 8.08958C3.62847 8.80764 4.49167 9.16667 5.5 9.16667V9.16667"
                    fill="currentColor"
                  />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="font-plusJakartaSans text-3xl font-bold tracking-tight text-[#111D23]">
                {isLoadingVehicles ? '...' : totalDisewa}
              </span>
              <span className="rounded-full bg-[#DBEAFE] px-2.5 py-1 font-plusJakartaSans text-[11px] font-semibold text-[#2563EB]">
                {pctDisewa}% Disewa
              </span>
            </div>
            <div className="mt-3.5 h-1.5 w-full overflow-hidden rounded-full bg-[#E3F0F8]">
              <div
                className="h-full rounded-full bg-[#2563EB]"
                style={{ width: `${pctDisewa}%` }}
              />
            </div>
          </div>

          {/* Card 4: Maintenance */}
          <div className="flex flex-col justify-between rounded-xl border border-[#E3F0F8] bg-white p-5 shadow-xs transition-shadow hover:shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-plusJakartaSans text-[13px] font-medium text-[#47607E]">
                Maintenance
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FEF3C7] text-[#B45309]">
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 17 17"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12.9708 16.225L7.425 10.6333C7.11944 10.7556 6.81007 10.8472 6.49687 10.9083C6.18368 10.9694 5.85139 11 5.5 11C3.97222 11 2.67361 10.4653 1.60417 9.39583C0.534722 8.32639 0 7.02778 0 5.5C0 4.95 0.0763889 4.42674 0.229167 3.93021C0.381944 3.43368 0.595833 2.96389 0.870833 2.52083L4.21667 5.86667L5.86667 4.21667L2.52083 0.870833C2.96389 0.595833 3.43368 0.381944 3.93021 0.229167C4.42674 0.0763889 4.95 0 5.5 0C7.02778 0 8.32639 0.534722 9.39583 1.60417C10.4653 2.67361 11 3.97222 11 5.5C11 5.85139 10.9694 6.18368 10.9083 6.49687C10.8472 6.81007 10.7556 7.11944 10.6333 7.425L16.225 12.9708C16.4083 13.1542 16.5 13.3757 16.5 13.6354C16.5 13.8951 16.4083 14.1167 16.225 14.3L14.3 16.225C14.1167 16.4083 13.8951 16.5 13.6354 16.5C13.3757 16.5 13.1542 16.4083 12.9708 16.225V16.225M13.6354 14.2771L14.2542 13.6583L8.3875 7.79167C8.6625 7.48611 8.86111 7.1309 8.98333 6.72604C9.10556 6.32118 9.16667 5.9125 9.16667 5.5C9.16667 4.58333 8.87257 3.78507 8.28438 3.10521C7.69618 2.42535 6.96667 2.01667 6.09583 1.87917L7.79167 3.575C7.975 3.75833 8.06667 3.97222 8.06667 4.21667C8.06667 4.46111 7.975 4.675 7.79167 4.85833L4.85833 7.79167C4.675 7.975 4.46111 8.06667 4.21667 8.06667C3.97222 8.06667 3.75833 7.975 3.575 7.79167L1.87917 6.09583C2.01667 6.96667 2.42535 7.69618 3.10521 8.28438C3.78507 8.87257 4.58333 9.16667 5.5 9.16667C5.89722 9.16667 6.29444 9.10556 6.69167 8.98333C7.08889 8.86111 7.44792 8.67014 7.76875 8.41042L13.6354 14.2771V14.2771M8.06667 8.06667V8.06667V8.06667V8.06667V8.06667V8.06667V8.06667V8.06667V8.06667V8.06667V8.06667V8.06667V8.06667V8.06667V8.06667V8.06667V8.06667V8.06667V8.06667"
                    fill="currentColor"
                  />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="font-plusJakartaSans text-3xl font-bold tracking-tight text-[#111D23]">
                {isLoadingVehicles ? '...' : totalMaintenance}
              </span>
              <span className="rounded-full bg-[#FEF3C7] px-2.5 py-1 font-plusJakartaSans text-[11px] font-semibold text-[#B45309]">
                {pctMaintenance}% Perlu Servis
              </span>
            </div>
            <div className="mt-3.5 h-1.5 w-full overflow-hidden rounded-full bg-[#E3F0F8]">
              <div
                className="h-full rounded-full bg-[#B45309]"
                style={{ width: `${pctMaintenance}%` }}
              />
            </div>
          </div>
        </div>

        {/* 2 Kolom Layout Utama: Kondisi Kendaraan & Maintenance Terdekat */}
        <div className="grid w-full grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,1fr)] xl:gap-8">
          {/* Kolom Kiri: Kondisi Kendaraan */}
          <div className="flex min-w-0 flex-col items-start gap-4">
            {/* Header Section & Filter */}
            <div className="flex w-full flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-plusJakartaSans text-lg font-semibold tracking-tight text-[#111D23] sm:text-xl">
                  Kondisi Kendaraan
                </h3>
                <p className="font-plusJakartaSans text-xs text-[#47607E] sm:text-[13px]">
                  Status kelaikan dan riwayat operasional armada terkini.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  aria-pressed={activeVehicleStatus === 'all'}
                  onClick={() => setActiveVehicleStatus('all')}
                  className={`cursor-pointer rounded-lg px-3 py-1.5 font-plusJakartaSans text-xs font-semibold transition-colors sm:text-[13px] ${activeVehicleStatus === 'all'
                    ? 'bg-white text-[#111D23] shadow-xs'
                    : 'bg-[#E3F0F8] text-[#47607E] hover:bg-[#D4E6F2]'
                    }`}
                >
                  Semua ({totalKendaraan})
                </button>
                <button
                  type="button"
                  aria-pressed={activeVehicleStatus === 'available'}
                  onClick={() => setActiveVehicleStatus('available')}
                  className={`cursor-pointer rounded-lg px-3 py-1.5 font-plusJakartaSans text-xs font-semibold transition-colors sm:text-[13px] ${activeVehicleStatus === 'available'
                    ? 'bg-white text-[#111D23] shadow-xs'
                    : 'bg-[#E3F0F8] text-[#47607E] hover:bg-[#D4E6F2]'
                    }`}
                >
                  Tersedia ({totalTersedia})
                </button>
                <button
                  type="button"
                  aria-pressed={activeVehicleStatus === 'rented'}
                  onClick={() => setActiveVehicleStatus('rented')}
                  className={`cursor-pointer rounded-lg px-3 py-1.5 font-plusJakartaSans text-xs font-semibold transition-colors sm:text-[13px] ${activeVehicleStatus === 'rented'
                    ? 'bg-white text-[#111D23] shadow-xs'
                    : 'bg-[#E3F0F8] text-[#47607E] hover:bg-[#D4E6F2]'
                    }`}
                >
                  Disewa ({totalDisewa})
                </button>
                <button
                  type="button"
                  aria-pressed={activeVehicleStatus === 'maintenance'}
                  onClick={() => setActiveVehicleStatus('maintenance')}
                  className={`cursor-pointer rounded-lg px-3 py-1.5 font-plusJakartaSans text-xs font-semibold transition-colors sm:text-[13px] ${activeVehicleStatus === 'maintenance'
                      ? 'bg-white text-[#111D23] shadow-xs'
                      : 'bg-[#E3F0F8] text-[#47607E] hover:bg-[#D4E6F2]'
                    }`}
                >
                  Maintenance ({totalMaintenance})
                </button>
                <Link
                  to="/kendaraan"
                  className="ml-1 flex items-center gap-1 font-plusJakartaSans text-xs font-semibold text-[#005C55] transition-colors hover:text-[#0F766E] sm:text-[13px]"
                >
                  <span>Lihat Semua</span>
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

            {/* Loading / Empty / Grid Kendaraan */}
            {isLoadingVehicles ? (
              <div className="flex h-56 w-full flex-col items-center justify-center rounded-xl border border-[#DDEAF2] bg-white">
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
                <p className="mt-3 font-plusJakartaSans text-xs text-[#47607E]">
                  Memuat data armada dari backend...
                </p>
              </div>
            ) : filteredVehicles.length === 0 ? (
              <div className="flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-[#C7D6E3] bg-white p-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E9F6FD] text-[#0F766E]">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 9h18M9 21V9" />
                  </svg>
                </div>
                <h4 className="mt-3 font-plusJakartaSans text-sm font-bold text-[#111D23] sm:text-base">
                  {vehicles.length === 0
                    ? 'Belum Ada Armada Terdaftar'
                    : 'Tidak Ada Kendaraan Sesuai Filter'}
                </h4>
                <p className="mt-1 max-w-sm font-plusJakartaSans text-xs text-[#47607E]">
                  {vehicles.length === 0
                    ? 'Database armada masih kosong. Mulai dengan menambahkan kendaraan rental pertama Anda.'
                    : 'Coba pilih tab status lain atau hapus kata kunci pencarian.'}
                </p>
                <Link
                  to="/kendaraan"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#0F766E] px-4 py-2 font-plusJakartaSans text-xs font-semibold text-white shadow-xs hover:bg-[#0D655E]"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6 1v10M1 6h10"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span>Buka Menu Kendaraan</span>
                </Link>
              </div>
            ) : (
              <div className="grid w-full grid-cols-1 items-stretch gap-5 lg:grid-cols-3">
                {filteredVehicles.slice(0, 6).map((vehicle) => {
                  const photoUrl =
                    vehicle.vehicle_photos && vehicle.vehicle_photos.length > 0
                      ? vehicle.vehicle_photos[0].photo_url
                      : DEFAULT_FALLBACK_IMAGE

                  const isAvailable =
                    vehicle.status === 'Available' || vehicle.status === 'Tersedia'
                  const isRented =
                    vehicle.status === 'Rented' || vehicle.status === 'Disewa'
                  const isMaint =
                    vehicle.status === 'In Maintenance' ||
                    vehicle.status === 'Maintenance'

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
                  const detailUrl = `/kendaraan/detail?id=${vehicle.vehicle_id}`

                  return (
                    <div
                      key={vehicle.vehicle_id}
                      className="flex flex-col justify-between overflow-hidden rounded-xl border border-[#E3F0F8] bg-white p-4 shadow-xs transition-shadow hover:shadow-md"
                    >
                      <div className="flex flex-col gap-3">
                        {/* Gambar Unit */}
                        <div className="relative flex h-40 w-full items-center justify-center overflow-hidden rounded-lg bg-[#E3F0F8] sm:h-44">
                          <img
                            src={photoUrl}
                            alt={vehicleName}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = DEFAULT_FALLBACK_IMAGE
                            }}
                          />
                          <div className="absolute right-2.5 top-2.5 shadow-xs">
                            <StatusBadge
                              status={statusType}
                              label={statusLabel}
                              size="sm"
                            />
                          </div>
                          <span className="absolute bottom-2.5 left-2.5 rounded bg-white/95 px-2 py-0.5 font-liberationMono text-[11px] font-bold tracking-wider text-[#111D23] shadow-xs">
                            {vehicle.plat_nomor}
                          </span>
                        </div>

                        {/* Info Utama */}
                        <div>
                          <h4 className="font-plusJakartaSans text-base font-semibold leading-snug text-[#111D23]">
                            {vehicleName}
                          </h4>
                          <p className="mt-0.5 font-plusJakartaSans text-[11px] font-medium text-[#47607E]">
                            {vehicle.tahun ? `Tahun ${vehicle.tahun}` : ''}
                            {vehicle.warna ? ` • Warna ${vehicle.warna}` : ''}
                          </p>
                        </div>

                        {/* Detail Status Info */}
                        {isAvailable && (
                          <div className="flex flex-col gap-1.5 pt-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="flex items-center gap-1 font-plusJakartaSans text-[13px] text-[#3E4947]">
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 14 14"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="text-[#15803D]"
                                >
                                  <path
                                    d="M5.73333 9.73333L10.4333 5.03333L9.5 4.1L5.73333 7.86667L3.83333 5.96667L2.9 6.9L5.73333 9.73333V9.73333M6.66667 13.3333C5.74444 13.3333 4.87778 13.1583 4.06667 12.8083C3.25556 12.4583 2.55 11.9833 1.95 11.3833C1.35 10.7833 0.875 10.0778 0.525 9.26667C0.175 8.45555 0 7.58889 0 6.66667C0 5.74444 0.175 4.87778 0.525 4.06667C0.875 3.25556 1.35 2.55 1.95 1.95C2.55 1.35 3.25556 0.875 4.06667 0.525C4.87778 0.175 5.74444 0 6.66667 0C7.58889 0 8.45555 0.175 9.26667 0.525C10.0778 0.875 10.7833 1.35 11.3833 1.95C11.9833 2.55 12.4583 3.25556 12.8083 4.06667C13.1583 4.87778 13.3333 5.74444 13.3333 6.66667C13.3333 7.58889 13.1583 8.45555 12.8083 9.26667C12.4583 10.0778 11.9833 10.7833 11.3833 11.3833C10.7833 11.9833 10.0778 12.4583 9.26667 12.8083C8.45555 13.1583 7.58889 13.3333 6.66667 13.3333V13.3333M6.66667 12C8.15556 12 9.41667 11.4833 10.45 10.45C11.4833 9.41667 12 8.15556 12 6.6C12 5.17778 11.4833 3.91667 10.45 2.88333C9.41667 1.85 8.15556 1.33333 6.66667 1.33333C5.17778 1.33333 3.91667 1.85 2.88333 2.88333C1.85 3.91667 1.33333 5.17778 1.33333 6.66667C1.33333 8.15556 1.85 9.41667 2.88333 10.45C3.91667 11.4833 5.17778 12 6.66667 12V12M6.66667 6.66667V6.66667V6.66667V6.66667V6.66667V6.66667V6.66667V6.66667V6.66667V6.66667"
                                    fill="currentColor"
                                  />
                                </svg>
                                Siap Direntalkan
                              </span>
                              <span className="font-plusJakartaSans font-bold text-[#0F766E]">
                                Rp {Number(vehicle.tarif_per_hari || 0).toLocaleString('id-ID')}
                              </span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E3F0F8]">
                              <div
                                className="h-full rounded-full bg-[#15803D]"
                                style={{ width: '100%' }}
                              />
                            </div>
                            <p className="mt-1 flex items-center gap-1 font-plusJakartaSans text-[11px] text-[#47607E]">
                              STNK: {vehicle.nomor_stnk || '-'}
                            </p>
                          </div>
                        )}

                        {isRented && (
                          <div className="flex flex-col gap-1.5 rounded-lg bg-[#E3F0F8] p-2.5">
                            <div className="flex items-center justify-between font-plusJakartaSans text-xs font-semibold text-[#111D23]">
                              <span>Status Unit</span>
                              <span className="text-[#2563EB]">Sedang On-Trip</span>
                            </div>
                            <div className="flex items-center justify-between font-plusJakartaSans text-[11px] text-[#47607E]">
                              <span>Tarif Sewa:</span>
                              <span className="font-bold text-[#111D23]">
                                Rp {Number(vehicle.tarif_per_hari || 0).toLocaleString('id-ID')} / hari
                              </span>
                            </div>
                          </div>
                        )}

                        {isMaint && (
                          <div className="flex flex-col gap-1.5 pt-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="flex items-center gap-1 font-plusJakartaSans text-[13px] text-[#B45309]">
                                <svg
                                  width="15"
                                  height="13"
                                  viewBox="0 0 15 13"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="text-[#B45309]"
                                >
                                  <path
                                    d="M0 12.6667L7.33333 0L14.6667 12.6667H0V12.6667M2.3 11.3333H12.3667L7.33333 2.66667L2.3 11.3333V11.3333M7.33333 10.6667C7.52222 10.6667 7.68056 10.6028 7.80833 10.475C7.93611 10.3472 8 10.1889 8 10C8 9.81111 7.93611 9.65278 7.80833 9.525C7.68056 9.39722 7.52222 9.33333 7.33333 9.33333C7.14444 9.33333 6.98611 9.39722 6.85833 9.525C6.73056 9.65278 6.66667 9.81111 6.66667 10C6.66667 10.1889 6.73056 10.3472 6.85833 10.475C6.98611 10.6028 7.14444 10.6667 7.33333 10.6667V10.6667M6.66667 8.66667H8V5.33333H6.66667V8.66667V8.66667M7.33333 7V7V7V7V7"
                                    fill="currentColor"
                                  />
                                </svg>
                                Sedang Dalam Perbaikan
                              </span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E3F0F8]">
                              <div
                                className="h-full rounded-full bg-[#B45309]"
                                style={{ width: '45%' }}
                              />
                            </div>
                            <p className="mt-1 flex items-center gap-1 font-plusJakartaSans text-[11px] text-[#B45309]">
                              Unit belum dapat disewakan
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Bottom Action Footer */}
                      <div className="mt-4 flex items-center justify-between border-t border-[#E3F0F8] pt-3.5">
                        <div className="flex items-center gap-1.5 font-plusJakartaSans text-[11px] font-medium text-[#47607E]">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${isAvailable
                                ? 'bg-[#15803D]'
                                : isRented
                                  ? 'bg-[#2563EB]'
                                  : 'bg-[#B45309]'
                              }`}
                          />
                          <span className="truncate max-w-[130px]">
                            {vehicle.deskripsi || 'Depot Pusat'}
                          </span>
                        </div>

                        <Link
                          to={detailUrl}
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
                  )
                })}
              </div>
            )}

            {/* Banner Efisiensi Bahan Bakar */}
            <div className="flex w-full flex-col items-start justify-between gap-3 rounded-xl bg-[#E3F0F8] p-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#005C55] shadow-xs">
                  <svg
                    width="24"
                    height="19"
                    viewBox="0 0 24 19"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M9.85833 13.4167C10.325 13.8833 10.9278 14.1118 11.6667 14.1021C12.4056 14.0924 12.95 13.825 13.3 13.3L19.8333 3.5L10.0333 10.0333C9.50833 10.3833 9.23125 10.9181 9.20208 11.6375C9.17292 12.3569 9.39167 12.95 9.85833 13.4167V13.4167M11.6667 0C12.8139 0 13.9174 0.160417 14.9771 0.48125C16.0368 0.802083 17.0333 1.28333 17.9667 1.925L15.75 3.325C15.1083 2.99444 14.4424 2.74653 13.7521 2.58125C13.0618 2.41597 12.3667 2.33333 11.6667 2.33333C9.08056 2.33333 6.87847 3.24236 5.06042 5.06042C3.24236 6.87847 2.33333 9.08056 2.33333 11.6667C2.33333 12.4833 2.44514 13.2903 2.66875 14.0875C2.89236 14.8847 3.20833 15.6333 3.61667 16.3333H19.7167C20.1639 15.5944 20.4896 14.8264 20.6938 14.0292C20.8979 13.2319 21 12.4056 21 11.55C21 10.85 20.9174 10.1694 20.7521 9.50833C20.5868 8.84722 20.3389 8.20556 20.0083 7.58333L21.4083 5.36667C21.9917 6.28056 22.4535 7.25278 22.7938 8.28333C23.134 9.31389 23.3139 10.3833 23.3333 11.4917C23.3528 12.6 23.2264 13.6597 22.9542 14.6708C22.6819 15.6819 22.2833 16.6444 21.7583 17.5583C21.5444 17.9083 21.2528 18.1806 20.8833 18.375C20.5139 18.5694 20.125 18.6667 19.7167 18.6667H3.61667C3.20833 18.6667 2.81944 18.5694 2.45 18.375C2.08056 18.1806 1.78889 17.9083 1.575 17.5583C1.06944 16.6833 0.680556 15.7549 0.408333 14.7729C0.136111 13.791 0 12.7556 0 11.6667C0 10.0528 0.30625 8.54097 0.91875 7.13125C1.53125 5.72153 2.36736 4.48681 3.42708 3.42708C4.48681 2.36736 5.72639 1.53125 7.14583 0.91875C8.56528 0.30625 10.0722 0 11.6667 0V0M11.8708 9.12917V9.12917V9.12917V9.12917V9.12917V9.12917V9.12917V9.12917V9.12917V9.12917V9.12917V9.12917V9.12917V9.12917V9.12917V9.12917"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-plusJakartaSans text-sm font-semibold text-[#111D23] sm:text-base">
                    Efisiensi Bahan Bakar & Jarak Tempuh Armada
                  </h4>
                  <p className="font-plusJakartaSans text-[11px] text-[#47607E] sm:text-xs">
                    Total armada aktif: {totalKendaraan} unit • Siap sewa: {totalTersedia} unit
                  </p>
                </div>
              </div>
              <div className="shrink-0 rounded-lg bg-white px-3 py-1.5 shadow-xs">
                <span className="font-plusJakartaSans text-xs font-semibold text-[#005C55]">
                  {pctDisewa}% Utilisasi Armada
                </span>
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Maintenance Terdekat & Staf */}
          <div className="flex min-w-0 flex-col items-start gap-4">
            <div className="flex w-full items-center justify-between">
              <div>
                <h3 className="font-plusJakartaSans text-lg font-semibold tracking-tight text-[#111D23] sm:text-xl">
                  Maintenance Terdekat
                </h3>
                <p className="font-plusJakartaSans text-xs text-[#47607E] sm:text-[13px]">
                  Jadwal perawatan pencegahan unit armada.
                </p>
              </div>
              <Link
                to="/kendaraan"
                className="flex items-center gap-1 font-plusJakartaSans text-xs font-semibold text-[#005C55] transition-colors hover:text-[#0F766E] sm:text-[13px]"
              >
                <span>Kelola</span>
                <svg
                  width="5"
                  height="8"
                  viewBox="0 0 5 8"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3.06667 4L0 0.933333L0.933333 0L4.93333 4L0.933333 8L0 7.06667L3.06667 4V4"
                    fill="currentColor"
                  />
                </svg>
              </Link>
            </div>

            {/* Card Container Maintenance */}
            <div className="flex w-full flex-col items-start gap-3.5 rounded-xl border border-[#E3F0F8] bg-white p-4 shadow-xs">
              {/* Unit dari database yang berstatus maintenance */}
              {maintenanceList.length > 0 &&
                maintenanceList.map((mUnit) => (
                  <div
                    key={mUnit.vehicle_id}
                    className="flex w-full flex-col gap-2 rounded-lg bg-[#FEF3C7]/40 p-3.5 border border-[#FDE68A]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FEF3C7] text-[#B45309]">
                          <svg
                            width="17"
                            height="18"
                            viewBox="0 0 17 18"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M14.0417 17.4792C13.9306 17.4792 13.8264 17.4618 13.7292 17.4271C13.6319 17.3924 13.5417 17.3333 13.4583 17.25L9.20833 13C9.125 12.9167 9.06597 12.8264 9.03125 12.7292C8.99653 12.6319 8.97917 12.5278 8.97917 12.4167C8.97917 12.3056 8.99653 12.2014 9.03125 12.1042C9.06597 12.0069 9.125 11.9167 9.20833 11.8333L10.9792 10.0625C11.0625 9.97917 11.1528 9.92014 11.25 9.88542C11.3472 9.85069 11.4514 9.83333 11.5625 9.83333C11.6736 9.83333 11.7778 9.85069 11.875 9.88542C11.9722 9.92014 12.0625 9.97917 12.1458 10.0625L16.3958 14.3125C16.4792 14.3958 16.5382 14.4861 16.5729 14.5833C16.6076 14.6806 16.625 14.7847 16.625 14.8958C16.625 15.0069 16.6076 15.1111 16.5729 15.2083C16.5382 15.3056 16.4792 15.3958 16.3958 15.4792L14.625 17.25C14.5417 17.3333 14.4514 17.3924 14.3542 17.4271C14.2569 17.4618 14.1528 17.4792 14.0417 17.4792V17.4792M14.0417 15.5L14.6458 14.8958L11.5833 11.8333L10.9792 12.4375L14.0417 15.5V15.5M2.60417 17.5C2.49306 17.5 2.38542 17.4792 2.28125 17.4375C2.17708 17.3958 2.08333 17.3333 2 17.25L0.25 15.5C0.166667 15.4167 0.104167 15.3229 0.0625 15.2188C0.0208333 15.1146 0 15.0069 0 14.8958C0 14.7847 0.0208333 14.6806 0.0625 14.5833C0.104167 14.4861 0.166667 14.3958 0.25 14.3125L4.66667 9.89583H6.4375L7.14583 9.1875L3.70833 5.75H2.52083L0 3.22917L2.35417 0.875L4.875 3.39583V4.58333L8.3125 8.02083L10.7292 5.60417L9.83333 4.70833L11 3.54167H8.64583L8.0625 2.95833L11.0208 0L11.6042 0.583333V2.9375L12.7708 1.77083L15.7292 4.72917C15.9653 4.96528 16.1458 5.23264 16.2708 5.53125C16.3958 5.82986 16.4583 6.14583 16.4583 6.47917C16.4583 6.8125 16.3958 7.13194 16.2708 7.4375C16.1458 7.74306 15.9653 8.01389 15.7292 8.25L13.9583 6.47917L12.7917 7.64583L11.9167 6.77083L7.60417 11.0833V12.8333L3.1875 17.25C3.10417 17.3333 3.01389 17.3958 2.91667 17.4375C2.81944 17.4792 2.71528 17.5 2.60417 17.5V17.5M2.60417 15.5L6.14583 11.9583V11.3542H5.54167L2 14.8958L2.60417 15.5V15.5M2.60417 15.5L2 14.8958V14.8958L2.3125 15.1875L2.60417 15.5V15.5V15.5M14.0417 15.5V15.5L14.6458 14.8958V14.8958L14.0417 15.5V15.5"
                              fill="currentColor"
                            />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-plusJakartaSans text-sm font-semibold text-[#111D23]">
                            {mUnit.merk} {mUnit.tipe}
                          </h4>
                          <p className="font-plusJakartaSans text-[11px] font-medium text-[#47607E]">
                            {mUnit.plat_nomor}
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full bg-[#FEF3C7] px-2.5 py-1 font-plusJakartaSans text-[11px] font-bold text-[#B45309]">
                        Perlu Servis
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-[#DDEAF2]/60 pt-2 text-xs">
                      <div className="flex items-center gap-1.5 font-plusJakartaSans text-[12px] text-[#111D23]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#B45309]" />
                        <span className="truncate max-w-[200px]">
                          {mUnit.deskripsi || 'Pemeriksaan rutin bengkel'}
                        </span>
                      </div>
                      <Link
                        to={`/kendaraan/detail?id=${mUnit.vehicle_id}`}
                        className="font-plusJakartaSans text-[11px] font-semibold text-[#0F766E] hover:underline"
                      >
                        Lihat Unit
                      </Link>
                    </div>
                  </div>
                ))}

              {/* Item Terjadwal 1 */}
              <div className="flex w-full flex-col gap-2 rounded-lg bg-[#E9F6FD] p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FEF3C7] text-[#B45309]">
                      <svg
                        width="17"
                        height="18"
                        viewBox="0 0 17 18"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M14.0417 17.4792C13.9306 17.4792 13.8264 17.4618 13.7292 17.4271C13.6319 17.3924 13.5417 17.3333 13.4583 17.25L9.20833 13C9.125 12.9167 9.06597 12.8264 9.03125 12.7292C8.99653 12.6319 8.97917 12.5278 8.97917 12.4167C8.97917 12.3056 8.99653 12.2014 9.03125 12.1042C9.06597 12.0069 9.125 11.9167 9.20833 11.8333L10.9792 10.0625C11.0625 9.97917 11.1528 9.92014 11.25 9.88542C11.3472 9.85069 11.4514 9.83333 11.5625 9.83333C11.6736 9.83333 11.7778 9.85069 11.875 9.88542C11.9722 9.92014 12.0625 9.97917 12.1458 10.0625L16.3958 14.3125C16.4792 14.3958 16.5382 14.4861 16.5729 14.5833C16.6076 14.6806 16.625 14.7847 16.625 14.8958C16.625 15.0069 16.6076 15.1111 16.5729 15.2083C16.5382 15.3056 16.4792 15.3958 16.3958 15.4792L14.625 17.25C14.5417 17.3333 14.4514 17.3924 14.3542 17.4271C14.2569 17.4618 14.1528 17.4792 14.0417 17.4792V17.4792M14.0417 15.5L14.6458 14.8958L11.5833 11.8333L10.9792 12.4375L14.0417 15.5V15.5M2.60417 17.5C2.49306 17.5 2.38542 17.4792 2.28125 17.4375C2.17708 17.3958 2.08333 17.3333 2 17.25L0.25 15.5C0.166667 15.4167 0.104167 15.3229 0.0625 15.2188C0.0208333 15.1146 0 15.0069 0 14.8958C0 14.7847 0.0208333 14.6806 0.0625 14.5833C0.104167 14.4861 0.166667 14.3958 0.25 14.3125L4.66667 9.89583H6.4375L7.14583 9.1875L3.70833 5.75H2.52083L0 3.22917L2.35417 0.875L4.875 3.39583V4.58333L8.3125 8.02083L10.7292 5.60417L9.83333 4.70833L11 3.54167H8.64583L8.0625 2.95833L11.0208 0L11.6042 0.583333V2.9375L12.7708 1.77083L15.7292 4.72917C15.9653 4.96528 16.1458 5.23264 16.2708 5.53125C16.3958 5.82986 16.4583 6.14583 16.4583 6.47917C16.4583 6.8125 16.3958 7.13194 16.2708 7.4375C16.1458 7.74306 15.9653 8.01389 15.7292 8.25L13.9583 6.47917L12.7917 7.64583L11.9167 6.77083L7.60417 11.0833V12.8333L3.1875 17.25C3.10417 17.3333 3.01389 17.3958 2.91667 17.4375C2.81944 17.4792 2.71528 17.5 2.60417 17.5V17.5M2.60417 15.5L6.14583 11.9583V11.3542H5.54167L2 14.8958L2.60417 15.5V15.5M2.60417 15.5L2 14.8958V14.8958L2.3125 15.1875L2.60417 15.5V15.5V15.5M14.0417 15.5V15.5L14.6458 14.8958V14.8958L14.0417 15.5V15.5"
                          fill="currentColor"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-plusJakartaSans text-sm font-semibold text-[#111D23]">
                        Jadwal Servis Berkala
                      </h4>
                      <p className="font-plusJakartaSans text-[11px] font-medium text-[#47607E]">
                        Bengkel Rekanan Resmi
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-[#FEF3C7] px-2.5 py-1 font-plusJakartaSans text-[11px] font-bold text-[#B45309]">
                    2 hari lagi
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-[#DDEAF2]/60 pt-2 text-xs">
                  <div className="flex items-center gap-1.5 font-plusJakartaSans text-[12px] text-[#111D23]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#B45309]" />
                    <span>Servis rem & penggantian kampas</span>
                  </div>
                  <span className="font-plusJakartaSans text-[11px] font-medium text-[#47607E]">
                    26 Okt
                  </span>
                </div>
              </div>

              {/* Item Terjadwal 2 */}
              <div className="flex w-full flex-col gap-2 rounded-lg bg-[#E9F6FD] p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E3F0F8] text-[#47607E]">
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 15 15"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M6.66667 15V10H8.33333V11.6667H15V13.3333H8.33333V15H6.66667V15M0 13.3333V11.6667H5V13.3333H0V13.3333M3.33333 10V8.33333H0V6.66667H3.33333V5H5V10H3.33333V10M6.66667 8.33333V6.66667H15V8.33333H6.66667V8.33333M10 5V0H11.6667V1.66667H15V3.33333H11.6667V5H10V5M0 3.33333V1.66667H8.33333V3.33333H0V3.33333"
                          fill="currentColor"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-plusJakartaSans text-sm font-semibold text-[#111D23]">
                        Ganti Oli Rutin
                      </h4>
                      <p className="font-plusJakartaSans text-[11px] font-medium text-[#47607E]">
                        Perawatan 10.000 KM
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-[#DDEAF2] px-2.5 py-1 font-plusJakartaSans text-[11px] font-bold text-[#47607E]">
                    Minggu depan
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-[#DDEAF2]/60 pt-2 text-xs">
                  <div className="flex items-center gap-1.5 font-plusJakartaSans text-[12px] text-[#111D23]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#47607E]" />
                    <span>Servis oli mesin & tune-up</span>
                  </div>
                  <span className="font-plusJakartaSans text-[11px] font-medium text-[#47607E]">
                    09 Nov
                  </span>
                </div>
              </div>

              {/* Tombol ke menu Kendaraan */}
              <Link
                to="/kendaraan"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#E3F0F8] py-2.5 font-plusJakartaSans text-xs font-semibold text-[#111D23] transition-colors hover:bg-[#D4E6F2] sm:text-[13px]"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 15 15"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6.75 11.25H8.25V8.25H11.25V6.75H8.25V3.75H6.75V6.75H3.75V8.25H6.75V11.25V11.25M7.5 15C6.4625 15 5.4875 14.8031 4.575 14.4094C3.6625 14.0156 2.86875 13.4812 2.19375 12.8062C1.51875 12.1312 0.984375 11.3375 0.590625 10.425C0.196875 9.5125 0 8.5375 0 7.5C0 6.4625 0.196875 5.4875 0.590625 4.575C0.984375 3.6625 1.51875 2.86875 2.19375 2.19375C2.86875 1.51875 3.6625 0.984375 4.575 0.590625C5.4875 0.196875 6.4625 0 7.5 0C8.5375 0 9.5125 0.196875 10.425 0.590625C11.3375 0.984375 12.1312 1.51875 12.8062 2.19375C13.4812 2.86875 14.0156 3.6625 14.4094 4.575C14.8031 5.4875 15 6.4625 15 7.5C15 8.5375 14.8031 9.5125 14.4094 10.425C14.0156 11.3375 13.4812 12.1312 12.8062 12.8062C12.1312 13.4812 11.3375 14.0156 10.425 14.4094C9.5125 14.8031 8.5375 15 7.5 15V15M7.5 13.5C9.175 13.5 10.5938 12.9188 11.7563 11.7563C12.9188 10.5938 13.5 9.175 13.5 7.5C13.5 5.825 12.9188 4.40625 11.7563 3.24375C10.5938 2.08125 9.175 1.5 7.5 1.5C5.825 1.5 4.40625 2.08125 3.24375 3.24375C2.08125 4.40625 1.5 5.825 1.5 7.5C1.5 9.175 2.08125 10.5938 3.24375 11.7563C4.40625 12.9188 5.825 13.5 7.5 13.5V13.5M7.5 7.5V7.5V7.5V7.5V7.5V7.5V7.5V7.5V7.5V7.5"
                    fill="currentColor"
                  />
                </svg>
                <span>Kelola Status Armada</span>
              </Link>
            </div>

            {/* Tips Card */}
            <div className="flex w-full items-start gap-3 rounded-xl bg-[#0F766E] p-4 text-white shadow-xs">
              <svg
                width="20"
                height="22"
                viewBox="0 0 15 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="shrink-0 text-[#A3FAEF]"
              >
                <path
                  d="M7.5 20C6.95 20 6.47917 19.8042 6.0875 19.4125C5.69583 19.0208 5.5 18.55 5.5 18H9.5C9.5 18.55 9.30417 19.0208 8.9125 19.4125C8.52083 19.8042 8.05 20 7.5 20V20M3.5 17V15H11.5V17H3.5V17M3.75 14C2.6 13.3167 1.6875 12.4 1.0125 11.25C0.3375 10.1 0 8.85 0 7.5C0 5.41667 0.729167 3.64583 2.1875 2.1875C3.64583 0.729167 5.41667 0 7.5 0C9.58333 0 11.3542 0.729167 12.8125 2.1875C14.2708 3.64583 15 5.41667 15 7.5C15 8.85 14.6625 10.1 13.9875 11.25C13.3125 12.4 12.4 13.3167 11.25 14H3.75V14M4.35 12H10.65C11.4 11.4667 11.9792 10.8083 12.3875 10.025C12.7958 9.24167 13 8.4 13 7.5C13 5.96667 12.4667 4.66667 11.4 3.6C10.3333 2.53333 9.03333 2 7.5 2C5.96667 2 4.66667 2.53333 3.6 3.6C2.53333 4.66667 2 5.96667 2 7.5C2 8.4 2.20417 9.24167 2.6125 10.025C3.02083 10.8083 3.6 11.4667 4.35 12V12M7.5 12V12V12V12V12V12V12V12V12V12"
                  fill="currentColor"
                />
              </svg>
              <div>
                <h4 className="font-plusJakartaSans text-xs font-semibold sm:text-[13px]">
                  Tips Kesiapan Armada Rental
                </h4>
                <p className="mt-1 font-plusJakartaSans text-[11px] leading-relaxed text-white/90">
                  Pastikan dokumen STNK dan foto fisik unit terbarui di sistem sebelum unit diserahkan kepada pelanggan sewa.
                </p>
              </div>
            </div>

            {/* Card: Staf & Pengguna Terdaftar (Data live dari GET /user) */}
            <div className="flex w-full flex-col items-start gap-3.5 rounded-xl border border-[#E3F0F8] bg-white p-4 shadow-xs">
              <div className="flex w-full items-center justify-between">
                <div>
                  <h4 className="font-plusJakartaSans text-sm font-bold text-[#111D23] sm:text-base">
                    Staf & Pengguna Terdaftar
                  </h4>
                  <p className="font-plusJakartaSans text-[11px] text-[#47607E]">
                    Akun terintegrasi database backend
                  </p>
                </div>
                <span className="rounded-full bg-[#E9F6FD] px-2.5 py-1 font-plusJakartaSans text-[11px] font-semibold text-[#0F766E]">
                  {userList.length} Pengguna
                </span>
              </div>

              {isLoadingUser ? (
                <div className="flex w-full items-center justify-center py-6 text-xs text-[#47607E]">
                  <span>Memuat data pengguna...</span>
                </div>
              ) : userList.length === 0 ? (
                <div className="w-full rounded-lg bg-[#F8FAFC] p-3 text-center text-xs text-[#6E7977]">
                  Belum ada data pengguna lainnya.
                </div>
              ) : (
                <div className="flex w-full flex-col gap-2">
                  {userList.map((item) => (
                    <div
                      key={item.user_id}
                      className="flex items-center justify-between rounded-lg bg-[#F8FAFC] p-2.5 transition-colors hover:bg-[#E9F6FD]"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0F766E] font-plusJakartaSans text-xs font-bold text-white shadow-xs">
                          {item.username ? item.username.charAt(0).toUpperCase() : 'U'}
                        </span>
                        <div className="flex flex-col min-w-0">
                          <p className="truncate font-plusJakartaSans text-xs font-bold text-[#111D23]">
                            {item.username}
                          </p>
                          <p className="truncate font-plusJakartaSans text-[11px] text-[#47607E]">
                            {item.phone ? item.phone : 'Tanpa nomor telepon'}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 font-plusJakartaSans text-[10px] font-semibold ${item.role === 'Admin'
                          ? 'bg-[#FEF3C7] text-[#B45309]'
                          : 'bg-[#DCFCE7] text-[#15803D]'
                          }`}
                      >
                        {item.role || 'Staff'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
