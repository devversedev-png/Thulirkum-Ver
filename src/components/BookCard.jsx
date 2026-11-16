import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import CartControl from './CartControl'
import { getPricing, formatMoney } from '../utils/pricing'
import { cashbackForBook } from '../utils/cashback'
import { activeBundleForBook, paidBooksFor, giftBooksFor, describeBookLines } from '../utils/buyGetOffers'

export default function BookCard({ book, variant = 'default' }) {
  const {
    account,
    toggleWishlist,
    backendReady,
    homeSections,
    offers,
    books,
  } = useStore()

  const [error, setError] = useState('')

  const inWishlist = account?.wishlist?.includes(book.id)

  const homeRefCard = variant === 'home-ref'
  const shopCard = variant === 'shop'

  const available =
    book.available !== false &&
    Number(book.stock || 0) > 0

  // Price, original price and badge all come from the book's own backend data,
  // so they cannot disagree with each other or with the cart and checkout.
  const {
    selling: sellingPrice,
    original: originalPrice,
    hasDiscount,
    percent,
  } = getPricing(book)

  const discount = hasDiscount ? percent : 0
  const buyGetOffer = activeBundleForBook(book.id, offers)
  const giftBook = books.find(item => String(item.id) === String(buyGetOffer?.getBookId))
  const cashback = cashbackForBook(book, homeSections)

  async function wishClick() {
    if (!backendReady && String(book.id).startsWith('demo-')) {
      return
    }

    await toggleWishlist(book.id)
  }

  const safeHomeBadge =
    book.homeBadge &&
    !/%\s*OFF/i.test(String(book.homeBadge))
      ? book.homeBadge
      : ''

  const label =
    discount > 0
      ? `${discount}% OFF`
      : book.newArrival
        ? 'New'
        : safeHomeBadge ||
          (book.featured ? 'Bestseller' : '')

  const labelClass = label.toLowerCase().includes('new')
    ? 'badge-new'
    : label.toLowerCase().includes('popular')
      ? 'badge-popular'
      : 'badge-green'

  const formatPrice = formatMoney

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
      {/* Badge and wishlist */}
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
          type="button"
        >
          {inWishlist ? '♥' : '♡'}
        </button>
      </div>

      {/* Book cover */}
      <Link
        to={`/book/${book.id}`}
        className="cover-wrap market-cover-wrap"
      >
        <img
          src={book.image}
          alt={book.title}
          loading="lazy"
          onError={event => {
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

      {/* Book information */}
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
          <strong>₹{formatPrice(sellingPrice)}</strong>

          {discount > 0 && (
            <del>₹{formatPrice(originalPrice)}</del>
          )}

          {discount > 0 && (
            <span
              className="price-discount-percent"
              style={{
                color: '#258142',
                fontSize: '0.8em',
                fontWeight: 700,
                whiteSpace: 'nowrap',
              }}
            >
              {discount}% off
            </span>
          )}
        </div>

        {cashback && available && (
          <div className="book-cashback-note" title="Up to this amount per paid copy, after eligible online payment. Final reward depends on wallet redemption and other offers.">
            <span aria-hidden="true">✦</span>
            <span>Earn up to <strong>₹{formatMoney(cashback.amount)} cashback</strong>{cashback.type === 'PERCENT' ? ` (${cashback.value}%)` : ''}</span>
          </div>
        )}
        {buyGetOffer && <span className="book-bogo-note" title={`Buy ${describeBookLines(paidBooksFor(buyGetOffer), books)} to receive ${describeBookLines(giftBooksFor(buyGetOffer), books)} free`}>🎁 Free-book bundle available</span>}

        <CartControl
          book={book}
          available={available}
          guard={() => {
            if (
              !backendReady &&
              String(book.id).startsWith('demo-')
            ) {
              setError('Cart is temporarily unavailable.')
              return false
            }

            setError('')
            return true
          }}
          onError={err => setError(err.message)}
        />

        {error && (
          <small className="card-error">
            {error}
          </small>
        )}
      </div>
    </article>
  )
}