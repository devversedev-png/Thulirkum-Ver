import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="footer market-footer">
      <div className="market-footer-top"><a href="#top">Back to top ↑</a></div>
      <div className="footer-grid market-footer-grid">
        <div>
          <img className="footer-logo" src="/logo.png" alt="Thulirkum Ver" />
          <p>Books that grow ideas, roots that shape generations.</p>
          <div className="market-footer-badges"><span>✓ Genuine Books</span><span>🔒 Secure Orders</span></div>
        </div>
        <div>
          <h4>Shop</h4>
          <Link to="/shop">All Books</Link>
          <Link to="/shop?sort=new">New Arrivals</Link>
          <Link to="/shop?sort=rating">Bestsellers</Link>
          <Link to="/offers">Offers</Link>
        </div>
        <div>
          <h4>Your Account</h4>
          <Link to="/account">My Account</Link>
          <Link to="/account">My Orders</Link>
          <Link to="/wishlist">Wishlist</Link>
          <Link to="/cart">Cart</Link>
        </div>
        <div>
          <h4>Customer Support</h4>
          <span>Dharmapuri - 636705</span>
          <span>thulirkumver@gmail.com</span>
          <span>Shipping & order tracking support</span>
          <span>Refund & cancellation assistance</span>
        </div>
      </div>
      <div className="footer-bottom market-footer-bottom">© 2026 Thulirkum Ver Book Store · Built for simple, trusted book shopping.</div>
    </footer>
  )
}
