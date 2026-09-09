import { useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import PremiumConfirm from '../components/PremiumConfirm'

const emptyBook = {
  title: '', author: '', category: '', language: '', publisher: '', isbn: '', description: '', image: '',
  price: 0, originalPrice: 0, rating: 0, reviewCount: 0, stock: 0, featured: false, newArrival: false, available: true
}

const emptyOffer = {
  title: '', code: '', description: '', discountType: 'PERCENT', discountValue: 0, minOrderAmount: 0,
  startDate: '', endDate: '', active: true
}

function statusLabel(value) {
  if (!value) return 'Status unavailable'
  return String(value).toLowerCase().split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

export default function AdminDashboardPage() {
  const { user, logout } = useAuth()
  const [tab, setTab] = useState('overview')
  const [books, setBooks] = useState([])
  const [orders, setOrders] = useState([])
  const [customers, setCustomers] = useState([])
  const [offers, setOffers] = useState([])
  const [statusOptions, setStatusOptions] = useState([])
  const [bookForm, setBookForm] = useState(emptyBook)
  const [offerForm, setOfferForm] = useState(emptyOffer)
  const [editingBook, setEditingBook] = useState(null)
  const [editingOffer, setEditingOffer] = useState(null)
  const [message, setMessage] = useState('')
  const [inventorySearch, setInventorySearch] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [orderedOnly, setOrderedOnly] = useState(false)
  const [orderFilters, setOrderFilters] = useState({ q: '', status: '', from: '', to: '', month: '' })
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [orderActions, setOrderActions] = useState([])
  const [orderActionBusy, setOrderActionBusy] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState(null)
  const stockDrafts = useRef({})
  const stockTimers = useRef({})

  useEffect(() => {
    loadEverything()
    return () => Object.values(stockTimers.current).forEach(clearTimeout)
  }, [])

  async function loadEverything() {
    try {
      const [bookData, orderData, customerData, offerData] = await Promise.all([
        api('/admin/books'), api('/admin/orders'), api('/admin/customers'), api('/admin/offers')
      ])
      setBooks(bookData)
      setOrders(orderData)
      setCustomers(customerData)
      setOffers(offerData)
      setStatusOptions([...new Set(orderData.map(order => order.status).filter(Boolean))])
    } catch (err) {
      setMessage(err.message)
    }
  }

  async function refreshEverything() {
    if (refreshing) return
    try {
      setRefreshing(true)
      await loadEverything()
      setMessage('Latest store data loaded')
    } finally {
      setRefreshing(false)
    }
  }

  async function loadOrders(filters = orderFilters) {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => value && params.set(key, value))
    setOrders(await api(`/admin/orders${params.toString() ? `?${params}` : ''}`))
  }

  const stats = useMemo(() => {
    const count = status => orders.filter(order => order.status === status).length
    const activeRevenue = orders.filter(order => order.status !== 'CANCELLED').reduce((sum, order) => sum + Number(order.total || 0), 0)
    return {
      books: books.length,
      lowStock: books.filter(book => book.stock <= 5 || book.available === false).length,
      outOfStock: books.filter(book => book.stock === 0 || book.available === false).length,
      orders: orders.length,
      toProcess: count('BOOKING_CONFIRMED') + count('CONFIRMED') + count('PACKED'),
      inTransit: count('SHIPPED') + count('OUT_FOR_DELIVERY'),
      delivered: count('DELIVERED'),
      cancelled: count('CANCELLED'),
      revenue: activeRevenue,
      customers: customers.length,
      activeOffers: offers.filter(offer => offer.active).length
    }
  }, [books, orders, customers, offers])

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

  function deleteBook(book) {
    setConfirmDialog({
      eyebrow: 'CATALOGUE',
      title: 'Delete this book?',
      message: `${book.title} will be removed from the catalogue. This action cannot be undone.`,
      confirmLabel: 'Delete book',
      tone: 'danger',
      onConfirm: async () => {
        await api(`/admin/books/${book.id}`, { method: 'DELETE' })
        setBooks(current => current.filter(item => item.id !== book.id))
        setMessage(`${book.title} removed from catalogue`)
      }
    })
  }

  function queueStockSave(bookId) {
    clearTimeout(stockTimers.current[bookId])
    stockTimers.current[bookId] = setTimeout(async () => {
      const draft = stockDrafts.current[bookId]
      if (!draft) return
      const sent = { ...draft }
      try {
        const updated = await api(`/admin/books/${bookId}/stock`, {
          method: 'PATCH',
          body: JSON.stringify({ stock: sent.stock, available: sent.available })
        })
        const latest = stockDrafts.current[bookId]
        if (latest && latest.stock === sent.stock && latest.available === sent.available) {
          delete stockDrafts.current[bookId]
          setBooks(current => current.map(item => item.id === updated.id ? updated : item))
        }
      } catch (error) {
        delete stockDrafts.current[bookId]
        setMessage(error.message)
        setBooks(await api('/admin/books'))
      }
    }, 220)
  }

  function adjustStock(book, delta) {
    const existing = stockDrafts.current[book.id]
    const currentStock = existing ? existing.stock : Number(book.stock || 0)
    const available = existing ? existing.available : book.available !== false
    const stock = Math.max(0, currentStock + delta)
    stockDrafts.current[book.id] = { stock, available }
    setBooks(current => current.map(item => item.id === book.id ? { ...item, stock, available } : item))
    queueStockSave(book.id)
  }

  function toggleBookAvailability(book) {
    const existing = stockDrafts.current[book.id]
    const stock = existing ? existing.stock : Number(book.stock || 0)
    const available = !(existing ? existing.available : book.available !== false)
    stockDrafts.current[book.id] = { stock, available }
    setBooks(current => current.map(item => item.id === book.id ? { ...item, stock, available } : item))
    queueStockSave(book.id)
  }

  async function openOrder(order) {
    setSelectedOrder(order)
    setOrderActions([])
    try {
      setOrderActions(await api(`/admin/orders/${order.id}/actions`))
    } catch (err) {
      setMessage(err.message)
    }
  }

  async function executeOrderAction(action) {
    if (!selectedOrder || orderActionBusy) return

    const previousOrder = selectedOrder
    const optimisticStatus = action.status || selectedOrder.status
    const optimisticOrder = { ...selectedOrder, status: optimisticStatus }

    // Update the UI immediately so status changes feel instant, even if the API is waking up.
    setOrderActionBusy(true)
    setSelectedOrder(optimisticOrder)
    setOrders(current => current.map(item => item.id === optimisticOrder.id ? { ...item, status: optimisticStatus } : item))
    setOrderActions([])

    try {
      const updated = await api(`/admin/orders/${selectedOrder.id}/status`, {
        method: 'PUT', body: JSON.stringify({ status: action.status, note: '' })
      })

      setOrders(current => current.map(item => item.id === updated.id ? updated : item))
      setStatusOptions(current => current.includes(updated.status) ? current : [...current, updated.status])
      setSelectedOrder(updated)
      setMessage(`Order #${updated.orderNumber} updated to ${statusLabel(updated.status)}`)

      // Only the next available workflow actions are needed before the modal is usable again.
      try {
        setOrderActions(await api(`/admin/orders/${updated.id}/actions`))
      } catch {
        setOrderActions([])
      }

      // Inventory/customer totals refresh in the background instead of blocking the status interaction.
      Promise.allSettled([api('/admin/books'), api('/admin/customers')]).then(([bookResult, customerResult]) => {
        if (bookResult.status === 'fulfilled') setBooks(bookResult.value)
        if (customerResult.status === 'fulfilled') setCustomers(customerResult.value)
      })
    } catch (err) {
      // Roll back the optimistic UI if the backend rejects the transition.
      setSelectedOrder(previousOrder)
      setOrders(current => current.map(item => item.id === previousOrder.id ? previousOrder : item))
      try {
        setOrderActions(await api(`/admin/orders/${previousOrder.id}/actions`))
      } catch {
        setOrderActions([])
      }
      setMessage(err.message)
    } finally {
      setOrderActionBusy(false)
    }
  }

  function performOrderAction(action) {
    if (!selectedOrder || orderActionBusy) return
    if (action.action === 'CANCEL' || action.action === 'REOPEN') {
      setConfirmDialog({
        eyebrow: 'ORDER WORKFLOW',
        title: action.action === 'CANCEL' ? 'Cancel this order?' : 'Reopen this order?',
        message: action.action === 'CANCEL'
          ? `Order #${selectedOrder.orderNumber} will be cancelled and reserved stock will be returned.`
          : `Order #${selectedOrder.orderNumber} will move back to Booking Confirmed if stock is available.`,
        confirmLabel: action.label,
        tone: action.action === 'CANCEL' ? 'danger' : 'success',
        onConfirm: () => executeOrderAction(action)
      })
      return
    }
    executeOrderAction(action)
  }

  function orderFilterChange(event) {
    setOrderFilters(current => ({ ...current, [event.target.name]: event.target.value }))
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

  function deleteOffer(offer) {
    setConfirmDialog({
      eyebrow: 'PROMOTIONS',
      title: 'Delete this promotion?',
      message: `${offer.title} will no longer be available in the admin console or customer offers.`,
      confirmLabel: 'Delete promotion',
      tone: 'danger',
      onConfirm: async () => {
        await api(`/admin/offers/${offer.id}`, { method: 'DELETE' })
        setOffers(current => current.filter(item => item.id !== offer.id))
        setMessage(`${offer.title} deleted`)
      }
    })
  }

  const navItems = [
    ['overview', '▦', 'Dashboard'], ['orders', '▣', 'Orders'], ['inventory', '▤', 'Catalogue'],
    ['customers', '◎', 'Customers'], ['offers', '✦', 'Promotions']
  ]

  return (
    <div className="admin-shell-v6">
      <aside className="admin-sidebar-v6 glass-admin-sidebar">
        <div className="admin-brand-v6">
          <img src="/logo.png" alt="Thulirkum Ver" />
          <div><strong>Thulirkum Ver</strong><span>Commerce Console</span></div>
        </div>

        <div className="admin-sprout-glass-v73" aria-hidden="true">
          <svg viewBox="0 0 120 120" role="presentation">
            <path d="M60 94V50" />
            <path d="M59 67C42 64 31 54 28 38c16 1 28 10 31 29Z" />
            <path d="M61 56c4-16 15-27 32-30-1 17-12 29-32 30Z" />
            <path d="M60 80c12-8 22-8 32-4-6 11-16 17-32 16" />
          </svg>
        </div>

        <nav className="admin-nav-v6">
          {navItems.map(([key, icon, label]) => (
            <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>
              <span>{icon}</span><strong>{label}</strong>
              {key === 'orders' && stats.toProcess > 0 && <b>{stats.toProcess}</b>}
              {key === 'inventory' && stats.lowStock > 0 && <b>{stats.lowStock}</b>}
            </button>
          ))}
        </nav>

        <div className="admin-profile-v6">
          <div className="admin-avatar-v6">{user?.name?.charAt(0)?.toUpperCase()}</div>
          <div><strong>{user?.name}</strong><small>{user?.email}</small></div>
          <button onClick={logout}>Logout</button>
        </div>
      </aside>

      <main className="admin-main-v6">
        <header className="admin-top-v6 glass-panel">
          <div>
            <span className="admin-kicker-v6">STORE MANAGEMENT</span>
            <h1>{navItems.find(([key]) => key === tab)?.[2]}</h1>
            <p>Live data from your catalogue, customers and orders.</p>
          </div>
          <div className="admin-top-actions-v6">
            <button type="button" className="admin-view-store-btn" onClick={() => window.open(`${window.location.origin}/home`, '_blank', 'noopener,noreferrer')}>View website</button>
            <button className={refreshing ? 'is-refreshing' : ''} onClick={refreshEverything} disabled={refreshing}>
              <span className="refresh-icon-v73">↻</span>{refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </header>

        {message && <button className="admin-toast-v6" onClick={() => setMessage('')}>{message}<span>×</span></button>}

        {tab === 'overview' && (
          <>
            <section className="admin-hero-v6 glass-panel">
              <div>
                <span>STORE OVERVIEW</span>
                <h2>Welcome back, {user?.name?.split(' ')[0] || 'Admin'}.</h2>
                <p>Monitor orders, stock and customers from one focused workspace.</p>
              </div>
              <div className="admin-hero-actions-v6">
                <button onClick={() => setTab('orders')}>Process orders</button>
                <button onClick={() => setTab('inventory')}>Manage catalogue</button>
              </div>
            </section>

            <section className="admin-kpi-grid-v6">
              <KpiCard label="Order value" value={`₹${Math.round(stats.revenue).toLocaleString()}`} detail="Excludes cancelled orders" icon="₹" />
              <KpiCard label="Orders" value={stats.orders} detail={`${stats.toProcess} need processing`} icon="▣" />
              <KpiCard label="Customers" value={stats.customers} detail="Registered customer accounts" icon="◎" />
              <KpiCard label="Catalogue" value={stats.books} detail={`${stats.lowStock} stock alerts`} icon="▤" />
            </section>

            <section className="admin-status-grid-v6">
              <StatusCard label="To process" value={stats.toProcess} onClick={() => setTab('orders')} />
              <StatusCard label="In transit" value={stats.inTransit} onClick={() => setTab('orders')} />
              <StatusCard label="Delivered" value={stats.delivered} onClick={() => setTab('orders')} />
              <StatusCard label="Cancelled" value={stats.cancelled} onClick={() => setTab('orders')} />
              <StatusCard label="Out of stock" value={stats.outOfStock} onClick={() => setTab('inventory')} />
              <StatusCard label="Live offers" value={stats.activeOffers} onClick={() => setTab('offers')} />
            </section>

            <div className="admin-overview-v6">
              <section className="admin-panel-v6 glass-panel">
                <PanelTitle eyebrow="FULFILMENT" title="Recent orders" copy="Open an order to see available workflow actions." action={<button onClick={() => setTab('orders')}>View all →</button>} />
                <OrderTable orders={orders.slice(0, 7)} onOpen={openOrder} />
              </section>

              <section className="admin-panel-v6 glass-panel">
                <PanelTitle eyebrow="INVENTORY" title="Stock attention" copy="Low-stock or unavailable catalogue items." action={<button onClick={() => setTab('inventory')}>Manage →</button>} />
                <div className="stock-list-v6">
                  {books.filter(book => book.stock <= 5 || book.available === false).slice(0, 7).map(book => (
                    <div className="stock-row-v6" key={book.id}>
                      <img src={book.image} alt="" />
                      <div><strong>{book.title}</strong><small>{book.category}</small></div>
                      <span className={book.stock === 0 || book.available === false ? 'critical' : ''}>{book.stock === 0 || book.available === false ? 'Out' : `${book.stock} left`}</span>
                    </div>
                  ))}
                  {!books.some(book => book.stock <= 5 || book.available === false) && <div className="admin-empty-v6">Inventory looks healthy.</div>}
                </div>
              </section>
            </div>
          </>
        )}

        {tab === 'orders' && (
          <section className="admin-panel-v6 glass-panel">
            <PanelTitle eyebrow="ORDER DESK" title="Orders" copy="Search, filter and open an order to manage its next valid action." />
            <form className="admin-filters-v6" onSubmit={applyOrderFilters}>
              <input name="q" value={orderFilters.q} onChange={orderFilterChange} placeholder="Order number, customer, email..." />
              <select name="status" value={orderFilters.status} onChange={orderFilterChange}>
                <option value="">All statuses</option>
                {statusOptions.map(value => <option key={value} value={value}>{statusLabel(value)}</option>)}
              </select>
              <label><span>From</span><input type="date" name="from" value={orderFilters.from} onChange={orderFilterChange} /></label>
              <label><span>To</span><input type="date" name="to" value={orderFilters.to} onChange={orderFilterChange} /></label>
              <label><span>Month</span><input type="month" name="month" value={orderFilters.month} onChange={orderFilterChange} /></label>
              <button className="admin-primary-v6" type="submit">Apply</button>
              <button className="admin-secondary-v6" type="button" onClick={clearOrderFilters}>Clear</button>
            </form>
            <OrderTable orders={orders} onOpen={openOrder} detailed />
          </section>
        )}

        {tab === 'inventory' && (
          <>
            <section className="admin-panel-v6 glass-panel">
              <PanelTitle eyebrow="CATALOGUE EDITOR" title={editingBook ? 'Edit book' : 'Add book'} copy="Catalogue data is saved through the backend and reflected on the customer store." action={editingBook ? <button onClick={() => { setEditingBook(null); setBookForm(emptyBook) }}>Cancel edit</button> : null} />
              <form className="admin-form-grid-v6" onSubmit={saveBook}>
                <label>Book title<input name="title" value={bookForm.title} onChange={bookChange} required /></label>
                <label>Author<input name="author" value={bookForm.author} onChange={bookChange} required /></label>
                <label>Category<input name="category" value={bookForm.category} onChange={bookChange} required /></label>
                <label>Language<input name="language" value={bookForm.language} onChange={bookChange} required /></label>
                <label>Publisher<input name="publisher" value={bookForm.publisher} onChange={bookChange} /></label>
                <label>ISBN<input name="isbn" value={bookForm.isbn} onChange={bookChange} /></label>
                <label className="wide">Cover path / URL<input name="image" value={bookForm.image} onChange={bookChange} /></label>
                <label>Selling price<input name="price" type="number" min="0" value={bookForm.price} onChange={bookChange} required /></label>
                <label>MRP<input name="originalPrice" type="number" min="0" value={bookForm.originalPrice} onChange={bookChange} required /></label>
                <label>Stock<input name="stock" type="number" min="0" value={bookForm.stock} onChange={bookChange} required /></label>
                <label>Rating<input name="rating" type="number" min="0" max="5" step="0.1" value={bookForm.rating} onChange={bookChange} /></label>
                <label>Review count<input name="reviewCount" type="number" min="0" value={bookForm.reviewCount} onChange={bookChange} /></label>
                <label className="wide">Description<textarea name="description" value={bookForm.description} onChange={bookChange} rows="4" /></label>
                <div className="admin-toggle-row-v6 wide">
                  <label className="premium-check-v73"><input name="available" type="checkbox" checked={bookForm.available !== false} onChange={bookChange} /> Available for sale</label>
                  <label className="premium-check-v73"><input name="featured" type="checkbox" checked={bookForm.featured} onChange={bookChange} /> Featured</label>
                  <label className="premium-check-v73"><input name="newArrival" type="checkbox" checked={bookForm.newArrival} onChange={bookChange} /> New arrival</label>
                </div>
                <button className="admin-primary-v6" type="submit">{editingBook ? 'Update book' : 'Add book'}</button>
              </form>
            </section>

            <section className="admin-panel-v6 glass-panel">
              <PanelTitle eyebrow="INVENTORY" title={`Catalogue (${filteredBooks.length})`} copy="Manage stock and availability without changing code." action={<input className="admin-search-v6" value={inventorySearch} onChange={e => setInventorySearch(e.target.value)} placeholder="Search catalogue..." />} />
              <div className="inventory-grid-v6">
                {filteredBooks.map(book => (
                  <article className={`inventory-card-v6 glass-card ${book.available === false || book.stock === 0 ? 'out' : ''}`} key={book.id}>
                    <img src={book.image} alt="" />
                    <div className="inventory-info-v6"><strong>{book.title}</strong><span>{book.author}</span><small>{book.category}</small></div>
                    <div className="inventory-stock-v6"><span>Stock</span><strong>{book.stock}</strong><small>{book.available === false || book.stock === 0 ? 'Unavailable' : book.stock <= 5 ? 'Low stock' : 'Available'}</small></div>
                    <div className="inventory-stepper-v6"><button onClick={() => adjustStock(book, 1)}>+1</button><button onClick={() => adjustStock(book, 5)}>+5</button><button disabled={book.stock === 0} onClick={() => adjustStock(book, -1)}>−1</button></div>
                    <div className="inventory-actions-v6">
                      <button onClick={() => editBook(book)}>Edit</button>
                      <button onClick={() => toggleBookAvailability(book)}>{book.available === false ? 'Make available' : 'Mark unavailable'}</button>
                      <button className="danger" onClick={() => deleteBook(book)}>Delete</button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}

        {tab === 'customers' && (
          <section className="admin-panel-v6 glass-panel">
            <PanelTitle eyebrow="CUSTOMER CRM" title="Customers" copy="Registered customers and order activity from your database." />
            <div className="customer-tools-v6">
              <input value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} placeholder="Search name, email or mobile..." />
              <label className="premium-check-v73 customer-order-check-v73"><input type="checkbox" checked={orderedOnly} onChange={e => setOrderedOnly(e.target.checked)} /> Customers with orders only</label>
            </div>
            <div className="admin-table-wrap-v6"><table className="admin-table-v6"><thead><tr><th>Customer</th><th>Mobile</th><th>Registered</th><th>Last login</th><th>Orders</th><th>Total spent</th><th>Last order</th></tr></thead><tbody>{filteredCustomers.map(customer => <tr key={customer.id}><td><strong>{customer.name}</strong><span>{customer.email}</span></td><td>{customer.mobile || '—'}</td><td>{formatDate(customer.createdAt)}</td><td>{formatDateTime(customer.lastLoginAt)}</td><td><b>{customer.orderCount}</b></td><td>₹{Math.round(customer.totalSpent || 0).toLocaleString()}</td><td>{formatDateTime(customer.lastOrderAt)}</td></tr>)}</tbody></table></div>
          </section>
        )}

        {tab === 'offers' && (
          <>
            <section className="admin-panel-v6 glass-panel">
              <PanelTitle eyebrow="PROMOTIONS" title={editingOffer ? 'Edit offer' : 'Create offer'} copy="Offers are stored in MongoDB and shown on the customer website when active." action={editingOffer ? <button onClick={() => { setEditingOffer(null); setOfferForm(emptyOffer) }}>Cancel edit</button> : null} />
              <form className="admin-form-grid-v6" onSubmit={saveOffer}>
                <label>Offer title<input name="title" value={offerForm.title} onChange={offerChange} required /></label>
                <label>Coupon code<input name="code" value={offerForm.code} onChange={offerChange} /></label>
                <label>Discount type<select name="discountType" value={offerForm.discountType} onChange={offerChange}><option value="PERCENT">Percentage</option><option value="FIXED">Fixed amount</option></select></label>
                <label>Discount value<input type="number" min="0" name="discountValue" value={offerForm.discountValue} onChange={offerChange} /></label>
                <label>Minimum order<input type="number" min="0" name="minOrderAmount" value={offerForm.minOrderAmount} onChange={offerChange} /></label>
                <label>Start date<input type="date" name="startDate" value={offerForm.startDate || ''} onChange={offerChange} /></label>
                <label>End date<input type="date" name="endDate" value={offerForm.endDate || ''} onChange={offerChange} /></label>
                <label className="wide">Description<textarea name="description" value={offerForm.description} onChange={offerChange} rows="4" /></label>
                <div className="admin-toggle-row-v6 wide"><label className="premium-check-v73"><input type="checkbox" name="active" checked={offerForm.active} onChange={offerChange} /> Publish this offer</label></div>
                <button className="admin-primary-v6" type="submit">{editingOffer ? 'Update offer' : 'Create offer'}</button>
              </form>
            </section>

            <section className="promotion-grid-v6">
              {offers.map(offer => (
                <article className={`promotion-card-v6 glass-card ${!offer.active ? 'inactive' : ''}`} key={offer.id}>
                  <span>{offer.active ? 'LIVE' : 'INACTIVE'}</span>
                  <h3>{offer.title}</h3>
                  <b>{offer.code || 'No coupon code'}</b>
                  <p>{offer.description}</p>
                  <strong>{offer.discountType === 'FIXED' ? `₹${offer.discountValue}` : `${offer.discountValue}%`} OFF</strong>
                  <small>{offer.startDate || 'No start date'} → {offer.endDate || 'No end date'}</small>
                  <div><button onClick={() => editOffer(offer)}>Edit</button><button className="danger" onClick={() => deleteOffer(offer)}>Delete</button></div>
                </article>
              ))}
              {!offers.length && <div className="admin-empty-v6 glass-card">No offers have been created yet.</div>}
            </section>
          </>
        )}
      </main>

      {selectedOrder && (
        <div className="admin-modal-backdrop" onMouseDown={() => setSelectedOrder(null)}>
          <section className="admin-order-modal glass-panel" onMouseDown={event => event.stopPropagation()}>
            <div className="order-modal-head-v6">
              <div><span>ORDER MANAGEMENT</span><h2>#{selectedOrder.orderNumber}</h2><p>{selectedOrder.customerName} · {selectedOrder.customerEmail}</p></div>
              <button onClick={() => setSelectedOrder(null)}>×</button>
            </div>

            <div className="order-modal-summary-v6">
              <div><span>Current status</span><strong className={`status-chip status-${String(selectedOrder.status).toLowerCase()}`}>{statusLabel(selectedOrder.status)}</strong></div>
              <div><span>Order total</span><strong>₹{selectedOrder.total}</strong></div>
              <div><span>Payment</span><strong>{selectedOrder.paymentMethod || '—'} · {selectedOrder.paymentStatus || '—'}</strong></div>
              <div><span>Created</span><strong>{formatDateTime(selectedOrder.createdAt)}</strong></div>
            </div>

            <div className="order-modal-items-v6">
              <h3>Items</h3>
              {selectedOrder.items?.map(item => (
                <div key={item.bookId}><img src={item.image} alt="" /><span><strong>{item.title}</strong><small>Qty {item.quantity}</small></span><b>₹{item.price * item.quantity}</b></div>
              ))}
            </div>

            <div className="order-modal-actions-v6">
              <h3>Available actions</h3>
              {orderActions.length ? orderActions.map(action => (
                <button key={`${action.action}-${action.status}`} className={`order-action-v6 ${action.tone || ''}`} onClick={() => performOrderAction(action)} disabled={orderActionBusy}>
                  <span><strong>{action.label}</strong><small>{action.description}</small></span>
                </button>
              )) : <div className="admin-empty-v6">No further workflow actions are available for this order.</div>}
            </div>

            <div className="order-modal-history-v6">
              <h3>Status history</h3>
              {(selectedOrder.statusHistory || []).map((event, index) => (
                <div key={`${event.status}-${event.at || index}`}><b>{index + 1}</b><span><strong>{statusLabel(event.status)}</strong><small>{formatDateTime(event.at)}</small><p>{event.note}</p></span></div>
              ))}
            </div>
          </section>
        </div>
      )}

      <PremiumConfirm
        dialog={confirmDialog}
        onClose={() => setConfirmDialog(null)}
      />
    </div>
  )
}

function KpiCard({ label, value, detail, icon }) {
  return <article className="admin-kpi-v6 glass-card"><span>{icon}</span><div><small>{label}</small><strong>{value}</strong><p>{detail}</p></div></article>
}

function StatusCard({ label, value, onClick }) {
  return <button className="admin-status-card-v6 glass-card" onClick={onClick}><span>{label}</span><strong>{value}</strong></button>
}

function PanelTitle({ eyebrow, title, copy, action }) {
  return <div className="admin-panel-title-v6"><div><span>{eyebrow}</span><h2>{title}</h2><p>{copy}</p></div>{action}</div>
}

function OrderTable({ orders, onOpen, detailed = false }) {
  return (
    <div className="admin-table-wrap-v6">
      <table className="admin-table-v6 order-table-v6">
        <thead><tr><th>Order</th><th>Customer</th>{detailed && <th>Items</th>}<th>Date</th><th>Total</th><th>Status</th><th /></tr></thead>
        <tbody>{orders.map(order => (
          <tr key={order.id}>
            <td><strong>#{order.orderNumber}</strong><span>{order.paymentMethod || '—'}</span></td>
            <td><strong>{order.customerName || 'Customer'}</strong><span>{order.customerEmail || order.userId}</span></td>
            {detailed && <td><span>{order.items?.length || 0} item types</span></td>}
            <td>{formatDateTime(order.createdAt)}</td>
            <td><strong>₹{order.total}</strong></td>
            <td><span className={`status-chip status-${String(order.status).toLowerCase()}`}>{statusLabel(order.status)}</span></td>
            <td><button className="manage-order-btn-v6" onClick={() => onOpen(order)}>Manage</button></td>
          </tr>
        ))}</tbody>
      </table>
      {!orders.length && <div className="admin-empty-v6">No orders found for this filter.</div>}
    </div>
  )
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : '—'
}

function formatDateTime(value) {
  return value ? new Date(value).toLocaleString() : '—'
}
