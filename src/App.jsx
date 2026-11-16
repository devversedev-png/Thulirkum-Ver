import { lazy, Suspense } from 'react'
import AndroidBackHandler from './components/AndroidBackHandler'

import { Navigate, Route, Routes } from 'react-router-dom'

import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import Layout from './components/Layout'

import LoginPage from './pages/LoginPage'
import AdminLoginPage from './pages/AdminLoginPage'
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'))

const HomePage = lazy(() => import('./pages/HomePage'))
const ShopPage = lazy(() => import('./pages/ShopPage'))
const BookDetailsPage = lazy(() => import('./pages/BookDetailsPage'))
const WishlistPage = lazy(() => import('./pages/WishlistPage'))
const CartPage = lazy(() => import('./pages/CartPage'))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'))
const OrderConfirmationPage = lazy(() => import('./pages/OrderConfirmationPage'))
const AccountPage = lazy(() => import('./pages/AccountPage'))
const WalletPage = lazy(() => import('./pages/WalletPage'))
const OffersPage = lazy(() => import('./pages/OffersPage'))
const ProfileSettings = lazy(() => import('./pages/ProfileSettings'))

import {
  AboutPage,
  ShippingPage,
  ReturnsPage,
  FaqPage,
  TermsPage,
  PrivacyPage
} from './pages/InfoPages'

const TrackOrderPage = lazy(() => import('./pages/TrackOrderPage'))

const isAdminApp = import.meta.env.MODE === 'admin'
const isDevelopment = import.meta.env.DEV

function PrivatePage({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  )
}

export default function App() {
  return <Suspense fallback={<div className="tv-route-loading" role="status" aria-live="polite"><span className="tv-route-loading-spinner" />Loading page…</div>}><AppRoutes /></Suspense>
}

function AppRoutes() {
  if (isAdminApp) {
    return (
      <>
      <AndroidBackHandler />
      <Routes>
        <Route
          path="/"
          element={<Navigate to="/admin/login" replace />}
        />

        <Route
          path="/admin/login"
          element={<AdminLoginPage />}
        />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboardPage />
            </AdminRoute>
          }
        />

        <Route
          path="*"
          element={<Navigate to="/admin/login" replace />}
        />
      </Routes>
      </>
    )
  }

  return (
    <>
    <AndroidBackHandler />
    <Routes>
      <Route
        path="/"
        element={<Navigate to="/home" replace />}
      />

      <Route path="/login" element={<LoginPage />} />

      {/* Allow both portals on the local Vite development server only.
          Production User and Admin APK builds remain separate. */}
      {isDevelopment && (
        <>
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
        </>
      )}

      <Route path="/home" element={<PrivatePage><HomePage /></PrivatePage>} />
      <Route path="/shop" element={<PrivatePage><ShopPage /></PrivatePage>} />
      <Route path="/offers" element={<PrivatePage><OffersPage /></PrivatePage>} />
      <Route path="/book/:id" element={<PrivatePage><BookDetailsPage /></PrivatePage>} />
      <Route path="/wishlist" element={<PrivatePage><WishlistPage /></PrivatePage>} />
      <Route path="/cart" element={<PrivatePage><CartPage /></PrivatePage>} />
      <Route path="/checkout" element={<PrivatePage><CheckoutPage /></PrivatePage>} />

      <Route
        path="/order-confirmation"
        element={<PrivatePage><OrderConfirmationPage /></PrivatePage>}
      />

      <Route path="/account" element={<PrivatePage><AccountPage /></PrivatePage>} />
      <Route path="/wallet" element={<PrivatePage><WalletPage /></PrivatePage>} />
      <Route path="/account/profile" element={<PrivatePage><ProfileSettings /></PrivatePage>} />

      <Route path="/about" element={<PrivatePage><AboutPage /></PrivatePage>} />
      <Route path="/shipping" element={<PrivatePage><ShippingPage /></PrivatePage>} />
      <Route path="/returns" element={<PrivatePage><ReturnsPage /></PrivatePage>} />
      <Route path="/faq" element={<PrivatePage><FaqPage /></PrivatePage>} />
      <Route path="/track-order" element={<PrivatePage><TrackOrderPage /></PrivatePage>} />
      <Route path="/terms" element={<PrivatePage><TermsPage /></PrivatePage>} />
      <Route path="/privacy" element={<PrivatePage><PrivacyPage /></PrivatePage>} />

      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />
    </Routes>
    </>
  )
}
