import { useMemo, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { account, books } = useStore()
  const initialQuery = new URLSearchParams(location.search).get('q') || ''
  const [term, setTerm] = useState(initialQuery)
  const [open, setOpen] = useState(false)

  const cartCount = account?.cart?.reduce((sum, item) => sum + item.quantity, 0) || 0

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
      .slice(0, 6)
      .map(item => item.book)
  }, [books, term])

  function submit(event) {
    event.preventDefault()
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

  function choose(book) {
    setTerm(book.title)
    setOpen(false)
    navigate(`/book/${book.id}`)
  }

  return (
    <>
      <div className="top-strip">
        <span>Dharmapuri, Tamil Nadu</span>
        <span>Free shipping on orders above ₹499 · Genuine books · Safe delivery</span>
        <span>Support: thulirkumver@gmail.com</span>
      </div>

      <header className="main-header">
        <Link className="brand" to="/home">
          <img src="/logo.png" alt="Thulirkum Ver Book Store" />
        </Link>

        <div className="smart-search-wrap">
          <form className="header-search" onSubmit={submit}>
            <input
              value={term}
              onChange={change}
              onFocus={() => term.trim() && setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 160)}
              placeholder="Search books by title, author or category..."
              autoComplete="off"
            />
            {term && (
              <button
                type="button"
                className="search-clear-btn"
                aria-label="Clear search"
                onMouseDown={event => event.preventDefault()}
                onClick={() => {
                  setTerm('')
                  setOpen(false)
                  if (location.pathname === '/shop') navigate('/shop')
                }}
              >×</button>
            )}
            <button type="submit" className="search-submit-btn">Search</button>
          </form>

          {open && (
            <div className="search-suggestions">
              <div className="search-suggestion-head">
                <span>Quick suggestions</span>
                <small>{suggestions.length ? `${suggestions.length} matches` : 'No exact matches'}</small>
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
                      {book.available !== false && book.stock > 0 ? `${book.stock} left` : 'Out of stock'}
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

        <nav className="header-actions">
          <NavLink to="/shop">Categories</NavLink>
          <NavLink to="/wishlist">♡ Wishlist</NavLink>
          <NavLink to="/account">♙ {user?.name?.split(' ')[0] || 'Account'}</NavLink>
          <NavLink className="cart-link" to="/cart">🛒 Cart <b>{cartCount}</b></NavLink>
          <NavLink to="/shop#filters">☷ Filters</NavLink>
        </nav>
      </header>

      <div className="sub-nav">
        <NavLink to="/home">Home</NavLink>
        <NavLink to="/shop">All Books</NavLink>
        <NavLink to="/shop?sort=new">New Arrivals</NavLink>
        <NavLink to="/shop?sort=rating">Best Sellers</NavLink>
        <NavLink to="/offers">Offers</NavLink>
        <span className="sub-nav-message">Books grow better humans 🌿</span>
      </div>
    </>
  )
}
