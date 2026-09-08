import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div>
          <img className="footer-logo" src="/logo.png" alt="Thulirkum Ver" />
          <p>A small bookstore. A bigger tomorrow.</p>
        </div>
        <div>
          <h4>Quick Links</h4>
          <Link to="/home">Home</Link>
          <Link to="/shop">Categories</Link>
          <Link to="/wishlist">Wishlist</Link>
          <Link to="/cart">Cart</Link>
        </div>
        <div>
          <h4>Customer Support</h4>
          <span>Dharmapuri - 636705</span>
          <span>thulirkumver@gmail.com</span>
          <span>Shipping & return support</span>
        </div>
        <div>
          <h4>Policies</h4>
          <span>Privacy Policy</span>
          <span>Terms & Conditions</span>
          <span>Refund & Cancellation</span>
          <span>Shipping Policy</span>
        </div>
      </div>
      <div className="footer-bottom">© 2026 Thulirkum Ver Book Store. All rights reserved.</div>
    </footer>
  )
}
