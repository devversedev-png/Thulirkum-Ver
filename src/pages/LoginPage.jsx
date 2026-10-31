import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff } from 'lucide-react'
import './LoginOtp.css'

const RESEND_SECONDS = 30

function cleanMobile(value) {
  return value.replace(/[^\d+]/g, '')
}

export default function LoginPage() {
  const {
    user,
    login,
    register,
    getOtpConfig,
    sendOtp,
    verifyOtp,
    loginWithOtp,
  } = useAuth()
  const navigate = useNavigate()

  // 'login' (email + password) | 'otp' (mobile OTP login) | 'register'
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', mobile: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const [otpConfig, setOtpConfig] = useState({ enabled: false, requiredForRegistration: false })
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [cooldown, setCooldown] = useState(0)

  // Ask the backend whether MSG91 is switched on. If the call fails the page
  // behaves exactly as it did before OTP existed.
  useEffect(() => {
    let active = true
    getOtpConfig()
      .then((config) => active && setOtpConfig(config))
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (cooldown <= 0) return undefined
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  if (user?.role === 'ADMIN') return <Navigate to="/admin" replace />
  if (user) return <Navigate to="/home" replace />

  const registerNeedsOtp = mode === 'register' && otpConfig.requiredForRegistration
  const usesOtp = mode === 'otp' || registerNeedsOtp

  function change(event) { setForm({ ...form, [event.target.name]: event.target.value }) }

  function switchMode(next) {
    setMode(next)
    setError('')
    setOtp('')
    setOtpSent(false)
    setCooldown(0)
  }

  async function requestOtp() {
    await sendOtp(form.mobile, mode === 'otp' ? 'LOGIN' : 'REGISTER')
    setOtpSent(true)
    setOtp('')
    setCooldown(RESEND_SECONDS)
  }

  async function resend() {
    setBusy(true)
    setError('')
    try {
      await requestOtp()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (mode === 'login') {
        await login(form.email, form.password, rememberMe)
        navigate('/home')
      } else if (mode === 'otp') {
        if (!otpSent) {
          await requestOtp()
        } else {
          await loginWithOtp(form.mobile, otp, rememberMe)
          navigate('/home')
        }
      } else if (registerNeedsOtp) {
        if (!otpSent) {
          await requestOtp()
        } else {
          const proof = await verifyOtp(form.mobile, 'REGISTER', otp)
          await register({ ...form, otpToken: proof.otpToken })
          navigate('/home')
        }
      } else {
        await register(form)
        navigate('/home')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const heading = {
    login: ['WELCOME BACK', 'Continue your book journey', 'Sign in to access your wishlist, cart and orders.'],
    otp: ['WELCOME BACK', 'Login with OTP', 'We will text a one-time code to your registered mobile number.'],
    register: ['JOIN OUR READING COMMUNITY', 'Create your account', 'Save books, manage delivery addresses and track every order.'],
  }[mode]

  let buttonLabel = 'Login'
  if (busy) buttonLabel = 'Please wait...'
  else if (usesOtp && !otpSent) buttonLabel = 'Send OTP'
  else if (mode === 'otp') buttonLabel = 'Verify & Login'
  else if (mode === 'register') buttonLabel = registerNeedsOtp ? 'Verify & Create Account' : 'Create Account'

  const showMobile = mode === 'otp' || mode === 'register'
  const showEmailPassword = mode !== 'otp'
  const lockFields = usesOtp && otpSent

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
          <span className="eyebrow">{heading[0]}</span>
          <h2>{heading[1]}</h2>
          <p>{heading[2]}</p>

          <form onSubmit={submit}>
            {mode === 'register' && (
              <>
                <label>Name</label>
                <input name="name" value={form.name} onChange={change} required disabled={lockFields} />
              </>
            )}

            {showMobile && (
              <>
                <label>Mobile Number</label>
                <input
                  name="mobile"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="10-digit mobile number"
                  value={form.mobile}
                  onChange={(event) => setForm({ ...form, mobile: cleanMobile(event.target.value) })}
                  required={mode === 'otp' || registerNeedsOtp}
                  disabled={lockFields}
                />
              </>
            )}

            {showEmailPassword && (
              <>
                <label>Email</label>
                <input name="email" type="email" value={form.email} onChange={change} required disabled={lockFields} />
                <label>Password</label>
                <div className="password-input-wrap">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={change}
                    minLength="6"
                    required
                    disabled={lockFields}
                  />

                  <button
                    type="button"
                    className="password-eye-btn"
                    onClick={() => setShowPassword(prev => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </>
            )}

            {usesOtp && otpSent && (
              <>
                <p className="otp-note">
                  Enter the code sent to <strong>{form.mobile}</strong>
                </p>
                <input
                  className="otp-code-input"
                  value={otp}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 9))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="······"
                  required
                  autoFocus
                />
                <div className="otp-actions">
                  <button type="button" className="text-btn" onClick={resend} disabled={busy || cooldown > 0}>
                    {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
                  </button>
                  <button type="button" className="text-btn" onClick={() => { setOtpSent(false); setOtp(''); setError('') }}>
                    Change number
                  </button>
                </div>
              </>
            )}

            {mode !== 'register' && (
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                />
                <span>Remember me</span>
              </label>
            )}
            {error && <div className="form-error">{error}</div>}
            <button className="primary-btn full big" disabled={busy}>{buttonLabel}</button>
          </form>

          {otpConfig.enabled && mode === 'login' && (
            <button className="text-btn login-switch" onClick={() => switchMode('otp')}>Login with a mobile OTP instead</button>
          )}
          {mode === 'otp' && (
            <button className="text-btn login-switch" onClick={() => switchMode('login')}>Use email and password instead</button>
          )}
          <button className="text-btn login-switch" onClick={() => switchMode(mode === 'register' ? 'login' : 'register')}>
            {mode === 'register' ? 'Already have an account? Login' : 'New to Thulirkum Ver? Create an account'}
          </button>
          <button className="text-btn admin-login-link" onClick={() => navigate('/admin/login')}>Store administrator? Admin login »</button>
        </div>
      </div>
    </div>
  )
}
