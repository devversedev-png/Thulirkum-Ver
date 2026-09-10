import {
  createContext,
  useContext,
  useMemo,
  useState,
} from 'react'

import { api } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('tvb_user')

    return saved
      ? JSON.parse(saved)
      : null
  })

  async function login(email, password) {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
      }),
    })

    saveSession(data)

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

    saveSession(data)

    return data
  }

  async function register(form) {
    const data = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify(form),
    })

    saveSession(data)

    return data
  }

  function saveSession(data) {
    const account = {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role || 'CUSTOMER',
    }

    localStorage.setItem(
      'tvb_token',
      data.token
    )

    localStorage.setItem(
      'tvb_user',
      JSON.stringify(account)
    )

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

