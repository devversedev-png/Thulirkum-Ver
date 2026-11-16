import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Gift,
  History,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react'

import { useWallet } from '../hooks/useWallet'
import { formatWalletAmount, formatWalletDate } from '../utils/wallet'

const FILTERS = [
  { key: 'all', title: 'All activity' },
  { key: 'earned', title: 'Cashback earned' },
  { key: 'reversed', title: 'Reversals' },
  { key: 'spent', title: 'Wallet spent' },
]

function TransactionRow({ transaction }) {
  const isCredit = transaction.amountPaise > 0
  const isReversal = transaction.type === 'CASHBACK_REVERSAL' || transaction.amountPaise < 0
  const title = ({
    CASHBACK_CREDIT: 'Cashback earned',
    CASHBACK_REVERSAL: 'Cashback reversed',
    WALLET_REDEMPTION: 'Wallet used for purchase',
    WALLET_REDEMPTION_REFUND: 'Wallet refunded',
  })[transaction.type] || (isCredit ? 'Wallet credited' : 'Wallet debited')

  return (
    <li className="wallet-transaction-row">
      <div className={`wallet-transaction-symbol ${isCredit ? 'wallet-transaction-symbol--earned' : 'wallet-transaction-symbol--reversed'}`}>
        {isCredit ? <ArrowDownLeft size={20} aria-hidden="true" /> : <ArrowUpRight size={20} aria-hidden="true" />}
      </div>
      <div className="wallet-transaction-main">
        <strong>{title}</strong>
        <span>{formatWalletDate(transaction.createdAt)}</span>
        {transaction.orderId && (
          <small title={transaction.orderId}>Order reference · {transaction.orderId}</small>
        )}
      </div>
      <strong className={`wallet-transaction-amount ${isCredit ? 'wallet-transaction-amount--earned' : 'wallet-transaction-amount--reversed'}`}>
        {isCredit ? '+' : '−'}{formatWalletAmount(Math.abs(transaction.amountPaise))}
      </strong>
    </li>
  )
}

export default function WalletPage() {
  const { wallet, loading, refreshing, error, refresh } = useWallet()
  const [filter, setFilter] = useState('all')
  const [visibleCount, setVisibleCount] = useState(8)

  const transactions = wallet?.transactions || []
  const earnedPaise = transactions.reduce(
    (sum, item) => sum + (item.type === 'CASHBACK_CREDIT' ? Math.max(0, item.amountPaise) : 0),
    0
  )
  const reversedPaise = transactions.reduce(
    (sum, item) => sum + (item.type === 'CASHBACK_REVERSAL' ? Math.max(0, -item.amountPaise) : 0),
    0
  )
  const filtered = useMemo(() => transactions.filter((item) => {
    if (filter === 'earned') return item.type === 'CASHBACK_CREDIT'
    if (filter === 'reversed') return item.type === 'CASHBACK_REVERSAL'
    if (filter === 'spent') return item.type === 'WALLET_REDEMPTION' || item.type === 'WALLET_REDEMPTION_REFUND' 
    return true
  }), [transactions, filter])

  function selectFilter(next) {
    setFilter(next)
    setVisibleCount(8)
  }

  return (
    <main className="wallet-page min-page">
      <div className="page-title-banner wallet-page-banner">
        <div className="page-width wallet-banner-inner">
          <div>
            <div className="breadcrumbs">Home &nbsp;›&nbsp; My Account &nbsp;›&nbsp; My Wallet</div>
            <h1>My Wallet</h1>
            <p>All the little rewards your reading journey has earned.</p>
          </div>
          <Link className="wallet-back-link" to="/account">
            <ArrowLeft size={17} aria-hidden="true" /> My account
          </Link>
        </div>
      </div>

      <div className="page-width wallet-page-content">
        <div className="wallet-summary-layout">
          <section className="wallet-balance-card" aria-label="Available cashback balance">
            <span className="wallet-balance-sheen" aria-hidden="true" />
            <div className="wallet-balance-top">
              <span className="wallet-eyebrow"><Wallet size={17} aria-hidden="true" /> THULIRKUM VER REWARDS</span>
              <span className="wallet-balance-decoration" aria-hidden="true"><Sparkles size={23} /></span>
            </div>
            <div className="wallet-balance-body">
              <p>Available cashback</p>
              <strong aria-live="polite">
                {loading ? 'Loading…' : error ? 'Unavailable' : formatWalletAmount(wallet?.balancePaise ?? 0)}
              </strong>
              <span>Rewards credited on successful, verified book purchases</span>
            </div>
            <div className="wallet-balance-bottom">
              <span><ShieldCheck size={16} aria-hidden="true" /> Secured by your bookstore account</span>
              <button type="button" className="wallet-refresh" disabled={refreshing} onClick={() => void refresh()}>
                <RotateCcw size={15} className={refreshing ? 'wallet-refresh-spinning' : ''} aria-hidden="true" />
                {refreshing ? 'Refreshing' : 'Refresh'}
              </button>
            </div>
          </section>

          <div className="wallet-stats">
            <div className="wallet-stat-card">
              <div className="wallet-stat-icon wallet-stat-icon--earned"><Gift size={20} aria-hidden="true" /></div>
              <span>Total cashback earned</span>
              <strong>{loading ? '—' : error ? 'Unavailable' : formatWalletAmount(earnedPaise)}</strong>
              <small>From completed payments</small>
            </div>
            <div className="wallet-stat-card">
              <div className="wallet-stat-icon wallet-stat-icon--reversed"><History size={20} aria-hidden="true" /></div>
              <span>Cashback reversed</span>
              <strong>{loading ? '—' : error ? 'Unavailable' : formatWalletAmount(reversedPaise)}</strong>
              <small>From cancelled orders</small>
            </div>
          </div>
        </div>

        {error && (
          <div className="wallet-alert" role="alert">
            <div>
              <strong>Wallet could not be loaded</strong>
              <p>{error}</p>
            </div>
            <button type="button" className="outline-btn compact" onClick={() => void refresh()} disabled={refreshing}>Try again</button>
          </div>
        )}

        <section className="wallet-history" aria-label="Cashback transaction history">
          <div className="wallet-history-heading">
            <div>
              <span className="wallet-section-eyebrow"><History size={15} aria-hidden="true" /> YOUR REWARD ACTIVITY</span>
              <h2>Cashback history</h2>
              <p>Cashback earned, redeemed, and refunded—all in one place.</p>
            </div>
            <span className="wallet-history-counter">{!wallet ? '—' : transactions.length} transactions</span>
          </div>

          {wallet && (
            <div className="wallet-filter-tabs" aria-label="Filter wallet history">
              {FILTERS.map(({ key, title }) => (
                <button key={key} type="button" className={filter === key ? 'active' : ''} aria-pressed={filter === key} onClick={() => selectFilter(key)}>
                  {title}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="wallet-empty-state" role="status"><RotateCcw size={26} className="wallet-refresh-spinning" aria-hidden="true" /><h3>Loading your wallet</h3><p>Getting your latest balance and rewards.</p></div>
          ) : error ? (
            <div className="wallet-empty-state"><Wallet size={30} aria-hidden="true" /><h3>History unavailable</h3><p>Try again to view your cashback activity.</p></div>
          ) : filtered.length ? (
            <>
              <ul className="wallet-transaction-list">
                {filtered.slice(0, visibleCount).map((item) => (
                  <TransactionRow key={item.id || item.referenceKey} transaction={item} />
                ))}
              </ul>
              {visibleCount < filtered.length && (
                <button type="button" className="wallet-show-more" onClick={() => setVisibleCount((count) => count + 8)}>
                  Show more transactions <ArrowRight size={16} aria-hidden="true" />
                </button>
              )}
            </>
          ) : (
            <div className="wallet-empty-state">
              <BookOpen size={32} aria-hidden="true" />
              <h3>{filter === 'all' ? 'Your rewards story starts here' : 'No transactions in this category'}</h3>
              <p>{filter === 'all' ? 'When an eligible online payment is verified, its cashback will appear here.' : 'Try another filter to explore your wallet activity.'}</p>
              {filter === 'all' && <Link to="/shop" className="primary-btn inline-btn">Explore books <ArrowRight size={16} aria-hidden="true" /></Link>}
            </div>
          )}
        </section>

        <div className="wallet-footnote"><ShieldCheck size={19} aria-hidden="true" /><p>Use earned cashback for your next eligible bookstore purchase by checking Use Wallet at checkout. Cashback is credited only on the Razorpay-paid portion of an eligible order. Cash withdrawals and transfers are not available.</p></div>
      </div>
    </main>
  )
}
