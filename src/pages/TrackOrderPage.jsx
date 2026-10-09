import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import InfoShell from '../components/InfoShell'
import { useStore } from '../context/StoreContext'

const STEPS = [
  ['BOOKING_CONFIRMED', 'Order placed'],
  ['CONFIRMED', 'Confirmed'],
  ['PACKED', 'Packed'],
  ['SHIPPED', 'Shipped'],
  ['OUT_FOR_DELIVERY', 'Out for delivery'],
  ['DELIVERED', 'Delivered'],
]

const fmt = value =>
  value ? new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''

export default function TrackOrderPage() {
  const { getOrders } = useStore()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState('')

  useEffect(() => {
    let alive = true
    getOrders()
      .then(list => {
        if (!alive) return
        const sorted = [...(list || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        setOrders(sorted)
        setSelectedId(sorted[0]?.id || '')
      })
      .catch(err => alive && setError(err.message || 'Unable to load your orders.'))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const term = query.trim().toLowerCase()
  const visible = term ? orders.filter(o => String(o.orderNumber || '').toLowerCase().includes(term)) : orders
  const order = orders.find(o => o.id === selectedId) || visible[0]
  const cancelled = order?.status === 'CANCELLED'
  const currentIndex = STEPS.findIndex(([key]) => key === order?.status)
  const eventFor = key => order?.statusHistory?.find(e => e.status === key)

  return (
    <InfoShell
      eyebrow="Follow your parcel"
      title="Order Tracking"
      intro="See exactly where your books are, from the moment you order to your doorstep."
    >
      {loading && <div className="info-empty">Loading your orders…</div>}
      {error && <div className="info-empty error">{error}</div>}

      {!loading && !error && orders.length === 0 && (
        <div className="info-empty">
          <h3>No orders yet</h3>
          <p>When you place an order, you can follow it here.</p>
          <Link className="primary-btn" to="/shop">Start Shopping »</Link>
        </div>
      )}

      {!loading && orders.length > 0 && (
        <>
          <div className="track-search">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by order number"
              aria-label="Search by order number"
            />
          </div>

          <div className="track-picker">
            {visible.map(o => (
              <button
                key={o.id}
                type="button"
                className={o.id === order?.id ? 'selected' : ''}
                onClick={() => setSelectedId(o.id)}
              >
                <strong>#{o.orderNumber}</strong>
                <span>{fmt(o.createdAt)}</span>
              </button>
            ))}
            {visible.length === 0 && <p className="muted">No order matches “{query}”.</p>}
          </div>

          {order && (
            <div className="track-card">
              <div className="track-head">
                <div>
                  <small>Order</small>
                  <h3>#{order.orderNumber}</h3>
                </div>
                <span className={`track-badge ${cancelled ? 'cancelled' : ''}`}>
                  {String(order.status || '').replaceAll('_', ' ')}
                </span>
              </div>

              {cancelled ? (
                <p className="track-note">This order was cancelled. Any payment made will be refunded to your original payment method.</p>
              ) : (
                <ol className="track-timeline">
                  {STEPS.map(([key, label], i) => {
                    const done = i <= currentIndex
                    return (
                      <li key={key} className={done ? 'done' : ''}>
                        <b>{done ? '✓' : i + 1}</b>
                        <div>
                          <strong>{label}</strong>
                          <span>{fmt(eventFor(key)?.at)}</span>
                        </div>
                      </li>
                    )
                  })}
                </ol>
              )}

              {(order.courierName || order.trackingNumber) && (
                <div className="track-courier">
                  {order.courierName && <div><small>Courier</small><strong>{order.courierName}</strong></div>}
                  {order.trackingNumber && <div><small>Tracking number</small><strong>{order.trackingNumber}</strong></div>}
                </div>
              )}

              <div className="track-items">
                {(order.items || []).map((item, i) => (
                  <div key={i}>
                    <span>{item.title}</span>
                    <b>× {item.quantity}</b>
                  </div>
                ))}
                <div className="total"><span>Total</span><b>₹{order.total}</b></div>
              </div>
            </div>
          )}
        </>
      )}
    </InfoShell>
  )
}
