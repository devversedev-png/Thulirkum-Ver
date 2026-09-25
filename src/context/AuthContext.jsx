import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { api } from '../api/client'

const AuthContext = createContext(null)

function readStoredUser() {
  try {
    const saved = localStorage.getItem('tvb_user')
    if (!saved) return null
    return JSON.parse(saved)
  } catch {
    localStorage.removeItem('tvb_user')
    localStorage.removeItem('tvb_token')
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)

  useEffect(() => {
    function handleSessionExpired() {
      localStorage.removeItem('tvb_token')
      localStorage.removeItem('tvb_user')
      setUser(null)
    }

    window.addEventListener('tvb:session-expired', handleSessionExpired)
    return () => {
      window.removeEventListener('tvb:session-expired', handleSessionExpired)
    }
  }, [])

  async function login(email, password) {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
      }),
    })

    updateSession(data)

    return data
  }

  async function adminLogin(email, password) {
    const data = await api('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
      }),
    })

    updateSession(data)

    return data
  }

  async function register(form) {
    const data = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify(form),
    })

    updateSession(data)

    return data
  }

  function updateSession(data) {
    const account = {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role || 'CUSTOMER',
    }

    localStorage.setItem('tvb_token', data.token)
    localStorage.setItem('tvb_user', JSON.stringify(account))
    setUser(account)
  }

  function logout() {
    localStorage.removeItem('tvb_token')
    localStorage.removeItem('tvb_user')
    setUser(null)
  }

  const value = useMemo(
    () => ({
      user,
      login,
      adminLogin,
      register,
      updateSession,
      logout,
    }),
    [user]
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
