import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import './AmazonOrdersPanel.css'

const STATUS_FILTERS = [
  ['ALL', 'All'],
  ['UNSHIPPED', 'Needs shipping'],
  ['PENDING', 'Pending'],
  ['PARTIALLY_SHIPPED', 'Partly shipped'],
  ['SHIPPED', 'Shipped'],
  ['CANCELLED', 'Cancelled'],
]

function formatWhen(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function money(amount, currency) {
  const symbol = !currency || currency === 'INR' ? '₹' : `${currency} `
  return `${symbol}${Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

function prettyStatus(status) {
  return (status || 'UNKNOWN').replace(/_/g, ' ').toLowerCase()
}

export default function AmazonOrdersPanel() {
  const [status, setStatus] = useState(null)
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState('')
  const [openId, setOpenId] = useState(null)

  const loadOrders = useCallback(async () => {
    const params = new URLSearchParams()
    if (filter !== 'ALL') params.set('status', filter)
    if (search.trim()) params.set('q', search.trim())
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    const query = params.toString()
    return api(`/admin/amazon/orders${query ? `?${query}` : ''}`)
  }, [filter, search, from, to])

  const refresh = useCallback(async () => {
    setError('')
    try {
      const [state, list] = await Promise.all([api('/admin/amazon/status'), loadOrders()])
      setStatus(state)
      setOrders(Array.isArray(list) ? list : [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [loadOrders])

  // Re-query shortly after the filters change (search box would otherwise fire per keystroke).
  useEffect(() => {
    const timer = setTimeout(refresh, 250)
    return () => clearTimeout(timer)
  }, [refresh])

  async function syncNow() {
    setSyncing(true)
    setError('')
    try {
      setStatus(await api('/admin/amazon/sync', { method: 'POST' }))
      setOrders(await loadOrders())
    } catch (err) {
      setError(err.message)
    } finally {
      setSyncing(false)
    }
  }

  const needsShipping = useMemo(
    () => orders.filter((order) => (order.fulfillmentStatus || '').toUpperCase() === 'UNSHIPPED').length,
    [orders]
  )

  if (status && !status.configured) {
    return (
      <section className="admin-panel-v6 amz-panel">
        <h2>Amazon seller account</h2>
        <p className="amz-muted">
          The Amazon connection is not set up on the server yet. Add these environment variables to the
          backend and redeploy: <code>AMAZON_ENABLED=true</code>, <code>AMAZON_LWA_CLIENT_ID</code>,{' '}
          <code>AMAZON_LWA_CLIENT_SECRET</code> and <code>AMAZON_REFRESH_TOKEN</code>.
        </p>
      </section>
    )
  }

  return (
    <section className="admin-panel-v6 amz-panel">
      <div className="amz-head">
        <div>
          <span className="amz-kicker">AMAZON SELLER CENTRAL</span>
          <h2>Amazon orders</h2>
          <p className="amz-muted">
            Orders from your Amazon.in seller account, synced automatically every few minutes.
          </p>
        </div>
        <button className="admin-primary-v6" onClick={syncNow} disabled={syncing}>
          {syncing ? 'Syncing…' : 'Sync now'}
        </button>
      </div>

      {status && (
        <div className="amz-stats">
          <div><span>Last synced</span><strong>{formatWhen(status.lastSuccessfulSync)}</strong></div>
          <div><span>Orders stored</span><strong>{status.totalOrders ?? 0}</strong></div>
          <div><span>Needs shipping</span><strong>{needsShipping}</strong></div>
        </div>
      )}

      {status?.lastError && <div className="form-error">{status.lastError}</div>}
      {error && <div className="form-error">{error}</div>}

      <div className="amz-filters">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search order ID, buyer, phone, city or book…"
        />
        <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} aria-label="From date" />
        <input type="date" value={to} onChange={(event) => setTo(event.target.value)} aria-label="To date" />
      </div>

      <div className="amz-chips">
        {STATUS_FILTERS.map(([key, label]) => (
          <button
            key={key}
            className={filter === key ? 'active' : ''}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="amz-muted">Loading Amazon orders…</p>
      ) : orders.length === 0 ? (
        <p className="amz-muted">No Amazon orders match these filters yet.</p>
      ) : (
        <div className="amz-list">
          {orders.map((order) => {
            const open = openId === order.id
            return (
              <article className="amz-order" key={order.id}>
                <button className="amz-order-row" onClick={() => setOpenId(open ? null : order.id)}>
                  <div>
                    <strong>{order.amazonOrderId}</strong>
                    <small>{formatWhen(order.createdTime)}</small>
                  </div>
                  <div>
                    <span>{order.recipientName || order.buyerName || 'Buyer details hidden'}</span>
                    <small>{[order.city, order.state].filter(Boolean).join(', ') || '—'}</small>
                  </div>
                  <div>
                    <span>{order.items?.length || 0} item(s)</span>
                    <small>{money(order.itemsTotal, order.currency)}</small>
                  </div>
                  <span className={`amz-badge amz-${(order.fulfillmentStatus || 'unknown').toLowerCase()}`}>
                    {prettyStatus(order.fulfillmentStatus)}
                  </span>
                </button>

                {open && (
                  <div className="amz-detail">
                    <div>
                      <h4>Deliver to</h4>
                      <p>
                        {order.recipientName || '—'}<br />
                        {[order.addressLine1, order.addressLine2].filter(Boolean).join(', ') || 'Address not available'}<br />
                        {[order.city, order.state, order.postalCode].filter(Boolean).join(', ')}
                      </p>
                      <p>
                        Phone: {order.phone || '—'}<br />
                        Buyer: {order.buyerName || '—'}
                        {order.buyerEmail ? ` (${order.buyerEmail})` : ''}
                      </p>
                      <p className="amz-muted">
                        Fulfilled by {(order.fulfilledBy || '—').toLowerCase()} · {order.marketplaceName || 'Amazon'}
                      </p>
                    </div>
                    <div>
                      <h4>Items</h4>
                      <ul>
                        {(order.items || []).map((item) => (
                          <li key={item.orderItemId || item.asin}>
                            <span>{item.title || item.asin || 'Item'} × {item.quantity}</span>
                            <b>{money(item.lineTotal, order.currency)}</b>
                          </li>
                        ))}
                      </ul>
                      <p className="amz-muted">Items value only; shipping and fees are not included.</p>
                    </div>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
