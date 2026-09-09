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
    { value: '', label: 'Recommended' },
    { value: 'rating', label: 'Customer Rating' },
    { value: 'new', label: 'Newest First' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' }
  ]

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...categories.map(item => ({ value: item, label: item }))
  ]

  const languageOptions = [
    { value: '', label: 'All Languages' },
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
    setParams(next)
  }

  function clearFilters() {
    const next = new URLSearchParams()
    if (q) next.set('q', q)
    setParams(next)
  }

  const hasFilters = Boolean(category || language || sort || offerOnly)

  return (
    <section className="shop-page page-width market-shop-page">
      <div className="market-shop-heading">
        <div>
          <div className="market-breadcrumb">Home / Books {category ? `/ ${category}` : ''}</div>
          <h1>{q ? `Search results for “${q}”` : category || 'All Books'}</h1>
          <p>{filtered.length} {filtered.length === 1 ? 'book' : 'books'} available</p>
        </div>
        {q && <span className="market-search-summary">Showing matches for <strong>{q}</strong></span>}
      </div>

      <div className="market-shop-toolbar" id="filters">
        <div className="market-filter-group">
          <span className="market-filter-label">Filter by</span>
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
          <button
            type="button"
            className={`market-offer-filter ${offerOnly ? 'active' : ''}`}
            onClick={() => update('offer', offerOnly ? '' : '1')}
          >⚡ Offers</button>
          {hasFilters && <button type="button" className="clear-filter-chip" onClick={clearFilters}>Clear all</button>}
        </div>

        <div className="market-sort-group">
          <span>Sort by</span>
          <PremiumSelect
            value={sort}
            options={sortOptions}
            onChange={value => update('sort', value)}
            className="shop-filter-select sort-premium-select"
            icon="☷"
          />
        </div>
      </div>

      {filtered.length ? (
        <div className="book-grid shop-grid premium-shop-grid market-shop-grid">
          {filtered.map(book => <BookCard key={book.id} book={book} variant="shop" />)}
        </div>
      ) : (
        <div className="empty-state premium-empty-state market-empty-state">
          <span className="empty-book-icon">📚</span>
          <h3>No matching books</h3>
          <p>Try a different title, author, category or language.</p>
          <button type="button" className="market-cart-button" onClick={() => setParams({})}>View all books</button>
        </div>
      )}
    </section>
  )
}
