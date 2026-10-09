import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import HomePage from './pages/HomePage'
import ShopPage from './pages/ShopPage'
import BookDetailsPage from './pages/BookDetailsPage'
import WishlistPage from './pages/WishlistPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import OrderConfirmationPage from './pages/OrderConfirmationPage'
import AccountPage from './pages/AccountPage'
import OffersPage from './pages/OffersPage'
import ProfileSettings from './pages/ProfileSettings'
import { AboutPage, ShippingPage, ReturnsPage, FaqPage, TermsPage, PrivacyPage } from './pages/InfoPages'
import TrackOrderPage from './pages/TrackOrderPage'

function PrivatePage({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
      <Route path="/home" element={<PrivatePage><HomePage /></PrivatePage>} />
      <Route path="/shop" element={<PrivatePage><ShopPage /></PrivatePage>} />
      <Route path="/offers" element={<PrivatePage><OffersPage /></PrivatePage>} />
      <Route path="/book/:id" element={<PrivatePage><BookDetailsPage /></PrivatePage>} />
      <Route path="/wishlist" element={<PrivatePage><WishlistPage /></PrivatePage>} />
      <Route path="/cart" element={<PrivatePage><CartPage /></PrivatePage>} />
      <Route path="/checkout" element={<PrivatePage><CheckoutPage /></PrivatePage>} />
      <Route path="/order-confirmation" element={<PrivatePage><OrderConfirmationPage /></PrivatePage>} />
      <Route path="/account" element={<PrivatePage><AccountPage /></PrivatePage>} />
      <Route path="/about" element={<PrivatePage><AboutPage /></PrivatePage>} />
      <Route path="/shipping" element={<PrivatePage><ShippingPage /></PrivatePage>} />
      <Route path="/returns" element={<PrivatePage><ReturnsPage /></PrivatePage>} />
      <Route path="/faq" element={<PrivatePage><FaqPage /></PrivatePage>} />
      <Route path="/track-order" element={<PrivatePage><TrackOrderPage /></PrivatePage>} />
      <Route path="/terms" element={<PrivatePage><TermsPage /></PrivatePage>} />
      <Route path="/privacy" element={<PrivatePage><PrivacyPage /></PrivatePage>} />
      <Route path="*" element={<Navigate to="/login" replace />} />
      <Route
        path="/account/profile"
        element={
          <PrivatePage>
            <ProfileSettings />
          </PrivatePage>
        }
      />
    </Routes>
  )
}
