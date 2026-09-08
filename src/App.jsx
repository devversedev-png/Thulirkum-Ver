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
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
