/**
 * Google Maps URL builder & destination validator utility for JagaRoda.
 *
 * Visualizes rental booking destinations by opening Google Maps in standard ROADMAP (street map) view.
 * NOTE: JagaRoda does not have live GPS / telematics hardware; this utility
 * strictly works with customer rental destinations / booking locations,
 * NOT real-time vehicle GPS tracking.
 *
 * Requirements:
 * - Coordinates: opens roadmap view centered on destination latitude & longitude.
 *   Format: https://www.google.com/maps/@?api=1&map_action=map&center=LATITUDE,LONGITUDE&zoom=16&basemap=roadmap
 * - Address: opens roadmap view search for the destination address.
 *   Format: https://www.google.com/maps/search/?api=1&query=ADDRESS&basemap=roadmap
 * - Safe opening in a new tab without requiring Google Maps API keys.
 * - Graceful fallback when destination data is unavailable ("Lokasi tujuan belum tersedia").
 */

/**
 * Validates whether latitude and longitude are valid geographic coordinates.
 * @param {number|string} latitude
 * @param {number|string} longitude
 * @returns {boolean}
 */
export function isValidCoordinate(latitude, longitude) {
  if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
    return false
  }
  if (typeof latitude === 'string' && latitude.trim() === '') {
    return false
  }
  if (typeof longitude === 'string' && longitude.trim() === '') {
    return false
  }

  const lat = Number(latitude)
  const lng = Number(longitude)

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return false
  }

  // Latitude must be between -90 and 90, Longitude between -180 and 180
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return false
  }

  // Treat (0, 0) as invalid/uninitialized GPS (Null Island)
  if (lat === 0 && lng === 0) {
    return false
  }

  return true
}

/**
 * Extracts valid destination coordinates from a booking or vehicle object if present.
 * @param {object} item
 * @returns {{ lat: number, lng: number } | null}
 */
export function getDestinationCoordinates(item) {
  if (!item || typeof item !== 'object') return null

  const candidates = [
    [item.destinationCoordinates?.lat, item.destinationCoordinates?.lng],
    [item.destinationCoordinates?.latitude, item.destinationCoordinates?.longitude],
    [item.destinationLatitude, item.destinationLongitude],
    [item.booking?.destinationCoordinates?.lat, item.booking?.destinationCoordinates?.lng],
    [item.booking?.destinationLatitude, item.booking?.destinationLongitude],
    [item.coordinates?.latitude, item.coordinates?.longitude],
    [item.coordinates?.lat, item.coordinates?.lng],
    [item.latitude, item.longitude],
    [item.lat, item.lng],
  ]

  for (const [lat, lng] of candidates) {
    if (isValidCoordinate(lat, lng)) {
      return {
        lat: Number(lat),
        lng: Number(lng),
      }
    }
  }

  return null
}

/**
 * Extracts destination address or place name from a booking or vehicle object.
 * @param {object} item
 * @returns {string}
 */
export function getDestinationAddress(item) {
  if (!item || typeof item !== 'object') return ''

  if (typeof item.destination === 'string' && item.destination.trim()) {
    return item.destination.trim()
  }
  if (typeof item.destinationAddress === 'string' && item.destinationAddress.trim()) {
    return item.destinationAddress.trim()
  }
  if (typeof item.rentalDestination === 'string' && item.rentalDestination.trim()) {
    return item.rentalDestination.trim()
  }
  if (typeof item.booking?.destination === 'string' && item.booking.destination.trim()) {
    return item.booking.destination.trim()
  }
  if (typeof item.destination === 'object' && item.destination !== null) {
    if (typeof item.destination.address === 'string' && item.destination.address.trim()) {
      return item.destination.address.trim()
    }
    if (typeof item.destination.name === 'string' && item.destination.name.trim()) {
      return item.destination.name.trim()
    }
  }
  if (typeof item.location === 'string' && item.location.trim()) {
    return item.location.trim()
  }
  if (typeof item.address === 'string' && item.address.trim()) {
    return item.address.trim()
  }

  return ''
}

/**
 * Checks whether an item has a valid destination (either coordinates or address).
 * @param {object} item
 * @returns {boolean}
 */
export function hasValidDestination(item) {
  return Boolean(getDestinationCoordinates(item) || getDestinationAddress(item))
}

/**
 * Builds the Google Maps Roadmap (standard street map) URL for a rental destination.
 * Prefers valid coordinates; falls back to destination address text; returns null if unavailable.
 * @param {object} item
 * @returns {string | null}
 */
export function buildGoogleMapsRoadmapUrl(item) {
  if (!item) return null

  // 1. Check coordinates first
  const coords = getDestinationCoordinates(item)
  if (coords) {
    return `https://www.google.com/maps/@?api=1&map_action=map&center=${coords.lat},${coords.lng}&zoom=16&basemap=roadmap`
  }

  // 2. Check destination address
  const address = getDestinationAddress(item)
  if (address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}&basemap=roadmap`
  }

  return null
}

// Aliases for compatibility
export const buildGoogleMapsUrl = buildGoogleMapsRoadmapUrl
export const buildGoogleMapsSatelliteUrl = buildGoogleMapsRoadmapUrl

/**
 * Safely opens Google Maps Roadmap (standard street map) view for a rental destination in a new tab.
 * @param {object} item
 * @param {function} [onUnavailable] Optional callback when destination is missing
 * @returns {boolean} Whether the window was opened successfully
 */
export function openGoogleMapsRoadmap(item, onUnavailable) {
  const url = buildGoogleMapsRoadmapUrl(item)
  if (!url) {
    if (typeof onUnavailable === 'function') {
      onUnavailable()
    }
    return false
  }

  window.open(url, '_blank', 'noopener,noreferrer')
  return true
}

// Aliases for compatibility
export const openGoogleMaps = openGoogleMapsRoadmap
export const openGoogleMapsSatellite = openGoogleMapsRoadmap
