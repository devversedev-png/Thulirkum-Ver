import { useState } from 'react'
import {
  Navigate,
  useNavigate,
  useSearchParams,
} from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import '../styles.css'
import { Eye, EyeOff } from "lucide-react";

export default function AdminLoginPage() {
  const {
    user,
    adminLogin,
  } = useAuth()

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [form, setForm] = useState({
    email: '',
    password: '',
  })

  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const redirectReason = searchParams.get('reason')

  const redirectMessage =
    redirectReason === 'session-expired'
      ? 'Your admin session expired or the token is invalid. Please sign in again.'
      : redirectReason === 'admin-access'
        ? 'This session is no longer authorized as an administrator. Please sign in again with an administrator account.'
        : ''

  const token = localStorage.getItem('tvb_token')

  if (user?.role === 'ADMIN' && token) {
    return (
      <Navigate
        to="/admin"
        replace
      />
    )
  }

  function change(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    })
  }

  async function submit(event) {
    event.preventDefault()

    setBusy(true)
    setError('')

    try {
      await adminLogin(
        form.email,
        form.password
      )

      navigate('/admin')
    } catch (err) {
      setError(
        err?.message ||
        'Unable to sign in. Please check your credentials.'
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="admin-login-page">

      {/* Background image already contains:
          Logo + Thulirkum Ver Admin + bookstore scene */}
     <img
  src="/admin-login-bg.png"
  alt=""
  className="admin-login-background"
/>

      {/* Dark/soft overlay for better login-card contrast */}
      <div className="admin-login-overlay" />

      {/* Login Card */}
      <div className="admin-login-card">

        {/* Small logo inside login card */}
        <div className="admin-login-logo-wrap">
          <img
            src="/logo.png"
            alt="Thulirkum Ver Book Store"
            className="admin-login-logo"
          />
        </div>

        <span className="admin-badge">
          STORE ADMINISTRATION
        </span>

        <h1>
          Admin Login
        </h1>

        <p className="admin-login-description">
          Sign in with your administrator account.
        </p>

        <form onSubmit={submit}>

          <label htmlFor="admin-email">
            Email
          </label>

          <input
            id="admin-email"
            name="email"
            type="email"
            value={form.email}
            onChange={change}
            placeholder="Enter your admin email"
            autoComplete="username"
            required
          />

          <label htmlFor="admin-password">
            Password
          </label>

         <div className="password-input-wrap">
  <input
    id="admin-password"
    name="password"
    type={showPassword ? 'text' : 'password'}
    value={form.password}
    onChange={change}
    placeholder="Enter your password"
    autoComplete="current-password"
    required
  />

  <button
    type="button"
    className="password-eye-btn"
    onClick={() => setShowPassword(prev => !prev)}
    aria-label={showPassword ? 'Hide password' : 'Show password'}
  >
    {showPassword ? (
      <EyeOff size={20} />
    ) : (
      <Eye size={20} />
    )}
  </button>
</div>

          {(error || redirectMessage) && (
            <div className="form-error">
              {error || redirectMessage}
            </div>
          )}

          <button
            type="submit"
            className="primary-btn full big admin-login-submit"
            disabled={busy}
          >
            {busy
              ? 'Signing in...'
              : 'Login as Admin'}
          </button>

        </form>

        <button
          className="text-btn admin-back-btn"
          type="button"
          onClick={() => navigate('/login')}
        >
          ← Back to customer login
        </button>

      </div>
    </div>
  )
}