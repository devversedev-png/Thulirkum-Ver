import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { StoreProvider } from './context/StoreContext'
import './styles.css'
import './pages/WalletPage.css'
import { initDesktopFit } from './utils/desktopFit'
import { installAppFreshness } from './utils/appFreshness'

// Keep the desktop layout identical while zooming (see utils/desktopFit.js)
initDesktopFit()
void installAppFreshness()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <StoreProvider>
          <App />
        </StoreProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
