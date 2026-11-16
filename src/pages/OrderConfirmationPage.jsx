import { Link, useLocation } from 'react-router-dom'
import { formatWalletAmount } from '../utils/wallet'

export default function OrderConfirmationPage() {
  const { state } = useLocation()
  const order = state?.order

  return (
    <section className="confirmation-page page-width min-page">
      <div className="confirmation-card">
        <div className="success-icon">✓</div>
        <span className="eyebrow">ORDER CONFIRMED</span>
        <h1>Order Placed Successfully!</h1>
        <p>Thank you for your purchase. Your order has been confirmed and will be prepared soon.</p>
        {order && (
          <div className="confirmation-order-box">
            <span>Order</span><strong>#{order.orderNumber}</strong>
            <small>{order.estimatedDeliveryDate ? `Estimated delivery: ${new Date(order.estimatedDeliveryDate).toLocaleDateString()}` : 'You can follow every status update from My Account.'}</small>
          </div>
        )}
        {Number(order?.bogoDiscountPaise) > 0 && (
          <div className="confirmation-cashback-note">
            <strong>🎁 {formatWalletAmount(order.bogoDiscountPaise)} saved with free-book offers</strong>
            <span>{(order.items || []).filter(item => item.bogoFreeQuantity > 0).map(item => `${item.title} × ${item.bogoFreeQuantity}`).join(', ')} included FREE in your order.</span>
          </div>
        )}
        {order?.paymentStatus === 'PAID' && Number(order.walletRedeemedPaise) > 0 && (
          <div className="confirmation-wallet-spent">
            <strong>{formatWalletAmount(order.walletRedeemedPaise)} redeemed from My Wallet</strong>
            <span>{Number(order.razorpayPaidPaise) > 0 ? `${formatWalletAmount(order.razorpayPaidPaise)} paid online` : 'No additional payment was needed.'}</span>
          </div>
        )}
        {order?.paymentStatus === 'PAID' && Number(order.cashbackEarnedPaise) > 0 && !order.cashbackReversed && (
          <div className="confirmation-cashback-note">
            <div>
              <strong>{formatWalletAmount(order.cashbackEarnedPaise)} cashback earned!</strong>
              <span>Added to your Thulirkum Ver wallet.</span>
            </div>
            <Link to="/wallet">View wallet</Link>
          </div>
        )}
        <div className="order-track premium-confirm-track">
          {['Confirmed', 'Packed', 'Shipped', 'Delivered'].map((step, index) => (
            <div className={index === 0 ? 'active' : ''} key={step}><b>{index === 0 ? '✓' : index + 1}</b><span>{step}</span></div>
          ))}
        </div>
        <div className="confirmation-actions"><Link className="primary-btn inline-btn" to="/account#orders">Track Order</Link><Link className="outline-btn inline-btn" to="/shop">Continue Shopping</Link></div>
      </div>
    </section>
  )
}
