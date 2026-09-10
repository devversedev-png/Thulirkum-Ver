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

  function change(event) { setForm({ ...form, [event.target.name]: event.target.value }) }

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (mode === 'login') await login(form.email, form.password)
      else await register(form)
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
        <div className="login-art-copy">
          <span className="eyebrow">READ · LEARN · GROW</span>
          <h1>Let Knowledge<br />Take Root.</h1>
          <p>Discover Tamil and English books that inform, inspire and uplift.</p>
          <div className="login-art-points"><span>✓ Genuine catalogue</span><span>✓ Secure checkout</span><span>✓ Live order tracking</span></div>
        </div>
        <blockquote>“A book today,<br />a better tomorrow.”</blockquote>
      </div>

      <div className="login-panel">
        <div className="login-card">
          <img className="login-logo" src="/logo.png" alt="Thulirkum Ver" />
          <span className="eyebrow">{mode === 'login' ? 'WELCOME BACK' : 'JOIN OUR READING COMMUNITY'}</span>
          <h2>{mode === 'login' ? 'Continue your book journey' : 'Create your account'}</h2>
          <p>{mode === 'login' ? 'Sign in to access your wishlist, cart and orders.' : 'Save books, manage delivery addresses and track every order.'}</p>

          <form onSubmit={submit}>
            {mode === 'register' && <><label>Name</label><input name="name" value={form.name} onChange={change} required /><label>Mobile Number</label><input name="mobile" value={form.mobile} onChange={change} /></>}
            <label>Email</label><input name="email" type="email" value={form.email} onChange={change} required />
            <label>Password</label><input name="password" type="password" value={form.password} onChange={change} minLength="6" required />
            {error && <div className="form-error">{error}</div>}
            <button className="primary-btn full big" disabled={busy}>{busy ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create Account'}</button>
          </form>

          <button className="text-btn login-switch" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'New to Thulirkum Ver? Create an account' : 'Already have an account? Login'}</button>
          <button className="text-btn admin-login-link" onClick={() => navigate('/admin/login')}>Store administrator? Admin login →</button>
        </div>
      </div>
    </div>
  )
}
