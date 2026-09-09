import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'

function statusLabel(value) {
  if (!value) return 'Status unavailable'
  return String(value)
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export default function AccountPage() {
  const { user, logout } = useAuth()
  const { account, getOrders } = useStore()
  const [orders, setOrders] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [filter, setFilter] = useState('ALL')

  async function loadOrders() {
    try {
      const data = await getOrders()
      setOrders(data)
      setSelectedId(current => current || data[0]?.id || null)
    } catch {
      setOrders([])
    }
  }

  useEffect(() => {
    loadOrders()
    const timer = setInterval(loadOrders, 15000)
    return () => clearInterval(timer)
  }, [])

  const visibleOrders = useMemo(() => orders.filter(order => {
    if (filter === 'ALL') return true
    if (filter === 'ACTIVE') return !['DELIVERED', 'CANCELLED'].includes(order.status)
    return order.status === filter
  }), [orders, filter])

  const selected = orders.find(order => order.id === selectedId) || orders[0]

  return (
    <section className="page-width account-page premium-account-page min-page account-page-v6">
      <aside className="account-sidebar premium-account-sidebar glass-panel">
        <Link className="account-home-link" to="/home">← Back to Home</Link>
        <div className="avatar">{user?.name?.charAt(0)?.toUpperCase()}</div>
        <h3>{user?.name}</h3>
        <span>{user?.email}</span>
        <nav>
          <a href="#orders">My Orders</a>
          <Link to="/wishlist">My Wishlist</Link>
          <a href="#address">My Addresses</a>
          <button onClick={logout}>Logout</button>
        </nav>
      </aside>

      <div className="account-content">
        <div className="account-welcome premium-account-welcome glass-panel">
          <div><span className="eyebrow">MY ACCOUNT</span><h1>Hello, {user?.name?.split(' ')[0]}</h1><p>View your purchases, current status and saved delivery details.</p></div>
          <div className="account-mini-stat"><strong>{orders.length}</strong><span>Total Orders</span></div>
        </div>

        <section id="orders" className="account-box premium-orders-box glass-panel">
          <div className="section-heading order-section-head">
            <div><h2>My Orders</h2><p>Select an order to view its items and tracking history.</p></div>
            <button className="outline-btn compact" onClick={loadOrders}>Refresh</button>
          </div>

          <div className="order-filter-tabs">
            {['ALL', 'ACTIVE', 'DELIVERED', 'CANCELLED'].map(item => (
              <button key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>
                {item === 'ALL' ? 'All' : item === 'ACTIVE' ? 'Active' : statusLabel(item)}
              </button>
            ))}
          </div>

          <div className="customer-order-layout">
            <div className="customer-order-list">
              {visibleOrders.length ? visibleOrders.map(order => (
                <button className={`customer-order-card glass-card ${selected?.id === order.id ? 'selected' : ''}`} key={order.id} onClick={() => setSelectedId(order.id)}>
                  <div className="order-card-top"><strong>#{order.orderNumber}</strong><span className={`status-chip status-${String(order.status).toLowerCase()}`}>{statusLabel(order.status)}</span></div>
                  <span className="order-date">{order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Date unavailable'}</span>
                  <div className="order-card-bottom"><span>{order.items?.length || 0} item types</span><strong>₹{order.total}</strong></div>
                </button>
              )) : <div className="muted account-no-order">No orders in this filter.</div>}
            </div>

            {selected ? (
              <div className="order-track-panel glass-card">
                <div className="track-panel-head">
                  <div><span className="eyebrow">ORDER TRACKING</span><h3>#{selected.orderNumber}</h3></div>
                  <span className={`status-chip status-${String(selected.status).toLowerCase()}`}>{statusLabel(selected.status)}</span>
                </div>

                {selected.status === 'CANCELLED' && (
                  <div className="cancelled-order-banner"><b>Order cancelled</b><span>The order is closed. If the store reopens it, a new tracking event will appear here.</span></div>
                )}

                <div className="tracking-history-v6">
                  {(selected.statusHistory || []).length ? [...selected.statusHistory].map((event, index) => (
                    <div className="history-step-v6" key={`${event.status}-${event.at || index}`}>
                      <span className="history-dot-v6">{index + 1}</span>
                      <div><strong>{statusLabel(event.status)}</strong><small>{event.at ? new Date(event.at).toLocaleString() : 'Time unavailable'}</small>{event.note && <p>{event.note}</p>}</div>
                    </div>
                  )) : <p className="muted">Tracking updates will appear here as your order progresses.</p>}
                </div>

                <div className="tracked-items">
                  <h4>Items in this order</h4>
                  {selected.items?.map(item => (
                    <div className="tracked-item" key={`${selected.id}-${item.bookId}`}>
                      <img src={item.image} alt="" />
                      <div><strong>{item.title}</strong><span>Qty {item.quantity}</span></div>
                      <b>₹{item.price * item.quantity}</b>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="order-track-panel empty-track glass-card"><h3>No order selected</h3><p>Your order tracking will appear here after checkout.</p></div>
            )}
          </div>
        </section>

        <section id="address" className="account-box glass-panel">
          <div className="section-heading"><div><h2>Saved Address</h2><p>Your delivery details</p></div></div>
          {account?.addresses?.length ? account.addresses.map((address, index) => (
            <div className="address-card glass-card" key={index}>
              <strong>{address.fullName}</strong>
              <span>{address.line1}{address.line2 ? `, ${address.line2}` : ''}</span>
              <span>{address.city}, {address.state} - {address.pincode}</span>
              <span>{address.mobile}</span>
            </div>
          )) : <p className="muted">Your first checkout address will be saved here.</p>}
        </section>
      </div>
    </section>
  )
}
