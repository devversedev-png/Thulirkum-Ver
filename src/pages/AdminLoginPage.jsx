import { useState } from 'react'
import {
  Navigate,
  useNavigate,
  useSearchParams,
} from 'react-router-dom'

import { useAuth } from '../context/AuthContext'

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

  const redirectReason = searchParams.get('reason')
  const redirectMessage = redirectReason === 'session-expired'
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
      [event.target.name]:
        event.target.value,
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
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="admin-login-page">
      {/* Left Side */}
      <div className="admin-login-side">
        <img
          src="/logo.png"
          alt="Thulirkum Ver"
        />

        <h1>
          Thulirkum Ver Admin
        </h1>

        <p>
          Manage your bookstore, catalogue, customers
          and orders from one focused workspace.
        </p>

        <blockquote>
          Read · Learn · Grow
        </blockquote>
      </div>

      {/* Login Card */}
      <div className="admin-login-card">
        <img
          src="/logo.png"
          alt="Thulirkum Ver Book Store"
        />

        <span className="admin-badge">
          STORE ADMINISTRATION
        </span>

        <h1>
          Admin Login
        </h1>

        <p>
          Sign in with your administrator account.
        </p>

        <form onSubmit={submit}>
          <label>
            Email
          </label>

          <input
            name="email"
            type="email"
            value={form.email}
            onChange={change}
            required
          />

          <label>
            Password
          </label>

          <input
            name="password"
            type="password"
            value={form.password}
            onChange={change}
            required
          />

          {(error || redirectMessage) && (
            <div className="form-error">
              {error || redirectMessage}
            </div>
          )}

          <button
            className="primary-btn full big"
            disabled={busy}
          >
            {busy
              ? 'Signing in...'
              : 'Login as Admin'}
          </button>
        </form>

        <button
          className="text-btn"
          type="button"
          onClick={() =>
            navigate('/login')
          }
        >
          ← Back to customer login
        </button>
      </div>
    </div>
  )
}

