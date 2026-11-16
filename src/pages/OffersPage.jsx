import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Check, Gift, Sparkles, Tag, TicketPercent } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { isBundle, paidBooksFor, giftBooksFor } from '../utils/buyGetOffers'

function BookOfferLine({ line, byId, free = false }) {
  const book = byId.get(String(line.bookId))
  return (
    <div className="tv-offer-book-row">
      <div className="tv-offer-book-cover">
        {book?.image ? <img src={book.image} alt={book.title || 'Book cover'} loading="lazy" /> : <BookOpen size={23} strokeWidth={1.6} />}
      </div>
      <div className="tv-offer-book-details">
        <strong title={book?.title || 'Book'}>{book?.title || 'Book'}</strong>
        <span>{line.quantity} {Number(line.quantity) === 1 ? 'copy' : 'copies'}</span>
      </div>
      {free && <span className="tv-offer-free-pill">FREE</span>}
    </div>
  )
}

export default function OffersPage() {
  const { offers, books } = useStore()
  const byId = new Map((books || []).map(book => [String(book.id), book]))

  return (
    <section className="offers-page min-page">
      <div className="offers-hero">
        <div className="page-width">
          <span className="eyebrow">SPECIAL OFFERS</span>
          <h1>Great Books. Greater Journeys.</h1>
          <p>Free books and special discounts selected for your next reading journey.</p>
          <Link to="/shop" className="primary-btn inline-btn">Explore books »</Link>
        </div>
      </div>
      <div className="page-width">
        {offers.length ? (
          <div className="offers-grid tv-offers-grid-v15">
            {offers.map(offer => {
              const bundle = isBundle(offer)
              const paidLines = paidBooksFor(offer)
              const giftLines = giftBooksFor(offer)
              const bought = byId.get(String(paidLines[0]?.bookId))
              const validUntil = offer.endDate && !Number.isNaN(new Date(`${offer.endDate}T00:00:00`).getTime())
                ? new Date(`${offer.endDate}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                : null

              return (
                <article className={`tv-offer-card ${bundle ? 'tv-offer-bundle' : 'tv-offer-discount'}`} key={offer.id}>
                  <div className="tv-offer-card-accent" aria-hidden="true" />
                  <div className="tv-offer-card-content">
                    <div className="tv-offer-card-head">
                      <span className="tv-offer-live"><span className="tv-offer-live-dot" />{offer.active ? 'LIVE OFFER' : 'SPECIAL OFFER'}</span>
                      <span className="tv-offer-type">{bundle ? <><Gift size={14} /> FREE BOOKS</> : <><Tag size={14} /> {offer.code || 'SAVE MORE'}</>}</span>
                    </div>
                    <h2 className="tv-offer-title">{offer.title}</h2>
                    {offer.description && <p className="tv-offer-description">{offer.description}</p>}
                    {bundle ? (
                      <>
                        <div className="tv-offer-highlight"><Gift size={19} /><span>More books. More joy.</span><Sparkles size={16} /></div>
                        <div className="tv-offer-bundle-content">
                          <div className="tv-offer-book-group">
                            <div className="tv-offer-group-label"><BookOpen size={17} /><span>Books to buy</span></div>
                            <div className="tv-offer-book-list">
                              {paidLines.map(line => <BookOfferLine key={line.bookId} line={line} byId={byId} />)}
                            </div>
                          </div>
                          <div className="tv-offer-connector" aria-label="Receive free books"><ArrowRight size={18} strokeWidth={2.5} /></div>
                          <div className="tv-offer-book-group tv-offer-gift-group">
                            <div className="tv-offer-group-label"><Gift size={17} /><span>Books you'll get free</span></div>
                            <div className="tv-offer-book-list">
                              {giftLines.map(line => <BookOfferLine key={line.bookId} line={line} byId={byId} free />)}
                            </div>
                          </div>
                        </div>
                        <div className="tv-offer-footnote"><Check size={15} />Free books added automatically at checkout, subject to stock.</div>
                      </>
                    ) : (
                      <>
                        <div className="tv-offer-coupon-panel">
                          <div className="tv-offer-saving"><strong>{offer.discountType === 'FIXED' ? `₹${offer.discountValue}` : `${offer.discountValue}%`}</strong><span>OFF</span></div>
                          <div className="tv-offer-coupon-desc"><TicketPercent size={20} /><span>Extra savings on your next read</span></div>
                        </div>
                        <div className="tv-offer-minimum">Minimum order: <strong>₹{offer.minOrderAmount || 0}</strong></div>
                      </>
                    )}
                  </div>
                  <div className="tv-offer-card-footer">
                    {validUntil && <span className="tv-offer-expiry">Valid until {validUntil}</span>}
                    <Link to={bundle ? (bought ? `/book/${bought.id}` : '/shop') : '/shop?offer=1'} className="tv-offer-action">
                      {bundle ? 'Shop eligible books' : 'Explore this offer'} <ArrowRight size={17} />
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="empty-state"><h3>No active offers right now</h3><p>Fresh offers will appear here when the admin publishes them.</p><Link to="/shop" className="primary-btn inline-btn">Browse Books</Link></div>
        )}
      </div>
    </section>
  )
}
