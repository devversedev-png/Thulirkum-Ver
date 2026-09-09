import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useStore } from '../context/StoreContext'
import BookCard from '../components/BookCard'

function languageKey(value = '') {
  const text = String(value).trim().toLowerCase()
  if (text.includes('tamil') || text.includes('தமிழ்')) return 'Tamil'
  if (text.includes('english')) return 'English'
  return value || 'Other'
}

export default function HomePage() {
  const { books, offers, authors, loading, backendReady } = useStore()

  const categoryRows = useMemo(() => {
    const groups = new Map()

    books.forEach(book => {
      if (!book.category) return
      if (!groups.has(book.category)) groups.set(book.category, [])
      groups.get(book.category).push(book)
    })

    return [...groups.entries()]
      .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
      .slice(0, 8)
      .map(([name, categoryBooks]) => ({
        name,
        count: categoryBooks.length,
        covers: categoryBooks
          .filter(book => book.image)
          .sort((a, b) => Number(b.featured || false) - Number(a.featured || false) || Number(b.rating || 0) - Number(a.rating || 0))
          .slice(0, 3)
          .map(book => ({ id: book.id, image: book.image, title: book.title }))
      }))
  }, [books])

  const authorRows = useMemo(() => {
    const groups = new Map()

    books.forEach(book => {
      const author = String(book.author || '').trim()
      if (!author) return
      if (!groups.has(author)) groups.set(author, [])
      groups.get(author).push(book)
    })

    const catalogueAuthor = name => {
      const authorBooks = groups.get(name) || []
      const sortedBooks = [...authorBooks].sort((a, b) =>
        Number(b.featured || false) - Number(a.featured || false)
        || Number(b.rating || 0) - Number(a.rating || 0)
        || String(a.title || '').localeCompare(String(b.title || ''))
      )
      return {
        name,
        count: authorBooks.length,
        books: sortedBooks.slice(0, 3),
        rating: authorBooks.reduce((sum, book) => sum + Number(book.rating || 0), 0) / Math.max(authorBooks.length, 1)
      }
    }

    const managedFeatured = (authors || []).filter(author => author.active !== false && author.featured === true)
    if (managedFeatured.length) {
      return [...managedFeatured]
        .sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0) || String(a.name || '').localeCompare(String(b.name || '')))
        .slice(0, 5)
        .map(author => ({
          ...catalogueAuthor(author.name),
          ...author,
          language: author.language || languageKey((groups.get(author.name) || [])[0]?.language)
        }))
    }

    const fallback = [...groups.entries()].map(([name, authorBooks]) => {
      const languageCounts = authorBooks.reduce((result, book) => {
        const key = languageKey(book.language)
        result[key] = (result[key] || 0) + 1
        return result
      }, {})
      const language = Object.entries(languageCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Other'
      return { ...catalogueAuthor(name), language }
    })

    const sortAuthors = list => [...list].sort((a, b) => b.count - a.count || b.rating - a.rating || a.name.localeCompare(b.name))
    const english = sortAuthors(fallback.filter(author => author.language === 'English')).slice(0, 3)
    const tamil = sortAuthors(fallback.filter(author => author.language === 'Tamil')).slice(0, 2)
    const selectedNames = new Set([...english, ...tamil].map(author => author.name))
    return [...english, ...tamil, ...sortAuthors(fallback.filter(author => !selectedNames.has(author.name)))].slice(0, 5)
  }, [books, authors])

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
          <h1 className="home-hero-title-v71"><span>Books that grow ideas,</span><em>roots that shape generations.</em></h1>
          <p className="home-hero-description-v71">Discover Tamil literature, fiction, self-help, children books and more in one simple place.</p>
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
            <div><span>DISCOVER</span><h2>Shop by category</h2><p>Visual shelves built directly from the books available in each category.</p></div>
            <Link to="/shop">View all books →</Link>
          </div>
          <div className="category-grid-v7">
            {categoryRows.map(({ name, count, covers }) => (
              <Link key={name} to={`/shop?category=${encodeURIComponent(name)}`} className="category-card-v7 glass-card">
                <div className="category-art-v7" aria-hidden="true">
                  {covers.length ? covers.map((cover, index) => (
                    <img
                      key={`${cover.id}-${index}`}
                      className={`category-cover-v7 category-cover-${index + 1}`}
                      src={cover.image}
                      alt=""
                    />
                  )) : <span>{name.charAt(0).toUpperCase()}</span>}
                  <i />
                </div>
                <div className="category-copy-v7">
                  <small>EXPLORE CATEGORY</small>
                  <strong>{name}</strong>
                  <span>{count} {count === 1 ? 'book' : 'books'} in catalogue</span>
                </div>
                <b>Browse →</b>
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

      {authorRows.length > 0 && (
        <section className="page-width home-section-v6 author-section-v7 glass-panel">
          <div className="section-head-v6 author-section-head-v7">
            <div>
              <span>AUTHOR SPOTLIGHT</span>
              <h2>Browse by author</h2>
              <p>Featured authors selected in the admin panel, with their books linked from the live catalogue.</p>
            </div>
            <Link to="/shop">Explore the full catalogue →</Link>
          </div>

          <div className="author-grid-v7">
            {authorRows.map(author => (
              <Link key={author.name} to={`/shop?q=${encodeURIComponent(author.name)}`} className="author-card-v7 glass-card">
                <div className={`author-book-stack-v7 ${author.image ? 'has-author-photo' : ''}`} aria-hidden="true">
                  {author.image ? (
                    <img className="author-profile-photo-v75" src={author.image} alt="" />
                  ) : author.books.map((book, index) => (
                    <img
                      key={`${book.id}-${index}`}
                      className={`author-cover-v7 author-cover-${index + 1}`}
                      src={book.image}
                      alt=""
                    />
                  ))}
                  {!author.image && !author.books.length && <span>{author.name.charAt(0).toUpperCase()}</span>}
                </div>
                <div className="author-copy-v7">
                  <span>{author.language}</span>
                  <strong>{author.name}</strong>
                  <small>{author.bio || `${author.count} ${author.count === 1 ? 'title' : 'titles'} available`}</small>
                </div>
                <b>View books →</b>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
