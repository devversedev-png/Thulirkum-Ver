import { useEffect, useState } from 'react'
import { api } from '../api/client'

export const DEFAULT_DELIVERY = Object.freeze({
  enabled: true,
  feePaise: 6000,
  freeDeliveryThresholdPaise: 49900,
  freeShippingAll: false,
})

export function shippingPaiseFor(subtotalRupees, settings = DEFAULT_DELIVERY) {
  const amount = Math.round(Math.max(0, Number(subtotalRupees) || 0) * 100)
  if (!amount || !settings.enabled || settings.freeShippingAll) return 0
  if (amount >= Number(settings.freeDeliveryThresholdPaise)) return 0
  return Math.max(0, Number(settings.feePaise) || 0)
}

export function useDeliverySettings() {
  const [settings, setSettings] = useState(DEFAULT_DELIVERY)
  useEffect(() => {
    let active = true
    const refresh = () => {
      api('/delivery-settings').then(value => {
        if (active && value) setSettings({ ...DEFAULT_DELIVERY, ...value })
      }).catch(() => {})
    }
    refresh()
    window.addEventListener('tvb:app-resumed', refresh)
    return () => {
      active = false
      window.removeEventListener('tvb:app-resumed', refresh)
    }
  }, [])
  return settings
}
