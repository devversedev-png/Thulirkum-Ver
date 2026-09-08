import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useStore } from '../context/StoreContext'

export default function CartPage() {
  const { cartRows, updateCart, removeFromCart } = useStore()
  const [error, setError] = useState('')
  const rows = cartRows()
  const subtotal = rows.reduce((sum, row) => sum + row.book.price * row.quantity, 0)
  const shipping = subtotal >= 499 || subtotal === 0 ? 0 : 60
  const total = subtotal + shipping

  async function changeQuantity(book, quantity) {
    setError('')
    try {
      await updateCart(book.id, quantity)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section className="page-width cart-page min-page">
      <div className="page-title-row"><div><span className="eyebrow">Almost there</span><h1>My Cart</h1><p>{rows.length} different books</p></div></div>
      {error && <div className="form-error cart-error">{error}</div>}
      {rows.length ? (
        <div className="cart-layout">
          <div className="cart-list">
            {rows.map(({ book, quantity }) => (
              <div className="cart-item" key={book.id}>
                <img src={book.image} alt={book.title} />
                <div className="cart-item-info">
                  <Link to={`/book/${book.id}`}>{book.title}</Link>
                  <span>{book.author}</span>
                  <small>{book.stock} more available after your cart reservation</small>
                  <strong>₹{book.price}</strong>
                </div>
                <div className="qty-box">
                  <button onClick={() => changeQuantity(book, quantity - 1)}>−</button>
                  <span>{quantity}</span>
                  <button disabled={book.available === false || book.stock <= 0} onClick={() => changeQuantity(book, quantity + 1)}>+</button>
                </div>
                <strong className="line-total">₹{book.price * quantity}</strong>
                <button className="remove-btn" onClick={() => removeFromCart(book.id)}>×</button>
              </div>
            ))}
          </div>

          <aside className="summary-card">
            <h3>Order Summary</h3>
            <div><span>Subtotal</span><strong>₹{subtotal}</strong></div>
            <div><span>Shipping</span><strong>{shipping ? `₹${shipping}` : 'Free'}</strong></div>
            <div className="summary-total"><span>Grand Total</span><strong>₹{total}</strong></div>
            <Link className="primary-btn full big" to="/checkout">Proceed to Checkout →</Link>
            <Link className="continue-link" to="/shop">← Continue shopping</Link>
          </aside>
        </div>
      ) : (
        <div className="empty-state"><h3>Your cart is empty</h3><p>Add a few books and they will appear here.</p><Link className="primary-btn inline-btn" to="/shop">Shop Books</Link></div>
      )}
    </section>
  )
}
