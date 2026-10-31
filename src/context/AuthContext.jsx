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

  // ---- Mobile OTP (MSG91, handled by the backend) ----

  function getOtpConfig() {
    return api('/auth/otp/config')
  }

  function sendOtp(mobile, purpose) {
    return api('/auth/otp/send', {
      method: 'POST',
      body: JSON.stringify({ mobile, purpose }),
    })
  }

  // purpose REGISTER -> { verified, otpToken }; purpose LOGIN -> normal auth response
  function verifyOtp(mobile, purpose, otp) {
    return api('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ mobile, purpose, otp }),
    })
  }

  async function loginWithOtp(mobile, otp, rememberMe = false) {
    const data = await verifyOtp(mobile, 'LOGIN', otp)

    updateSession(data, rememberMe)

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
      getOtpConfig,
      sendOtp,
      verifyOtp,
      loginWithOtp,
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