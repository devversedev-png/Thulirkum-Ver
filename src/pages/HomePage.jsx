import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useStore } from '../context/StoreContext'
import BookCard from '../components/BookCard'

export default function HomePage() {
  const { books, offers, loading, backendReady } = useStore()

  const categoryRows = useMemo(() => {
    const counts = new Map()
    books.forEach(book => {
      if (!book.category) return
      counts.set(book.category, (counts.get(book.category) || 0) + 1)
    })
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }))
  }, [books])

  const featuredBooks = books.filter(book => book.featured && book.available !== false && book.stock > 0)
  const newBooks = books.filter(book => book.newArrival && book.available !== false && book.stock > 0)
  const featured = (featuredBooks.length ? featuredBooks : books).slice(0, 6)
  const arrivals = (newBooks.length ? newBooks : books).slice(0, 6)
  const topRated = [...books].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0)).slice(0, 6)
  const topOffer = offers.find(offer => offer.active) || offers[0]
  const heroBooks = featured.slice(0, 3)

  return (
    <div className="market-home-v6">
      {!backendReady && (
        <div className="backend-status-banner page-width">The catalogue service is temporarily unavailable. Please try again shortly.</div>
      )}

      <section className="page-width home-hero-v6 glass-panel">
        <div className="home-hero-copy-v6">
          <span className="home-kicker-v6">THULIRKUM VER · ONLINE BOOKSTORE</span>
          <h1>Books for curious minds,<br /><em>delivered with care.</em></h1>
          <p>Discover books across languages and interests with fast search, clear pricing, trusted stock information and simple order tracking.</p>
          <div className="home-hero-actions-v6">
            <Link className="premium-solid-btn" to="/shop">Explore all books <span>→</span></Link>
            {topOffer && <Link className="premium-ghost-btn" to="/offers">See current offers</Link>}
          </div>
          <div className="home-trust-chips-v6">
            <span>✓ Genuine catalogue</span>
            <span>⌁ Secure checkout</span>
            <span>↻ Easy tracking</span>
          </div>
        </div>

        <div className="home-hero-showcase-v6">
          <div className="showcase-glow" />
          <div className="showcase-books-v6">
            {heroBooks.length ? heroBooks.map((book, index) => (
              <Link key={book.id} to={`/book/${book.id}`} className={`showcase-book-v6 showcase-${index + 1}`}>
                <img src={book.image} alt={book.title} />
                <span>{book.title}</span>
              </Link>
            )) : <div className="catalogue-placeholder">Catalogue items will appear here when books are added.</div>}
          </div>
          {topOffer && (
            <Link className="hero-offer-glass-v6" to="/offers">
              <small>LIVE OFFER</small>
              <strong>{topOffer.title}</strong>
              <span>{topOffer.code ? `Code: ${topOffer.code}` : 'View offer details'} →</span>
            </Link>
          )}
        </div>
      </section>

      <section className="page-width service-ribbon-v6 glass-panel">
        <article><span>🚚</span><div><strong>Delivery updates</strong><small>Track each order from confirmation to delivery</small></div></article>
        <article><span>🔒</span><div><strong>Secure checkout</strong><small>Your account and order flow stay protected</small></div></article>
        <article><span>📦</span><div><strong>Live stock</strong><small>Availability updates directly from inventory</small></div></article>
        <article><span>♡</span><div><strong>Save favourites</strong><small>Keep books in your wishlist for later</small></div></article>
      </section>

      {categoryRows.length > 0 && (
        <section className="page-width home-section-v6">
          <div className="section-head-v6">
            <div><span>DISCOVER</span><h2>Shop by category</h2><p>Browse the catalogue the way you prefer.</p></div>
            <Link to="/shop">View all books →</Link>
          </div>
          <div className="category-grid-v6">
            {categoryRows.map(({ name, count }) => (
              <Link key={name} to={`/shop?category=${encodeURIComponent(name)}`} className="category-card-v6 glass-card">
                <span className="category-monogram-v6">{name.charAt(0).toUpperCase()}</span>
                <div><strong>{name}</strong><small>{count} {count === 1 ? 'book' : 'books'}</small></div>
                <b>→</b>
              </Link>
            ))}
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <section className="page-width home-section-v6 glass-shelf-v6">
          <div className="section-head-v6">
            <div><span>FEATURED</span><h2>Recommended reads</h2><p>Featured titles from the current catalogue.</p></div>
            <Link to="/shop">See all →</Link>
          </div>
          <div className="market-product-grid v6-product-grid">
            {loading ? <p>Loading books...</p> : featured.map(book => <BookCard key={book.id} book={book} />)}
          </div>
        </section>
      )}

      {topOffer && (
        <section className="page-width home-offer-v6 glass-panel">
          <div>
            <span>LIMITED-TIME SAVINGS</span>
            <h2>{topOffer.title}</h2>
            <p>{topOffer.description}</p>
          </div>
          <div className="home-offer-code-v6">
            <small>{topOffer.code ? 'COUPON CODE' : 'CURRENT OFFER'}</small>
            <strong>{topOffer.code || 'VIEW OFFER'}</strong>
            <Link to="/offers">See details →</Link>
          </div>
        </section>
      )}

      {arrivals.length > 0 && (
        <section className="page-width home-section-v6 glass-shelf-v6">
          <div className="section-head-v6">
            <div><span>FRESH ON THE SHELF</span><h2>New arrivals</h2><p>Recently highlighted books in the catalogue.</p></div>
            <Link to="/shop?sort=new">View new arrivals →</Link>
          </div>
          <div className="market-product-grid v6-product-grid">
            {arrivals.map(book => <BookCard key={book.id} book={book} />)}
          </div>
        </section>
      )}

      {topRated.length > 0 && (
        <section className="page-width home-section-v6 glass-shelf-v6">
          <div className="section-head-v6">
            <div><span>READER FAVOURITES</span><h2>Top-rated books</h2><p>Sorted from the ratings stored in your catalogue.</p></div>
            <Link to="/shop?sort=rating">Browse top-rated →</Link>
          </div>
          <div className="market-product-grid v6-product-grid">
            {topRated.map(book => <BookCard key={book.id} book={book} />)}
          </div>
        </section>
      )}
    </div>
  )
}
