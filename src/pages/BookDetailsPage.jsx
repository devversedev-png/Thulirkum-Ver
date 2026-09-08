import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { useStore } from '../context/StoreContext'
import BookCard from '../components/BookCard'

export default function BookDetailsPage() {
  const { id } = useParams()
  const { books, getBook, addToCart, toggleWishlist, account, backendReady } = useStore()
  const [qty, setQty] = useState(1)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const book = getBook(id)

  if (!book) {
    return <div className="empty-state page-width"><h2>Book not found</h2><p>Please go back to the shop and choose another book.</p></div>
  }

  const related = books.filter(item => item.category === book.category && item.id !== book.id).slice(0, 4)
  const wish = account?.wishlist?.includes(book.id)
  const available = book.available !== false && book.stock > 0

  async function cart() {
    if (!available || busy) return
    if (!backendReady && book.id.startsWith('demo-')) {
      alert('Connect the backend to use cart actions.')
      return
    }
    setBusy(true)
    setMessage('')
    try {
      await addToCart(book.id, qty)
      setQty(1)
      setMessage('Added to cart. Available stock has been updated.')
    } catch (err) {
      setMessage(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="page-width details-page">
      <div className="breadcrumbs">Home / {book.category} / {book.title}</div>
      <div className="details-grid">
        <div className="details-cover"><img src={book.image} alt={book.title} /></div>
        <div className="details-info">
          <span className="category-tag">{book.category}</span>
          <h1>{book.title}</h1>
          <p className="author">by {book.author}</p>
          <div className="rating big-rating">★ {book.rating} <span>({book.reviewCount} reviews)</span></div>
          <div className="details-price"><strong>₹{book.price}</strong>{book.originalPrice > book.price && <del>₹{book.originalPrice}</del>}</div>
          <div className={`stock ${available ? '' : 'stock-out'}`}>● {available ? `In Stock (${book.stock} available)` : 'Out of Stock'}</div>
          <p className="description">{book.description}</p>

          <div className="buy-row">
            <div className="qty-box">
              <button onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
              <span>{qty}</span>
              <button disabled={!available || qty >= book.stock} onClick={() => setQty(Math.min(book.stock, qty + 1))}>+</button>
            </div>
            <button className="primary-btn big" onClick={cart} disabled={!available || busy}>
              {!available ? 'Out of Stock' : busy ? 'Adding...' : '🛒 Add to Cart'}
            </button>
          </div>
          {message && <div className="details-message">{message}</div>}

          <div className="secondary-actions">
            <button className={wish ? 'outline-btn selected-outline' : 'outline-btn'} onClick={() => backendReady && toggleWishlist(book.id)}>♡ {wish ? 'Wishlisted' : 'Add to Wishlist'}</button>
          </div>

          <div className="book-meta">
            <div><span>Publisher</span><strong>{book.publisher}</strong></div>
            <div><span>Language</span><strong>{book.language}</strong></div>
            <div><span>Category</span><strong>{book.category}</strong></div>
            <div><span>ISBN</span><strong>{book.isbn || 'Available on print copy'}</strong></div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className="section related-section">
          <div className="section-heading"><div><h2>You may also like</h2><p>More books from this category.</p></div></div>
          <div className="book-grid">{related.map(item => <BookCard key={item.id} book={item} />)}</div>
        </div>
      )}
    </section>
  )
}
