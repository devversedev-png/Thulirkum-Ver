import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useStore } from '../context/StoreContext'

export default function BookCard({ book, variant = 'default' }) {
  const { account, addToCart, toggleWishlist, backendReady } = useStore()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const inWishlist = account?.wishlist?.includes(book.id)
  const shopCard = variant === 'shop'
  const available = book.available !== false && book.stock > 0
  const discount = book.originalPrice > book.price
    ? Math.round(((book.originalPrice - book.price) / book.originalPrice) * 100)
    : 0

  async function cartClick() {
    if (!available || busy) return
    if (!backendReady && book.id.startsWith('demo-')) {
      alert('Connect the Spring Boot backend and MongoDB Atlas to use cart actions.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await addToCart(book.id, 1)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function wishClick() {
    if (!backendReady && book.id.startsWith('demo-')) return
    await toggleWishlist(book.id)
  }

  return (
    <article className={`book-card market-book-card ${shopCard ? 'shop-book-card market-shop-card' : ''} ${!available ? 'book-card-out' : ''}`}>
      <div className="market-card-topline">
        {book.newArrival ? <span className="market-new-label">NEW</span> : discount > 0 ? <span className="market-discount-label">{discount}% OFF</span> : <span />}
        <button className={`market-wishlist-button ${inWishlist ? 'selected' : ''}`} onClick={wishClick} title="Wishlist" aria-label="Add to wishlist">♡</button>
      </div>

      <Link to={`/book/${book.id}`} className="cover-wrap market-cover-wrap">
        <img src={book.image} alt={book.title} />
        {!available && <span className="out-cover-badge">Out of Stock</span>}
      </Link>

      <div className="book-card-body market-book-body">
        <Link to={`/book/${book.id}`} className="book-title market-book-title">{book.title}</Link>
        <div className="muted market-book-author">by {book.author}</div>
        <div className="market-rating-row">
          <span className="market-rating-pill">★ {book.rating}</span>
          <small>{book.reviewCount || 0} ratings</small>
        </div>
        <div className="price-line market-price-line">
          <strong>₹{book.price}</strong>
          {book.originalPrice > book.price && <del>₹{book.originalPrice}</del>}
          {discount > 0 && <span>{discount}% off</span>}
        </div>
        <div className="market-delivery-line">{available ? 'Free delivery eligible' : 'Currently unavailable'}</div>
        <div className={`stock-mini market-stock-mini ${available ? '' : 'stock-mini-out'}`}>
          {available ? (book.stock <= 5 ? `Only ${book.stock} left in stock` : 'In stock') : 'Out of stock'}
        </div>
        <button className="market-cart-button" onClick={cartClick} disabled={!available || busy}>
          {!available ? 'Out of Stock' : busy ? 'Adding...' : 'Add to Cart'}
        </button>
        {error && <small className="card-error">{error}</small>}
      </div>
    </article>
  )
}
