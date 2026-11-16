import { useMemo, useState } from 'react'
import { Wallet } from 'lucide-react'
import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
} from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'
import { formatMoney } from '../utils/pricing'

const preferredNav = [
  'Children Books',
  'Competitive Exams',
  'Fiction',
  'Self Help',
  'Tamil Literature',
]

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()

  const { user } = useAuth()
  const { account, books } = useStore()

  const initialQuery =
    new URLSearchParams(location.search).get('q') || ''

  const activeCategory =
    new URLSearchParams(location.search).get('category') || ''

  const [term, setTerm] = useState(initialQuery)
  const [open, setOpen] = useState(false)

  const cartCount =
    account?.cart?.reduce(
      (sum, item) =>
        sum + Number(item.quantity || 0),
      0
    ) || 0

  const wishlistCount =
    account?.wishlist?.length || 0

  const categories = preferredNav

  const suggestions = useMemo(() => {
    const text = term.trim().toLowerCase()

    if (!text) return []

    return books
      .map((book) => {
        const title =
          (book.title || '').toLowerCase()

        const author =
          (book.author || '').toLowerCase()

        const category =
          (book.category || '').toLowerCase()

        const publisher =
          (book.publisher || '').toLowerCase()

        const isbn =
          (book.isbn || '').toLowerCase()

        const score = title.startsWith(text)
          ? 0
          : author.startsWith(text)
            ? 1
            : category.startsWith(text)
              ? 2
              : isbn.startsWith(text)
                ? 3
                : 4

        const match =
          `${title} ${author} ${category} ${publisher} ${isbn}`.includes(text)

        return {
          book,
          score,
          match,
        }
      })
      .filter((item) => item.match)
      .sort(
        (a, b) =>
          a.score - b.score ||
          a.book.title.localeCompare(b.book.title)
      )
      .slice(0, 6)
      .map((item) => item.book)
  }, [books, term])

  function submit(event) {
    event?.preventDefault?.()

    const value = term.trim()

    setOpen(false)

    navigate(
      value
        ? `/shop?q=${encodeURIComponent(value)}`
        : '/shop'
    )
  }

  function change(event) {
    const value = event.target.value

    setTerm(value)
    setOpen(Boolean(value.trim()))

    if (location.pathname === '/shop') {
      const next =
        new URLSearchParams(location.search)

      if (value.trim()) {
        next.set('q', value.trim())
      } else {
        next.delete('q')
      }

      next.delete('page')

      navigate(
        `/shop${
          next.toString()
            ? `?${next.toString()}`
            : ''
        }`,
        {
          replace: true,
        }
      )
    }
  }

  function clearSearch() {
    setTerm('')
    setOpen(false)

    if (location.pathname === '/shop') {
      const next =
        new URLSearchParams(location.search)

      next.delete('q')
      next.delete('page')

      navigate(
        `/shop${
          next.toString()
            ? `?${next.toString()}`
            : ''
        }`,
        {
          replace: true,
        }
      )
    }
  }

  function choose(book) {
    setTerm(book.title)
    setOpen(false)
    navigate(`/book/${book.id}`)
  }

  return (
    <div
      className="commerce-sticky-shell"
      id="top"
    >
      {/* Header */}
      <header className="market-header">
        {/* Logo */}
        <Link
          className="market-brand"
          to="/home"
          aria-label="Thulirkum Ver home"
        >
          <img
            src="/logo.png"
            alt="Thulirkum Ver Book Store"
          />
        </Link>

        {/* Search */}
        <div className="smart-search-wrap market-search-wrap">
          <form
            className="market-search"
            onSubmit={submit}
          >
            <input
              value={term}
              onChange={change}
              onFocus={() =>
                term.trim() && setOpen(true)
              }
              onBlur={() =>
                setTimeout(
                  () => setOpen(false),
                  160
                )
              }
              placeholder="Search books by title, author, ISBN or category..."
              autoComplete="off"
            />

            {term && (
              <button
                type="button"
                className="market-search-clear"
                aria-label="Clear search"
                onMouseDown={(event) =>
                  event.preventDefault()
                }
                onClick={clearSearch}
              >
                ×
              </button>
            )}

            <button
              type="submit"
              className="market-search-button"
            >
              <span>⌕</span>
              Search
            </button>
          </form>

          {/* Search Suggestions */}
          {open && (
            <div className="search-suggestions market-search-suggestions">
              <div className="search-suggestion-head">
                <span>
                  Search suggestions
                </span>

                <small>
                  {suggestions.length
                    ? `${suggestions.length} matches`
                    : 'No exact matches'}
                </small>
              </div>

              {suggestions.length ? (
                suggestions.map((book) => (
                  <button
                    key={book.id}
                    className="search-suggestion-row"
                    type="button"
                    onMouseDown={() =>
                      choose(book)
                    }
                  >
                    <img
                      src={book.image}
                      alt=""
                    />

                    <span className="search-suggestion-copy">
                      <strong>
                        {book.title}
                      </strong>

                      <small>
                        {book.author} ·{' '}
                        {book.category}
                      </small>
                    </span>

                    <span className="search-suggestion-meta">
                      <b>
                        ₹{formatMoney(book.price)}
                      </b>

                      <small
                        className={
                          book.available !== false &&
                          book.stock > 0
                            ? 'available'
                            : 'unavailable'
                        }
                      >
                        {book.available !== false &&
                        book.stock > 0
                          ? 'In stock'
                          : 'Out of stock'}
                      </small>
                    </span>
                  </button>
                ))
              ) : (
                <button
                  className="search-all-row"
                  type="button"
                  onMouseDown={submit}
                >
                  Search “{term}” in all books
                </button>
              )}

              {suggestions.length > 0 && (
                <button
                  className="search-all-row"
                  type="button"
                  onMouseDown={submit}
                >
                  View all results for “{term}”
                </button>
              )}
            </div>
          )}
        </div>

        {/* Header Actions */}
        <nav className="market-header-actions">
          {/* Wishlist */}
          <NavLink
            to="/wishlist"
            className="market-action-link"
          >
            <span className="market-action-icon">
              ♡
            </span>

            <strong>
              Wishlist
            </strong>

            {wishlistCount > 0 && (
              <b className="market-count-badge">
                {wishlistCount}
              </b>
            )}
          </NavLink>

          {/* Cart */}
          <NavLink
            to="/cart"
            className="market-action-link"
          >
            <span className="market-action-icon">
              🛒
            </span>

            <strong>
              Cart
            </strong>

            {cartCount > 0 && (
              <b className="market-count-badge">
                {cartCount}
              </b>
            )}
          </NavLink>

          {/* Wallet — opens the existing protected customer wallet page */}
          <NavLink
            to="/wallet"
            className="market-action-link market-wallet-link"
            aria-label="My Wallet"
            title="My Wallet"
          >
            <span className="market-action-icon market-wallet-icon" aria-hidden="true">
              <Wallet size={29} strokeWidth={1.8} />
            </span>
            <strong>Wallet</strong>
          </NavLink>

          {/* Account */}
          <NavLink
            to="/account"
            className="market-action-link account-action"
          >
            <span className="market-action-icon">
              ♙
            </span>

            <span>
              <small>
                Hello,{' '}
                {user?.name?.split(' ')[0] ||
                  'Reader'}
              </small>

              <strong>
                Account
              </strong>
            </span>
          </NavLink>
        </nav>
      </header>

      {/* Category Navigation */}
      <div className="market-category-nav">
        <div className="market-category-inner">
          <NavLink
            className="market-home-link"
            to="/home"
          >
            Home
          </NavLink>

          <Link
            className={`market-all-link ${
              location.pathname === '/shop' &&
              !activeCategory
                ? 'active'
                : ''
            }`}
            to="/shop"
          >
            All Books
          </Link>

          {categories.map((category) => (
            <Link
              key={category}
              className={
                location.pathname === '/shop' &&
                activeCategory === category
                  ? 'active'
                  : ''
              }
              to={`/shop?category=${encodeURIComponent(
                category
              )}`}
            >
              {category}
            </Link>
          ))}

          <NavLink
            className="market-offer-link"
            to="/offers"
          >
            🎁 Offers
          </NavLink>
        </div>
      </div>
    </div>
  )
}

