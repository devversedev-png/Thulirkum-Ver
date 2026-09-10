import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useStore } from '../context/StoreContext'
import BookCard from '../components/BookCard'

const categoryGlyphs = {
  'Children Books': '▤',
  'Competitive Exams': '▣',
  'Fiction': '◫',
  'Self Help': '✦',
  'Tamil Literature': 'அ',
  'Spiritual': '✧',
  'Biography': '◉',
  'Educational': '▥'
}

function languageKey(value = '') {
  const text = String(value).trim().toLowerCase()
  if (text.includes('tamil') || text.includes('தமிழ்')) return 'Tamil'
  if (text.includes('english')) return 'English'
  return value || 'Other'
}

function categoryGlyph(name = '') {
  return categoryGlyphs[name] || String(name).trim().charAt(0).toUpperCase() || '•'
}

export default function HomePage() {
  const { books, offers, authors, loading, backendReady } = useStore()

  const inStockBooks = useMemo(
    () => books.filter(book => book.available !== false && Number(book.stock || 0) > 0),
    [books]
  )

  const categoryRows = useMemo(() => {
    const groups = new Map()
    books.forEach(book => {
      const category = String(book.category || '').trim()
      if (!category) return
      if (!groups.has(category)) groups.set(category, [])
      groups.get(category).push(book)
    })

    return [...groups.entries()]
      .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
      .slice(0, 6)
      .map(([name, list]) => ({ name, count: list.length }))
  }, [books])

  const authorRows = useMemo(() => {
    const groups = new Map()
    books.forEach(book => {
      const name = String(book.author || '').trim()
      if (!name) return
      if (!groups.has(name)) groups.set(name, [])
      groups.get(name).push(book)
    })

    const catalogueAuthor = name => {
      const authorBooks = groups.get(name) || []
      return {
        name,
        count: authorBooks.length,
        books: [...authorBooks]
          .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
          .slice(0, 2),
        language: languageKey(authorBooks[0]?.language)
      }
    }

    const featuredManaged = (authors || [])
      .filter(author => author.active !== false && author.featured === true)
      .sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0))
      .slice(0, 5)
      .map(author => ({ ...catalogueAuthor(author.name), ...author }))

    if (featuredManaged.length) return featuredManaged

    return [...groups.keys()]
      .map(catalogueAuthor)
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, 5)
  }, [books, authors])

  const heroBooks = useMemo(() => {
    const featured = inStockBooks.filter(book => book.featured)
    return (featured.length ? featured : inStockBooks).slice(0, 3)
  }, [inStockBooks])

  const featuredBooks = useMemo(() => {
    const featured = inStockBooks.filter(book => book.featured)
    return (featured.length ? featured : inStockBooks).slice(0, 5)
  }, [inStockBooks])

  const topOffer = offers.find(offer => offer.active) || offers[0]

  return (
    <main className="c9-home">
      {!backendReady && (
        <div className="backend-status-banner page-width">
          The catalogue service is temporarily unavailable. Please try again shortly.
        </div>
      )}

      <section className="page-width c9-home-hero">
        <div className="c9-home-copy">
          <span className="c9-eyebrow"><i /> BOOKS FOR BRIGHTER TOMORROWS</span>
          <h1>Let Knowledge<br />Take Root</h1>
          <p className="c9-hero-line">Books that grow ideas, roots that shape generations.</p>
          <p className="c9-hero-copy">
            Discover Tamil and English books that inform, inspire and uplift — with simple search,
            clear pricing and easy order tracking.
          </p>
          <div className="c9-hero-actions">
            <Link to="/shop" className="c9-primary-btn">Explore Books <span>→</span></Link>
            {topOffer && <Link to="/offers" className="c9-text-link">View current offers</Link>}
          </div>
        </div>

        <div className="c9-hero-art" aria-label="Featured books">
          <div className="c9-sprout c9-sprout-large" aria-hidden="true">
            <span className="stem" /><span className="leaf leaf-a" /><span className="leaf leaf-b" /><span className="leaf leaf-c" />
          </div>
          <div className="c9-book-stack">
            {heroBooks.length ? heroBooks.map((book, index) => (
              <Link to={`/book/${book.id}`} className={`c9-hero-book c9-hero-book-${index + 1}`} key={book.id}>
                <img src={book.image} alt={book.title} />
              </Link>
            )) : (
              <div className="c9-empty-book-stack" aria-hidden="true">
                <span>READ</span><span>LEARN</span><span>GROW</span>
              </div>
            )}
          </div>
          <blockquote>“A book today,<br />a better tomorrow.”</blockquote>
        </div>
      </section>

      <section className="page-width c9-trust-strip" aria-label="Store benefits">
        <article><b>✓</b><div><strong>Genuine Books</strong><small>Curated with care</small></div></article>
        <article><b>▣</b><div><strong>Secure Checkout</strong><small>Safe and simple</small></div></article>
        <article><b>↗</b><div><strong>Fast Discovery</strong><small>Search in seconds</small></div></article>
        <article><b>♡</b><div><strong>Save Favourites</strong><small>Build your wishlist</small></div></article>
      </section>

      {categoryRows.length > 0 && (
        <section className="page-width c9-home-section">
          <div className="c9-section-heading">
            <div><span>EXPLORE</span><h2>Featured Categories</h2><p>Find the shelf that fits what you want to read next.</p></div>
            <Link to="/shop">View all <span>→</span></Link>
          </div>
          <div className="c9-category-grid">
            {categoryRows.map(category => (
              <Link key={category.name} to={`/shop?category=${encodeURIComponent(category.name)}`} className="c9-category-card">
                <span className="c9-category-icon">{categoryGlyph(category.name)}</span>
                <strong>{category.name}</strong>
                <small>{category.count} {category.count === 1 ? 'book' : 'books'}</small>
              </Link>
            ))}
          </div>
        </section>
      )}

      {featuredBooks.length > 0 && (
        <section className="page-width c9-home-section c9-featured-section">
          <div className="c9-section-heading">
            <div><span>CURATED PICKS</span><h2>Featured Books</h2><p>Popular titles from the current catalogue.</p></div>
            <Link to="/shop">See all <span>→</span></Link>
          </div>
          <div className="c9-featured-books">
            {loading ? <p>Loading books...</p> : featuredBooks.map(book => <BookCard key={book.id} book={book} />)}
          </div>
        </section>
      )}

      {topOffer && (
        <section className="page-width c9-offer-banner">
          <div className="c9-sprout c9-sprout-small" aria-hidden="true">
            <span className="stem" /><span className="leaf leaf-a" /><span className="leaf leaf-b" />
          </div>
          <div>
            <span>THIS WEEK AT THULIRKUM VER</span>
            <h2>{topOffer.title}</h2>
            <p>{topOffer.description}</p>
          </div>
          <Link to="/offers">Explore offer <span>→</span></Link>
        </section>
      )}

      {authorRows.length > 0 && (
        <section className="page-width c9-home-section c9-author-section">
          <div className="c9-section-heading">
            <div><span>MEET THE VOICES</span><h2>Featured Authors</h2><p>Browse books through the writers behind them.</p></div>
            <Link to="/shop">Browse catalogue <span>→</span></Link>
          </div>
          <div className="c9-author-grid">
            {authorRows.map(author => (
              <Link key={author.name} to={`/shop?q=${encodeURIComponent(author.name)}`} className="c9-author-card">
                <div className="c9-author-avatar">
                  {author.image ? <img src={author.image} alt={author.name} /> : author.books?.[0]?.image ? <img src={author.books[0].image} alt="" /> : <span>{author.name.charAt(0)}</span>}
                </div>
                <strong>{author.name}</strong>
                <small>{author.language || 'Author'} · {author.count || 0} {(author.count || 0) === 1 ? 'book' : 'books'}</small>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
