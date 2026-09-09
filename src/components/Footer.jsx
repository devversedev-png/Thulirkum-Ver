import { Link } from 'react-router-dom'

export default function Footer() {
  const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL || ''
  const year = new Date().getFullYear()

  return (
    <footer className="footer market-footer footer-v6">
      <div className="market-footer-top"><a href="#top">Back to top ↑</a></div>
      <div className="footer-grid market-footer-grid">
        <div>
          <img className="footer-logo" src="/logo.png" alt="Thulirkum Ver" />
          <p>Books that grow ideas, roots that shape generations.</p>
          <div className="market-footer-badges"><span>✓ Genuine catalogue</span><span>🔒 Secure orders</span></div>
        </div>
        <div>
          <h4>Explore</h4>
          <Link to="/home">Home</Link>
          <Link to="/shop">All Books</Link>
          <Link to="/shop?sort=new">New Arrivals</Link>
          <Link to="/offers">Offers</Link>
        </div>
        <div>
          <h4>Your Account</h4>
          <Link to="/account">My Account</Link>
          <Link to="/account#orders">My Orders</Link>
          <Link to="/wishlist">Wishlist</Link>
          <Link to="/cart">Cart</Link>
        </div>
        <div>
          <h4>Support</h4>
          <Link to="/account">Order tracking</Link>
          <Link to="/account">Saved addresses</Link>
          {supportEmail && <a href={`mailto:${supportEmail}`}>{supportEmail}</a>}
        </div>
      </div>
      <div className="footer-bottom market-footer-bottom">© {year} Thulirkum Ver Book Store.</div>
    </footer>
  )
}
