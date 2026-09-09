import { useMemo, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'

const quickCategories = [
  'Tamil Literature', 'Fiction', 'Children Books', 'Educational', 'Spiritual', 'Biography', 'Competitive Exams', 'Self Help'
]

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { account, books } = useStore()
  const initialQuery = new URLSearchParams(location.search).get('q') || ''
  const [term, setTerm] = useState(initialQuery)
  const [open, setOpen] = useState(false)

  const cartCount = account?.cart?.reduce((sum, item) => sum + item.quantity, 0) || 0
  const wishlistCount = account?.wishlist?.length || 0

  const suggestions = useMemo(() => {
    const text = term.trim().toLowerCase()
    if (!text) return []

    return books
      .map(book => {
        const title = (book.title || '').toLowerCase()
        const author = (book.author || '').toLowerCase()
        const category = (book.category || '').toLowerCase()
        const publisher = (book.publisher || '').toLowerCase()
        const score = title.startsWith(text) ? 0 : author.startsWith(text) ? 1 : category.startsWith(text) ? 2 : 3
        return { book, score, match: `${title} ${author} ${category} ${publisher}`.includes(text) }
      })
      .filter(item => item.match)
      .sort((a, b) => a.score - b.score || a.book.title.localeCompare(b.book.title))
      .slice(0, 7)
      .map(item => item.book)
  }, [books, term])

  function submit(event) {
    event?.preventDefault?.()
    const value = term.trim()
    setOpen(false)
    navigate(value ? `/shop?q=${encodeURIComponent(value)}` : '/shop')
  }

  function change(event) {
    const value = event.target.value
    setTerm(value)
    setOpen(Boolean(value.trim()))

    if (location.pathname === '/shop') {
      if (value.trim()) {
        const next = new URLSearchParams(location.search)
        next.set('q', value.trim())
        navigate(`/shop?${next.toString()}`, { replace: true })
      } else {
        navigate('/shop', { replace: true })
      }
    }
  }

  function clearSearch() {
    setTerm('')
    setOpen(false)
    if (location.pathname === '/shop') navigate('/shop', { replace: true })
  }

  function choose(book) {
    setTerm(book.title)
    setOpen(false)
    navigate(`/book/${book.id}`)
  }

  return (
    <>
      <div className="market-topbar">
        <div className="market-topbar-inner">
          <span>📍 Deliver to Dharmapuri 636705</span>
          <span className="market-trust">100% Genuine Books &nbsp;·&nbsp; Secure Checkout &nbsp;·&nbsp; Easy Order Tracking</span>
          <span>Need help? thulirkumver@gmail.com</span>
        </div>
      </div>

      <header className="market-header">
        <Link className="market-brand" to="/home" aria-label="Thulirkum Ver home">
          <img src="/logo.png" alt="Thulirkum Ver Book Store" />
        </Link>

        <div className="smart-search-wrap market-search-wrap">
          <form className="market-search" onSubmit={submit}>
            <span className="market-search-icon">⌕</span>
            <input
              value={term}
              onChange={change}
              onFocus={() => term.trim() && setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 160)}
              placeholder="Search by title, author, ISBN or category"
              autoComplete="off"
            />
            {term && (
              <button
                type="button"
                className="market-search-clear"
                aria-label="Clear search"
                onMouseDown={event => event.preventDefault()}
                onClick={clearSearch}
              >×</button>
            )}
            <button type="submit" className="market-search-button">Search</button>
          </form>

          {open && (
            <div className="search-suggestions market-search-suggestions">
              <div className="search-suggestion-head">
                <span>Search suggestions</span>
                <small>{suggestions.length ? `${suggestions.length} results` : 'No exact matches'}</small>
              </div>
              {suggestions.length ? suggestions.map(book => (
                <button key={book.id} className="search-suggestion-row" type="button" onMouseDown={() => choose(book)}>
                  <img src={book.image} alt="" />
                  <span className="search-suggestion-copy">
                    <strong>{book.title}</strong>
                    <small>{book.author} · {book.category}</small>
                  </span>
                  <span className="search-suggestion-meta">
                    <b>₹{book.price}</b>
                    <small className={book.available !== false && book.stock > 0 ? 'available' : 'unavailable'}>
                      {book.available !== false && book.stock > 0 ? 'In stock' : 'Out of stock'}
                    </small>
                  </span>
                </button>
              )) : (
                <button className="search-all-row" type="button" onMouseDown={submit}>Search “{term}” in all books →</button>
              )}
              {suggestions.length > 0 && (
                <button className="search-all-row" type="button" onMouseDown={submit}>View all results for “{term}” →</button>
              )}
            </div>
          )}
        </div>

        <nav className="market-header-actions">
          <NavLink to="/account" className="market-action-link">
            <span className="market-action-icon">♙</span>
            <span><small>Hello, {user?.name?.split(' ')[0] || 'Reader'}</small><strong>Account</strong></span>
          </NavLink>
          <NavLink to="/wishlist" className="market-action-link market-action-simple">
            <span className="market-action-icon">♡</span>
            <span><small>Saved</small><strong>Wishlist</strong></span>
            {wishlistCount > 0 && <b className="market-count-badge">{wishlistCount}</b>}
          </NavLink>
          <NavLink to="/cart" className="market-action-link market-cart-action">
            <span className="market-action-icon">🛒</span>
            <span><small>Your</small><strong>Cart</strong></span>
            <b className="market-count-badge">{cartCount}</b>
          </NavLink>
        </nav>
      </header>

      <div className="market-category-nav">
        <div className="market-category-inner">
          <NavLink className="market-all-link" to="/shop">☰ All Books</NavLink>
          {quickCategories.map(category => (
            <NavLink key={category} to={`/shop?category=${encodeURIComponent(category)}`}>{category}</NavLink>
          ))}
          <NavLink className="market-offer-link" to="/offers">⚡ Today's Offers</NavLink>
        </div>
      </div>
    </>
  )
}
