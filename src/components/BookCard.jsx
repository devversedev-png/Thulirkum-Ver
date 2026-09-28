import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext'

export default function BookCard({ book, variant = 'default' }) {
  const {
    account,
    addToCart,
    toggleWishlist,
    backendReady,
  } = useStore()

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [added, setAdded] = useState(false)

  const inWishlist = account?.wishlist?.includes(book.id)

  const homeRefCard = variant === 'home-ref'
  const shopCard = variant === 'shop'

  const available =
    book.available !== false &&
    Number(book.stock || 0) > 0

  const discount =
    Number(book.originalPrice || 0) > Number(book.price || 0)
      ? Math.round(
          ((book.originalPrice - book.price) / book.originalPrice) * 100
        )
      : 0

  async function cartClick() {
    if (!available || busy) return

    if (!backendReady && String(book.id).startsWith('demo-')) {
      setError('Cart is temporarily unavailable.')
      return
    }

    setBusy(true)
    setError('')
    setAdded(false)

    /*
     * addToCart is optimistic: StoreContext updates the local cart
     * before the backend request starts. Do not keep the button locked
     * for the full network round-trip (especially when the backend is
     * waking up on Render). The request continues in the background.
     */
    const request = addToCart(book.id, 1)

    setBusy(false)
    setAdded(true)

    window.setTimeout(() => {
      setAdded(false)
    }, 700)

    request.catch(err => {
      setAdded(false)
      setError(err.message)
    })
  }

  async function wishClick() {
    if (!backendReady && String(book.id).startsWith('demo-')) return

    await toggleWishlist(book.id)
  }

  const label =
    book.homeBadge ||
    (book.newArrival
      ? 'New'
      : discount >= 15
        ? `${discount}% OFF`
        : book.featured
          ? 'Bestseller'
          : '')

  const labelClass = label.toLowerCase().includes('new')
    ? 'badge-new'
    : label.toLowerCase().includes('popular')
      ? 'badge-popular'
      : 'badge-green'

  return (
    <article
      className={[
        'book-card',
        shopCard ? 'shop-book-card' : '',
        homeRefCard ? 'home-ref-book-card' : '',
        !available ? 'book-card-out' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Top Badge + Wishlist */}
      <div className="market-card-topline">
        {label ? (
          <span className={`market-discount-label ${labelClass}`}>
            {label}
          </span>
        ) : (
          <span />
        )}

        <button
          className={`market-wishlist-button ${
            inWishlist ? 'selected' : ''
          }`}
          onClick={wishClick}
          title="Wishlist"
          aria-label="Add to wishlist"
        >
          {inWishlist ? '♥' : '♡'}
        </button>
      </div>

      {/* Book Cover */}
      <Link
        to={`/book/${book.id}`}
        className="cover-wrap market-cover-wrap"
      >
        <img
          src={book.image}
          alt={book.title}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.onerror = null
            event.currentTarget.src =
              book.fallbackImage || '/covers/atomic-habits.svg'
          }}
        />

        {!available && (
          <span className="out-cover-badge">
            Out of Stock
          </span>
        )}
      </Link>

      {/* Book Information */}
      <div className="book-card-body market-book-body">
        <Link
          to={`/book/${book.id}`}
          className="book-title market-book-title"
        >
          {book.title}
        </Link>

        <div className="muted market-book-author">
          {book.author}
        </div>

        <div className="market-rating-row">
          <span>
            ★ {Number(book.rating || 0).toFixed(1)}
          </span>

          <small>
            ({book.reviewCount || 0})
          </small>
        </div>

        <div className="price-line market-price-line">
          <strong>₹{book.price}</strong>

          {Number(book.originalPrice || 0) >
            Number(book.price || 0) && (
            <del>₹{book.originalPrice}</del>
          )}
        </div>

        <button
          className="market-cart-button"
          onClick={cartClick}
          disabled={!available || busy}
        >
          {!available
            ? 'Out of Stock'
            : added
              ? 'Added ✓'
              : busy
                ? 'Adding...'
                : 'Add to Cart'}
        </button>

        {error && (
          <small className="card-error">
            {error}
          </small>
        )}
      </div>
    </article>
  )
}

