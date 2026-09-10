import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext'

export default function OffersPage() {
  const { offers } = useStore()
  return (
    <section className="offers-page min-page">
      <div className="offers-hero">
        <div className="page-width"><span className="eyebrow">SPECIAL OFFERS</span><h1>Great Books. Greater Journeys.</h1><p>Save on selected titles and make your next reading journey even better.</p><Link to="/shop?offer=1" className="primary-btn inline-btn">Shop discounted books →</Link></div>
      </div>
      <div className="page-width">
        {offers.length ? (
          <div className="offers-grid">
            {offers.map(offer => (
              <article className="offer-card-premium" key={offer.id}>
                <div className="offer-card-top"><span>{offer.active ? 'LIVE OFFER' : 'OFFER'}</span><b>{offer.code || 'BOOKS'}</b></div>
                <h2>{offer.title}</h2><p>{offer.description}</p>
                <div className="offer-value"><strong>{offer.discountType === 'FIXED' ? `₹${offer.discountValue}` : `${offer.discountValue}%`}</strong><span>OFF</span></div>
                <div className="offer-rule">Minimum order ₹{offer.minOrderAmount || 0}</div>
                {offer.endDate && <small>Valid until {new Date(`${offer.endDate}T00:00:00`).toLocaleDateString()}</small>}
                <Link to="/shop?offer=1" className="primary-btn full">Browse Books →</Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state"><h3>No active offers right now</h3><p>Fresh offers will appear here when the admin publishes them.</p><Link to="/shop" className="primary-btn inline-btn">Browse Books</Link></div>
        )}
      </div>
    </section>
  )
}
