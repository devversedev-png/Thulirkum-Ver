import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'

const orderStatuses = [
  ['BOOKING_CONFIRMED', 'Booking Confirmed'],
  ['CONFIRMED', 'Confirmed'],
  ['PACKED', 'Packed'],
  ['SHIPPED', 'Shipped'],
  ['OUT_FOR_DELIVERY', 'Out for Delivery'],
  ['DELIVERED', 'Delivered'],
  ['CANCELLED', 'Cancelled']
]

const emptyBook = {
  title: '', author: '', category: '', language: 'Tamil', publisher: '', isbn: '', description: '', image: '',
  price: 0, originalPrice: 0, rating: 0, reviewCount: 0, stock: 0, featured: false, newArrival: false, available: true
}

const emptyOffer = {
  title: '', code: '', description: '', discountType: 'PERCENT', discountValue: 10, minOrderAmount: 0,
  startDate: '', endDate: '', active: true
}

export default function AdminDashboardPage() {
  const { user, logout } = useAuth()
  const [tab, setTab] = useState('overview')
  const [books, setBooks] = useState([])
  const [orders, setOrders] = useState([])
  const [customers, setCustomers] = useState([])
  const [offers, setOffers] = useState([])
  const [bookForm, setBookForm] = useState(emptyBook)
  const [offerForm, setOfferForm] = useState(emptyOffer)
  const [editingBook, setEditingBook] = useState(null)
  const [editingOffer, setEditingOffer] = useState(null)
  const [message, setMessage] = useState('')
  const [inventorySearch, setInventorySearch] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [orderedOnly, setOrderedOnly] = useState(false)
  const [orderFilters, setOrderFilters] = useState({ q: '', status: '', from: '', to: '', month: '' })

  useEffect(() => {
    loadEverything()
  }, [])

  async function loadEverything() {
    const [bookData, orderData, customerData, offerData] = await Promise.all([
      api('/admin/books'), api('/admin/orders'), api('/admin/customers'), api('/admin/offers')
    ])
    setBooks(bookData)
    setOrders(orderData)
    setCustomers(customerData)
    setOffers(offerData)
  }

  async function loadOrders(filters = orderFilters) {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => value && params.set(key, value))
    setOrders(await api(`/admin/orders${params.toString() ? `?${params}` : ''}`))
  }

  const stats = useMemo(() => ({
    books: books.length,
    lowStock: books.filter(book => book.stock <= 5 || book.available === false).length,
    outOfStock: books.filter(book => book.stock === 0 || book.available === false).length,
    orders: orders.length,
    pending: orders.filter(order => ['BOOKING_CONFIRMED', 'CONFIRMED', 'PACKED'].includes(order.status)).length,
    shipped: orders.filter(order => ['SHIPPED', 'OUT_FOR_DELIVERY'].includes(order.status)).length,
    delivered: orders.filter(order => order.status === 'DELIVERED').length,
    cancelled: orders.filter(order => order.status === 'CANCELLED').length,
    revenue: orders.filter(order => order.status !== 'CANCELLED').reduce((sum, order) => sum + Number(order.total || 0), 0),
    customers: customers.length,
    activeOffers: offers.filter(offer => offer.active).length
  }), [books, orders, customers, offers])

  const filteredBooks = useMemo(() => {
    const q = inventorySearch.toLowerCase().trim()
    return books.filter(book => !q || `${book.title} ${book.author} ${book.category} ${book.isbn || ''}`.toLowerCase().includes(q))
  }, [books, inventorySearch])

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.toLowerCase().trim()
    return customers.filter(customer => (!orderedOnly || customer.orderCount > 0)
      && (!q || `${customer.name} ${customer.email} ${customer.mobile || ''}`.toLowerCase().includes(q)))
  }, [customers, customerSearch, orderedOnly])

  function bookChange(event) {
    const { name, value, type, checked } = event.target
    setBookForm(current => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  function offerChange(event) {
    const { name, value, type, checked } = event.target
    setOfferForm(current => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  async function saveBook(event) {
    event.preventDefault()
    const payload = {
      ...bookForm,
      price: Number(bookForm.price), originalPrice: Number(bookForm.originalPrice), rating: Number(bookForm.rating),
      reviewCount: Number(bookForm.reviewCount), stock: Number(bookForm.stock)
    }
    if (editingBook) await api(`/admin/books/${editingBook}`, { method: 'PUT', body: JSON.stringify(payload) })
    else await api('/admin/books', { method: 'POST', body: JSON.stringify(payload) })
    setMessage(editingBook ? 'Book updated successfully' : 'Book added successfully')
    setEditingBook(null)
    setBookForm(emptyBook)
    setBooks(await api('/admin/books'))
  }

  function editBook(book) {
    setEditingBook(book.id)
    setBookForm({ ...emptyBook, ...book, available: book.available !== false })
    setTab('inventory')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function deleteBook(book) {
    if (!window.confirm(`Delete ${book.title}?`)) return
    await api(`/admin/books/${book.id}`, { method: 'DELETE' })
    setBooks(await api('/admin/books'))
  }

  async function quickStock(book, nextStock, available = book.available !== false) {
    const updated = await api(`/admin/books/${book.id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ stock: Math.max(0, nextStock), available })
    })
    setBooks(current => current.map(item => item.id === updated.id ? updated : item))
  }

  async function updateOrderStatus(order, status) {
    try {
      const updated = await api(`/admin/orders/${order.id}/status`, {
        method: 'PUT', body: JSON.stringify({ status, note: '' })
      })
      setOrders(current => current.map(item => item.id === updated.id ? updated : item))
      setBooks(await api('/admin/books'))
      setCustomers(await api('/admin/customers'))
      setMessage(`Order #${order.orderNumber} updated to ${labelStatus(status)}`)
    } catch (err) {
      setMessage(err.message)
    }
  }

  function orderFilterChange(event) {
    const next = { ...orderFilters, [event.target.name]: event.target.value }
    setOrderFilters(next)
  }

  async function applyOrderFilters(event) {
    event?.preventDefault()
    await loadOrders(orderFilters)
  }

  async function clearOrderFilters() {
    const blank = { q: '', status: '', from: '', to: '', month: '' }
    setOrderFilters(blank)
    await loadOrders(blank)
  }

  async function saveOffer(event) {
    event.preventDefault()
    const payload = {
      ...offerForm,
      discountValue: Number(offerForm.discountValue), minOrderAmount: Number(offerForm.minOrderAmount)
    }
    if (editingOffer) await api(`/admin/offers/${editingOffer}`, { method: 'PUT', body: JSON.stringify(payload) })
    else await api('/admin/offers', { method: 'POST', body: JSON.stringify(payload) })
    setEditingOffer(null)
    setOfferForm(emptyOffer)
    setOffers(await api('/admin/offers'))
    setMessage('Offer saved successfully')
  }

  function editOffer(offer) {
    setEditingOffer(offer.id)
    setOfferForm({ ...emptyOffer, ...offer })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function deleteOffer(offer) {
    if (!window.confirm(`Delete offer ${offer.title}?`)) return
    await api(`/admin/offers/${offer.id}`, { method: 'DELETE' })
    setOffers(await api('/admin/offers'))
  }

  return (
    <div className="admin-shell-v4">
      <aside className="admin-sidebar-v4">
        <div className="admin-logo-v4"><img src="/logo.png" alt="" /><div><strong>Thulirkum Ver</strong><span>Seller & Admin Center</span></div></div>
        <nav>
          {[
            ['overview', '▦', 'Overview'], ['orders', '▣', 'Orders'], ['inventory', '▤', 'Inventory'],
            ['customers', '◎', 'Customers'], ['offers', '✦', 'Offers']
          ].map(([key, icon, label]) => <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}><b>{icon}</b>{label}</button>)}
        </nav>
        <div className="admin-profile-v4"><span>{user?.name}</span><small>{user?.email}</small><button onClick={logout}>Logout</button></div>
      </aside>

      <main className="admin-content-v4">
        <header className="admin-page-header-v4">
          <div><span className="eyebrow">Commerce administration</span><h1>{tab[0].toUpperCase() + tab.slice(1)}</h1><p className="admin-page-subtitle">Manage the bookstore from one workspace.</p></div>
          <div className="admin-header-actions"><button className="outline-btn" onClick={loadEverything}>Refresh Data</button><span className="admin-live-dot">● Live</span></div>
        </header>
        {message && <div className="admin-toast-v4" onClick={() => setMessage('')}>{message}<span>×</span></div>}

        {tab === 'overview' && (
          <>
            <section className="admin-command-banner">
              <div>
                <span>STORE SUMMARY</span>
                <h2>Good morning, {user?.name?.split(' ')[0] || 'Admin'}.</h2>
                <p>Track sales, fulfil orders, manage stock and keep the storefront ready for customers.</p>
              </div>
              <div className="admin-command-actions">
                <button className="admin-command-primary" onClick={() => setTab('orders')}>Process Orders</button>
                <button className="admin-command-secondary" onClick={() => setTab('inventory')}>Update Inventory</button>
              </div>
            </section>

            <section className="admin-stat-grid-v4 marketplace-admin-stats">
              <StatCard icon="₹" label="Order Value" value={`₹${Math.round(stats.revenue).toLocaleString()}`} detail="Excluding cancelled orders" tone="green" />
              <StatCard icon="▣" label="Total Orders" value={stats.orders} detail={`${stats.pending} waiting for fulfilment`} tone="blue" />
              <StatCard icon="◎" label="Customers" value={stats.customers} detail="Registered customer accounts" tone="violet" />
              <StatCard icon="▤" label="Catalogue" value={stats.books} detail={`${stats.lowStock} stock alerts`} tone="amber" />
            </section>

            <section className="admin-fulfilment-strip">
              <button onClick={() => setTab('orders')}><span>To Process</span><strong>{stats.pending}</strong><small>Confirmed / packed</small></button>
              <button onClick={() => setTab('orders')}><span>In Transit</span><strong>{stats.shipped}</strong><small>Shipped / out for delivery</small></button>
              <button onClick={() => setTab('orders')}><span>Delivered</span><strong>{stats.delivered}</strong><small>Completed orders</small></button>
              <button onClick={() => setTab('inventory')}><span>Out of Stock</span><strong>{stats.outOfStock}</strong><small>Needs inventory action</small></button>
              <button onClick={() => setTab('offers')}><span>Live Offers</span><strong>{stats.activeOffers}</strong><small>Published promotions</small></button>
            </section>

            <div className="admin-overview-grid">
              <section className="admin-panel-v4 admin-orders-panel">
                <div className="admin-panel-title"><div><span className="admin-panel-kicker">FULFILMENT</span><h2>Recent Orders</h2><p>Confirm and move orders through the delivery workflow.</p></div><button className="text-btn" onClick={() => setTab('orders')}>View all →</button></div>
                <OrderTable orders={orders.slice(0, 6)} onStatus={updateOrderStatus} />
              </section>

              <section className="admin-panel-v4 admin-inventory-panel">
                <div className="admin-panel-title"><div><span className="admin-panel-kicker">STOCK HEALTH</span><h2>Inventory Attention</h2><p>Low-stock and unavailable titles.</p></div><button className="text-btn" onClick={() => setTab('inventory')}>Manage →</button></div>
                <div className="inventory-attention-grid admin-attention-list">
                  {books.filter(book => book.stock <= 5 || book.available === false).slice(0, 6).map(book => <InventoryMini key={book.id} book={book} />)}
                  {!books.some(book => book.stock <= 5 || book.available === false) && <p className="muted">Inventory looks healthy.</p>}
                </div>
              </section>
            </div>
          </>
        )}

        {tab === 'orders' && (
          <section className="admin-panel-v4">
            <div className="admin-panel-title"><div><h2>Order Management</h2><p>Confirm, ship, deliver or cancel orders. Filter date-wise or month-wise.</p></div></div>
            <form className="admin-order-filters" onSubmit={applyOrderFilters}>
              <input name="q" value={orderFilters.q} onChange={orderFilterChange} placeholder="Order no, customer, email..." />
              <select name="status" value={orderFilters.status} onChange={orderFilterChange}><option value="">All Statuses</option>{orderStatuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
              <label><span>From</span><input type="date" name="from" value={orderFilters.from} onChange={orderFilterChange} /></label>
              <label><span>To</span><input type="date" name="to" value={orderFilters.to} onChange={orderFilterChange} /></label>
              <label><span>Month</span><input type="month" name="month" value={orderFilters.month} onChange={orderFilterChange} /></label>
              <button className="primary-btn" type="submit">Apply</button><button className="outline-btn" type="button" onClick={clearOrderFilters}>Clear</button>
            </form>
            <OrderTable orders={orders} onStatus={updateOrderStatus} detailed />
          </section>
        )}

        {tab === 'inventory' && (
          <>
            <section className="admin-panel-v4 admin-book-editor">
              <div className="admin-panel-title"><div><h2>{editingBook ? 'Edit Book' : 'Add New Book'}</h2><p>Manage catalogue, prices, availability and stock.</p></div>{editingBook && <button className="text-btn" onClick={() => { setEditingBook(null); setBookForm(emptyBook) }}>Cancel edit</button>}</div>
              <form className="admin-book-form-v4" onSubmit={saveBook}>
                <label>Book Title<input name="title" value={bookForm.title} onChange={bookChange} required /></label>
                <label>Author<input name="author" value={bookForm.author} onChange={bookChange} required /></label>
                <label>Category<input name="category" value={bookForm.category} onChange={bookChange} required /></label>
                <label>Language<input name="language" value={bookForm.language} onChange={bookChange} required /></label>
                <label>Publisher<input name="publisher" value={bookForm.publisher} onChange={bookChange} /></label>
                <label>ISBN<input name="isbn" value={bookForm.isbn} onChange={bookChange} /></label>
                <label>Cover path / URL<input name="image" value={bookForm.image} onChange={bookChange} placeholder="/covers/book.svg" /></label>
                <label>Selling Price<input name="price" type="number" min="0" value={bookForm.price} onChange={bookChange} required /></label>
                <label>MRP<input name="originalPrice" type="number" min="0" value={bookForm.originalPrice} onChange={bookChange} required /></label>
                <label>Stock<input name="stock" type="number" min="0" value={bookForm.stock} onChange={bookChange} required /></label>
                <label>Rating<input name="rating" type="number" min="0" max="5" step="0.1" value={bookForm.rating} onChange={bookChange} /></label>
                <label>Review Count<input name="reviewCount" type="number" min="0" value={bookForm.reviewCount} onChange={bookChange} /></label>
                <label className="admin-wide-field">Description<textarea name="description" value={bookForm.description} onChange={bookChange} rows="3" /></label>
                <label className="admin-toggle-field"><input name="available" type="checkbox" checked={bookForm.available !== false} onChange={bookChange} /><span>Available for sale</span></label>
                <label className="admin-toggle-field"><input name="featured" type="checkbox" checked={bookForm.featured} onChange={bookChange} /><span>Featured</span></label>
                <label className="admin-toggle-field"><input name="newArrival" type="checkbox" checked={bookForm.newArrival} onChange={bookChange} /><span>New Arrival</span></label>
                <button className="primary-btn admin-form-save" type="submit">{editingBook ? 'Update Book' : 'Add Book'}</button>
              </form>
            </section>

            <section className="admin-panel-v4">
              <div className="admin-panel-title"><div><h2>Inventory ({filteredBooks.length})</h2><p>Stock changes made here are reflected in the customer store.</p></div><input className="admin-list-search" value={inventorySearch} onChange={e => setInventorySearch(e.target.value)} placeholder="Search books..." /></div>
              <div className="admin-inventory-grid">
                {filteredBooks.map(book => (
                  <article className={`inventory-card-v4 ${book.available === false || book.stock === 0 ? 'out' : ''}`} key={book.id}>
                    <img src={book.image} alt="" />
                    <div className="inventory-card-copy"><strong>{book.title}</strong><span>{book.author}</span><small>{book.category}</small></div>
                    <div className="inventory-stock-box"><span>Available Stock</span><strong>{book.stock}</strong><small>{book.available === false || book.stock === 0 ? 'Out of stock' : book.stock <= 5 ? 'Low stock' : 'In stock'}</small></div>
                    <div className="inventory-quick-actions">
                      <button onClick={() => quickStock(book, book.stock + 1)}>+1</button><button onClick={() => quickStock(book, book.stock + 5)}>+5</button><button disabled={book.stock === 0} onClick={() => quickStock(book, book.stock - 1)}>−1</button>
                    </div>
                    <div className="inventory-card-actions"><button className="outline-btn compact" onClick={() => editBook(book)}>Edit</button><button className={book.available === false ? 'primary-btn compact' : 'warning-btn compact'} onClick={() => quickStock(book, book.stock, book.available === false)}>{book.available === false ? 'Make Available' : 'Mark Out of Stock'}</button><button className="danger-btn compact" onClick={() => deleteBook(book)}>Delete</button></div>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}

        {tab === 'customers' && (
          <section className="admin-panel-v4">
            <div className="admin-panel-title"><div><h2>Customer Tracking</h2><p>See registered users, last login and ordered customer activity.</p></div></div>
            <div className="customer-admin-filters"><input value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} placeholder="Search name, email or mobile..." /><label><input type="checkbox" checked={orderedOnly} onChange={e => setOrderedOnly(e.target.checked)} /> Ordered customers only</label></div>
            <div className="admin-table-wrap"><table className="admin-table-v4"><thead><tr><th>Customer</th><th>Mobile</th><th>Registered</th><th>Last Login</th><th>Orders</th><th>Total Spent</th><th>Last Order</th></tr></thead><tbody>{filteredCustomers.map(customer => <tr key={customer.id}><td><strong>{customer.name}</strong><span>{customer.email}</span></td><td>{customer.mobile || '—'}</td><td>{formatDate(customer.createdAt)}</td><td>{formatDateTime(customer.lastLoginAt)}</td><td><b>{customer.orderCount}</b></td><td>₹{Math.round(customer.totalSpent || 0).toLocaleString()}</td><td>{formatDateTime(customer.lastOrderAt)}</td></tr>)}</tbody></table></div>
          </section>
        )}

        {tab === 'offers' && (
          <>
            <section className="admin-panel-v4">
              <div className="admin-panel-title"><div><h2>{editingOffer ? 'Edit Offer' : 'Create Offer'}</h2><p>Publish professional offers that appear on the customer website.</p></div>{editingOffer && <button className="text-btn" onClick={() => { setEditingOffer(null); setOfferForm(emptyOffer) }}>Cancel edit</button>}</div>
              <form className="admin-offer-form" onSubmit={saveOffer}>
                <label>Offer Title<input name="title" value={offerForm.title} onChange={offerChange} required /></label>
                <label>Coupon Code<input name="code" value={offerForm.code} onChange={offerChange} /></label>
                <label>Discount Type<select name="discountType" value={offerForm.discountType} onChange={offerChange}><option value="PERCENT">Percentage</option><option value="FIXED">Fixed Amount</option></select></label>
                <label>Discount Value<input type="number" min="0" name="discountValue" value={offerForm.discountValue} onChange={offerChange} /></label>
                <label>Minimum Order<input type="number" min="0" name="minOrderAmount" value={offerForm.minOrderAmount} onChange={offerChange} /></label>
                <label>Start Date<input type="date" name="startDate" value={offerForm.startDate || ''} onChange={offerChange} /></label>
                <label>End Date<input type="date" name="endDate" value={offerForm.endDate || ''} onChange={offerChange} /></label>
                <label className="admin-wide-field">Description<textarea name="description" value={offerForm.description} onChange={offerChange} rows="3" /></label>
                <label className="admin-toggle-field"><input type="checkbox" name="active" checked={offerForm.active} onChange={offerChange} /><span>Publish this offer</span></label>
                <button className="primary-btn admin-form-save" type="submit">{editingOffer ? 'Update Offer' : 'Add Offer'}</button>
              </form>
            </section>
            <section className="admin-offer-grid-v4">{offers.map(offer => <article className={`admin-offer-card ${!offer.active ? 'inactive' : ''}`} key={offer.id}><span>{offer.active ? 'ACTIVE' : 'DRAFT'}</span><h3>{offer.title}</h3><b>{offer.code || 'NO CODE'}</b><p>{offer.description}</p><strong>{offer.discountType === 'FIXED' ? `₹${offer.discountValue}` : `${offer.discountValue}%`} OFF</strong><small>{offer.startDate || 'Any date'} → {offer.endDate || 'No end date'}</small><div><button className="outline-btn compact" onClick={() => editOffer(offer)}>Edit</button><button className="danger-btn compact" onClick={() => deleteOffer(offer)}>Delete</button></div></article>)}</section>
          </>
        )}
      </main>
    </div>
  )
}

function StatCard({ icon = '•', label, value, detail, tone = 'green' }) {
  return <article className={`admin-stat-card-v4 admin-stat-${tone}`}><div className="admin-stat-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></article>
}

function InventoryMini({ book }) {
  return <div className="inventory-mini"><img src={book.image} alt="" /><div><strong>{book.title}</strong><span>Stock {book.stock}</span></div><b className={book.available === false || book.stock === 0 ? 'bad' : 'warn'}>{book.available === false || book.stock === 0 ? 'Out' : 'Low'}</b></div>
}

function OrderTable({ orders, onStatus, detailed = false }) {
  return <div className="admin-table-wrap"><table className="admin-table-v4 order-admin-table"><thead><tr><th>Order</th><th>Customer</th>{detailed && <th>Items</th>}<th>Date</th><th>Total</th><th>Status / Action</th></tr></thead><tbody>{orders.map(order => <tr key={order.id}><td><strong>#{order.orderNumber}</strong><span>{order.paymentMethod}</span></td><td><strong>{order.customerName || 'Customer'}</strong><span>{order.customerEmail || order.userId}</span></td>{detailed && <td><div className="admin-order-items">{order.items?.map(item => <small key={item.bookId}>{item.title} × {item.quantity}</small>)}</div></td>}<td>{formatDateTime(order.createdAt)}</td><td><strong>₹{order.total}</strong></td><td><select className={`admin-status-select status-${String(order.status).toLowerCase()}`} value={order.status || 'BOOKING_CONFIRMED'} disabled={order.status === 'CANCELLED'} onChange={e => onStatus(order, e.target.value)}>{orderStatuses.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></td></tr>)}</tbody></table>{!orders.length && <div className="admin-empty-row">No orders found for this filter.</div>}</div>
}

function labelStatus(status) {
  return orderStatuses.find(([value]) => value === status)?.[1] || status
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : '—'
}

function formatDateTime(value) {
  return value ? new Date(value).toLocaleString() : '—'
}
