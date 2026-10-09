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

/** Convert a Nominatim response into our address fields. */
export function addressFromPlace(place) {
  const a = place?.address || {}
  const line1 = [a.house_number, a.road || a.pedestrian || a.residential || a.footway]
    .filter(Boolean)
    .join(' ')
  const line2 = a.suburb || a.neighbourhood || a.quarter || a.hamlet || a.city_district || ''
  const city = a.city || a.town || a.village || a.municipality || a.county || ''
  const district = a.state_district || a.county || a.district || city
  return {
    line1,
    line2,
    city,
    district,
    state: a.state || '',
    pincode: String(a.postcode || '').replace(/\s+/g, ''),
    locationLabel: place?.display_name || '',
  }
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
