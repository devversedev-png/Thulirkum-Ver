import { Link } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../context/StoreContext'
import BookCard from '../components/BookCard'
import { decorateBooks, demoAuthors, demoBooks, demoOffers, slugKey } from '../data/siteCatalog'

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

const CATEGORY_CONFIG = [
  {
    name: 'Children Books',
    match: ['children books', "children's books", 'kids books'],
    eyebrow: 'FOR YOUNG READERS',
    title: 'Stories That Make Young Minds Wonder',
    description: 'Colourful stories, early-learning books and joyful reads for growing imaginations.',
    icon: '🧒',
    theme: 'children',
    visualText: 'READ • IMAGINE • GROW'
  },
  {
    name: 'Competitive Exams',
    match: ['competitive exams', 'competitive exam'],
    eyebrow: 'LEARN • PREPARE • ACHIEVE',
    title: 'Prepare Smarter. Aim Higher.',
    description: 'Useful study guides and knowledge books designed for focused exam preparation.',
    icon: '🎯',
    theme: 'exam',
    visualText: 'FOCUS • PRACTISE • SUCCEED'
  },
  {
    name: 'Fiction',
    match: ['fiction'],
    eyebrow: 'ESCAPE INTO A STORY',
    title: 'Every Page Opens Another World',
    description: 'Discover unforgettable characters, adventures and stories worth getting lost in.',
    icon: '📖',
    theme: 'fiction',
    visualText: 'DREAM • DISCOVER • ESCAPE'
  },
  {
    name: 'Self Help',
    match: ['self help', 'self-help'],
    eyebrow: 'GROW EVERY DAY',
    title: 'Small Ideas. Meaningful Changes.',
    description: 'Books that inspire better habits, clearer thinking and a more purposeful everyday life.',
    icon: '🌱',
    theme: 'selfhelp',
    visualText: 'LEARN • GROW • TRANSFORM'
  },
  {
    name: 'Tamil Literature',
    match: ['tamil literature', 'tamil'],
    eyebrow: 'ROOTED IN OUR LANGUAGE',
    title: 'Timeless Tamil Stories & Ideas',
    description: 'Explore classics and contemporary Tamil works that celebrate language, culture and thought.',
    icon: 'அ',
    theme: 'tamil',
    visualText: 'மொழி • இலக்கியம் • மரபு'
  }
]

function orderedFeaturedBooks(catalogue) {
  const byKey = new Map(catalogue.map(book => [slugKey(book.title), book]))
  const ordered = FEATURED_ORDER.map(key => byKey.get(key)).filter(Boolean)
  return ordered.length ? ordered : catalogue.slice(0, 5)
}

function normalizeCategory(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export default function HomePage() {
  const [activeCategorySlide, setActiveCategorySlide] = useState(0)
  const [categoryPaused, setCategoryPaused] = useState(false)
  const { books, offers, authors, loading } = useStore()
  const carouselRef = useRef(null)

  const catalogue = useMemo(
    () => decorateBooks(books?.length ? books : demoBooks),
    [books]
  )

  const featuredBooks = useMemo(
    () => orderedFeaturedBooks(catalogue),
    [catalogue]
  )

  const topOffer = useMemo(
    () => (offers?.length ? offers.find(offer => offer.active) || offers[0] : demoOffers[0]),
    [offers]
  )

  const authorRows = useMemo(() => {
    const source = authors?.length ? authors : demoAuthors
    const byKey = new Map(source.map(author => [slugKey(author.name), author]))
    return AUTHOR_ORDER.map(key => byKey.get(key)).filter(Boolean)
  }, [authors])

  const categorySlides = useMemo(() => {
    return CATEGORY_CONFIG.map(item => {
      const matchSet = new Set(item.match.map(normalizeCategory))

      const matchingBooks = catalogue.filter(book =>
        matchSet.has(normalizeCategory(book.category))
      )

      const images = [...new Set(
        matchingBooks
          .map(book => book.image)
          .filter(Boolean)
      )].slice(0, 3)

      return {
        ...item,
        count: matchingBooks.length,
        images,
        image: images[0] || '/covers/atomic-habits.svg'
      }
    })
  }, [catalogue])

  useEffect(() => {
    if (categoryPaused || categorySlides.length <= 1) return undefined

    const timer = window.setInterval(() => {
      setActiveCategorySlide(current =>
        (current + 1) % categorySlides.length
      )
    }, 4000)

    return () => window.clearInterval(timer)
  }, [categoryPaused, categorySlides.length])

  useEffect(() => {
    if (activeCategorySlide >= categorySlides.length) {
      setActiveCategorySlide(0)
    }
  }, [activeCategorySlide, categorySlides.length])

  function slide(direction) {
    carouselRef.current?.scrollBy({
      left: direction * 280,
      behavior: 'smooth'
    })
  }

  function nextCategorySlide() {
    if (!categorySlides.length) return
    setActiveCategorySlide(current =>
      (current + 1) % categorySlides.length
    )
  }

  function previousCategorySlide() {
    if (!categorySlides.length) return
    setActiveCategorySlide(current =>
      (current - 1 + categorySlides.length) % categorySlides.length
    )
  }

  return (
    <main className="tv-homepage">
      <section className="tv-hero-shell">
        <div className="page-width tv-hero">
          <div className="tv-hero-left">
            <div className="tv-hero-kicker">THULIRKUM VER · ONLINE BOOKSTORE</div>
            <h1>Let Knowledge<br />Take Root.</h1>
            <p className="tv-hero-subtitle">
              Discover Tamil and English books that inform, inspire and uplift.
            </p>
            <div className="tv-hero-actions">
              <Link to="/shop" className="tv-btn-primary">
                Explore all books <span>→</span>
              </Link>
              <Link to="/offers" className="tv-btn-secondary">
                <span>🎁</span> View Offers
              </Link>
            </div>
          </div>

          <div className="tv-hero-stage" aria-label="Featured book stack">
            <img
              className="tv-hero-photo"
              src="/premium/hero-books-premium.png"
              alt="Featured books stacked beside a green plant"
            />
          </div>
        </div>
      </section>

      <section className="page-width home-category-showcase">
        <div className="category-showcase-header">
          <div>
            <span>EXPLORE</span>
            <h2>Explore by Category</h2>
          </div>

          <Link to="/shop">View all categories →</Link>
        </div>

        <div
          className="category-slider-shell"
          onMouseEnter={() => setCategoryPaused(true)}
          onMouseLeave={() => setCategoryPaused(false)}
          onFocusCapture={() => setCategoryPaused(true)}
          onBlurCapture={() => setCategoryPaused(false)}
        >
          {categorySlides.map((slideItem, index) => (
            <article
              key={slideItem.name}
              className={`category-feature-slide category-theme-${slideItem.theme} ${
                index === activeCategorySlide ? 'active' : ''
              }`}
              aria-hidden={index !== activeCategorySlide}
            >
              <div className="category-feature-copy">
                <span className="category-feature-eyebrow">
                  <b>{slideItem.icon}</b>
                  {slideItem.eyebrow}
                </span>

                <h3>{slideItem.title}</h3>
                <p>{slideItem.description}</p>

                <div className="category-feature-actions">
                  <Link
                    to={`/shop?category=${encodeURIComponent(slideItem.name)}`}
                    className="category-explore-btn"
                  >
                    Explore {slideItem.name}
                    <span>→</span>
                  </Link>

                  <small>
                    <strong>{slideItem.count}</strong>{' '}
                    {slideItem.count === 1 ? 'book' : 'books'} available
                  </small>
                </div>
              </div>

              <div className="category-feature-visual">
                <div className="category-visual-blob" />
                <div className="category-visual-spark spark-one">✦</div>
                <div className="category-visual-spark spark-two">✦</div>

                <div className={`category-cover-collage covers-${Math.min(slideItem.images.length, 3) || 1}`}>
                  {(slideItem.images.length ? slideItem.images : [slideItem.image]).map((src, imageIndex) => (
                    <img
                      key={`${slideItem.name}-${src}-${imageIndex}`}
                      className={`category-cover category-cover-${imageIndex + 1}`}
                      src={src}
                      alt={`${slideItem.name} book ${imageIndex + 1}`}
                      onError={event => {
                        event.currentTarget.onerror = null
                        event.currentTarget.src = '/covers/atomic-habits.svg'
                      }}
                    />
                  ))}
                </div>

                <div className="category-character-badge" aria-hidden="true">
                  <span>{slideItem.icon}</span>
                </div>

                <div className="category-visual-copy" aria-hidden="true">
                  {slideItem.visualText}
                </div>
              </div>
            </article>
          ))}

          {categorySlides.length > 1 && (
            <>
              <button
                type="button"
                className="category-slider-arrow category-slider-prev"
                onClick={previousCategorySlide}
                aria-label="Previous category"
              >
                ‹
              </button>

              <button
                type="button"
                className="category-slider-arrow category-slider-next"
                onClick={nextCategorySlide}
                aria-label="Next category"
              >
                ›
              </button>

              <div className="category-slider-dots" aria-label="Category slides">
                {categorySlides.map((slideItem, index) => (
                  <button
                    type="button"
                    key={slideItem.name}
                    className={index === activeCategorySlide ? 'active' : ''}
                    onClick={() => setActiveCategorySlide(index)}
                    aria-label={`Show ${slideItem.name}`}
                    aria-current={index === activeCategorySlide ? 'true' : undefined}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <section className="page-width tv-section tv-featured-section">
        <div className="tv-section-head">
          <div>
            <h2>Featured Books</h2>
            <p>Curated picks for your next great read.</p>
          </div>
          <Link to="/shop" className="tv-inline-link">
            View all books <span>→</span>
          </Link>
        </div>

        <div className="tv-carousel-shell">
          <button
            type="button"
            className="tv-carousel-btn prev"
            onClick={() => slide(-1)}
            aria-label="Previous books"
          >
            ‹
          </button>

          <div className="tv-featured-grid" ref={carouselRef}>
            {loading && !featuredBooks.length ? (
              <p>Loading books...</p>
            ) : (
              featuredBooks.map(book => (
                <BookCard key={book.id} book={book} variant="home-ref" />
              ))
            )}
          </div>

          <button
            type="button"
            className="tv-carousel-btn next"
            onClick={() => slide(1)}
            aria-label="Next books"
          >
            ›
          </button>
        </div>
      </section>

      <section className="page-width tv-offer-banner">
        <div className="tv-offer-copy">
          <small>🎁 SPECIAL OFFER</small>
          <h3>{topOffer?.title || 'Great Books. Greater Journeys.'}</h3>
          <p>{topOffer?.description || 'Get up to 30% OFF on selected titles.'}</p>
        </div>

        <Link to="/offers" className="tv-offer-link">
          View Offers <span>→</span>
        </Link>

        <img
          className="tv-offer-photo"
          src="/premium/offer-books-premium.png"
          alt="Premium books with an up to 30 percent offer"
        />
      </section>

      <section className="page-width tv-section tv-authors-section">
        <div className="tv-section-head">
          <h2>Featured Authors</h2>
          <Link to="/shop" className="tv-inline-link">
            View all authors <span>→</span>
          </Link>
        </div>

        <div className="tv-author-row">
          {authorRows.map(author => (
            <Link
              key={author.name}
              to={`/shop?q=${encodeURIComponent(author.name)}`}
              className="tv-author-chip"
            >
              <img
                src={author.image || '/covers/authors/editorial.svg'}
                alt={author.name}
                onError={event => {
                  event.currentTarget.onerror = null
                  event.currentTarget.src = '/covers/authors/editorial.svg'
                }}
              />
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
