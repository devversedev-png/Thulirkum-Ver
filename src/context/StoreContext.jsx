import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import { useAuth } from './AuthContext'

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const { user } = useAuth()
  const [books, setBooks] = useState([])
  const [offers, setOffers] = useState([])
  const [account, setAccount] = useState(null)
  const [loading, setLoading] = useState(true)
  const [backendReady, setBackendReady] = useState(true)

  useEffect(() => {
    loadBooks()
    loadOffers()
  }, [])

  useEffect(() => {
    if (user && user.role !== 'ADMIN') loadAccount()
    else setAccount(null)
  }, [user])

  async function loadBooks(silent = false) {
    if (!silent) setLoading(true)
    try {
      const data = await api('/books')
      setBooks(data)
      setBackendReady(true)
    } catch {
      setBooks([])
      setBackendReady(false)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  async function loadOffers() {
    try {
      setOffers(await api('/offers/active'))
    } catch {
      setOffers([])
    }
  }

  async function loadAccount() {
    try {
      const data = await api('/account')
      setAccount(data)
      setBackendReady(true)
    } catch {
      setAccount({ wishlist: [], cart: [], addresses: [] })
    }
  }

  async function addToCart(bookId, quantity = 1) {
    const data = await api('/account/cart', { method: 'POST', body: JSON.stringify({ bookId, quantity }) })
    setAccount(data)
    await loadBooks(true)
    return data
  }

  async function updateCart(bookId, quantity) {
    const data = await api(`/account/cart/${bookId}`, { method: 'PUT', body: JSON.stringify({ quantity }) })
    setAccount(data)
    await loadBooks(true)
    return data
  }

  async function removeFromCart(bookId) {
    const data = await api(`/account/cart/${bookId}`, { method: 'DELETE' })
    setAccount(data)
    await loadBooks(true)
    return data
  }

  async function toggleWishlist(bookId) {
    const selected = account?.wishlist?.includes(bookId)
    const data = await api(`/account/wishlist/${bookId}`, { method: selected ? 'DELETE' : 'POST' })
    setAccount(data)
  }

  async function placeOrder(payload) {
    const order = await api('/orders', { method: 'POST', body: JSON.stringify(payload) })
    await Promise.all([loadAccount(), loadBooks(true)])
    return order
  }

  async function getOrders() { return api('/orders') }
  async function getOrder(id) { return api(`/orders/${id}`) }
  function getBook(id) { return books.find(book => book.id === id) }

  function cartRows() {
    if (!account?.cart) return []
    return account.cart.map(item => ({ ...item, book: getBook(item.bookId) })).filter(item => item.book)
  }

  const value = useMemo(() => ({
    books, offers, account, loading, backendReady,
    loadBooks, loadOffers, loadAccount, getBook, cartRows,
    addToCart, updateCart, removeFromCart, toggleWishlist,
    placeOrder, getOrders, getOrder
  }), [books, offers, account, loading, backendReady])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  return useContext(StoreContext)
}
