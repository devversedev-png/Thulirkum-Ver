import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { App as CapacitorApp } from '@capacitor/app'

const isAdmin = import.meta.env.MODE === 'admin'

export default function AndroidBackHandler() {
  const navigate = useNavigate()
  const location = useLocation()
  const latest = useRef(location)
  const lastBack = useRef(0)
  const toast = useRef(null)

  useEffect(() => { latest.current = location }, [location])

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    let subscription
    let cancelled = false
    const onBack = async () => {
      const current = latest.current
      const root = isAdmin ? '/admin/login' : '/home'
      const currentPath = current.pathname
      // React Router tracks its own history index in history.state.
      const historyIndex = window.history.state?.idx ?? 0
      if (historyIndex > 0) {
        navigate(-1)
        return
      }
      if (currentPath !== root && currentPath !== (isAdmin ? '/admin' : '/login')) {
        navigate(root, { replace: true })
        return
      }
      const now = Date.now()
      if (now - lastBack.current < 2000) {
        await CapacitorApp.exitApp()
        return
      }
      lastBack.current = now
      if (!toast.current) {
        toast.current = document.createElement('div')
        toast.current.className = 'tv-android-back-toast'
        document.body.appendChild(toast.current)
      }
      toast.current.textContent = 'Press back again to exit'
      toast.current.classList.add('visible')
      setTimeout(() => toast.current?.classList.remove('visible'), 1900)
    }
    CapacitorApp.addListener('backButton', onBack).then((listener) => {
      if (cancelled) listener.remove()
      else subscription = listener
    })
    return () => {
      cancelled = true
      subscription?.remove()
      toast.current?.remove()
      toast.current = null
    }
  }, [navigate])
  return null
}
