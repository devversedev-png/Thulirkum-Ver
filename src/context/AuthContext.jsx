import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { api } from '../api/client'

const AuthContext = createContext(null)

const TOKEN_KEY = 'tvb_token'
const USER_KEY = 'tvb_user'

function getStorage() {
  return localStorage.getItem(TOKEN_KEY)
    ? localStorage
    : sessionStorage
}

function readStoredUser() {
  try {
    const storage = getStorage()
    const saved = storage.getItem(USER_KEY)

    if (!saved) return null

    return JSON.parse(saved)
  } catch {
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(TOKEN_KEY)

    sessionStorage.removeItem(USER_KEY)
    sessionStorage.removeItem(TOKEN_KEY)

    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)

  useEffect(() => {
    function handleSessionExpired() {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)

      sessionStorage.removeItem(TOKEN_KEY)
      sessionStorage.removeItem(USER_KEY)

      setUser(null)
    }

    window.addEventListener(
      'tvb:session-expired',
      handleSessionExpired
    )

    return () => {
      window.removeEventListener(
        'tvb:session-expired',
        handleSessionExpired
      )
    }
  }, [])

  async function login(email, password, rememberMe = false) {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
      }),
    })

    updateSession(data, rememberMe)

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

    updateSession(data, true)

    return data
  }

  async function register(form) {
    const data = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify(form),
    })

    updateSession(data, true)

    return data
  }

  function updateSession(data, rememberMe = true) {
    const account = {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role || 'CUSTOMER',
    }

    const storage = rememberMe
      ? localStorage
      : sessionStorage

    const otherStorage = rememberMe
      ? sessionStorage
      : localStorage

    // Remove old session from the other storage
    otherStorage.removeItem(TOKEN_KEY)
    otherStorage.removeItem(USER_KEY)

    storage.setItem(TOKEN_KEY, data.token)
    storage.setItem(USER_KEY, JSON.stringify(account))

    setUser(account)
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)

    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(USER_KEY)

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