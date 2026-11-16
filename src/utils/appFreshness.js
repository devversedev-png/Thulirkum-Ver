/**
 * Notify mounted views when the Android application becomes active again.
 * Never reload the whole WebView: that loses the current page and form input.
 */
let previousRefresh = 0
const MIN_INTERVAL_MS = 1200

function requestFreshData() {
  if (typeof document === 'undefined' || document.visibilityState === 'hidden') return
  const now = Date.now()
  if (now - previousRefresh < MIN_INTERVAL_MS) return
  previousRefresh = now
  window.dispatchEvent(new Event('tvb:app-resumed'))
}

export async function installAppFreshness() {
  document.addEventListener('visibilitychange', requestFreshData)
  window.addEventListener('pageshow', requestFreshData)
  window.addEventListener('focus', requestFreshData)
  try {
    const { Capacitor } = await import('@capacitor/core')
    if (!Capacitor.isNativePlatform()) return
    const { App } = await import('@capacitor/app')
    await App.addListener('resume', requestFreshData)
    await App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) requestFreshData()
    })
  } catch (error) {
    if (import.meta.env.DEV) console.debug('Native resume listener unavailable', error)
  }
}
