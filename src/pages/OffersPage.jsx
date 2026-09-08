import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext'

export default function OffersPage() {
  const { offers } = useStore()

  return (
    <section className="page-width offers-page min-page">
      <div className="offers-hero">
        <span className="eyebrow">Reader rewards</span>
        <h1>Offers made for your next good read</h1>
        <p>Current bookstore offers are managed directly by the Thulirkum Ver admin team.</p>
      </div>

      {offers.length ? (
        <div className="offers-grid">
          {offers.map(offer => (
            <article className="offer-card-premium" key={offer.id}>
              <div className="offer-card-top"><span>LIMITED OFFER</span><b>{offer.code || 'BOOKS'}</b></div>
              <h2>{offer.title}</h2>
              <p>{offer.description}</p>
              <div className="offer-value">
                <strong>{offer.discountType === 'FIXED' ? `₹${offer.discountValue}` : `${offer.discountValue}%`}</strong>
                <span>OFF</span>
              </div>
              <div className="offer-rule">Minimum order ₹{offer.minOrderAmount || 0}</div>
              {offer.endDate && <small>Valid until {new Date(`${offer.endDate}T00:00:00`).toLocaleDateString()}</small>}
              <Link to="/shop" className="primary-btn full">Browse Books →</Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state premium-empty-state"><h3>No active offers right now</h3><p>Fresh offers will appear here when the admin publishes them.</p><Link to="/shop" className="primary-btn inline-btn">Browse Books</Link></div>
      )}
    </section>
  )
}
