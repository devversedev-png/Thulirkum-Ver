import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { api } from '../api/client'
import { useAuth } from './AuthContext'

import {
  demoAuthors,
  demoBooks,
  demoOffers,
  decorateAuthors,
  decorateBooks,
} from '../data/siteCatalog'

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const { user } = useAuth()

  const [books, setBooks] = useState([])
  const [offers, setOffers] = useState([])
  const [authors, setAuthors] = useState([])
  const [account, setAccount] = useState(null)

  const [loading, setLoading] = useState(true)
  const [backendReady, setBackendReady] = useState(true)

  useEffect(() => {
    loadBooks()
    loadOffers()
    loadAuthors()
  }, [])

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      loadAccount()
    } else {
      setAccount(null)
    }
  }, [user])

  async function loadBooks(silent = false) {
    if (!silent) {
      setLoading(true)
    }

    try {
      const data = await api('/books')

      setBooks(decorateBooks(data))
      setBackendReady(true)
    } catch {
      setBooks(demoBooks)
      setBackendReady(false)
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }

  async function loadOffers() {
    try {
      const data = await api('/offers/active')

      setOffers(data)
    } catch {
      setOffers(demoOffers)
    }
  }

  async function loadAuthors() {
    try {
      const data = await api('/authors')

      setAuthors(decorateAuthors(data))
    } catch {
      setAuthors(demoAuthors)
    }
  }

  async function loadAccount() {
    try {
      const data = await api('/account')

      setAccount(data)
      setBackendReady(true)
    } catch {
      setAccount({
        wishlist: [],
        cart: [],
        addresses: [],
      })
    }
  }

  async function addToCart(bookId, quantity = 1) {
    const data = await api('/account/cart', {
      method: 'POST',
      body: JSON.stringify({
        bookId,
        quantity,
      }),
    })

    setAccount(data)

    await loadBooks(true)

    return data
  }

  async function updateCart(bookId, quantity) {
    const data = await api(
      `/account/cart/${bookId}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          quantity,
        }),
      }
    )

    setAccount(data)

    await loadBooks(true)

    return data
  }

  async function removeFromCart(bookId) {
    const data = await api(
      `/account/cart/${bookId}`,
      {
        method: 'DELETE',
      }
    )

    setAccount(data)

    await loadBooks(true)

    return data
  }

  async function toggleWishlist(bookId) {
    const selected =
      account?.wishlist?.includes(bookId)

    const data = await api(
      `/account/wishlist/${bookId}`,
      {
        method: selected
          ? 'DELETE'
          : 'POST',
      }
    )

    setAccount(data)
  }

  async function addAddress(address) {
    const data = await api(
      '/account/addresses',
      {
        method: 'POST',
        body: JSON.stringify(address),
      }
    )

    setAccount(data)

    return data
  }

  async function updateAddress(
    addressId,
    address
  ) {
    const data = await api(
      `/account/addresses/${addressId}`,
      {
        method: 'PUT',
        body: JSON.stringify(address),
      }
    )

    setAccount(data)

    return data
  }

  async function deleteAddress(addressId) {
    const data = await api(
      `/account/addresses/${addressId}`,
      {
        method: 'DELETE',
      }
    )

    setAccount(data)

    return data
  }

  async function setDefaultAddress(addressId) {
    const data = await api(
      `/account/addresses/${addressId}/default`,
      {
        method: 'PUT',
      }
    )

    setAccount(data)

    return data
  }

  async function placeOrder(payload) {
    const order = await api('/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    await Promise.all([
      loadAccount(),
      loadBooks(true),
    ])

    return order
  }

  async function getOrders() {
    return api('/orders')
  }

  async function getOrder(id) {
    return api(`/orders/${id}`)
  }

  function getBook(id) {
    return books.find(
      (book) => book.id === id
    )
  }

  function cartRows() {
    if (!account?.cart) {
      return []
    }

    return account.cart
      .map((item) => ({
        ...item,
        book: getBook(item.bookId),
      }))
      .filter((item) => item.book)
  }

  const value = useMemo(
    () => ({
      books,
      offers,
      authors,
      account,
      loading,
      backendReady,

      loadBooks,
      loadOffers,
      loadAuthors,
      loadAccount,

      getBook,
      cartRows,

      addToCart,
      updateCart,
      removeFromCart,
      toggleWishlist,

      addAddress,
      updateAddress,
      deleteAddress,
      setDefaultAddress,

      placeOrder,
      getOrders,
      getOrder,
    }),
    [
      books,
      offers,
      authors,
      account,
      loading,
      backendReady,
    ]
  )

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  return useContext(StoreContext)
}

