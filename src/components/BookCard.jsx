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
    <article className={`book-card ${shopCard ? 'shop-book-card' : ''} ${!available ? 'book-card-out' : ''}`}>
      <div className="book-card-actions single-action">
        <button className={inWishlist ? 'selected' : ''} onClick={wishClick} title="Wishlist" aria-label="Add to wishlist">♡</button>
      </div>

      <Link to={`/book/${book.id}`} className="cover-wrap">
        <img src={book.image} alt={book.title} />
        {!available && <span className="out-cover-badge">Out of Stock</span>}
      </Link>

      <div className="book-card-body">
        <Link to={`/book/${book.id}`} className="book-title">{book.title}</Link>
        <div className="muted">{book.author}</div>
        <div className="rating">★ {book.rating} <span>({book.reviewCount})</span></div>
        <div className="price-line">
          <strong>₹{book.price}</strong>
          {book.originalPrice > book.price && <del>₹{book.originalPrice}</del>}
        </div>
        <div className={`stock-mini ${available ? '' : 'stock-mini-out'}`}>
          {available ? `${book.stock} available` : 'Currently unavailable'}
        </div>
        <button className="primary-btn full" onClick={cartClick} disabled={!available || busy}>
          {!available ? 'Out of Stock' : busy ? 'Adding...' : '🛒 Add to Cart'}
        </button>
        {error && <small className="card-error">{error}</small>}
      </div>
    </article>
  )
}
