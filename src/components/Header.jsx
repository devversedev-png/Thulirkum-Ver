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
  const wishlistCount = account?.wishlist?.length || 0

  const categories = useMemo(() => {
    return [...new Set(books.map(book => book.category).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b))
      .slice(0, 6)
  }, [books])

  const suggestions = useMemo(() => {
    const text = term.trim().toLowerCase()
    if (!text) return []

    return books
      .map(book => {
        const title = (book.title || '').toLowerCase()
        const author = (book.author || '').toLowerCase()
        const category = (book.category || '').toLowerCase()
        const publisher = (book.publisher || '').toLowerCase()
        const isbn = (book.isbn || '').toLowerCase()
        const score = title.startsWith(text) ? 0 : author.startsWith(text) ? 1 : category.startsWith(text) ? 2 : isbn.startsWith(text) ? 3 : 4
        return { book, score, match: `${title} ${author} ${category} ${publisher} ${isbn}`.includes(text) }
      })
      .filter(item => item.match)
      .sort((a, b) => a.score - b.score || a.book.title.localeCompare(b.book.title))
      .slice(0, 6)
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
      const next = new URLSearchParams(location.search)
      value.trim() ? next.set('q', value.trim()) : next.delete('q')
      navigate(`/shop${next.toString() ? `?${next.toString()}` : ''}`, { replace: true })
    }
  }

  function clearSearch() {
    setTerm('')
    setOpen(false)
    if (location.pathname === '/shop') {
      const next = new URLSearchParams(location.search)
      next.delete('q')
      navigate(`/shop${next.toString() ? `?${next.toString()}` : ''}`, { replace: true })
    }
  }

  function choose(book) {
    setTerm(book.title)
    setOpen(false)
    navigate(`/book/${book.id}`)
  }

  return (
    <div className="commerce-sticky-shell concept-c-header-shell" id="top">
      <header className="market-header glass-market-header concept-c-header">
        <Link className="market-brand" to="/home" aria-label="Thulirkum Ver home">
          <img src="/logo.png" alt="Thulirkum Ver Book Store" />
        </Link>

        <div className="smart-search-wrap market-search-wrap">
          <form className="market-search concept-search" onSubmit={submit}>
            <span className="market-search-icon">⌕</span>
            <input
              value={term}
              onChange={change}
              onFocus={() => term.trim() && setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 160)}
              placeholder="Search books by title, author, ISBN or category..."
              autoComplete="off"
            />
            {term && <button type="button" className="market-search-clear" aria-label="Clear search" onMouseDown={e => e.preventDefault()} onClick={clearSearch}>×</button>}
            <button type="submit" className="market-search-button">Search</button>
          </form>

          {open && (
            <div className="search-suggestions market-search-suggestions glass-popover concept-search-popover">
              <div className="search-suggestion-head"><span>Search suggestions</span><small>{suggestions.length ? `${suggestions.length} matches` : 'No exact matches'}</small></div>
              {suggestions.length ? suggestions.map(book => (
                <button key={book.id} className="search-suggestion-row" type="button" onMouseDown={() => choose(book)}>
                  <img src={book.image} alt="" />
                  <span className="search-suggestion-copy"><strong>{book.title}</strong><small>{book.author} · {book.category}</small></span>
                  <span className="search-suggestion-meta"><b>₹{book.price}</b><small className={book.available !== false && book.stock > 0 ? 'available' : 'unavailable'}>{book.available !== false && book.stock > 0 ? 'In stock' : 'Out of stock'}</small></span>
                </button>
              )) : <button className="search-all-row" type="button" onMouseDown={submit}>Search “{term}” in all books</button>}
              {suggestions.length > 0 && <button className="search-all-row" type="button" onMouseDown={submit}>View all results for “{term}”</button>}
            </div>
          )}
        </div>

        <nav className="market-header-actions concept-header-actions">
          <NavLink to="/wishlist" className="market-action-link market-action-simple">
            <span className="market-action-icon">♡</span><span><small>Saved</small><strong>Wishlist</strong></span>
            {wishlistCount > 0 && <b className="market-count-badge">{wishlistCount}</b>}
          </NavLink>
          <NavLink to="/cart" className="market-action-link market-cart-action">
            <span className="market-action-icon">▣</span><span><small>Your</small><strong>Cart</strong></span><b className="market-count-badge">{cartCount}</b>
          </NavLink>
          <NavLink to="/account" className="market-action-link">
            <span className="market-action-icon">♙</span><span><small>Hello, {user?.name?.split(' ')[0] || 'Reader'}</small><strong>Account</strong></span>
          </NavLink>
        </nav>
      </header>

      <div className="market-category-nav glass-category-nav concept-c-nav">
        <div className="market-category-inner concept-c-nav-inner">
          <NavLink className="market-all-link" to="/shop">All Books</NavLink>
          {categories.map(category => <NavLink key={category} to={`/shop?category=${encodeURIComponent(category)}`}>{category}</NavLink>)}
          <NavLink className="market-offer-link" to="/offers">Offers</NavLink>
        </div>
      </div>
    </div>
  )
}
