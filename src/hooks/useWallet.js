import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchWallet } from '../api/wallet'
import { useAuth } from '../context/AuthContext'

/** Never cache customer wallet funds in browser storage. */
export function useWallet() {
  const { user } = useAuth()
  const requestNumber = useRef(0)
  const [wallet, setWallet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    const requestId = ++requestNumber.current
    setRefreshing(true)
    setError('')

    try {
      const response = await fetchWallet()
      if (requestNumber.current === requestId) {
        setWallet(response)
      }
    } catch (err) {
      if (requestNumber.current === requestId) {
        setError(err?.message || 'Unable to load your wallet.')
        // Never display a stale balance if the server cannot be reached.
        setWallet(null)
      }
    } finally {
      if (requestNumber.current === requestId) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }, [])

  useEffect(() => {
    setWallet(null)
    setLoading(true)
    if (user?.id) void refresh()

    return () => {
      // Ignore results after logout, account switch, or unmount.
      requestNumber.current += 1
    }
  }, [refresh, user?.id])

  useEffect(() => {
    if (!user?.id) return undefined
    const onResume = () => { void refresh() }
    window.addEventListener('tvb:app-resumed', onResume)
    return () => window.removeEventListener('tvb:app-resumed', onResume)
  }, [refresh, user?.id])

  return { wallet, loading, refreshing, error, refresh }
}
