import { Navigate, Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'

function blankAddress(user) {
  return {
    label: 'Home',
    fullName: user?.name || '',
    mobile: user?.mobile || '',
    email: user?.email || '',
    line1: '',
    line2: '',
    city: '',
    district: '',
    state: '',
    pincode: '',
    latitude: null,
    longitude: null,
    locationLabel: ''
  }
}

export default function CheckoutPage() {
  const { user } = useAuth()
  const { cartRows, account, offers, placeOrder } = useStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const rows = cartRows()
  const addresses = account?.addresses || []
  const preferredAddress = addresses.find(item => item.defaultAddress) || addresses[0]
  const [selectedAddressId, setSelectedAddressId] = useState(preferredAddress?.id || 'NEW')
  const [address, setAddress] = useState(preferredAddress ? { ...preferredAddress } : blankAddress(user))
  const [paymentMethod, setPaymentMethod] = useState('COD')
  const [couponCode, setCouponCode] = useState(searchParams.get('coupon') || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!addresses.length) return
    const current = addresses.find(item => item.id === selectedAddressId)
    if (current) setAddress({ ...current })
  }, [account?.addresses, selectedAddressId])

  const subtotal = rows.reduce((sum, row) => sum + Number(row.book.price || 0) * Number(row.quantity || 0), 0)
  const shipping = subtotal >= 499 ? 0 : 60
  const matchedOffer = useMemo(() => offers.find(offer => offer.code?.toLowerCase() === couponCode.trim().toLowerCase()), [offers, couponCode])
  const estimateDiscount = matchedOffer && subtotal >= Number(matchedOffer.minOrderAmount || 0)
    ? matchedOffer.discountType === 'FIXED'
      ? Math.min(subtotal, Number(matchedOffer.discountValue || 0))
      : subtotal * Number(matchedOffer.discountValue || 0) / 100
    : 0
  const total = Math.max(0, subtotal + shipping - estimateDiscount)

  if (!rows.length) return <Navigate to="/cart" replace />

  function change(event) {
    setAddress({ ...address, [event.target.name]: event.target.value })
  }

  function chooseSavedAddress(item) {
    setSelectedAddressId(item.id)
    setAddress({ ...item })
  }

  function chooseNewAddress() {
    setSelectedAddressId('NEW')
    setAddress(blankAddress(user))
  }

  async function reverseGeocode(latitude, longitude) {
    const baseUrl =
      import.meta.env.VITE_REVERSE_GEOCODE_URL ||
      'https://nominatim.openstreetmap.org/reverse'
    const separator = baseUrl.includes('?') ? '&' : '?'
    const response = await fetch(
      `${baseUrl}${separator}format=jsonv2&addressdetails=1&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`,
      { headers: { 'Accept-Language': 'en' } }
    )
    if (!response.ok) throw new Error('Unable to read the address from the map')
    return response.json()
  }

  function useCurrentLocation() {
    setError('')
    if (!navigator.geolocation) {
      setError('Location access is not supported by this browser.')
      return
    }

    setBusy(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const latitude = Number(position.coords.latitude.toFixed(6))
          const longitude = Number(position.coords.longitude.toFixed(6))
          const data = await reverseGeocode(latitude, longitude)
          const geo = data?.address || {}
          setAddress(current => ({
            ...current,
            latitude,
            longitude,
            locationLabel: data?.display_name || '',
            line1: current.line1 || [geo.house_number, geo.road].filter(Boolean).join(' '),
            city: current.city || geo.city || geo.town || geo.village || geo.municipality || '',
            district: current.district || geo.state_district || geo.county || geo.district || '',
            state: current.state || geo.state || '',
            pincode: current.pincode || geo.postcode || '',
          }))
        } catch (err) {
          setError(err.message || 'Unable to fetch the current address.')
        } finally {
          setBusy(false)
        }
      },
      (error) => {
        setBusy(false)
        const messages = {
          1: 'Location permission was denied. Please allow location access and try again.',
          2: 'Your current location could not be determined.',
          3: 'Location request timed out. Please try again.',
        }
        setError(messages[error.code] || 'Unable to get your current location.')
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const order = await placeOrder({ address, paymentMethod, couponCode: couponCode.trim() || null })
      navigate('/order-confirmation', { state: { order } })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="checkout-page min-page">
      <div className="page-title-banner">
        <div className="page-width checkout-title-row"><div><div className="breadcrumbs">Home &nbsp;›&nbsp; Cart &nbsp;›&nbsp; Checkout</div><h1>Checkout</h1><p>Almost there! Complete your order and let great books find their way to you.</p></div><blockquote>“A small step<br />for a brighter you.”</blockquote></div>
      </div>

      <div className="page-width checkout-steps"><span className="active"><b>1</b> Address</span><span className="active"><b>2</b> Payment</span><span><b>3</b> Review</span></div>

      <div className="page-width checkout-layout">
        <form className="checkout-form" onSubmit={submit}>
          <section className="checkout-card">
            <div className="checkout-section-head-v7"><div><span className="checkout-section-icon">⌖</span><div><h2>Shipping Address</h2><p>Where should we deliver your books?</p></div></div><button type="button" className="location-button-v7" onClick={useCurrentLocation} disabled={busy}>{busy ? 'Locating...' : '⌖ Use current location'}</button>{addresses.length > 0 && <button type="button" className="text-btn" onClick={() => document.querySelector('.checkout-address-picker-v7')?.scrollIntoView({ behavior: 'smooth' })}>Select saved address →</button>}</div>

            {addresses.length > 0 && (
              <div className="checkout-address-picker-v7">
                {addresses.map(item => (
                  <button type="button" key={item.id} className={`checkout-address-option-v7 ${selectedAddressId === item.id ? 'selected' : ''}`} onClick={() => chooseSavedAddress(item)}>
                    <span className="checkout-radio-v7">{selectedAddressId === item.id ? '●' : '○'}</span>
                    <div><strong>{item.label || 'Address'} {item.defaultAddress && <small>Default</small>}</strong><p> {item.line1}{item.line2 ? `, ${item.line2}` : ''}, {item.city}{item.district ? `, ${item.district}` : ''} - {item.pincode}</p></div>
                  </button>
                ))}
                <button type="button" className={`checkout-address-option-v7 new ${selectedAddressId === 'NEW' ? 'selected' : ''}`} onClick={chooseNewAddress}><span>＋</span><div><strong>Use a new address</strong><p>Enter a different delivery address.</p></div></button>
              </div>
            )}

            <div className="form-grid checkout-form-grid">
              <div><label>Full Name *</label><input name="fullName" value={address.fullName || ''} onChange={change} required /></div>
              <div><label>Phone Number *</label><input name="mobile" value={address.mobile || ''} onChange={change} required /></div>
              <div className="wide"><label>Email Address *</label><input type="email" value={user?.email || ''} readOnly /><small>We’ll send order updates to this email.</small></div>
              <div className="wide"><label>Address Line *</label><input name="line1" value={address.line1 || ''} onChange={change} required /></div>
              <div><label>City *</label><input name="city" value={address.city || ''} onChange={change} required /></div>
              <div><label>District</label><input name="district" value={address.district || ''} onChange={change} /></div><div><label>State *</label><input name="state" value={address.state || ''} onChange={change} required /></div>
              <div><label>Pincode *</label><input name="pincode" value={address.pincode || ''} onChange={change} required /></div>
              <div className="wide"><label>Delivery Notes (Optional)</label><textarea name="line2" value={address.line2 || ''} onChange={change} placeholder="House name, nearby landmark, delivery instructions..." rows="3" /></div>
            </div>
          </section>

          <section className="checkout-card payment-card">
            <div className="checkout-section-head-v7"><div><span className="checkout-section-icon">▣</span><div><h2>Payment Method</h2><p>🔒 Your payment information is secure and encrypted.</p></div></div></div>
            <div className="payment-options">
              <label className={paymentMethod === 'UPI' ? 'selected' : ''}><input type="radio" name="payment" checked={paymentMethod === 'UPI'} onChange={() => setPaymentMethod('UPI')} /><span className="payment-icon">◉</span><strong>UPI</strong><small>GPay, PhonePe, Paytm</small></label>
              <label className={paymentMethod === 'COD' ? 'selected' : ''}><input type="radio" name="payment" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} /><span className="payment-icon">₹</span><strong>Cash on Delivery</strong><small>Pay when you receive</small></label>
            </div>
            {paymentMethod === 'UPI' && <div className="payment-note">Online payment will be enabled when the production payment gateway is connected.</div>}

            <div className="checkout-coupon-box">
              <label>Offer Code</label>
              <div><input value={couponCode} onChange={event => setCouponCode(event.target.value.toUpperCase())} placeholder="Enter coupon code" /></div>
              {matchedOffer && subtotal >= Number(matchedOffer.minOrderAmount || 0) && <span>✓ {matchedOffer.title} applied</span>}
            </div>
            {offers.length > 0 && <div className="checkout-offer-chips">{offers.slice(0, 4).map(offer => <button type="button" key={offer.id} onClick={() => setCouponCode(offer.code || '')}>{offer.code || offer.title}</button>)}</div>}
          </section>

          {error && <div className="form-error">{error}</div>}
        </form>

        <aside className="summary-card checkout-summary">
          <div className="checkout-summary-title"><h3>🛒 Order Summary</h3><span>{rows.length} items</span></div>
          <div className="checkout-summary-items">
            {rows.map(row => <div className="mini-order" key={row.book.id}><img src={row.book.image} alt="" /><span><strong>{row.book.title}</strong><small>{row.book.author}</small><b>₹{row.book.price} <del>{Number(row.book.originalPrice || 0) > Number(row.book.price || 0) ? `₹${row.book.originalPrice}` : ''}</del></b></span><small>Qty: {row.quantity}</small></div>)}
          </div>
          <div><span>Subtotal ({rows.length} items)</span><strong>₹{subtotal}</strong></div>
          {estimateDiscount > 0 && <div className="checkout-discount"><span>Discount</span><strong>− ₹{Math.round(estimateDiscount)}</strong></div>}
          <div><span>Shipping</span><strong className="free-text">{shipping ? `₹${shipping}` : 'Free'}</strong></div>
          <div className="summary-total"><span>Total Amount</span><strong>₹{Math.round(total)}</strong></div>
          {estimateDiscount > 0 && <div className="checkout-savings">🏷 You’re saving ₹{Math.round(estimateDiscount)} on this order!</div>}
          <button className="primary-btn full big" type="button" onClick={() => document.querySelector('.checkout-form')?.requestSubmit()} disabled={busy}>{busy ? 'Placing order...' : '🔒 Place Order →'}</button>
          <small className="checkout-terms">By placing this order, you agree to our Terms & Conditions and Privacy Policy.</small>
          <div className="summary-trust checkout-trust"><span>◆ <b>Secure Payment</b><small>Protected checkout</small></span><span>🚚 <b>Fast Delivery</b><small>Across India</small></span><span>♧ <b>Dedicated Support</b><small>We’re here to help</small></span></div>
          <Link className="continue-link" to="/cart">← Back to cart</Link>
        </aside>
      </div>
    </section>
  )
}
