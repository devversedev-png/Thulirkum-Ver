import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext'

export default function WishlistPage() {
  const { books, account, addToCart, toggleWishlist } = useStore()
  const [busyId, setBusyId] = useState('')
  const [message, setMessage] = useState('')
  const list = books.filter(book => account?.wishlist?.includes(book.id))

  async function moveToCart(book) {
    if (book.available === false || Number(book.stock || 0) <= 0) return
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
    try { await toggleWishlist(book.id) }
    catch (error) { setMessage(error.message) }
    finally { setBusyId('') }
  }

  return (
    <section className="wishlist-page min-page">
      <div className="page-title-banner">
        <div className="page-width page-title-row"><div><div className="breadcrumbs">Home &nbsp;›&nbsp; Wishlist</div><h1>My Wishlist</h1><p>Books I love, ideas I want to explore.</p></div><blockquote>“A book today,<br />a brighter tomorrow.”</blockquote></div>
      </div>

      <div className="page-width wishlist-content">
        <div className="wishlist-heading-row"><h2>{list.length} saved {list.length === 1 ? 'book' : 'books'}</h2><Link to="/shop">Browse more books →</Link></div>
        {message && <div className="wishlist-message-v7">{message}</div>}

        {list.length ? (
          <div className="wishlist-layout">
            <div className="wishlist-grid">
              {list.map(book => {
                const available = book.available !== false && Number(book.stock || 0) > 0
                const discount = Number(book.originalPrice || 0) > Number(book.price || 0)
                  ? Math.round(((book.originalPrice - book.price) / book.originalPrice) * 100)
                  : 0
                return (
                  <article className="wishlist-item-v7" key={book.id}>
                    <button className="wishlist-heart" onClick={() => remove(book)} disabled={busyId === book.id}>♥</button>
                    <Link to={`/book/${book.id}`} className="wishlist-cover-v7"><img src={book.image} alt={book.title} /></Link>
                    <div className="wishlist-copy-v7">
                      <Link to={`/book/${book.id}`}><h3>{book.title}</h3></Link>
                      <span>{book.author}</span>
                      <div className="wishlist-rating-v7"><b>★ {Number(book.rating || 0).toFixed(1)}</b><small>({book.reviewCount || 0})</small></div>
                      <div className="wishlist-price-v7"><strong>₹{book.price}</strong>{Number(book.originalPrice || 0) > Number(book.price || 0) && <del>₹{book.originalPrice}</del>}{discount > 0 && <span>{discount}% off</span>}</div>
                    </div>
                    <div className="wishlist-actions-v7">
                      <button className="primary-btn" disabled={!available || busyId === book.id} onClick={() => moveToCart(book)}>{busyId === book.id ? 'Updating...' : available ? '🛒 Add to Cart' : 'Out of Stock'}</button>
                      <button className="wishlist-remove-link" disabled={busyId === book.id} onClick={() => remove(book)}>⌫ Remove</button>
                    </div>
                  </article>
                )
              })}
            </div>

            <aside className="wishlist-aside">
              <div className="wishlist-leaf-art">🌿</div>
              <h2>Save books you love</h2>
              <p>Keep track of books you want to read, explore later, or gift to someone special.</p>
              <ul><li>♥ Build your personal collection</li><li>🎁 Never lose track of great books</li><li>🔔 Get notified about offers</li><li>▤ Turn your interests into a reading journey</li></ul>
              <blockquote>Good books<br />grow better human beings.</blockquote>
            </aside>
          </div>
        ) : (
          <div className="empty-state wishlist-empty-v7"><div className="wishlist-empty-icon-v7">♡</div><h3>Your wishlist is empty</h3><p>Save books you like and they will appear here.</p><Link className="primary-btn inline-btn" to="/shop">Explore Books</Link></div>
        )}
      </div>
    </section>
  )
}
