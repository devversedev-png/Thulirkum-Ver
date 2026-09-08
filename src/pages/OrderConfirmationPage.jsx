import { Link, useLocation } from 'react-router-dom'

const statusLabels = {
  BOOKING_CONFIRMED: 'Booking Confirmed',
  CONFIRMED: 'Confirmed',
  PACKED: 'Packed',
  SHIPPED: 'Shipped',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled'
}

export default function OrderConfirmationPage() {
  const { state } = useLocation()
  const order = state?.order

  return (
    <section className="confirmation-page page-width min-page">
      <div className="confirmation-card">
        <div className="success-icon">✓</div>
        <h1>Thank You!</h1>
        <p>Your order has been placed and the booking is confirmed.</p>
        {order && <div className="order-number">Order No: <strong>#{order.orderNumber}</strong></div>}
        <div className="order-track premium-confirm-track">
          {['BOOKING_CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].map((step, index) => (
            <div className={index === 0 ? 'active' : ''} key={step}><b>{index === 0 ? '✓' : index + 1}</b><span>{statusLabels[step]}</span></div>
          ))}
        </div>
        <div className="confirmation-actions">
          <Link className="primary-btn inline-btn" to="/account">Track My Order</Link>
          <Link className="outline-btn inline-btn" to="/shop">Continue Shopping</Link>
        </div>
      </div>
    </section>
  )
}
