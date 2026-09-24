import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useStore } from '../context/StoreContext'
import BookCard from '../components/BookCard'
import { decorateBooks } from '../data/siteCatalog'

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
  const [activeOfferSlide, setActiveOfferSlide] = useState(0)
  const { books, offers, authors, homeSections, homeSettings, loading } = useStore()
  console.log('HOME SECTIONS FROM BACKEND:', homeSections)

  const catalogue = useMemo(
    () => decorateBooks(books || []),
    [books]
  )

  const homeBookSections = useMemo(() => {
  const seen = new Set()

  return (homeSections || [])
    .map(section => ({
      ...section,
      books: (section.bookIds || [])
        .map(id => catalogue.find(book => book.id === id))
        .filter(Boolean),
    }))
    .filter(section => {
      if (section.active === false || !section.books.length) {
        return false
      }

      // Use the actual section key/title to prevent duplicate sections
      const uniqueKey = String(
        section.key ||
        section.name ||
        section.title ||
        section.id ||
        ''
      )
        .trim()
        .toLowerCase()

      if (!uniqueKey || seen.has(uniqueKey)) {
        return false
      }

      seen.add(uniqueKey)
      return true
    })
    .sort(
      (a, b) =>
        Number(a.displayOrder || 0) -
        Number(b.displayOrder || 0)
    )
}, [homeSections, catalogue])

  const offerRows = useMemo(
    () => (offers || []).filter(offer => offer.active !== false),
    [offers]
  )

  const authorRows = useMemo(() => {
    return [...(authors || [])]
      .filter(author => author.active !== false && author.featured !== false)
      .sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0))
  }, [authors])

  const activeOffer = offerRows[activeOfferSlide] || offerRows[0]
  const activeHeroBanner = homeSettings?.bannerUrls?.[homeSettings?.activeBannerIndex] || ''

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
    if (offerRows.length <= 1) return undefined

    const timer = window.setInterval(() => {
      setActiveOfferSlide(current => (current + 1) % offerRows.length)
    }, 4500)

    return () => window.clearInterval(timer)
  }, [offerRows.length])

  useEffect(() => {
    if (activeOfferSlide >= offerRows.length) {
      setActiveOfferSlide(0)
    }
  }, [activeOfferSlide, offerRows.length])

  useEffect(() => {
    if (categoryPaused || categorySlides.length <= 1) return undefined

    const timer = window.setInterval(() => {
      setActiveCategorySlide(current =>
        (current + 1) % categorySlides.length
      )
    }, 2500)

    return () => window.clearInterval(timer)
  }, [categoryPaused, categorySlides.length])

  useEffect(() => {
    if (activeCategorySlide >= categorySlides.length) {
      setActiveCategorySlide(0)
    }
  }, [activeCategorySlide, categorySlides.length])

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
      <section
        className={`tv-hero-shell ${activeHeroBanner ? 'tv-hero-shell-has-banner' : ''}`}
        style={activeHeroBanner ? { backgroundImage: `linear-gradient(90deg, rgba(247, 247, 239, .98) 0%, rgba(247, 247, 239, .84) 52%, rgba(247, 247, 239, .38) 100%), url("${activeHeroBanner}")` } : undefined}
      >
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

      {homeBookSections.map(section => (
        <section className="page-width tv-section tv-home-book-section-v7" key={section.id || section.key}>
          <div className="tv-section-head">
            <div>
              <h2>{section.title}</h2>
              {section.description && <p>{section.description}</p>}
            </div>
            <Link to={`/shop?homeSection=${encodeURIComponent(section.key)}`} className="tv-inline-link">
              View all <span>→</span>
            </Link>
          </div>

          <div className="tv-home-book-row-v7">
            {section.books.map(book => (
              <BookCard key={`${section.key}-${book.id}`} book={book} variant="home-ref" />
            ))}
          </div>
        </section>
      ))}

      {activeOffer && (
        <section className="page-width tv-offer-banner tv-offer-slider-v7">
          <div className="tv-offer-copy">
            <small>🎁 SPECIAL OFFER</small>
            <h3>{activeOffer.title}</h3>
            <p>{activeOffer.description || 'Save on selected books.'}</p>
            <div className="tv-offer-slide-value-v7">
              <strong>
                {activeOffer.discountType === 'FIXED'
                  ? `₹${activeOffer.discountValue}`
                  : `${activeOffer.discountValue}%`}
              </strong>
              <span>OFF</span>
              {activeOffer.code && <b>Code: {activeOffer.code}</b>}
            </div>
          </div>

          <Link to="/offers" className="tv-offer-link">
            View Offers <span>→</span>
          </Link>

          <div className="tv-offer-slider-controls-v7">
            {offerRows.length > 1 && (
              <>
                <button type="button" onClick={() => setActiveOfferSlide(current => (current - 1 + offerRows.length) % offerRows.length)} aria-label="Previous offer">‹</button>
                <div>
                  {offerRows.map((offer, index) => (
                    <button
                      type="button"
                      key={offer.id}
                      className={index === activeOfferSlide ? 'active' : ''}
                      onClick={() => setActiveOfferSlide(index)}
                      aria-label={`Show offer ${index + 1}`}
                    />
                  ))}
                </div>
                <button type="button" onClick={() => setActiveOfferSlide(current => (current + 1) % offerRows.length)} aria-label="Next offer">›</button>
              </>
            )}
          </div>

          <img
            className="tv-offer-photo"
            src={activeOffer.bannerImage || '/premium/offer-books-premium.png'}
            alt={activeOffer.title}
          />
        </section>
      )}

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
