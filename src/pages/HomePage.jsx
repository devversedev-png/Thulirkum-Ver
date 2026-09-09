import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import BookCard from '../components/BookCard'

const categories = [
  { name: 'Tamil Literature', small: 'தமிழ் நூல்கள்', icon: '📚' },
  { name: 'Fiction', small: 'Stories & novels', icon: '📖' },
  { name: 'Children Books', small: 'Young readers', icon: '🧒' },
  { name: 'Educational', small: 'Learn better', icon: '🎓' },
  { name: 'Spiritual', small: 'Mind & peace', icon: '🪷' },
  { name: 'Biography', small: 'Life stories', icon: '👤' },
  { name: 'Competitive Exams', small: 'Exam prep', icon: '🏆' },
  { name: 'Self Help', small: 'Grow daily', icon: '🌱' }
]

export default function HomePage() {
  const { books, offers, loading, backendReady } = useStore()

  const featuredBooks = books.filter(book => book.featured)
  const newBooks = books.filter(book => book.newArrival)
  const featured = (featuredBooks.length ? featuredBooks : books).slice(0, 6)
  const arrivals = (newBooks.length ? newBooks : books).slice(0, 6)
  const valueBooks = [...books].sort((a, b) => a.price - b.price).slice(0, 6)
  const topOffer = offers[0]
  const heroBooks = featured.slice(0, 3)

  return (
    <>
      {!backendReady && (
        <div className="demo-note">Preview mode is active. Connect Spring Boot + MongoDB Atlas to enable account actions.</div>
      )}

      <section className="market-home page-width">
        <div className="market-hero">
          <div className="market-hero-copy">
            <span className="market-kicker">THULIRKUM VER BOOK STORE</span>
            <h1>Find the right book.<br /><span>Grow the right idea.</span></h1>
            <p>Shop Tamil literature, fiction, self-help, children's books, education and more — all in one simple bookstore.</p>
            <div className="market-hero-actions">
              <Link className="market-primary-cta" to="/shop">Shop all books</Link>
              <Link className="market-secondary-cta" to="/offers">View offers</Link>
            </div>
            <div className="market-hero-promises">
              <span>✓ Genuine books</span>
              <span>✓ Safe payments</span>
              <span>✓ Easy tracking</span>
            </div>
          </div>

          <div className="market-hero-products">
            <div className="market-hero-badge">Reader favourites</div>
            <div className="market-hero-book-row">
              {heroBooks.map((book, index) => (
                <Link key={book.id} to={`/book/${book.id}`} className={`market-hero-book hero-book-${index + 1}`}>
                  <img src={book.image} alt={book.title} />
                  <span>{book.title}</span>
                </Link>
              ))}
            </div>
            <div className="market-hero-deal">
              <strong>{topOffer?.title || 'Special savings on selected books'}</strong>
              <span>{topOffer?.code ? `Use ${topOffer.code}` : 'Limited-time offers available'}</span>
            </div>
          </div>
        </div>

        <div className="market-service-row">
          <div><b>🚚</b><span><strong>Free Delivery</strong><small>On orders above ₹499</small></span></div>
          <div><b>✓</b><span><strong>Genuine Collection</strong><small>Carefully selected titles</small></span></div>
          <div><b>🔒</b><span><strong>Secure Checkout</strong><small>Simple & protected ordering</small></span></div>
          <div><b>📦</b><span><strong>Track Orders</strong><small>From confirmed to delivered</small></span></div>
        </div>
      </section>

      <section className="market-category-section page-width">
        <div className="market-section-title">
          <div><span>SHOP BY INTEREST</span><h2>Popular Categories</h2></div>
          <Link to="/shop">See all →</Link>
        </div>
        <div className="market-category-grid">
          {categories.map(item => (
            <Link key={item.name} className="market-category-card" to={`/shop?category=${encodeURIComponent(item.name)}`}>
              <div className="market-category-icon">{item.icon}</div>
              <strong>{item.name}</strong>
              <small>{item.small}</small>
            </Link>
          ))}
        </div>
      </section>

      <section className="market-shelf page-width">
        <div className="market-section-title">
          <div><span>TOP PICKS</span><h2>Bestsellers & Reader Favourites</h2></div>
          <Link to="/shop?sort=rating">View all →</Link>
        </div>
        <div className="market-product-grid">
          {loading ? <p>Loading books...</p> : featured.map(book => <BookCard key={book.id} book={book} />)}
        </div>
      </section>

      <section className="market-deal-banner page-width">
        <div className="market-deal-copy">
          <span>LIMITED TIME DEAL</span>
          <h2>{topOffer?.title || 'Books worth reading. Prices worth smiling about.'}</h2>
          <p>{topOffer?.description || 'Explore selected titles with special prices and seasonal offers.'}</p>
        </div>
        <div className="market-deal-code">
          <small>{topOffer?.code ? 'COUPON CODE' : 'BOOKSTORE OFFER'}</small>
          <strong>{topOffer?.code || 'SAVE MORE'}</strong>
          <Link to="/offers">Explore deals →</Link>
        </div>
      </section>

      {arrivals.length > 0 && (
        <section className="market-shelf page-width">
          <div className="market-section-title">
            <div><span>JUST ADDED</span><h2>New Arrivals</h2></div>
            <Link to="/shop?sort=new">See all new books →</Link>
          </div>
          <div className="market-product-grid">
            {arrivals.map(book => <BookCard key={book.id} book={book} />)}
          </div>
        </section>
      )}

      {valueBooks.length > 0 && (
        <section className="market-shelf page-width market-value-shelf">
          <div className="market-section-title">
            <div><span>VALUE PICKS</span><h2>Books at Friendly Prices</h2></div>
            <Link to="/shop?sort=price-low">Shop by low price →</Link>
          </div>
          <div className="market-product-grid">
            {valueBooks.map(book => <BookCard key={book.id} book={book} />)}
          </div>
        </section>
      )}

      <section className="market-confidence page-width">
        <div><b>01</b><span><strong>Search easily</strong><small>Title, author, category or ISBN</small></span></div>
        <div><b>02</b><span><strong>Choose confidently</strong><small>Stock, rating and price shown clearly</small></span></div>
        <div><b>03</b><span><strong>Order simply</strong><small>Cart, checkout and confirmation in a few steps</small></span></div>
        <div><b>04</b><span><strong>Track everything</strong><small>Confirmed, shipped, delivered or cancelled</small></span></div>
      </section>
    </>
  )
}
