import { useEffect, useMemo, useState } from 'react'
import { Navigate, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'

function blankAddress(user) {
  return {
    label: 'Home',
    fullName: user?.name || '',
    mobile: user?.mobile || '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    latitude: null,
    longitude: null,
    locationLabel: '',
    defaultAddress: false
  }
}

export default function CheckoutPage() {
  const { user } = useAuth()
  const { cartRows, placeOrder, account, offers } = useStore()
  const navigate = useNavigate()
  const rows = cartRows()
  const addresses = account?.addresses || []
  const preferredAddress = addresses.find(item => item.defaultAddress) || addresses[0]
  const [selectedAddressId, setSelectedAddressId] = useState(preferredAddress?.id || 'NEW')
  const [address, setAddress] = useState(preferredAddress ? { ...preferredAddress } : blankAddress(user))
  const [paymentMethod, setPaymentMethod] = useState('COD')
  const [couponCode, setCouponCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!addresses.length) return
    const current = addresses.find(item => item.id === selectedAddressId)
    if (current) setAddress({ ...current })
  }, [account?.addresses])

  const subtotal = rows.reduce((sum, row) => sum + row.book.price * row.quantity, 0)
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
    <section className="page-width checkout-page min-page checkout-page-v7">
      <div className="checkout-steps"><span className="active">1 Address</span><span>2 Delivery</span><span>3 Payment</span><span>4 Review</span></div>
      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={submit}>
          <div className="checkout-section-head-v7"><div><span className="eyebrow">DELIVERY</span><h2>Delivery Address</h2></div><Link to="/account#address">Manage saved addresses</Link></div>

          {addresses.length > 0 && (
            <div className="checkout-address-picker-v7">
              {addresses.map(item => (
                <button type="button" key={item.id} className={`checkout-address-option-v7 ${selectedAddressId === item.id ? 'selected' : ''}`} onClick={() => chooseSavedAddress(item)}>
                  <span className="checkout-radio-v7">{selectedAddressId === item.id ? '●' : '○'}</span>
                  <div><strong>{item.label || 'Address'} {item.defaultAddress && <small>Default</small>}</strong><p>{item.line1}{item.line2 ? `, ${item.line2}` : ''}, {item.city} - {item.pincode}</p></div>
                </button>
              ))}
              <button type="button" className={`checkout-address-option-v7 new ${selectedAddressId === 'NEW' ? 'selected' : ''}`} onClick={chooseNewAddress}><span>＋</span><div><strong>Use a new address</strong><p>This address will be saved to your account after checkout.</p></div></button>
            </div>
          )}

          <div className="form-grid">
            <div><label>Full Name</label><input name="fullName" value={address.fullName} onChange={change} required /></div>
            <div><label>Mobile Number</label><input name="mobile" value={address.mobile} onChange={change} required /></div>
            <div className="wide"><label>Address Line 1</label><input name="line1" value={address.line1} onChange={change} required /></div>
            <div className="wide"><label>Address Line 2</label><input name="line2" value={address.line2} onChange={change} /></div>
            <div><label>City</label><input name="city" value={address.city} onChange={change} required /></div>
            <div><label>State</label><input name="state" value={address.state} onChange={change} required /></div>
            <div><label>Pincode</label><input name="pincode" value={address.pincode} onChange={change} required /></div>
          </div>

          <h2 className="payment-title">Payment Method</h2>
          <div className="payment-options">
            <label><input type="radio" name="payment" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} /> Cash on Delivery</label>
            <label><input type="radio" name="payment" checked={paymentMethod === 'UPI'} onChange={() => setPaymentMethod('UPI')} /> UPI / Online Payment</label>
          </div>
          {paymentMethod === 'UPI' && <div className="payment-note">Online payment will be enabled when the production payment gateway is connected.</div>}

          <h2 className="payment-title">Offer Code</h2>
          <div className="checkout-coupon-box">
            <input value={couponCode} onChange={event => setCouponCode(event.target.value.toUpperCase())} placeholder="Enter coupon code" />
            {matchedOffer && subtotal >= Number(matchedOffer.minOrderAmount || 0) && <span>✓ {matchedOffer.title} applied</span>}
          </div>
          {offers.length > 0 && (
            <div className="checkout-offer-chips">
              {offers.slice(0, 4).map(offer => <button type="button" key={offer.id} onClick={() => setCouponCode(offer.code || '')}>{offer.code || offer.title}</button>)}
            </div>
          )}

          {error && <div className="form-error">{error}</div>}
          <button className="primary-btn big" disabled={busy}>{busy ? 'Placing order...' : 'Place Order →'}</button>
        </form>

        <aside className="summary-card checkout-summary">
          <h3>Your Order</h3>
          {rows.map(row => <div className="mini-order" key={row.book.id}><span>{row.book.title} × {row.quantity}</span><strong>₹{row.book.price * row.quantity}</strong></div>)}
          <div><span>Subtotal</span><strong>₹{subtotal}</strong></div>
          <div><span>Shipping</span><strong>{shipping ? `₹${shipping}` : 'Free'}</strong></div>
          {estimateDiscount > 0 && <div className="checkout-discount"><span>Offer Discount</span><strong>− ₹{Math.round(estimateDiscount)}</strong></div>}
          <div className="summary-total"><span>Total</span><strong>₹{Math.round(total)}</strong></div>
        </aside>
      </div>
    </section>
  )
}
