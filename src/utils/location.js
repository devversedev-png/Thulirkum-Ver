/*
 * Accurate "use my current location" helpers.
 *
 * A single getCurrentPosition() call often returns the FIRST fix, which on
 * many devices is a coarse Wi-Fi / IP estimate (hundreds of metres to km off).
 * We instead watch the GPS for a few seconds and keep the most accurate fix,
 * stopping early as soon as it is good enough.
 */

export function getAccuratePosition({
  targetAccuracy = 40,  // metres – stop as soon as we reach this
  maxWait = 7000,       // ms – hard limit for refining
  onFix,                // called with the first fix and with each clearly better one
} = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(Object.assign(new Error('Location access is not supported by this browser.'), { code: 0 }))
      return
    }

    let best = null
    let finished = false
    let watchId = null
    let lastError = null

    const finish = (fn, value) => {
      if (finished) return
      finished = true
      if (watchId !== null) navigator.geolocation.clearWatch(watchId)
      clearTimeout(timer)
      fn(value)
    }

    const consider = position => {
      if (finished) return
      const acc = position.coords.accuracy
      if (!best) {
        best = position
        onFix?.(position)
      } else if (acc < best.coords.accuracy) {
        const clearlyBetter = acc <= best.coords.accuracy * 0.75
        best = position
        if (clearlyBetter) onFix?.(position)
      }
      if (best.coords.accuracy <= targetAccuracy) finish(resolve, best)
    }

    const fail = error => {
      lastError = error
      if (error.code === 1) finish(reject, error) // permission denied is final
    }

    const timer = setTimeout(() => {
      if (best) finish(resolve, best)
      else finish(reject, lastError || Object.assign(new Error('Location request timed out.'), { code: 3 }))
    }, best ? maxWait : Math.max(maxWait, 10000))

    // 1) Fast first fix: a cached / network position is usually instant.
    navigator.geolocation.getCurrentPosition(consider, fail, {
      enableHighAccuracy: false,
      timeout: 4000,
      maximumAge: 300000,
    })

    // 2) Meanwhile refine with the GPS.
    watchId = navigator.geolocation.watchPosition(consider, fail, {
      enableHighAccuracy: true,
      timeout: maxWait,
      maximumAge: 0,
    })
  })
}

export async function reverseGeocode(latitude, longitude) {
  const baseUrl =
    import.meta.env.VITE_REVERSE_GEOCODE_URL ||
    'https://nominatim.openstreetmap.org/reverse'
  const separator = baseUrl.includes('?') ? '&' : '?'
  const response = await fetch(
    `${baseUrl}${separator}format=jsonv2&addressdetails=1&zoom=18&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`,
    { headers: { 'Accept-Language': 'en' } }
  )
  if (!response.ok) throw new Error('Unable to read the address from the map')
  return response.json()
}

/**
 * Nominatim address components are approximate to the GPS pin, not proof of
 * the customer's house number. Keep road, locality and delivery notes separate.
 */
export function addressFromPlace(place) {
  const a = place?.address || {}
  const road = a.road || a.pedestrian || a.residential || a.footway || a.path || ''
  const locality = a.neighbourhood || a.suburb || a.quarter || a.city_district ||
    a.hamlet || a.village || a.locality || ''
  const city = a.city || a.town || a.municipality || a.village || a.county || ''
  const district = a.state_district || a.district || a.county || city
  return {
    // Do not insert the nearest map feature's house number: it may be another home.
    line1: road,
    locality: locality || (a.subdistrict && a.subdistrict !== city ? a.subdistrict : ''),
    line2: '',
    city,
    district,
    state: a.state || '',
    pincode: String(a.postcode || '').replace(/\s+/g, ''),
    locationLabel: place?.display_name || '',
  }
}

/** Full human-readable address for drivers, labels and Google Maps search. */
export function formatDeliveryAddress(address) {
  if (!address) return ''
  const parts = [
    address.line1,
    address.locality,
    address.line2,
    address.city,
    address.district && address.district !== address.city ? address.district : '',
    address.state,
    address.pincode,
    'India',
  ]
  return parts.map(part => String(part || '').trim()).filter(Boolean).join(', ')
}

/** GPS-coordinates take priority; otherwise search the confirmed typed address. */
export function googleMapsDeliveryUrl(address) {
  const lat = Number(address?.latitude)
  const lon = Number(address?.longitude)
  const hasPin = address?.latitude != null && address?.longitude != null &&
    Number.isFinite(lat) && Number.isFinite(lon) &&
    Math.abs(lat) <= 90 && Math.abs(lon) <= 180
  const query = hasPin ? `${lat},${lon}` : formatDeliveryAddress(address)
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : ''
}

export function locationErrorMessage(error) {
  if (error?.code === 1) return 'Location permission was denied. Please allow location access and try again.'
  if (error?.code === 2) return 'Your current location could not be determined. Check that GPS / location services are on.'
  if (error?.code === 3) return 'Location request timed out. Please try again, ideally outdoors or near a window.'
  return error?.message || 'Unable to get your current location.'
}

export function accuracyNote(accuracy) {
  const metres = Math.round(accuracy || 0)
  if (metres <= 50) return ''
  return ` Location accuracy is about ${metres} m — please verify the address (this is common on laptops without GPS).`
}
