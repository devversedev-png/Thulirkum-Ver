import { Link } from 'react-router-dom'

export default function Footer() {
  const supportEmail =
    import.meta.env.VITE_SUPPORT_EMAIL || ''

  const year = new Date().getFullYear()

  return (
    <footer className="footer market-footer">
      <div className="footer-grid market-footer-grid page-width">
        {/* Brand */}
        <div className="footer-brand-block">
          <img
            className="footer-logo"
            src="/logo.png"
            alt="Thulirkum Ver"
          />

          <p>
            Books that take roots, readers that shape generations.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4>Quick Links</h4>

          <Link to="/about">About Us</Link>
          <Link to="/shop">All Books</Link>
          <Link to="/shipping">Shipping & Delivery</Link>
          <Link to="/returns">Returns & Refunds</Link>
        </div>

        {/* Account */}
        <div>
          <h4>Your Account</h4>

          <Link to="/account">My Account</Link>
          <Link to="/account#orders">My Orders</Link>
          <Link to="/wishlist">Wishlist</Link>
          <Link to="/cart">Cart</Link>
        </div>

        {/* Support */}
        <div>
          <h4>Support</h4>

          <Link to="/faq">FAQs</Link>
          <Link to="/track-order">Order Tracking</Link>
          <Link to="/account#address">
            Saved Addresses
          </Link>

          {supportEmail && (
            <a href={`mailto:${supportEmail}`}>
              {supportEmail}
            </a>
          )}
        </div>

        {/* Social Links */}
        <div>
          <h4>Follow Us</h4>

          <div className="footer-socials">
            <span>f</span>
            <span>◎</span>
            <span>▶</span>
            <span>𝕏</span>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="footer-bottom market-footer-bottom">
        <div className="page-width">
          <span>
            © {year} Thulirkum Ver Book Store.
            All rights reserved.
          </span>

          <span>
            <Link to="/terms">Terms & Conditions</Link>
            &nbsp; | &nbsp;
            <Link to="/privacy">Privacy Policy</Link>
            &nbsp; | &nbsp;
            Read · Learn · Grow
          </span>
        </div>
      </div>
    </footer>
  )
}

