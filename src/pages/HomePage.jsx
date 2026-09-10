import { Link } from 'react-router-dom'
import { useMemo, useRef } from 'react'
import { useStore } from '../context/StoreContext'
import BookCard from '../components/BookCard'
import { decorateBooks, demoAuthors, demoBooks, demoOffers, homeCategories, slugKey } from '../data/siteCatalog'

const FEATURED_ORDER = ['atomic habits', 'ikigai', 'ponniyin selvan', 'siru maatrangal periya vazhkai', 'the alchemist']
const AUTHOR_ORDER = ['kalki krishnamurthy', 'paulo coelho', 'james clear', 'hector garcia', 'jay shetty', 'r balakrishnan']

function orderedFeaturedBooks(catalogue) {
  const byKey = new Map(catalogue.map(book => [slugKey(book.title), book]))
  const ordered = FEATURED_ORDER.map(key => byKey.get(key)).filter(Boolean)
  return ordered.length ? ordered : catalogue.slice(0, 5)
}

export default function HomePage() {
  const { books, offers, authors, loading } = useStore()
  const carouselRef = useRef(null)

  const catalogue = useMemo(() => decorateBooks(books?.length ? books : demoBooks), [books])
  const featuredBooks = useMemo(() => orderedFeaturedBooks(catalogue), [catalogue])
  const topOffer = useMemo(() => (offers?.length ? offers.find(offer => offer.active) || offers[0] : demoOffers[0]), [offers])

  const authorRows = useMemo(() => {
    const source = authors?.length ? authors : demoAuthors
    const byKey = new Map(source.map(author => [slugKey(author.name), author]))
    return AUTHOR_ORDER.map(key => byKey.get(key)).filter(Boolean)
  }, [authors])

  const categoryRows = useMemo(() => {
    const counts = new Map()
    catalogue.forEach(book => counts.set(book.category, (counts.get(book.category) || 0) + 1))
    return homeCategories.map(item => ({ ...item, count: counts.get(item.name) || 1 }))
  }, [catalogue])

  function slide(direction) {
    carouselRef.current?.scrollBy({ left: direction * 280, behavior: 'smooth' })
  }

  return (
    <main className="tv-homepage">
      <section className="tv-hero-shell">
        <div className="page-width tv-hero">
          <div className="tv-hero-left">
            <div className="tv-hero-kicker">THULIRKUM VER · ONLINE BOOKSTORE</div>
            <h1>Let Knowledge<br />Take Root.</h1>
            <p className="tv-hero-subtitle">Discover Tamil and English books that inform, inspire and uplift.</p>
            <div className="tv-hero-actions">
              <Link to="/shop" className="tv-btn-primary">Explore all books <span>→</span></Link>
              <Link to="/offers" className="tv-btn-secondary"><span>🎁</span> View Offers</Link>
            </div>
          </div>

          <div className="tv-hero-stage" aria-label="Featured book stack">
            <img
              className="tv-hero-photo"
              src="/premium/hero-books-premium.png"
              alt="Atomic Habits, Ikigai, Siru Maatrangal Periya Vazhkai and Ponniyin Selvan stacked beside a green plant"
            />
          </div>
        </div>
      </section>

      <section className="page-width tv-section">
        <div className="tv-section-head">
          <h2>Explore by Category</h2>
          <Link to="/shop" className="tv-inline-link">View all categories <span>→</span></Link>
        </div>
        <div className="tv-category-row">
          {categoryRows.map(category => (
            <Link key={category.name} to={`/shop?category=${encodeURIComponent(category.name)}`} className={`tv-category-card tv-tone-${category.color}`}>
              <div className="tv-category-icon">{category.icon}</div>
              <div className="tv-category-copy"><strong>{category.name}</strong><small>{category.subtitle}</small></div>
              <span className="tv-category-arrow">→</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="page-width tv-section tv-featured-section">
        <div className="tv-section-head">
          <div><h2>Featured Books</h2><p>Curated picks for your next great read.</p></div>
          <Link to="/shop" className="tv-inline-link">View all books <span>→</span></Link>
        </div>
        <div className="tv-carousel-shell">
          <button type="button" className="tv-carousel-btn prev" onClick={() => slide(-1)} aria-label="Previous books">‹</button>
          <div className="tv-featured-grid" ref={carouselRef}>
            {loading && !featuredBooks.length ? <p>Loading books...</p> : featuredBooks.map(book => <BookCard key={book.id} book={book} variant="home-ref" />)}
          </div>
          <button type="button" className="tv-carousel-btn next" onClick={() => slide(1)} aria-label="Next books">›</button>
        </div>
      </section>

      <section className="page-width tv-offer-banner">
        <div className="tv-offer-copy">
          <small>🎁 SPECIAL OFFER</small>
          <h3>{topOffer?.title || 'Great Books. Greater Journeys.'}</h3>
          <p>{topOffer?.description || 'Get up to 30% OFF on selected titles.'}</p>
        </div>
        <Link to="/offers" className="tv-offer-link">View Offers <span>→</span></Link>
        <img
          className="tv-offer-photo"
          src="/premium/offer-books-premium.png"
          alt="Premium books with an up to 30 percent offer"
        />
      </section>

      <section className="page-width tv-section tv-authors-section">
        <div className="tv-section-head">
          <h2>Featured Authors</h2>
          <Link to="/shop" className="tv-inline-link">View all authors <span>→</span></Link>
        </div>
        <div className="tv-author-row">
          {authorRows.map(author => (
            <Link key={author.name} to={`/shop?q=${encodeURIComponent(author.name)}`} className="tv-author-chip">
              <img
                src={author.image || '/covers/authors/editorial.svg'}
                alt={author.name}
                onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = '/covers/authors/editorial.svg' }}
              />
              <div><strong>{author.name}</strong><small>{author.role || 'Author'}</small></div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
