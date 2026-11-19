const API_BASE = import.meta.env.VITE_API_BASE || 'https://jaga-roda-backend.vercel.app'

export function getAuthToken() {
  return localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || ''
}

export async function fetchVehicles({ limit = 50, offset = 0, status, search } = {}) {
  const params = new URLSearchParams()
  if (limit) params.set('limit', String(limit))
  if (offset) params.set('offset', String(offset))
  if (status && status !== 'Semua') {
    if (status === 'Tersedia' || status === 'Available') params.set('status', 'Available')
    else if (status === 'Disewa' || status === 'Rented') params.set('status', 'Rented')
    else if (status === 'Maintenance' || status === 'In Maintenance') params.set('status', 'In Maintenance')
    else params.set('status', status)
  }
  if (search && search.trim()) {
    params.set('search', search.trim())
  }

  const query = params.toString() ? `?${params.toString()}` : ''
  const response = await fetch(`${API_BASE}/vehicle${query}`)
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || errorData.message || 'Gagal mengambil data kendaraan')
  }
  return response.json()
}

export async function fetchVehicleById(vehicleId) {
  const response = await fetch(`${API_BASE}/vehicle/${vehicleId}`)
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || errorData.message || 'Kendaraan tidak ditemukan')
  }
  return response.json()
}

export async function createVehicle(payload) {
  const token = getAuthToken()
  const response = await fetch(`${API_BASE}/vehicle`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = data.detail
      ? typeof data.detail === 'string'
        ? data.detail
        : Array.isArray(data.detail)
          ? data.detail.map((err) => err.msg).join(', ')
          : 'Gagal menambahkan kendaraan'
      : data.message || 'Gagal menambahkan kendaraan'
    throw new Error(message)
  }
  return data
}

export async function updateVehicle(vehicleId, payload) {
  const token = getAuthToken()
  const response = await fetch(`${API_BASE}/vehicle/${vehicleId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = data.detail
      ? typeof data.detail === 'string'
        ? data.detail
        : Array.isArray(data.detail)
          ? data.detail.map((err) => err.msg).join(', ')
          : 'Gagal memperbarui kendaraan'
      : data.message || 'Gagal memperbarui kendaraan'
    throw new Error(message)
  }
  return data
}

export async function deleteVehicle(vehicleId) {
  const token = getAuthToken()
  const response = await fetch(`${API_BASE}/vehicle/${vehicleId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.detail || data.message || 'Gagal menghapus kendaraan')
  }
  return data
}

export async function uploadVehiclePhoto(vehicleId, file, photoType = 'Exterior') {
  const token = getAuthToken()
  const formData = new FormData()
  formData.append('file', file)
  formData.append('photo_type', photoType)

  const response = await fetch(`${API_BASE}/vehicle/${vehicleId}/photos`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.detail || data.message || 'Gagal mengunggah foto kendaraan')
  }
  return data
}

export async function deleteVehiclePhoto(vehicleId, photoId) {
  const token = getAuthToken()
  const response = await fetch(`${API_BASE}/vehicle/${vehicleId}/photos/${photoId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.detail || data.message || 'Gagal menghapus foto kendaraan')
  }
  return data
}
