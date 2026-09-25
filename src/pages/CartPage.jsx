import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useStore } from '../context/StoreContext'

export default function CartPage() {
  const { cartRows, updateCart, removeFromCart, offers } = useStore()
  const [error, setError] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [appliedCode, setAppliedCode] = useState('')
  const rows = cartRows()
  const subtotal = rows.reduce((sum, row) => sum + Number(row.book.price || 0) * Number(row.quantity || 0), 0)
  const shipping = subtotal >= 499 || subtotal === 0 ? 0 : 60

  const matchedOffer = useMemo(() => offers.find(offer => offer.code?.toLowerCase() === appliedCode.trim().toLowerCase()), [offers, appliedCode])
  const discount = matchedOffer && subtotal >= Number(matchedOffer.minOrderAmount || 0)
    ? matchedOffer.discountType === 'FIXED'
      ? Math.min(subtotal, Number(matchedOffer.discountValue || 0))
      : subtotal * Number(matchedOffer.discountValue || 0) / 100
    : 0
  const total = Math.max(0, subtotal + shipping - discount)

  async function changeQuantity(book, quantity) {
    setError('')
    try {
      if (quantity <= 0) await removeFromCart(book.id)
      else await updateCart(book.id, quantity)
    } catch (err) {
      setError(err.message)
    }
  }

  function applyCoupon() {
    const code = couponCode.trim().toUpperCase()
    const offer = offers.find(item => item.code?.toUpperCase() === code)
    if (!code) return setError('Enter a coupon code.')
    if (!offer) return setError('This coupon code is not currently active.')
    if (subtotal < Number(offer.minOrderAmount || 0)) return setError(`Minimum order ₹${offer.minOrderAmount || 0} required for this offer.`)
    setError('')
    setAppliedCode(code)
  }

  return (
    <section className="cart-page min-page">
      <div className="page-title-banner">
        <div className="page-width page-title-row"><div><div className="breadcrumbs">Home &nbsp;›&nbsp; Cart</div><h1>Your Cart</h1><p>{rows.length} {rows.length === 1 ? 'item' : 'items'} in your cart. Great choices!</p></div><blockquote>“Books you love,<br />a brighter you tomorrow.”</blockquote></div>
      </div>

      <div className="page-width">
        {error && <div className="form-error cart-error">{error}</div>}
        {rows.length ? (
          <>
            <div className="cart-layout">
              <div className="cart-list">
                {rows.map(({ book, quantity }) => (
                  <div className="cart-item" key={book.id}>
                    <img src={book.image} alt={book.title} />
                    <div className="cart-item-info">
                      <Link to={`/book/${book.id}`}>{book.title}</Link>
                      <span>{book.author}</span>
                      <small>{book.language || 'Paperback'}</small>
                      {book.featured && <em>Bestseller</em>}
                    </div>
                    <div className="cart-price-block"><strong>₹{book.price}</strong>{Number(book.originalPrice || 0) > Number(book.price || 0) && <del>₹{book.originalPrice}</del>}</div>
                    <div className="qty-box"><button onClick={() => changeQuantity(book, quantity - 1)}>−</button><span>{quantity}</span><button disabled={book.available === false || Number(book.stock || 0) <= 0} onClick={() => changeQuantity(book, quantity + 1)}>+</button></div>
                    <button className="remove-btn" aria-label="Remove item" onClick={() => removeFromCart(book.id)}>⌫</button>
                  </div>
                ))}
                <div className="cart-list-footer"><Link className="continue-link" to="/shop">← Continue Shopping</Link></div>
              </div>

              <aside className="summary-card cart-summary">
                <h3>Order Summary</h3>
                <div><span>Subtotal ({rows.length} items)</span><strong>₹{subtotal}</strong></div>
                <div><span>Delivery Charge<small>{shipping ? 'Free above ₹499' : 'Free delivery applied'}</small></span><strong className={shipping ? '' : 'free-text'}>{shipping ? `₹${shipping}` : 'FREE'}</strong></div>
                {discount > 0 && <div><span>Discount<small>{appliedCode} applied</small></span><strong className="free-text">− ₹{Math.round(discount)}</strong></div>}
                <div className="summary-total"><span>Total Amount</span><strong>₹{Math.round(total)}</strong></div>

                <div className="cart-coupon"><label>Have a coupon code?</label><div><input value={couponCode} onChange={event => setCouponCode(event.target.value.toUpperCase())} placeholder="Enter coupon" /><button type="button" onClick={applyCoupon}>Apply</button></div>{discount > 0 && <small>✓ Coupon applied! You saved ₹{Math.round(discount)}.</small>}</div>

                <Link className="primary-btn full big" to={`/checkout${appliedCode ? `?coupon=${encodeURIComponent(appliedCode)}` : ''}`}>🔒 Proceed to Checkout »</Link>
                <div className="summary-trust"><span>◆ Secure Checkout</span><span>🚚 Fast Delivery</span><span>♧ Dedicated Support</span></div>
              </aside>
            </div>

            <div className="cart-recommend-note"><span>🌿</span><div><strong>More books, more journeys.</strong><p>Explore the catalogue and add another great read.</p></div><Link to="/shop">View all books »</Link></div>
          </>
        ) : (
          <div className="empty-state"><h3>Your cart is empty</h3><p>Add a few books and they will appear here.</p><Link className="primary-btn inline-btn" to="/shop">Shop Books</Link></div>
        )}
      </div>
    </section>
  )
}
