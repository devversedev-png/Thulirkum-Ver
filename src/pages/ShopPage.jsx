import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import BookCard from '../components/BookCard'
import PremiumSelect from '../components/PremiumSelect'

export default function ShopPage() {
  const { books } = useStore()
  const [params, setParams] = useSearchParams()

  const q = params.get('q') || ''
  const category = params.get('category') || ''
  const language = params.get('language') || ''
  const sort = params.get('sort') || ''
  const offerOnly = params.get('offer') === '1'

  const categories = [...new Set(books.map(book => book.category).filter(Boolean))]
  const languages = [...new Set(books.map(book => book.language).filter(Boolean))]

  const sortOptions = [
    { value: '', label: 'Featured' },
    { value: 'rating', label: 'Best Rated' },
    { value: 'new', label: 'New Arrivals' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' }
  ]

  const categoryOptions = [
    { value: '', label: 'Category' },
    ...categories.map(item => ({ value: item, label: item }))
  ]

  const languageOptions = [
    { value: '', label: 'Language' },
    ...languages.map(item => ({ value: item, label: item }))
  ]

  const filtered = useMemo(() => {
    const text = q.toLowerCase().trim()
    let list = books.filter(book => {
      const searchable = `${book.title} ${book.author} ${book.category} ${book.publisher || ''} ${book.isbn || ''}`.toLowerCase()
      return (!text || searchable.includes(text))
        && (!category || book.category === category)
        && (!language || book.language === language)
        && (!offerOnly || book.originalPrice > book.price)
    })

    if (sort === 'rating') list = [...list].sort((a, b) => b.rating - a.rating)
    if (sort === 'new') list = [...list].sort((a, b) => Number(b.newArrival) - Number(a.newArrival))
    if (sort === 'price-low') list = [...list].sort((a, b) => a.price - b.price)
    if (sort === 'price-high') list = [...list].sort((a, b) => b.price - a.price)
    return list
  }, [books, q, category, language, sort, offerOnly])

  function update(key, value) {
    const next = new URLSearchParams(params)
    value ? next.set(key, value) : next.delete(key)
    next.delete('filters')
    setParams(next)
  }

  function clearFilters() {
    const next = new URLSearchParams()
    if (q) next.set('q', q)
    setParams(next)
  }

  const hasFilters = Boolean(category || language || sort || offerOnly)

  return (
    <section className="shop-page page-width premium-shop-page">
      <div className="shop-hero-row">
        <div className="shop-title-block">
          <span className="eyebrow">Browse our shelf</span>
          <h1>{category || 'All Books'}</h1>
          <div className="shop-result-line">
            <span>{filtered.length} books found</span>
            {q && <span className="search-result-chip">Search: “{q}”</span>}
            {offerOnly && <span className="search-result-chip">Offers only</span>}
          </div>
        </div>

        <div className="shop-filter-bar" id="filters">
          <PremiumSelect
            value={category}
            options={categoryOptions}
            onChange={value => update('category', value)}
            className="shop-filter-select category-filter-select"
            icon="▤"
          />
          <PremiumSelect
            value={language}
            options={languageOptions}
            onChange={value => update('language', value)}
            className="shop-filter-select language-filter-select"
            icon="◎"
          />
          <PremiumSelect
            value={sort}
            options={sortOptions}
            onChange={value => update('sort', value)}
            className="shop-filter-select sort-premium-select"
            icon="☷"
          />
          {hasFilters && (
            <button type="button" className="clear-filter-chip" onClick={clearFilters}>Clear</button>
          )}
        </div>
      </div>

      {filtered.length ? (
        <div className="book-grid shop-grid premium-shop-grid">
          {filtered.map(book => <BookCard key={book.id} book={book} variant="shop" />)}
        </div>
      ) : (
        <div className="empty-state premium-empty-state">
          <span className="empty-book-icon">▤</span>
          <h3>No books found</h3>
          <p>Try another category, language or search term.</p>
          <button type="button" className="primary-btn" onClick={() => setParams({})}>View all books</button>
        </div>
      )}
    </section>
  )
}
