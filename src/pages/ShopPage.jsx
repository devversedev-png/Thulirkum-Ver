import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import BookCard from '../components/BookCard'
import PremiumSelect from '../components/PremiumSelect'

const PAGE_SIZE = 12

export default function ShopPage() {
  const { books } = useStore()
  const [params, setParams] = useSearchParams()

  const q = params.get('q') || ''
  const category = params.get('category') || ''
  const language = params.get('language') || ''
  const sort = params.get('sort') || ''
  const price = params.get('price') || ''
  const rating = Number(params.get('rating') || 0)
  const inStockOnly = params.get('stock') === '1'
  const offerOnly = params.get('offer') === '1'
  const page = Math.max(1, Number(params.get('page') || 1))

  const categories = [...new Set(books.map(book => book.category).filter(Boolean))].sort()
  const languages = [...new Set(books.map(book => book.language).filter(Boolean))].sort()

  const sortOptions = [
    { value: '', label: 'Bestselling' },
    { value: 'rating', label: 'Customer Rating' },
    { value: 'new', label: 'Newest First' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' }
  ]

  const filtered = useMemo(() => {
    const text = q.toLowerCase().trim()
    let list = books.filter(book => {
      const searchable = `${book.title} ${book.author} ${book.category} ${book.publisher || ''} ${book.isbn || ''}`.toLowerCase()
      const amount = Number(book.price || 0)
      const priceMatch = !price
        || (price === 'under-200' && amount < 200)
        || (price === '200-500' && amount >= 200 && amount <= 500)
        || (price === '500-1000' && amount > 500 && amount <= 1000)
        || (price === '1000-plus' && amount > 1000)
      const stockMatch = !inStockOnly || (book.available !== false && Number(book.stock || 0) > 0)
      return (!text || searchable.includes(text))
        && (!category || book.category === category)
        && (!language || book.language === language)
        && priceMatch
        && (!rating || Number(book.rating || 0) >= rating)
        && stockMatch
        && (!offerOnly || Number(book.originalPrice || 0) > Number(book.price || 0))
    })
    if (sort === 'rating') list = [...list].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
    if (sort === 'new') list = [...list].sort((a, b) => Number(b.newArrival) - Number(a.newArrival))
    if (sort === 'price-low') list = [...list].sort((a, b) => Number(a.price || 0) - Number(b.price || 0))
    if (sort === 'price-high') list = [...list].sort((a, b) => Number(b.price || 0) - Number(a.price || 0))
    return list
  }, [books, q, category, language, sort, price, rating, inStockOnly, offerOnly])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  function update(key, value) {
    const next = new URLSearchParams(params)
    value ? next.set(key, value) : next.delete(key)
    if (key !== 'page') next.delete('page')
    setParams(next)
  }

  function clearFilters() {
    const next = new URLSearchParams()
    if (q) next.set('q', q)
    setParams(next)
  }

  const countFor = predicate => books.filter(predicate).length

  return (
    <section className="shop-page">
      <div className="shop-title-band">
        <div className="page-width market-shop-heading">
          <div>
            {/* <div className="market-breadcrumb">Home &nbsp;›&nbsp; All Books {category ? `› ${category}` : ''}</div> */}
            <h1>{q ? `Search results for “${q}”` : category || 'All Books'}</h1>
            <p>Discover Tamil and English books that inform, inspire and uplift.</p>
          </div>
          <blockquote>“Good books<br />grow better human beings.”</blockquote>
        </div>
      </div>

      <div className="page-width concept-shop-layout">
        <aside className="concept-filter-panel">
          <div className="concept-filter-head"><strong>Filters</strong><button type="button" onClick={clearFilters}>Clear all</button></div>

          <div className="concept-filter-section">
            <h3>Categories</h3>
            {categories.slice(0, 8).map(item => (
              <button key={item} className={category === item ? 'active' : ''} onClick={() => update('category', category === item ? '' : item)}>
                <span><i className="filter-check">{category === item ? '✓' : ''}</i>{item}</span><b>{countFor(book => book.category === item)}</b>
              </button>
            ))}
          </div>

          <div className="concept-filter-section">
            <h3>Language</h3>
            {languages.map(item => (
              <button key={item} className={language === item ? 'active' : ''} onClick={() => update('language', language === item ? '' : item)}>
                <span><i className="filter-check">{language === item ? '✓' : ''}</i>{item}</span><b>{countFor(book => book.language === item)}</b>
              </button>
            ))}
          </div>

          <div className="concept-filter-section">
            <h3>Price Range</h3>
            {[
              ['under-200', 'Under ₹200'], ['200-500', '₹200 – ₹500'], ['500-1000', '₹500 – ₹1000'], ['1000-plus', 'Above ₹1000']
            ].map(([value, label]) => (
              <button key={value} className={price === value ? 'active' : ''} onClick={() => update('price', price === value ? '' : value)}>
                <span><i className="filter-check">{price === value ? '✓' : ''}</i>{label}</span>
              </button>
            ))}
          </div>

          <div className="concept-filter-section">
            <h3>Rating</h3>
            {[4, 3].map(value => (
              <button key={value} className={rating === value ? 'active' : ''} onClick={() => update('rating', rating === value ? '' : String(value))}>
                <span><i className="filter-check">{rating === value ? '✓' : ''}</i>{'★'.repeat(value)} & up</span>
              </button>
            ))}
          </div>

          <div className="concept-filter-section compact-filter-section">
            <h3>Availability</h3>
            <button className={inStockOnly ? 'active' : ''} onClick={() => update('stock', inStockOnly ? '' : '1')}><span><i className="filter-check">{inStockOnly ? '✓' : ''}</i>In Stock</span></button>
          </div>
          <div className="concept-filter-section compact-filter-section">
            <h3>Offers</h3>
            <button className={offerOnly ? 'active' : ''} onClick={() => update('offer', offerOnly ? '' : '1')}><span><i className="filter-check">{offerOnly ? '✓' : ''}</i>On Sale</span></button>
          </div>
        </aside>

        <div className="concept-shop-results">
          <div className="shop-results-toolbar">
            <span>Showing {filtered.length ? (safePage - 1) * PAGE_SIZE + 1 : 0}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} books</span>
            <div className="concept-sort-wrap"><span>Sort by</span><PremiumSelect value={sort} options={sortOptions} onChange={value => update('sort', value)} className="sort-premium-select" /></div>
          </div>

          {(category || language || price || rating || inStockOnly || offerOnly) && (
            <div className="concept-active-filters">
              {category && <button onClick={() => update('category', '')}>{category} ×</button>}
              {language && <button onClick={() => update('language', '')}>{language} ×</button>}
              {price && <button onClick={() => update('price', '')}>Price ×</button>}
              {rating > 0 && <button onClick={() => update('rating', '')}>{rating}★ & up ×</button>}
              {inStockOnly && <button onClick={() => update('stock', '')}>In stock ×</button>}
              {offerOnly && <button onClick={() => update('offer', '')}>Offers ×</button>}
            </div>
          )}

          {visible.length ? (
            <div className="book-grid shop-grid">{visible.map(book => <BookCard key={book.id} book={book} variant="shop" />)}</div>
          ) : (
            <div className="empty-state"><span className="empty-book-icon">▤</span><h3>No matching books</h3><p>Try a different title, author, category or language.</p><button type="button" className="market-cart-button" onClick={() => setParams({})}>View all books</button></div>
          )}

          {pageCount > 1 && (
            <div className="shop-pagination">
              <button disabled={safePage === 1} onClick={() => update('page', String(safePage - 1))}>‹</button>
              {Array.from({ length: Math.min(pageCount, 5) }, (_, i) => i + 1).map(number => <button key={number} className={safePage === number ? 'active' : ''} onClick={() => update('page', String(number))}>{number}</button>)}
              {pageCount > 5 && <span>… {pageCount}</span>}
              <button disabled={safePage === pageCount} onClick={() => update('page', String(safePage + 1))}>›</button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
