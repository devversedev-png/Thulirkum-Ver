import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useStore } from '../context/StoreContext'

export default function BookCard({ book, variant = 'default' }) {
  const { account, addToCart, toggleWishlist, backendReady } = useStore()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const inWishlist = account?.wishlist?.includes(book.id)
  const shopCard = variant === 'shop'
  const available = book.available !== false && Number(book.stock || 0) > 0
  const discount = Number(book.originalPrice || 0) > Number(book.price || 0)
    ? Math.round(((book.originalPrice - book.price) / book.originalPrice) * 100)
    : 0

  async function cartClick() {
    if (!available || busy) return
    if (!backendReady && String(book.id).startsWith('demo-')) {
      setError('Cart is temporarily unavailable.')
      return
    }
    setBusy(true)
    setError('')
    try { await addToCart(book.id, 1) }
    catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }

  async function wishClick() {
    if (!backendReady && String(book.id).startsWith('demo-')) return
    await toggleWishlist(book.id)
  }

  return (
    <article className={`book-card ${shopCard ? 'shop-book-card' : ''} ${!available ? 'book-card-out' : ''}`}>
      <div className="market-card-topline">
        {book.newArrival ? <span className="market-new-label">New</span> : discount > 0 ? <span className="market-discount-label">{discount}% OFF</span> : book.featured ? <span className="market-bestseller-label">Bestseller</span> : <span />}
        <button className={`market-wishlist-button ${inWishlist ? 'selected' : ''}`} onClick={wishClick} title="Wishlist" aria-label="Add to wishlist">{inWishlist ? '♥' : '♡'}</button>
      </div>

      <Link to={`/book/${book.id}`} className="cover-wrap market-cover-wrap">
        <img src={book.image} alt={book.title} />
        {!available && <span className="out-cover-badge">Out of Stock</span>}
      </Link>

      <div className="book-card-body market-book-body">
        <Link to={`/book/${book.id}`} className="book-title market-book-title">{book.title}</Link>
        <div className="muted market-book-author">{book.author}</div>
        <div className="market-rating-row"><span>★ {Number(book.rating || 0).toFixed(1)}</span><small>({book.reviewCount || 0})</small></div>
        <div className="price-line market-price-line">
          <strong>₹{book.price}</strong>
          {Number(book.originalPrice || 0) > Number(book.price || 0) && <del>₹{book.originalPrice}</del>}
        </div>
        <button className="market-cart-button" onClick={cartClick} disabled={!available || busy}>
          <span>🛒</span> {!available ? 'Out of Stock' : busy ? 'Adding...' : 'Add to Cart'}
        </button>
        {error && <small className="card-error">{error}</small>}
      </div>
    </article>
  )
}
