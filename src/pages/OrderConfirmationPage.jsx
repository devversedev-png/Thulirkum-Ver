import { Link, useLocation } from 'react-router-dom'

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
