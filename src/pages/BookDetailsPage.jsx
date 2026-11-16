import { useDeliverySettings } from '../utils/delivery'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useStore } from '../context/StoreContext'
import { getPricing, formatMoney } from '../utils/pricing'
import { cashbackForBook } from '../utils/cashback'
import { activeBundleForBook, paidBooksFor, giftBooksFor, describeBookLines } from '../utils/buyGetOffers'
import BookCard from '../components/BookCard'
import CartControl from '../components/CartControl'

export default function BookDetailsPage() {
  const deliverySettings = useDeliverySettings()
  const { id } = useParams()
  const navigate = useNavigate()
  const { books, offers, getBook, addToCart, toggleWishlist, account, backendReady, loadBooks, homeSections } = useStore()
  const [qty, setQty] = useState(1)
  const [busy, setBusy] = useState(false)
  const [added, setAdded] = useState(false)
  const [message, setMessage] = useState('')
  const [tab, setTab] = useState('description')
  const book = getBook(id)

  // Always show the latest backend price when a book is opened.
  useEffect(() => {
    void loadBooks(true)
  }, [id])

  if (!book) {
    return <div className="empty-state page-width min-page"><h2>Book not found</h2><p>Please go back to the shop and choose another book.</p></div>
  }

  const related = books.filter(item => item.category === book.category && item.id !== book.id).slice(0, 4)
  const wish = account?.wishlist?.includes(book.id)
  const available = book.available !== false && Number(book.stock || 0) > 0
  const pricing = getPricing(book)
  const discount = pricing.percent
  const buyGetOffer = activeBundleForBook(book.id, offers)
  const giftBook = books.find(item => String(item.id) === String(buyGetOffer?.getBookId))
  const cashback = cashbackForBook(book, homeSections)

  async function cart(goCheckout = false) {
    if (!available || busy) return
    if (!backendReady && String(book.id).startsWith('demo-')) {
      setMessage('Cart is temporarily unavailable. Please try again in a moment.')
      return
    }
    setBusy(true)
    setMessage('')
    setAdded(false)

    /*
     * Normal Add to Cart is optimistic. Update the UI immediately and
     * let the StoreContext mutation queue persist it in the background.
     * Buy Now still waits for the server because checkout must only open
     * after the cart has been persisted.
     */
    if (!goCheckout) {
      const request = addToCart(book.id, qty)
      setQty(1)
      setBusy(false)
      setAdded(true)
      setMessage('Added to cart successfully.')

      window.setTimeout(() => {
        setAdded(false)
      }, 700)

      request.catch(err => {
        setAdded(false)
        setMessage(err.message)
      })
      return
    }

    try {
      await addToCart(book.id, qty)
      setQty(1)
      navigate('/checkout')
    } catch (err) {
      setMessage(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="details-page">
      <div className="page-width breadcrumbs">Home &nbsp;›&nbsp; {book.category} &nbsp;›&nbsp; Book Details</div>

      <div className="page-width details-grid">
        <div className="details-cover-column">
          <div className="details-cover"><img src={book.image} alt={book.title} /></div>
          <div className="details-thumbnails">
            <button className="active"><img src={book.image} alt="Front cover" /></button>
            <button><span>Book<br />Preview</span></button>
            <button><span>Read<br />Sample</span></button>
          </div>
        </div>

        <div className="details-info">
          <div className="details-title-row">
            <div>
              {book.featured && <span className="category-tag">Bestseller</span>}
              <h1>{book.title}</h1>
              <p className="author">{book.author}</p>
              <div className="rating big-rating"><span>★★★★★</span> <b>{Number(book.rating || 0).toFixed(1)}</b> <small>({book.reviewCount || 0} reviews)</small></div>
            </div>
            <blockquote>“Small changes<br />make a big difference.”</blockquote>
          </div>

          <p className="description details-lead">{book.description}</p>

          <div className="details-price"><strong>₹{formatMoney(pricing.selling)}</strong>{discount > 0 && <span>{discount}% OFF</span>}{pricing.hasDiscount && <del>₹{formatMoney(pricing.original)}</del>}<b className={`stock ${available ? '' : 'stock-out'}`}>● {available ? 'In stock' : 'Out of stock'}</b></div>

          {cashback && available && (
            <div className="book-cashback-note details-cashback-note">
              ✦ Earn up to <strong>₹{formatMoney(cashback.amount)} cashback</strong> per paid copy
              {cashback.type === 'PERCENT' ? ` (${cashback.value}%)` : ''}. Credited to your wallet after an eligible Razorpay payment.
            </div>
          )}
          {buyGetOffer && (
            <div className="book-bogo-note">🎁 Buy {describeBookLines(paidBooksFor(buyGetOffer), books)} to receive {describeBookLines(giftBooksFor(buyGetOffer), books)} FREE. Offer repeats for complete sets, subject to stock.</div>
          )}

          <div className="book-meta details-meta-grid">
            <div><span>▤</span><small>Language</small><strong>{book.language || '—'}</strong></div>
            <div><span>▧</span><small>Publisher</small><strong>{book.publisher || 'Paperback'}</strong></div>
            <div><span>≡</span><small>Category</small><strong>{book.category || 'Books'}</strong></div>
            <div><span>▥</span><small>ISBN</small><strong>{book.isbn || 'On print copy'}</strong></div>
          </div>

          <div className="buy-row">
            <label>Quantity</label>
            <div className="qty-box"><button onClick={() => setQty(Math.max(1, qty - 1))}>−</button><span>{qty}</span><button disabled={!available || qty >= Number(book.stock || 0)} onClick={() => setQty(Math.min(Number(book.stock || 0), qty + 1))}>+</button></div>
          </div>

          <div className="details-action-row">
            <CartControl
              book={book}
              available={available}
              className="primary-btn big"
              addQuantity={qty}
              addLabel="🛒 Add to Cart"
              guard={() => {
                if (!backendReady && String(book.id).startsWith('demo-')) {
                  setMessage('Cart is temporarily unavailable. Please try again in a moment.')
                  return false
                }
                setMessage('')
                return true
              }}
              onAdd={() => setQty(1)}
              onError={err => setMessage(err.message)}
            />
            <button className={wish ? 'outline-btn selected-outline' : 'outline-btn'} onClick={() => backendReady && toggleWishlist(book.id)}>{wish ? '♥' : '♡'} {wish ? 'Wishlisted' : 'Add to Wishlist'}</button>
            <button className="buy-now-btn" onClick={() => cart(true)} disabled={!available || busy}>⚡ Buy Now</button>
          </div>
          {message && <div className="details-message">{message}</div>}

          <div className="details-trust-strip">
            <div><b>🚚</b><span><strong>Free Delivery</strong><small>{!deliverySettings.enabled || deliverySettings.freeShippingAll ? 'on all orders' : `from ₹${(deliverySettings.freeDeliveryThresholdPaise / 100).toLocaleString('en-IN')}`}</small></span></div>
            <div><b>◆</b><span><strong>Secure Checkout</strong><small>Multiple payment options</small></span></div>
            <div><b>▣</b><span><strong>Genuine Books</strong><small>Original catalogue</small></span></div>
            <div><b>♧</b><span><strong>Dedicated Support</strong><small>We’re here to help</small></span></div>
          </div>

          <div className="details-tabs">
            {[
              ['description', 'Description'], ['details', 'Product Details'], ['author', 'Author'], ['reviews', `Reviews (${book.reviewCount || 0})`]
            ].map(([key, label]) => <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>{label}</button>)}
          </div>
          <div className="details-tab-panel">
            {tab === 'description' && <><p>{book.description || `${book.title} is part of the Thulirkum Ver catalogue.`}</p><ul><li>Carefully selected catalogue title</li><li>Clear pricing and live stock availability</li><li>Simple checkout and order tracking</li></ul></>}
            {tab === 'details' && <div className="tab-detail-grid"><span>Publisher <b>{book.publisher || '—'}</b></span><span>Language <b>{book.language || '—'}</b></span><span>Category <b>{book.category || '—'}</b></span><span>ISBN <b>{book.isbn || '—'}</b></span></div>}
            {tab === 'author' && <p><strong>{book.author}</strong><br />Browse more books from this author using the catalogue search.</p>}
            {tab === 'reviews' && <p>{book.reviewCount || 0} reader ratings are currently available for this book.</p>}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className="page-width section related-section">
          <div className="section-heading"><div><h2>You May Also Like</h2><p>More books selected from this category.</p></div><Link to="/shop">View all books »</Link></div>
          <div className="book-grid related-grid">{related.map(item => <BookCard key={item.id} book={item} />)}</div>
        </div>
      )}
    </section>
  )
}
