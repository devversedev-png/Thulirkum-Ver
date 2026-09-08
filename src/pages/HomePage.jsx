import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import BookCard from '../components/BookCard'

const categories = [
  { name: 'Tamil Literature', small: 'தமிழ்', icon: '▤' },
  { name: 'Fiction', small: 'Stories', icon: '▥' },
  { name: 'Children Books', small: 'Kids', icon: '◉' },
  { name: 'Educational', small: 'Learn', icon: '◆' },
  { name: 'Spiritual', small: 'Peace', icon: '✦' },
  { name: 'Biography', small: 'Lives', icon: '●' },
  { name: 'Competitive Exams', small: 'Prepare', icon: '▰' },
  { name: 'Self Help', small: 'Grow', icon: '◒' }
]

export default function HomePage() {
  const { books, offers, loading, backendReady } = useStore()

  const featuredBooks = books.filter(book => book.featured)
  const newBooks = books.filter(book => book.newArrival)
  const featured = (featuredBooks.length ? featuredBooks : books).slice(0, 6)
  const arrivals = (newBooks.length ? newBooks : books).slice(0, 6)
  const topOffer = offers[0]

  return (
    <>
      {!backendReady && (
        <div className="demo-note">Preview mode is active. Connect Spring Boot + MongoDB Atlas to enable account actions.</div>
      )}

      <section className="hero-section page-width premium-home-hero">
        <div className="hero-copy">
          <span className="eyebrow">Good books · brighter lives</span>
          <h1>Books for a<br /><em>Brighter Tomorrow</em></h1>
          <p>
            Discover stories, ideas and wisdom in Tamil and beyond. Books selected to inspire,
            educate and grow with every kind of reader.
          </p>
          <Link className="primary-btn big inline-btn" to="/shop">Start Exploring →</Link>

          <div className="hero-benefits">
            <div><b>↝</b><span><strong>Free shipping</strong><small>above ₹499</small></span></div>
            <div><b>✓</b><span><strong>Genuine books</strong><small>trusted collection</small></span></div>
            <div><b>◒</b><span><strong>A better you</strong><small>with every book</small></span></div>
          </div>
        </div>

        <div className="hero-visual premium-book-scene">
          <div className="hero-leaf hero-leaf-one">⌁</div>
          <div className="hero-leaf hero-leaf-two">⌁</div>
          <div className="scene-plant">
            <span className="plant-stem" />
            <span className="plant-leaf leaf-a" />
            <span className="plant-leaf leaf-b" />
            <span className="plant-leaf leaf-c" />
            <span className="plant-leaf leaf-d" />
          </div>
          <div className="premium-stack">
            <div className="scene-book brown-book">TAMIL LITERATURE</div>
            <div className="scene-book green-book">SPIRITUALITY</div>
            <div className="scene-book cream-book">SELF HELP</div>
            <div className="scene-book gold-book">CHILDREN BOOKS</div>
            <div className="scene-book dark-book">BIOGRAPHY</div>
          </div>
          <div className="scene-mug">A Good Book<br /><small>A Kinder You</small></div>
          <div className="scene-note">Small<br />Books<br /><strong>Big Changes</strong></div>
        </div>
      </section>

      <section className="section page-width home-category-section">
        <div className="section-heading">
          <div><h2>Browse by Category</h2><p>Explore books that match what you love.</p></div>
          <Link to="/shop">View all categories →</Link>
        </div>
        <div className="category-row">
          {categories.map(item => (
            <Link key={item.name} className="category-pill" to={`/shop?category=${encodeURIComponent(item.name)}`}>
              <div className={`category-icon category-icon-${item.name.toLowerCase().replaceAll(' ', '-')}`}>{item.icon}</div>
              <strong>{item.name}</strong>
              <span>{item.small}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section page-width">
        <div className="section-heading">
          <div><h2>Bestsellers</h2><p>Reader favourites, loved by many.</p></div>
          <Link to="/shop?sort=rating">View all books →</Link>
        </div>
        <div className="book-grid home-book-grid">
          {loading ? <p>Loading books...</p> : featured.map(book => <BookCard key={book.id} book={book} />)}
        </div>
      </section>

      <section className="offer-strip page-width premium-offer-strip">
        <div>
          <span>{topOffer?.code ? `Use code ${topOffer.code}` : 'Special Offer'}</span>
          <h2>{topOffer?.title || 'Up to 30% Off on Selected Books'}</h2>
          <p>{topOffer?.description || 'Good books should always be within reach.'}</p>
        </div>
        <Link className="outline-btn" to="/offers">Explore Offers →</Link>
      </section>

      {arrivals.length > 0 && (
        <section className="section page-width">
          <div className="section-heading">
            <div><h2>New Arrivals</h2><p>Fresh titles added to the shelf.</p></div>
            <Link to="/shop?sort=new">See new arrivals →</Link>
          </div>
          <div className="book-grid home-book-grid">
            {arrivals.map(book => <BookCard key={book.id} book={book} />)}
          </div>
        </section>
      )}

      <section className="flow-section page-width premium-flow-section">
        <div className="flow-heading">
          <span className="eyebrow">Simple from start to finish</span>
          <h2>A Better Way to Buy Your Books</h2>
        </div>
        <div className="flow-grid">
          {['Login', 'Home', 'Search / Browse', 'Book Details', 'Add to Cart', 'Checkout', 'Order Confirmation'].map((item, index) => (
            <div key={item} className="flow-step"><b>{index + 1}</b><span>{item}</span></div>
          ))}
        </div>
      </section>
    </>
  )
}
