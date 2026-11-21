import { Link, useNavigate } from 'react-router-dom'

export default function AdminNavbar() {
  const navigate = useNavigate()

  function handleLogout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    sessionStorage.removeItem('access_token')
    sessionStorage.removeItem('refresh_token')
    sessionStorage.removeItem('user')
    navigate('/signin')
  }

  return (
    <header className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-[#DDEAF2] bg-white px-5 py-3 lg:px-8">
      <div>
        <p className="font-plusJakartaSans text-[11px] font-semibold tracking-[0.06em] text-[#6E7977]">JAGARODA / ADMIN</p>
        <p className="mt-0.5 font-plusJakartaSans text-sm font-bold text-[#17324D]">Panel pengelolaan</p>
      </div>
      <div className="flex items-center gap-3">
        <Link to="/dashboard" className="rounded-lg border border-[#0F766E] bg-white px-3 py-1.5 font-plusJakartaSans text-xs font-semibold text-[#0F766E] transition-colors hover:bg-[#F0FBF9]">
          Buka Panel Operasional
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg border border-[#FECDD3] bg-[#FFF1F2] px-3 py-1.5 font-plusJakartaSans text-xs font-semibold text-[#BA1A1A] transition-colors hover:bg-[#FEE2E2]"
        >
          Keluar
        </button>
      </div>
    </header>
  )
}
