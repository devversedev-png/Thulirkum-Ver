import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { api } from '../api/client'
import { useAuth } from './AuthContext'

import {
  decorateAuthors,
  decorateBooks,
} from '../data/siteCatalog'

const StoreContext = createContext(null)

const CACHE_VERSION = 'v3'
const PUBLIC_CACHE_KEYS = {
  books: `tvb_cache_${CACHE_VERSION}_books`,
  offers: `tvb_cache_${CACHE_VERSION}_offers`,
  authors: `tvb_cache_${CACHE_VERSION}_authors`,
  homeSections: `tvb_cache_${CACHE_VERSION}_home_sections`,
  homeSettings: `tvb_cache_${CACHE_VERSION}_home_settings`,
}

function readCache(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback

    const parsed = JSON.parse(raw)
    return parsed?.data ?? fallback
  } catch {
    return fallback
  }
}

function writeCache(key, data) {
  try {
    localStorage.setItem(
      key,
      JSON.stringify({
        savedAt: Date.now(),
        data,
      })
    )
  } catch {
    // Cache is only an acceleration layer. Never break the store if
    // browser storage is full, blocked, or unavailable.
  }
}

function accountCacheKey(user) {
  const identity = user?.id || user?.email
  return identity
    ? `tvb_cache_${CACHE_VERSION}_account_${identity}`
    : ''
}

function readAccountCache(user) {
  const key = accountCacheKey(user)
  return key
    ? readCache(key, null)
    : null
}

function writeAccountCache(user, data) {
  const key = accountCacheKey(user)
  if (key && data) writeCache(key, data)
}

function normalizeAccount(data) {
  if (!data) return null

  return {
    ...data,
    wishlist: Array.isArray(data.wishlist) ? data.wishlist : [],
    cart: Array.isArray(data.cart) ? data.cart : [],
    addresses: Array.isArray(data.addresses) ? data.addresses : [],
  }
}

function updateCartInAccount(account, bookId, quantity) {
  const current = normalizeAccount(account) || {
    wishlist: [],
    cart: [],
    addresses: [],
  }

  const cart = [...current.cart]
  const index = cart.findIndex(item => item.bookId === bookId)

  if (quantity <= 0) {
    if (index >= 0) cart.splice(index, 1)
  } else if (index >= 0) {
    cart[index] = {
      ...cart[index],
      quantity,
    }
  } else {
    cart.push({
      bookId,
      quantity,
      stockReserved: false,
    })
  }

  return {
    ...current,
    cart,
  }
}

export function StoreProvider({ children }) {
  const { user } = useAuth()

  // Hydrate public catalogue data synchronously from the browser cache.
  // This prevents the home/shop pages from becoming empty while Render wakes up.
  const [books, setBooks] = useState(() =>
    decorateBooks(readCache(PUBLIC_CACHE_KEYS.books, []))
  )
  const [offers, setOffers] = useState(() =>
    readCache(PUBLIC_CACHE_KEYS.offers, [])
  )
  const [authors, setAuthors] = useState(() =>
    decorateAuthors(readCache(PUBLIC_CACHE_KEYS.authors, []))
  )
  const [homeSections, setHomeSections] = useState(() =>
    readCache(PUBLIC_CACHE_KEYS.homeSections, [])
  )
  const [homeSettings, setHomeSettings] = useState(() =>
    readCache(PUBLIC_CACHE_KEYS.homeSettings, {
      bannerUrls: [],
      activeBannerIndex: 0,
    })
  )

  // Hydrate the signed-in user's cart/wishlist/addresses immediately as well.
  const [account, setAccount] = useState(() =>
    user && user.role !== 'ADMIN'
      ? normalizeAccount(readAccountCache(user))
      : null
  )

  const [loading, setLoading] = useState(() => books.length === 0)
  const [backendReady, setBackendReady] = useState(true)

  // Cart/wishlist mutations are queued so rapid clicks cannot make responses
  // arrive out of order and overwrite a newer optimistic state.
  const mutationQueue = useRef(Promise.resolve())
  const publicBootstrapRef = useRef(false)
  const accountLoadIdentityRef = useRef('')

  useEffect(() => {
    if (publicBootstrapRef.current) return
    publicBootstrapRef.current = true
    // All public requests start together. Cached data is already visible,
    // so these requests only refresh it in the background.
    Promise.all([
      loadBooks(true),
      loadOffers(true),
      loadAuthors(true),
      loadHomeSections(true),
      loadHomeSettings(true),
    ]).catch(() => {})
  }, [])

  useEffect(() => {
    const identity = user && user.role !== 'ADMIN'
      ? `${user.id || ''}:${user.email || ''}`
      : 'ANONYMOUS'

    if (accountLoadIdentityRef.current === identity) return
    accountLoadIdentityRef.current = identity

    if (user && user.role !== 'ADMIN') {
      const cached = normalizeAccount(readAccountCache(user))

      // Show cached account state immediately after login/refresh.
      setAccount(cached)
      void loadAccount(true)
    } else {
      setAccount(null)
    }
  }, [user?.id, user?.email, user?.role])

  async function loadBooks(silent = false) {
    if (!silent && books.length === 0) {
      setLoading(true)
    }

    try {
      const data = await api('/books')
      const decorated = decorateBooks(Array.isArray(data) ? data : [])

      setBooks(decorated)
      writeCache(PUBLIC_CACHE_KEYS.books, Array.isArray(data) ? data : [])
      setBackendReady(true)

      return decorated
    } catch (error) {
      // Keep the last known catalogue. A temporary Render/network failure
      // must never replace visible books with an empty array.
      if (books.length === 0) setBackendReady(false)
      throw error
    } finally {
      if (!silent || books.length === 0) setLoading(false)
    }
  }

  async function loadOffers(silent = false) {
    try {
      const data = await api('/offers/active')
      const next = Array.isArray(data) ? data : []
      setOffers(next)
      writeCache(PUBLIC_CACHE_KEYS.offers, next)
      return next
    } catch (error) {
      if (!silent) throw error
      return offers
    }
  }

  async function loadAuthors(silent = false) {
    try {
      const data = await api('/authors')
      const raw = Array.isArray(data) ? data : []
      const decorated = decorateAuthors(raw)

      setAuthors(decorated)
      writeCache(PUBLIC_CACHE_KEYS.authors, raw)
      return decorated
    } catch (error) {
      if (!silent) throw error
      return authors
    }
  }

  async function loadHomeSections(silent = false) {
    try {
      const data = await api('/home-sections')
      const next = Array.isArray(data) ? data : []

      setHomeSections(next)
      writeCache(PUBLIC_CACHE_KEYS.homeSections, next)
      return next
    } catch (error) {
      if (!silent) throw error
      return homeSections
    }
  }

  async function loadHomeSettings(silent = false) {
    try {
      const data = await api('/home-settings')
      const next = {
        bannerUrls: Array.isArray(data?.bannerUrls) ? data.bannerUrls : [],
        activeBannerIndex: Number(data?.activeBannerIndex || 0),
      }

      setHomeSettings(next)
      writeCache(PUBLIC_CACHE_KEYS.homeSettings, next)
      return next
    } catch (error) {
      if (!silent) throw error
      return homeSettings
    }
  }

  async function loadAccount(silent = false) {
    if (!user || user.role === 'ADMIN') return null

    try {
      const data = normalizeAccount(await api('/account'))
      setAccount(data)
      writeAccountCache(user, data)
      setBackendReady(true)
      return data
    } catch (error) {
      // Keep cached cart/wishlist/addresses visible during a temporary outage.
      if (!account) setAccount(null)
      if (!silent) throw error
      return account
    }
  }

  function queueMutation(work) {
    const run = mutationQueue.current.then(work, work)

    // Keep the queue alive after an error so the next click can still run.
    mutationQueue.current = run.catch(() => undefined)
    return run
  }

  async function addToCart(bookId, quantity = 1) {
    const previous = normalizeAccount(account)
    const optimistic = updateCartInAccount(account, bookId, quantity)

    setAccount(optimistic)
    writeAccountCache(user, optimistic)

    return queueMutation(async () => {
      try {
        const data = normalizeAccount(await api('/account/cart', {
          method: 'POST',
          body: JSON.stringify({ bookId, quantity }),
        }))

        setAccount(data)
        writeAccountCache(user, data)

        // Stock/catalogue refresh is deliberately background-only.
        void loadBooks(true).catch(() => {})

        return data
      } catch (error) {
        setAccount(current => {
          const currentCart = current?.cart || []
          const optimisticCart = optimistic?.cart || []
          const changedByThisMutation = JSON.stringify(currentCart) === JSON.stringify(optimisticCart)
          return changedByThisMutation ? previous : current
        })
        writeAccountCache(user, previous)
        throw error
      }
    })
  }

  async function updateCart(bookId, quantity) {
    const previous = normalizeAccount(account)
    const optimistic = updateCartInAccount(account, bookId, quantity)

    setAccount(optimistic)
    writeAccountCache(user, optimistic)

    return queueMutation(async () => {
      try {
        const data = normalizeAccount(await api(
          `/account/cart/${bookId}`,
          {
            method: 'PUT',
            body: JSON.stringify({ quantity }),
          }
        ))

        setAccount(data)
        writeAccountCache(user, data)
        void loadBooks(true).catch(() => {})

        return data
      } catch (error) {
        // The next queued operation may already have changed the UI, so only
        // restore the previous snapshot when the optimistic state is still current.
        setAccount(current => {
          if (JSON.stringify(current?.cart || []) === JSON.stringify(optimistic?.cart || [])) {
            return previous
          }
          return current
        })
        writeAccountCache(user, previous)
        throw error
      }
    })
  }

  async function removeFromCart(bookId) {
    const previous = normalizeAccount(account)
    const optimistic = updateCartInAccount(account, bookId, 0)

    setAccount(optimistic)
    writeAccountCache(user, optimistic)

    return queueMutation(async () => {
      try {
        const data = normalizeAccount(await api(
          `/account/cart/${bookId}`,
          {
            method: 'DELETE',
          }
        ))

        setAccount(data)
        writeAccountCache(user, data)
        void loadBooks(true).catch(() => {})

        return data
      } catch (error) {
        setAccount(current => {
          if (JSON.stringify(current?.cart || []) === JSON.stringify(optimistic?.cart || [])) {
            return previous
          }
          return current
        })
        writeAccountCache(user, previous)
        throw error
      }
    })
  }

  async function toggleWishlist(bookId) {
    const selected = account?.wishlist?.includes(bookId)
    const previous = normalizeAccount(account) || { wishlist: [], cart: [], addresses: [] }
    const wishlist = selected
      ? previous.wishlist.filter(id => id !== bookId)
      : [...previous.wishlist, bookId]
    const optimistic = {
      ...previous,
      wishlist,
    }

    // The heart changes immediately; the server confirms in the background.
    setAccount(optimistic)
    writeAccountCache(user, optimistic)

    return queueMutation(async () => {
      try {
        const data = normalizeAccount(await api(
          `/account/wishlist/${bookId}`,
          {
            method: selected ? 'DELETE' : 'POST',
          }
        ))

        setAccount(data)
        writeAccountCache(user, data)
        return data
      } catch (error) {
        setAccount(current => {
          if (JSON.stringify(current?.wishlist || []) === JSON.stringify(optimistic.wishlist || [])) {
            return previous
          }
          return current
        })
        writeAccountCache(user, previous)
        throw error
      }
    })
  }

  async function addAddress(address) {
    const data = normalizeAccount(await api(
      '/account/addresses',
      {
        method: 'POST',
        body: JSON.stringify(address),
      }
    ))

    setAccount(data)
    writeAccountCache(user, data)
    return data
  }

  async function updateAddress(addressId, address) {
    const data = normalizeAccount(await api(
      `/account/addresses/${addressId}`,
      {
        method: 'PUT',
        body: JSON.stringify(address),
      }
    ))

    setAccount(data)
    writeAccountCache(user, data)
    return data
  }

  async function deleteAddress(addressId) {
    const data = normalizeAccount(await api(
      `/account/addresses/${addressId}`,
      {
        method: 'DELETE',
      }
    ))

    setAccount(data)
    writeAccountCache(user, data)
    return data
  }

  async function setDefaultAddress(addressId) {
    const data = normalizeAccount(await api(
      `/account/addresses/${addressId}/default`,
      {
        method: 'PUT',
      }
    ))

    setAccount(data)
    writeAccountCache(user, data)
    return data
  }

  async function placeOrder(payload) {
    const order = await api('/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    await Promise.all([
      loadAccount(true),
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
    return books.find(book => book.id === id)
  }

  const cartRows = useMemo(() => {
    if (!account?.cart) return []

    return account.cart
      .map(item => ({
        ...item,
        book: books.find(book => book.id === item.bookId),
      }))
      .filter(item => item.book)
  }, [account?.cart, books])

  const value = useMemo(
    () => ({
      books,
      offers,
      authors,
      homeSections,
      homeSettings,
      account,
      loading,
      backendReady,

      loadBooks,
      loadOffers,
      loadAuthors,
      loadHomeSections,
      loadHomeSettings,
      loadAccount,

      getBook,
      cartRows: () => cartRows,

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
      homeSections,
      homeSettings,
      account,
      loading,
      backendReady,
      cartRows,
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
