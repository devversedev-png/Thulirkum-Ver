import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext'

export default function WishlistPage() {
  const { books, account, addToCart, toggleWishlist } = useStore()
  const [busyId, setBusyId] = useState('')
  const [message, setMessage] = useState('')
  const list = books.filter(book => account?.wishlist?.includes(book.id))
  const availableCount = list.filter(book => book.available !== false && book.stock > 0).length

  async function moveToCart(book) {
    if (book.available === false || book.stock <= 0) return
    setBusyId(book.id)
    setMessage('')
    try {
      await addToCart(book.id, 1)
      await toggleWishlist(book.id)
      setMessage(`${book.title} moved to your cart.`)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusyId('')
    }
  }

  async function remove(book) {
    setBusyId(book.id)
    setMessage('')
    try {
      await toggleWishlist(book.id)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusyId('')
    }
  }

  return (
    <section className="page-width section min-page wishlist-page-v7">
      <div className="wishlist-hero-v7 glass-panel">
        <div><span className="eyebrow">SAVED FOR LATER</span><h1>My Wishlist</h1><p>Keep your next reads in one place and move them to cart whenever you are ready.</p></div>
        <div className="wishlist-stats-v7"><div><strong>{list.length}</strong><span>Saved books</span></div><div><strong>{availableCount}</strong><span>In stock</span></div></div>
      </div>

      <div className="wishlist-toolbar-v7">
        <Link to="/account" className="outline-btn compact">← My Account</Link>
        <Link to="/shop" className="primary-btn compact">Browse more books</Link>
      </div>

      {message && <div className="wishlist-message-v7">{message}</div>}

      {list.length ? (
        <div className="wishlist-list-v7">
          {list.map(book => {
            const available = book.available !== false && book.stock > 0
            const discount = book.originalPrice > book.price ? Math.round(((book.originalPrice - book.price) / book.originalPrice) * 100) : 0
            return (
              <article className="wishlist-item-v7 glass-card" key={book.id}>
                <Link to={`/book/${book.id}`} className="wishlist-cover-v7"><img src={book.image} alt={book.title} /></Link>
                <div className="wishlist-copy-v7">
                  <Link to={`/book/${book.id}`}><h3>{book.title}</h3></Link>
                  <span>by {book.author}</span>
                  <div className="wishlist-rating-v7"><b>★ {book.rating}</b><span>{book.reviewCount || 0} ratings</span></div>
                  <div className="wishlist-price-v7"><strong>₹{book.price}</strong>{book.originalPrice > book.price && <del>₹{book.originalPrice}</del>}{discount > 0 && <span>{discount}% off</span>}</div>
                  <small className={available ? 'wishlist-stock-v7' : 'wishlist-stock-v7 out'}>{available ? (book.stock <= 5 ? `Only ${book.stock} left` : 'In stock') : 'Currently out of stock'}</small>
                </div>
                <div className="wishlist-actions-v7">
                  <button className="primary-btn" disabled={!available || busyId === book.id} onClick={() => moveToCart(book)}>{busyId === book.id ? 'Updating...' : available ? 'Move to Cart' : 'Out of Stock'}</button>
                  <button className="outline-btn" disabled={busyId === book.id} onClick={() => remove(book)}>Remove</button>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="empty-state wishlist-empty-v7"><div className="wishlist-empty-icon-v7">♡</div><h3>Your wishlist is empty</h3><p>Save books you like and they will appear here.</p><Link className="primary-btn inline-btn" to="/shop">Explore Books</Link></div>
      )}
    </section>
  )
}
