import { useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useStore } from '../context/StoreContext'

const emptyAddress = {
  fullName: '',
  mobile: '',
  line1: '',
  line2: '',
  city: '',
  state: 'Tamil Nadu',
  pincode: ''
}

export default function CheckoutPage() {
  const { cartRows, placeOrder, account, offers } = useStore()
  const navigate = useNavigate()
  const rows = cartRows()
  const firstAddress = account?.addresses?.[0]
  const [address, setAddress] = useState(firstAddress || emptyAddress)
  const [paymentMethod, setPaymentMethod] = useState('COD')
  const [couponCode, setCouponCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

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
    <section className="page-width checkout-page min-page">
      <div className="checkout-steps"><span className="active">1 Address</span><span>2 Delivery</span><span>3 Payment</span><span>4 Review</span></div>
      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={submit}>
          <h2>Delivery Address</h2>
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
          {paymentMethod === 'UPI' && <div className="payment-note">Payment gateway credentials are not included yet. Connect Razorpay or another gateway before production launch.</div>}

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
