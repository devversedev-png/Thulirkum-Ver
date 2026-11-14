import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import BookCard from '../components/BookCard'
import PremiumSelect from '../components/PremiumSelect'
import { demoBooks } from '../data/siteCatalog'

const PAGE_SIZE = 12

export default function ShopPage() {
  const { books, homeSections } = useStore()

  const catalogue = useMemo(() => {
    return books?.length ? books : demoBooks
  }, [books])

  const [params, setParams] = useSearchParams()
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [activeSlide, setActiveSlide] = useState(0)

  const q = params.get('q') || ''
  const category = params.get('category') || ''
  const language = params.get('language') || ''
  const sort = params.get('sort') || ''
  const price = params.get('price') || ''
  const rating = Number(params.get('rating') || 0)
  const inStockOnly = params.get('stock') === '1'
  const offerOnly = params.get('offer') === '1'
  const homeSection = params.get('homeSection') || ''
  const page = Math.max(1, Number(params.get('page') || 1))

  const categories = useMemo(
    () =>
      [...new Set(
        catalogue
          .map(book => book.category)
          .filter(Boolean)
      )].sort(),
    [catalogue]
  )

  const languages = useMemo(
    () =>
      [...new Set(
        catalogue
          .map(book => book.language)
          .filter(Boolean)
      )].sort(),
    [catalogue]
  )

  const sortOptions = [
    { value: '', label: 'Bestselling' },
    { value: 'rating', label: 'Customer Rating' },
    { value: 'new', label: 'Newest First' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' }
  ]


  useEffect(() => {
    if (!mobileFiltersOpen) return

    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previous
    }
  }, [mobileFiltersOpen])

  const promoBooks = useMemo(() => {

    const promotional = catalogue.filter(book => {

      const hasOffer =
        Number(book.originalPrice || 0) >
        Number(book.price || 0)

      const isNew =
        book.newArrival === true

      return (
        book.available !== false &&
        Number(book.stock || 0) > 0 &&
        (hasOffer || isNew)
      )
    })

    if (promotional.length) {
      return promotional.slice(0, 6)
    }

    return catalogue
      .filter(
        book =>
          book.available !== false &&
          Number(book.stock || 0) > 0
      )
      .slice(0, 6)

  }, [catalogue])

  useEffect(() => {

    if (promoBooks.length <= 1) {
      return
    }

    const timer = setInterval(() => {

      setActiveSlide(current =>
        (current + 1) %
        promoBooks.length
      )

    }, 2500)

    return () =>
      clearInterval(timer)

  }, [promoBooks.length])

  function nextSlide() {

    if (!promoBooks.length) return

    setActiveSlide(current =>
      (current + 1) %
      promoBooks.length
    )

  }


  function previousSlide() {

    if (!promoBooks.length) return

    setActiveSlide(current =>
      (
        current -
        1 +
        promoBooks.length
      ) %
      promoBooks.length
    )

  }

  useEffect(() => {

    if (
      activeSlide >= promoBooks.length
    ) {
      setActiveSlide(0)
    }

  }, [
    activeSlide,
    promoBooks.length
  ])

  const sectionBookIds = useMemo(() => {
    if (!homeSection || homeSection === 'discounted') return null
    const section = (homeSections || []).find(item => item.key === homeSection)
    return section ? new Set((section.bookIds || []).map(String)) : null
  }, [homeSections, homeSection])

  const filtered = useMemo(() => {
    const text = q.toLowerCase().trim()

    let list = catalogue.filter(book => {
      const searchable = `
        ${book.title || ''}
        ${book.author || ''}
        ${book.category || ''}
        ${book.publisher || ''}
        ${book.isbn || ''}
      `.toLowerCase()

      const amount = Number(book.price || 0)

      const priceMatch =
        !price ||
        (price === 'under-200' && amount < 200) ||
        (
          price === '200-500' &&
          amount >= 200 &&
          amount <= 500
        ) ||
        (
          price === '500-1000' &&
          amount > 500 &&
          amount <= 1000
        ) ||
        (
          price === '1000-plus' &&
          amount > 1000
        )

      const stockMatch =
        !inStockOnly ||
        (
          book.available !== false &&
          Number(book.stock || 0) > 0
        )

      const sectionMatch =
        !homeSection ||
        (homeSection === 'discounted'
          ? Number(book.originalPrice || 0) > Number(book.price || 0)
          : sectionBookIds !== null && sectionBookIds.has(String(book.id)))

      const offerMatch =
        !offerOnly ||
        Number(book.originalPrice || 0) >
        Number(book.price || 0)

      return (
        (!text || searchable.includes(text)) &&
        (!category || book.category === category) &&
        (!language || book.language === language) &&
        priceMatch &&
        (!rating || Number(book.rating || 0) >= rating) &&
        stockMatch &&
        sectionMatch &&
        offerMatch
      )
    })

    if (sort === 'rating') {
      list = [...list].sort(
        (a, b) =>
          Number(b.rating || 0) -
          Number(a.rating || 0)
      )
    }

    if (sort === 'new') {
      list = [...list].sort(
        (a, b) =>
          Number(b.newArrival || 0) -
          Number(a.newArrival || 0)
      )
    }

    if (sort === 'price-low') {
      list = [...list].sort(
        (a, b) =>
          Number(a.price || 0) -
          Number(b.price || 0)
      )
    }

    if (sort === 'price-high') {
      list = [...list].sort(
        (a, b) =>
          Number(b.price || 0) -
          Number(a.price || 0)
      )
    }

    return list
  }, [
    catalogue,
    q,
    category,
    language,
    sort,
    price,
    rating,
    inStockOnly,
    offerOnly,
    homeSection,
    sectionBookIds
  ])

  const pageCount = Math.max(
    1,
    Math.ceil(filtered.length / PAGE_SIZE)
  )

  const safePage = Math.min(page, pageCount)

  const visible = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  )

  function update(key, value) {
    const next = new URLSearchParams(params)

    if (value) {
      next.set(key, value)
    } else {
      next.delete(key)
    }

    if (key !== 'page') {
      next.delete('page')
    }

    setParams(next)
  }

  function clearFilters() {
    const next = new URLSearchParams()

    if (q) {
      next.set('q', q)
    }

    setParams(next)
  }

  const countFor = predicate =>
    catalogue.filter(predicate).length

  const activeFilterCount = [
    category,
    language,
    price,
    rating > 0,
    inStockOnly,
    offerOnly
  ].filter(Boolean).length

  const hasActiveFilters = activeFilterCount > 0

  function FiltersContent() {
    return (
      <>
        <div className="concept-filter-section">
          <h3>Categories</h3>

          {categories.slice(0, 8).map(item => (
            <button
              type="button"
              key={item}
              className={category === item ? 'active' : ''}
              onClick={() =>
                update(
                  'category',
                  category === item ? '' : item
                )
              }
            >
              <span>
                <i className="filter-check">
                  {category === item ? '✓' : ''}
                </i>

                {item}
              </span>

              <b>
                {countFor(
                  book => book.category === item
                )}
              </b>
            </button>
          ))}
        </div>

        <div className="concept-filter-section">
          <h3>Language</h3>

          {languages.map(item => (
            <button
              type="button"
              key={item}
              className={language === item ? 'active' : ''}
              onClick={() =>
                update(
                  'language',
                  language === item ? '' : item
                )
              }
            >
              <span>
                <i className="filter-check">
                  {language === item ? '✓' : ''}
                </i>

                {item}
              </span>

              <b>
                {countFor(
                  book => book.language === item
                )}
              </b>
            </button>
          ))}
        </div>

        <div className="concept-filter-section">
          <h3>Price Range</h3>

          {[
            ['under-200', 'Under ₹200'],
            ['200-500', '₹200 – ₹500'],
            ['500-1000', '₹500 – ₹1000'],
            ['1000-plus', 'Above ₹1000']
          ].map(([value, label]) => (
            <button
              type="button"
              key={value}
              className={price === value ? 'active' : ''}
              onClick={() =>
                update(
                  'price',
                  price === value ? '' : value
                )
              }
            >
              <span>
                <i className="filter-check">
                  {price === value ? '✓' : ''}
                </i>

                {label}
              </span>
            </button>
          ))}
        </div>

        <div className="concept-filter-section">
          <h3>Rating</h3>

          {[4, 3].map(value => (
            <button
              type="button"
              key={value}
              className={rating === value ? 'active' : ''}
              onClick={() =>
                update(
                  'rating',
                  rating === value
                    ? ''
                    : String(value)
                )
              }
            >
              <span>
                <i className="filter-check">
                  {rating === value ? '✓' : ''}
                </i>

                {'★'.repeat(value)} & up
              </span>
            </button>
          ))}
        </div>

        <div className="concept-filter-section">
          <h3>Availability</h3>

          <button
            type="button"
            className={inStockOnly ? 'active' : ''}
            onClick={() =>
              update(
                'stock',
                inStockOnly ? '' : '1'
              )
            }
          >
            <span>
              <i className="filter-check">
                {inStockOnly ? '✓' : ''}
              </i>

              In Stock
            </span>
          </button>
        </div>

        <div className="concept-filter-section">
          <h3>Offers</h3>

          <button
            type="button"
            className={offerOnly ? 'active' : ''}
            onClick={() =>
              update(
                'offer',
                offerOnly ? '' : '1'
              )
            }
          >
            <span>
              <i className="filter-check">
                {offerOnly ? '✓' : ''}
              </i>

              On Sale
            </span>
          </button>
        </div>
      </>
    )
  }

  return (
    <section className="shop-page">

      {/* =====================================
          COMPACT BOOK OFFER / NEW RELEASE SLIDER
      ===================================== */}

      {promoBooks.length > 0 && (
        <section className="shop-book-slider">
          <div className="page-width">
            <div className="shop-slider-shell">

              {promoBooks.map((book, index) => {
                const discount =
                  Number(book.originalPrice || 0) > Number(book.price || 0)
                    ? Math.round(
                      ((Number(book.originalPrice) - Number(book.price)) /
                        Number(book.originalPrice)) *
                      100
                    )
                    : 0

                return (
                  <article
                    key={book.id}
                    className={`shop-slider-slide ${index === activeSlide ? 'active' : ''
                      }`}
                    aria-hidden={index !== activeSlide}
                  >
                    <div className="shop-slider-content">

                      <div className="shop-slider-text">
                        <span className="shop-slider-badge">
                          {book.newArrival
                            ? '✨ NEW RELEASE'
                            : discount > 0
                              ? `🔥 ${discount}% OFF`
                              : '📚 FEATURED BOOK'}
                        </span>

                        <h2>{book.title}</h2>
                        <p>{book.author}</p>

                        <div className="shop-slider-price">
                          <strong>₹{book.price}</strong>

                          {Number(book.originalPrice || 0) >
                            Number(book.price || 0) && (
                              <del>₹{book.originalPrice}</del>
                            )}
                        </div>

                        <Link
                          to={`/book/${book.id}`}
                          className="shop-slider-btn"
                        >
                          View Book <span>»</span>
                        </Link>
                      </div>

                      <Link
                        to={`/book/${book.id}`}
                        className="shop-slider-image"
                        aria-label={`View ${book.title}`}
                      >
                        <img
                          src={book.image}
                          alt={book.title}
                          loading={index === 0 ? 'eager' : 'lazy'}
                        />
                      </Link>

                    </div>
                  </article>
                )
              })}

              {promoBooks.length > 1 && (
                <>
                  <button
                    type="button"
                    className="shop-slider-arrow shop-slider-prev"
                    onClick={previousSlide}
                    aria-label="Previous featured book"
                  >
                    ‹
                  </button>

                  <button
                    type="button"
                    className="shop-slider-arrow shop-slider-next"
                    onClick={nextSlide}
                    aria-label="Next featured book"
                  >
                    ›
                  </button>

                  <div className="shop-slider-dots">
                    {promoBooks.map((book, index) => (
                      <button
                        type="button"
                        key={book.id}
                        className={index === activeSlide ? 'active' : ''}
                        onClick={() => setActiveSlide(index)}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}

            </div>
          </div>
        </section>
      )}


      {/* =====================================
          SHOP AREA
      ===================================== */}

      <div className="page-width concept-shop-layout">

        {/* DESKTOP FILTER */}

        <aside className="concept-filter-panel desktop-filter-panel">

          <div className="concept-filter-head">
            <strong>Filters</strong>

            <button
              type="button"
              onClick={clearFilters}
            >
              Clear all
            </button>
          </div>

          <FiltersContent />

        </aside>


        {/* BOOK RESULTS */}

        <div className="concept-shop-results">

          <div className="shop-results-toolbar">

            <div className="shop-result-info">

              {/* MOBILE FILTER BUTTON */}

              <button
                type="button"
                className="shop-mobile-filter-btn"
                onClick={() =>
                  setMobileFiltersOpen(true)
                }
              >
                <span>☷</span>

                Filters

                {activeFilterCount > 0 && (
                  <b>{activeFilterCount}</b>
                )}
              </button>


              <span className="shop-result-count">
                Showing{' '}
                {filtered.length
                  ? (safePage - 1) *
                  PAGE_SIZE +
                  1
                  : 0}
                –
                {Math.min(
                  safePage * PAGE_SIZE,
                  filtered.length
                )}{' '}
                of {filtered.length} books
              </span>

            </div>


            <div className="concept-sort-wrap">
              <span>Sort by</span>

              <PremiumSelect
                value={sort}
                options={sortOptions}
                onChange={value =>
                  update('sort', value)
                }
                className="sort-premium-select"
              />
            </div>

          </div>


          {/* ACTIVE FILTERS */}

          {hasActiveFilters && (
            <div className="concept-active-filters">

              {category && (
                <button
                  onClick={() =>
                    update('category', '')
                  }
                >
                  {category} ×
                </button>
              )}

              {language && (
                <button
                  onClick={() =>
                    update('language', '')
                  }
                >
                  {language} ×
                </button>
              )}

              {price && (
                <button
                  onClick={() =>
                    update('price', '')
                  }
                >
                  Price ×
                </button>
              )}

              {rating > 0 && (
                <button
                  onClick={() =>
                    update('rating', '')
                  }
                >
                  {rating}★ & up ×
                </button>
              )}

              {inStockOnly && (
                <button
                  onClick={() =>
                    update('stock', '')
                  }
                >
                  In Stock ×
                </button>
              )}

              {offerOnly && (
                <button
                  onClick={() =>
                    update('offer', '')
                  }
                >
                  Offers ×
                </button>
              )}

            </div>
          )}


          {/* ONLY BOOK AREA SCROLL */}

          <div className="concept-shop-scroll-area">

            {visible.length ? (
              <div className="book-grid shop-grid">

                {visible.map(book => (
                  <BookCard
                    key={book.id}
                    book={book}
                    variant="shop"
                  />
                ))}

              </div>
            ) : (
              <div className="empty-state">

                <span className="empty-book-icon">
                  ▤
                </span>

                <h3>No matching books</h3>

                <p>
                  Try a different title, author,
                  category or language.
                </p>

                <button
                  type="button"
                  className="market-cart-button"
                  onClick={() => setParams({})}
                >
                  View all books
                </button>

              </div>
            )}


            {pageCount > 1 && (
              <div className="shop-pagination">

                <button
                  disabled={safePage === 1}
                  onClick={() =>
                    update(
                      'page',
                      String(safePage - 1)
                    )
                  }
                >
                  ‹
                </button>

                {Array.from(
                  {
                    length: Math.min(
                      pageCount,
                      5
                    )
                  },
                  (_, index) => index + 1
                ).map(number => (
                  <button
                    key={number}
                    className={
                      safePage === number
                        ? 'active'
                        : ''
                    }
                    onClick={() =>
                      update(
                        'page',
                        String(number)
                      )
                    }
                  >
                    {number}
                  </button>
                ))}

                {pageCount > 5 && (
                  <span>… {pageCount}</span>
                )}

                <button
                  disabled={
                    safePage === pageCount
                  }
                  onClick={() =>
                    update(
                      'page',
                      String(safePage + 1)
                    )
                  }
                >
                  ›
                </button>

              </div>
            )}

          </div>

        </div>

      </div>


      {/* =====================================
          MOBILE FILTER DRAWER
      ===================================== */}

      <div
        className={`mobile-filter-overlay ${mobileFiltersOpen ? 'show' : ''
          }`}
        onClick={() =>
          setMobileFiltersOpen(false)
        }
      />

      <aside
        className={`mobile-filter-drawer ${mobileFiltersOpen ? 'open' : ''
          }`}
      >

        <div className="mobile-filter-header">
          <div>
            <strong>Filters</strong>

            <small>
              Refine your book selection
            </small>
          </div>

          <button
            type="button"
            className="mobile-filter-close"
            onClick={() =>
              setMobileFiltersOpen(false)
            }
          >
            ×
          </button>
        </div>


        <div className="mobile-filter-body">
          <FiltersContent />
        </div>


        <div className="mobile-filter-footer">

          <button
            type="button"
            className="mobile-clear-btn"
            onClick={clearFilters}
          >
            Clear
          </button>

          <button
            type="button"
            className="mobile-show-btn"
            onClick={() =>
              setMobileFiltersOpen(false)
            }
          >
            Show {filtered.length} Books
          </button>

        </div>

      </aside>

    </section>
  )
}