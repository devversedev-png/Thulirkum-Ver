import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { user, login, register } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', mobile: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user?.role === 'ADMIN') return <Navigate to="/admin" replace />
  if (user) return <Navigate to="/home" replace />

  function change(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (mode === 'login') {
        await login(form.email, form.password)
      } else {
        await register(form)
      }
      navigate('/home')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-art">
        <img src="/logo.png" alt="Thulirkum Ver Book Store" />
        <div>
          <span className="eyebrow">Good books. Brighter lives.</span>
          <h1>Books that grow ideas,<br />roots that shape generations.</h1>
          <p>Discover Tamil literature, fiction, self-help, children books and more in one simple place.</p>
        </div>
      </div>

      <div className="login-panel">
        <div className="login-card">
          <img className="login-logo" src="/logo.png" alt="Thulirkum Ver" />
          <h2>{mode === 'login' ? 'Welcome Back' : 'Create your account'}</h2>
          <p>{mode === 'login' ? 'Login to continue your book journey.' : 'Start saving and ordering your favourite books.'}</p>

          <form onSubmit={submit}>
            {mode === 'register' && (
              <>
                <label>Name</label>
                <input name="name" value={form.name} onChange={change} required />
                <label>Mobile Number</label>
                <input name="mobile" value={form.mobile} onChange={change} />
              </>
            )}
            <label>Email</label>
            <input name="email" type="email" value={form.email} onChange={change} required />
            <label>Password</label>
            <input name="password" type="password" value={form.password} onChange={change} minLength="6" required />
            {error && <div className="form-error">{error}</div>}
            <button className="primary-btn full big" disabled={busy}>
              {busy ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create Account'}
            </button>
          </form>

          <button className="text-btn" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'New to Thulirkum Ver? Create an account' : 'Already have an account? Login'}
          </button>
        </div>
      </div>
    </div>
  )
}
