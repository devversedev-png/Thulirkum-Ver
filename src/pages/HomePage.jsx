import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useStore } from '../context/StoreContext'
import BookCard from '../components/BookCard'
import { decorateBooks, demoAuthors, demoBooks, demoOffers, homeCategories, slugKey } from '../data/siteCatalog'

const FEATURED_ORDER = [
  'atomic habits',
  'ikigai',
  'ponniyin selvan',
  'siru maatrangal periya vazhkai',
  'the alchemist'
]

const AUTHOR_ORDER = [
  'kalki krishnamurthy',
  'paulo coelho',
  'james clear',
  'hector garcia',
  'jay shetty',
  'r balakrishnan'
]

function orderedFeaturedBooks(catalogue) {
  const byKey = new Map(catalogue.map(book => [slugKey(book.title), book]))
  const ordered = FEATURED_ORDER.map(key => byKey.get(key)).filter(Boolean)
  if (ordered.length) return ordered
  return catalogue.slice(0, 5)
}

export default function HomePage() {
  const { books, offers, authors, loading, backendReady } = useStore()

  const catalogue = useMemo(() => decorateBooks((books && books.length ? books : demoBooks)), [books])
  const featuredBooks = useMemo(() => orderedFeaturedBooks(catalogue), [catalogue])
  const topOffer = useMemo(() => (offers && offers.length ? offers.find(offer => offer.active) || offers[0] : demoOffers[0]), [offers])

  const authorRows = useMemo(() => {
    const source = authors && authors.length ? authors : demoAuthors
    const byKey = new Map(source.map(author => [slugKey(author.name), author]))
    return AUTHOR_ORDER.map(key => byKey.get(key)).filter(Boolean)
  }, [authors])

  const categoryRows = useMemo(() => {
    const counts = new Map()
    catalogue.forEach(book => {
      const key = String(book.category || '').trim()
      if (!key) return
      counts.set(key, (counts.get(key) || 0) + 1)
    })
    return homeCategories.map(item => ({
      ...item,
      count: counts.get(item.name) || (item.name === 'Children Books' ? 1 : item.name === 'Competitive Exams' ? 1 : item.name === 'Fiction' ? 1 : item.name === 'Self Help' ? 4 : 1)
    }))
  }, [catalogue])

  return (
    <main className="tv-homepage">
      {!backendReady && (
        <div className="backend-status-banner page-width">
          Demo catalogue loaded. Backend is currently unavailable.
        </div>
      )}

      <section className="page-width tv-hero">
        <div className="tv-hero-left">
          <div className="tv-hero-kicker">THULIRKUM VER · ONLINE BOOKSTORE</div>
          <h1>Let Knowledge<br />Take Root.</h1>
          <p className="tv-hero-subtitle">Discover Tamil and English books that inform, inspire and uplift.</p>
          <div className="tv-hero-actions">
            <Link to="/shop" className="tv-btn-primary">Explore all books <span>→</span></Link>
            <Link to="/offers" className="tv-btn-secondary">🎁 View Offers</Link>
          </div>
        </div>
        <div className="tv-hero-right">
          <p className="tv-hero-quote">“A book today,<br />a better tomorrow.”</p>
          <img src="/refcrops/hero_stack.png" alt="Featured books stacked beside a plant" />
        </div>
      </section>

      <section className="page-width tv-benefits">
        <article><span>📖</span><div><strong>Genuine Books</strong><small>100% originals</small></div></article>
        <article><span>🛡️</span><div><strong>Secure Checkout</strong><small>Multiple payment options</small></div></article>
        <article><span>🚚</span><div><strong>Fast Delivery</strong><small>Across India</small></div></article>
        <article><span>🎧</span><div><strong>Dedicated Support</strong><small>We’re here to help</small></div></article>
      </section>

      <section className="page-width tv-section">
        <div className="tv-section-head tv-section-head-inline">
          <div>
            <h2>Explore by Category</h2>
          </div>
          <Link to="/shop" className="tv-inline-link">View all categories <span>→</span></Link>
        </div>
        <div className="tv-category-row">
          {categoryRows.map(category => (
            <Link key={category.name} to={`/shop?category=${encodeURIComponent(category.name)}`} className={`tv-category-card tv-tone-${category.color}`}>
              <div className="tv-category-icon">{category.icon}</div>
              <div>
                <strong>{category.name}</strong>
                <small>{category.subtitle}</small>
              </div>
              <button type="button" aria-hidden="true">+</button>
            </Link>
          ))}
        </div>
      </section>

      <section className="page-width tv-section tv-featured-section">
        <div className="tv-section-head tv-section-head-inline">
          <div>
            <h2>Featured Books</h2>
            <p>Curated picks for your next read.</p>
          </div>
          <Link to="/shop" className="tv-inline-link">View all books <span>→</span></Link>
        </div>
        <div className="tv-featured-grid">
          {loading && !featuredBooks.length ? <p>Loading books...</p> : featuredBooks.map(book => <BookCard key={book.id} book={book} variant="home-ref" />)}
        </div>
      </section>

      <section className="page-width tv-offer-banner">
        <div className="tv-offer-copy">
          <small>🎁 Special Offer</small>
          <h3>{topOffer?.title || 'Great Books. Greater Journeys.'}</h3>
          <p>{topOffer?.description || 'Get up to 30% OFF on selected titles.'}</p>
          <Link to="/offers" className="tv-offer-link">View Offers →</Link>
        </div>
        <div className="tv-offer-art">
          <img src="/refcrops/offer_books.png" alt="Books and plant decoration" />
          <div className="tv-discount-badge">
            <span>UP TO</span>
            <strong>30%</strong>
            <small>OFF</small>
          </div>
        </div>
      </section>

      <section className="page-width tv-section tv-authors-section">
        <div className="tv-section-head tv-section-head-inline">
          <div>
            <h2>Featured Authors</h2>
          </div>
          <Link to="/shop" className="tv-inline-link">View all authors <span>→</span></Link>
        </div>
        <div className="tv-author-row">
          {authorRows.map(author => (
            <Link key={author.name} to={`/shop?q=${encodeURIComponent(author.name)}`} className="tv-author-chip">
              <img src={author.image || '/covers/authors/editorial.svg'} alt={author.name} />
              <div>
                <strong>{author.name}</strong>
                <small>{author.role || 'Author'}</small>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
