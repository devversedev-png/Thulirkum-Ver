import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'

const statusLabels = {
  BOOKING_CONFIRMED: 'Booking Confirmed',
  CONFIRMED: 'Confirmed',
  PACKED: 'Packed',
  SHIPPED: 'Shipped',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  Processing: 'Processing'
}

const flow = ['BOOKING_CONFIRMED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED']

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
    <section className="page-width account-page premium-account-page min-page">
      <aside className="account-sidebar premium-account-sidebar">
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
        <div className="account-welcome premium-account-welcome">
          <div><span className="eyebrow">My Account</span><h1>Hello, {user?.name?.split(' ')[0]}</h1><p>Track every order from booking confirmation to delivery.</p></div>
          <div className="account-mini-stat"><strong>{orders.length}</strong><span>Total Orders</span></div>
        </div>

        <section id="orders" className="account-box premium-orders-box">
          <div className="section-heading order-section-head">
            <div><h2>My Orders</h2><p>Select an order to view items and live tracking.</p></div>
            <button className="outline-btn compact" onClick={loadOrders}>Refresh</button>
          </div>

          <div className="order-filter-tabs">
            {['ALL', 'ACTIVE', 'DELIVERED', 'CANCELLED'].map(item => (
              <button key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>
                {item === 'ALL' ? 'All' : item === 'ACTIVE' ? 'Active' : statusLabels[item]}
              </button>
            ))}
          </div>

          <div className="customer-order-layout">
            <div className="customer-order-list">
              {visibleOrders.length ? visibleOrders.map(order => (
                <button className={`customer-order-card ${selected?.id === order.id ? 'selected' : ''}`} key={order.id} onClick={() => setSelectedId(order.id)}>
                  <div className="order-card-top"><strong>#{order.orderNumber}</strong><span className={`status-chip status-${String(order.status).toLowerCase()}`}>{statusLabels[order.status] || order.status}</span></div>
                  <span className="order-date">{order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Date unavailable'}</span>
                  <div className="order-card-bottom"><span>{order.items?.length || 0} item types</span><strong>₹{order.total}</strong></div>
                </button>
              )) : <div className="muted account-no-order">No orders in this filter.</div>}
            </div>

            {selected ? (
              <div className="order-track-panel">
                <div className="track-panel-head">
                  <div><span className="eyebrow">Order tracking</span><h3>#{selected.orderNumber}</h3></div>
                  <span className={`status-chip status-${String(selected.status).toLowerCase()}`}>{statusLabels[selected.status] || selected.status}</span>
                </div>

                {selected.status === 'CANCELLED' ? (
                  <div className="cancelled-order-banner"><b>Order Cancelled</b><span>This order was cancelled. Reserved stock was returned to inventory.</span></div>
                ) : (
                  <div className="tracking-timeline">
                    {flow.map((step, index) => {
                      const currentIndex = flow.indexOf(selected.status)
                      const historyEvent = selected.statusHistory?.find(event => event.status === step)
                      const done = currentIndex >= index || Boolean(historyEvent)
                      return (
                        <div key={step} className={`tracking-step ${done ? 'done' : ''} ${selected.status === step ? 'current' : ''}`}>
                          <b>{done ? '✓' : index + 1}</b>
                          <div><strong>{statusLabels[step]}</strong><span>{historyEvent?.at ? new Date(historyEvent.at).toLocaleString() : done ? 'Completed' : 'Waiting for update'}</span>{historyEvent?.note && <small>{historyEvent.note}</small>}</div>
                        </div>
                      )
                    })}
                  </div>
                )}

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
              <div className="order-track-panel empty-track"><h3>No order selected</h3><p>Your order tracking will appear here after checkout.</p></div>
            )}
          </div>
        </section>

        <section id="address" className="account-box">
          <div className="section-heading"><div><h2>Saved Address</h2><p>Your delivery details</p></div></div>
          {account?.addresses?.length ? account.addresses.map((address, index) => (
            <div className="address-card" key={index}>
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
