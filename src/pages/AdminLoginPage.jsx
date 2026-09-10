import { useState } from 'react'
import {
  Navigate,
  useNavigate,
} from 'react-router-dom'

import { useAuth } from '../context/AuthContext'

export default function AdminLoginPage() {
  const {
    user,
    adminLogin,
  } = useAuth()

  const navigate = useNavigate()

  const [form, setForm] = useState({
    email: '',
    password: '',
  })

  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user?.role === 'ADMIN') {
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
          Commerce Console
        </h1>

        <p>
          Manage catalogue, customers, orders
          and promotions from one focused
          workspace.
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

          {error && (
            <div className="form-error">
              {error}
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

