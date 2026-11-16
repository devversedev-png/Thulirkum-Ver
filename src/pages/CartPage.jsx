import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useStore } from '../context/StoreContext'
import { getPricing, formatMoney } from '../utils/pricing'
import { activeBundleForBook, previewBuyGet, paidBooksFor, giftBooksFor, describeBookLines } from '../utils/buyGetOffers'
import { useDeliverySettings, shippingPaiseFor } from '../utils/delivery'

export default function CartPage() {
  const {
    cartRows,
    updateCart,
    removeFromCart,
    offers,
    account,
    accountReady,
    accountLoading,
    accountError,
    catalogueReady,
    loadAccount,
    loadBooks,
    homeSections,
    books,
  } = useStore()
  const deliverySettings = useDeliverySettings()
  const [error, setError] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [appliedCode, setAppliedCode] = useState('')

  // Refresh live catalogue prices whenever the cart is opened.
  useEffect(() => {
    void loadBooks(true)
  }, [])

  const rows = cartRows()
  const hasSavedCartItems = Boolean(account?.cart?.length)
  const cartDataStillLoading = !accountReady || !catalogueReady || accountLoading
  const cartBooksNotResolved = hasSavedCartItems && rows.length === 0
  const hydratingCart = cartDataStillLoading || cartBooksNotResolved
  const subtotal = rows.reduce((sum, row) => sum + Number(row.book.price || 0) * Number(row.quantity || 0), 0)
  const buyGet = previewBuyGet(rows, offers, books)
  const bogoDiscount = buyGet.giftValuePaise / 100
  const merchandiseDue = subtotal
  const shipping = shippingPaiseFor(merchandiseDue, deliverySettings) / 100

  const matchedOffer = useMemo(() => offers.find(offer => offer.offerType !== 'BUY_GET' && offer.code && offer.code.toLowerCase() === appliedCode.trim().toLowerCase()), [offers, appliedCode])
  const discount = matchedOffer && merchandiseDue >= Number(matchedOffer.minOrderAmount || 0)
    ? matchedOffer.discountType === 'FIXED'
      ? Math.min(merchandiseDue, Number(matchedOffer.discountValue || 0))
      : merchandiseDue * Number(matchedOffer.discountValue || 0) / 100
    : 0
  const total = Math.max(0, merchandiseDue + shipping - discount)

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
    const offer = offers.find(item => item.offerType !== 'BUY_GET' && item.code?.toUpperCase() === code)
    if (!code) return setError('Enter a coupon code.')
    if (!offer) return setError('This coupon code is not currently active.')
    if (merchandiseDue < Number(offer.minOrderAmount || 0)) return setError(`Minimum order ₹${offer.minOrderAmount || 0} required for this offer.`)
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
        {hydratingCart ? (
          <div className="empty-state cart-loading-state">
            <h3>Restoring your cart…</h3>
            <p>
              {cartBooksNotResolved
                ? 'Your saved cart was found. Loading the book details now.'
                : 'Your saved cart is being restored.'}
            </p>
            <span className="cart-loading-spinner" aria-hidden="true" />
          </div>
        ) : accountError && rows.length === 0 ? (
          <div className="empty-state cart-loading-state">
            <h3>We could not restore your cart</h3>
            <p>{accountError}</p>
            <button
              type="button"
              className="primary-btn inline-btn"
              onClick={() => loadAccount(true)}
            >
              Try Again
            </button>
          </div>
        ) : rows.length ? (
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
                      {activeBundleForBook(book.id, offers) && <small className="book-bogo-note">🎁 Bundle: buy {describeBookLines(paidBooksFor(activeBundleForBook(book.id, offers)), books)} to unlock free books</small>}
                    </div>
                    <div className="cart-price-block">
                      <span className="cart-price-unit">Price per copy: ₹{formatMoney(book.price)}</span>
                      {getPricing(book).hasDiscount && <del>MRP ₹{formatMoney(getPricing(book).original)}</del>}
                      <span className="cart-price-formula">{quantity} {quantity === 1 ? 'copy' : 'copies'} at ₹{formatMoney(book.price)} each</span>
                      <strong className="cart-item-line-total">Item total: ₹{formatMoney(Math.round(Number(book.price || 0) * quantity * 100) / 100)}</strong>
                    </div>
                    <div className="qty-box"><button onClick={() => changeQuantity(book, quantity - 1)}>−</button><span>{quantity}</span><button disabled={book.available === false || Number(book.stock || 0) <= 0} onClick={() => changeQuantity(book, quantity + 1)}>+</button></div>
                    <button className="remove-btn" aria-label="Remove item" onClick={() => removeFromCart(book.id)}>⌫</button>
                  </div>
                ))}
                <div className="cart-list-footer"><Link className="continue-link" to="/shop">← Continue Shopping</Link></div>
              </div>

              <aside className="summary-card cart-summary">
                <h3>Order Summary</h3>
                <div><span>Books and gift copies<small>Value before the free-book offer</small></span><strong>₹{(subtotal + bogoDiscount).toFixed(2)}</strong></div>
                {buyGet.summaries.map(({ offer, count, giftBook }, index) => (
                  <div className="cart-offer-detail" key={`${offer.id || offer.buyBookId}-${index}`}>
                    <span>🎁 Free-book offer<small>Buy {describeBookLines(paidBooksFor(offer), books)} — receive {describeBookLines(giftBooksFor(offer), books)} free</small><small>Free copies of this title: {count}</small></span>
                    <strong className="free-text">FREE</strong>
                  </div>
                ))}
                {bogoDiscount > 0 && <div className="checkout-discount"><span>Free-book offer savings<small>Value of the complimentary copies</small></span><strong className="free-text">− ₹{bogoDiscount.toFixed(2)}</strong></div>}
                <div><span>Delivery Charge<small>{shipping ? `Free above ₹${(deliverySettings.freeDeliveryThresholdPaise / 100).toLocaleString('en-IN')}` : 'Free delivery applied'}</small></span><strong className={shipping ? '' : 'free-text'}>{shipping ? `₹${shipping}` : 'FREE'}</strong></div>
                {discount > 0 && <div><span>Discount<small>{appliedCode} applied</small></span><strong className="free-text">− ₹{Math.round(discount)}</strong></div>}
                <div className="summary-total"><span>Estimated Total</span><strong>₹{total.toFixed(2)}</strong></div>
                {bogoDiscount > 0 && <small>Free books will be added automatically to your order. Final gift stock and pricing are verified at checkout.</small>}

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
