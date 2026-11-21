import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { getAuthToken } from '../services/vehicleApi'

function getStoredUser() {
  try {
    const raw = localStorage.getItem('user') || sessionStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export default function ProtectedRoute({ allowedRoles }) {
  const location = useLocation()
  const token = getAuthToken()
  const user = getStoredUser()

  if (!token) {
    return <Navigate to="/signin" state={{ from: location }} replace />
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user?.role
    if (!userRole || !allowedRoles.includes(userRole)) {
      return <Navigate to={userRole === 'Admin' ? '/admin/dashboard' : '/dashboard'} replace />
    }
  }

  return <Outlet />
}
