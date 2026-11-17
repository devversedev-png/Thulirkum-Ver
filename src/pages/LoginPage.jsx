import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff } from 'lucide-react'
import './LoginOtp.css'
import './PremiumAuth2026.css'

const RESEND_SECONDS = 30

function cleanMobile(value) {
  return value.replace(/[^\d+]/g, '')
}

export default function LoginPage() {
  const {
    user,
    login,
    register,
    logout,
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
      .catch(() => { })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (cooldown <= 0) return undefined
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  if (user?.role === 'ADMIN') {
    return (
      <div className="login-page tv-auth-2026 tv-auth-admin-session">
        <div className="login-panel tv-auth-panel">
          <div className="login-card tv-auth-card">
            <h2>Administrator session detected</h2>
            <p>
              Please use the separate Admin website to manage your store.
            </p>
            <button
              type="button"
              className="primary-btn full big"
              onClick={() => logout()}
            >
              Sign out and continue
            </button>
          </div>
        </div>
      </div>
    )
  }
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
    <main className="login-page tv-auth-2026">
      <section className="login-art tv-auth-story" aria-label="Thulirkum Ver Book Store">
        <div className="tv-auth-story-top">
          <img
            className="tv-auth-story-logo"
            src="/logo.png"
            alt="Thulirkum Ver Book Store"
          />
        </div>

        <div className="tv-auth-story-body">
          <div className="tv-auth-story-kicker"><span className="tv-auth-story-line" /> A WORLD OF STORIES</div>
          <h1>Every great journey<br /><em>begins with a book.</em></h1>
          <p>Discover stories that stay with you. Find new perspectives, timeless classics, and your next favourite read.</p>
          <div className="tv-auth-feature-row" aria-label="Store benefits">
            <span><span aria-hidden="true">✧</span> Curated reads</span>
            <span><span aria-hidden="true">✧</span> Secure checkout</span>
            <span><span aria-hidden="true">✧</span> Made for readers</span>
          </div>
        </div>

        <div className="tv-auth-story-bottom">
          <img
              className="tv-auth-book-image"
              src="/premium/hero-books-premium.png"
              alt="A stack of books beside a small green plant"
              loading="eager"
              decoding="async"
            />
          <div className="tv-auth-story-footer">
            <span>THULIRKUM VER COLLECTION</span>
            <span>READ <b>·</b> LEARN <b>·</b> GROW</span>
          </div>
        </div>
      </section>

      <section className="login-panel tv-auth-panel" aria-label="Account access">
        <div className="login-card tv-auth-card">
          <div className="tv-auth-card-heading">
            <div className="tv-auth-monogram"><img src="/logo-icon.jpeg" alt="" /></div>
            <span>THULIRKUM VER <span className="tv-auth-bullet">✦</span> BOOK STORE</span>
          </div>
          <div className="tv-auth-mode-tabs" role="group" aria-label="Choose account action">
            <button type="button" className={mode === 'login' || mode === 'otp' ? 'is-selected' : ''} aria-pressed={mode === 'login' || mode === 'otp'} onClick={() => switchMode('login')}>Sign in</button>
            <button type="button" className={mode === 'register' ? 'is-selected' : ''} aria-pressed={mode === 'register'} onClick={() => switchMode('register')}>Create account</button>
          </div>
          <div className="tv-auth-intro">
            <span className="eyebrow">{heading[0]}</span>
            <h2>{heading[1]}</h2>
            <p>{heading[2]}</p>
          </div>

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
          <div className="tv-auth-switch-note">
            <span>{mode === 'register' ? 'Already part of our reading community?' : 'New to our reading community?'}</span>
            <button type="button" className="text-btn login-switch" onClick={() => switchMode(mode === 'register' ? 'login' : 'register')}>
              {mode === 'register' ? 'Sign in instead' : 'Create an account'}
            </button>
          </div>
          <p className="tv-auth-privacy-note">A little space for big stories. Your reading journey starts here.</p>
        </div>
      </section>
    </main>
  )
}
