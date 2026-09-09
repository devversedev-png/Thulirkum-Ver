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

  const categories = [...new Set(books.map(book => book.category).filter(Boolean))].sort()
  const languages = [...new Set(books.map(book => book.language).filter(Boolean))].sort()

  const sortOptions = [
    { value: '', label: 'Recommended' },
    { value: 'rating', label: 'Customer Rating' },
    { value: 'new', label: 'Newest First' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' }
  ]

  const filtered = useMemo(() => {
    const text = q.toLowerCase().trim()
    let list = books.filter(book => {
      const searchable = `${book.title} ${book.author} ${book.category} ${book.publisher || ''} ${book.isbn || ''}`.toLowerCase()
      return (!text || searchable.includes(text))
        && (!category || book.category === category)
        && (!language || book.language === language)
        && (!offerOnly || Number(book.originalPrice || 0) > Number(book.price || 0))
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

  return (
    <section className="shop-page page-width market-shop-page concept-shop-page">
      <div className="market-shop-heading concept-shop-heading">
        <div>
          <div className="market-breadcrumb">Home / Books {category ? `/ ${category}` : ''}</div>
          <h1>{q ? `Search results for “${q}”` : category || 'All Books'}</h1>
          <p>{filtered.length} {filtered.length === 1 ? 'book' : 'books'} available</p>
        </div>
        <div className="concept-sort-wrap"><span>Sort by</span><PremiumSelect value={sort} options={sortOptions} onChange={value => update('sort', value)} className="sort-premium-select" /></div>
      </div>

      <div className="concept-shop-layout">
        <aside className="concept-filter-panel">
          <div className="concept-filter-head"><strong>Filters</strong><button type="button" onClick={clearFilters}>Clear all</button></div>
          <div className="concept-filter-section">
            <h3>Categories</h3>
            <button className={!category ? 'active' : ''} onClick={() => update('category', '')}><span>All Categories</span><b>{books.length}</b></button>
            {categories.map(item => <button key={item} className={category === item ? 'active' : ''} onClick={() => update('category', item)}><span>{item}</span><b>{books.filter(book => book.category === item).length}</b></button>)}
          </div>
          <div className="concept-filter-section">
            <h3>Language</h3>
            <button className={!language ? 'active' : ''} onClick={() => update('language', '')}><span>All Languages</span><b>{books.length}</b></button>
            {languages.map(item => <button key={item} className={language === item ? 'active' : ''} onClick={() => update('language', item)}><span>{item}</span><b>{books.filter(book => book.language === item).length}</b></button>)}
          </div>
          <div className="concept-filter-section">
            <h3>Availability</h3>
            <button className={offerOnly ? 'active' : ''} onClick={() => update('offer', offerOnly ? '' : '1')}><span>Books on offer</span><b>₹</b></button>
          </div>
          <div className="concept-filter-note"><span>✓</span><div><strong>Live catalogue</strong><small>Stock and prices are loaded from the backend.</small></div></div>
        </aside>

        <div className="concept-shop-results">
          {(category || language || offerOnly) && (
            <div className="concept-active-filters">
              {category && <button onClick={() => update('category', '')}>{category} ×</button>}
              {language && <button onClick={() => update('language', '')}>{language} ×</button>}
              {offerOnly && <button onClick={() => update('offer', '')}>Offers ×</button>}
            </div>
          )}
          {filtered.length ? (
            <div className="book-grid shop-grid premium-shop-grid market-shop-grid concept-book-grid">
              {filtered.map(book => <BookCard key={book.id} book={book} variant="shop" />)}
            </div>
          ) : (
            <div className="empty-state premium-empty-state market-empty-state concept-empty">
              <span className="empty-book-icon">▤</span><h3>No matching books</h3><p>Try a different title, author, category or language.</p><button type="button" className="market-cart-button" onClick={() => setParams({})}>View all books</button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
