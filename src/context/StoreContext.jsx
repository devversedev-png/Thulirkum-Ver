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

const CACHE_VERSION = 'v6'
const LEGACY_CACHE_VERSIONS = ['v5', 'v4', 'v3']

const PUBLIC_CACHE_KEYS = {
  books: `tvb_cache_${CACHE_VERSION}_books`,
  offers: `tvb_cache_${CACHE_VERSION}_offers`,
  authors: `tvb_cache_${CACHE_VERSION}_authors`,
  homeSections: `tvb_cache_${CACHE_VERSION}_home_sections`,
  homeSettings: `tvb_cache_${CACHE_VERSION}_home_settings`,
}

/* =========================================================
   CACHE HELPERS
========================================================= */

function readCache(key, fallback) {
  try {
    const raw = localStorage.getItem(key)

    if (!raw) {
      return fallback
    }

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
    // Cache is only an acceleration layer.
  }
}

/* =========================================================
   ACCOUNT CACHE
========================================================= */

function accountCacheKeys(user, version = CACHE_VERSION) {
  const keys = []

  const id = user?.id
    ? String(user.id).trim()
    : ''

  const email = user?.email
    ? String(user.email).trim().toLowerCase()
    : ''

  if (id) {
    keys.push(
      `tvb_cache_${version}_account_id_${id}`
    )
  }

  if (email) {
    keys.push(
      `tvb_cache_${version}_account_email_${encodeURIComponent(email)}`
    )
  }

  return keys
}

function readAccountCache(user) {
  const versions = [
    CACHE_VERSION,
    ...LEGACY_CACHE_VERSIONS,
  ]

  for (const version of versions) {
    for (const key of accountCacheKeys(user, version)) {
      const cached = readCache(key, null)

      if (cached) {
        return cached
      }
    }
  }

  return null
}

function writeAccountCache(user, data) {
  if (!user || !data) {
    return
  }

  for (const key of accountCacheKeys(user)) {
    writeCache(key, data)
  }
}

/* =========================================================
   ACCOUNT NORMALIZATION
========================================================= */

function normalizeAccount(data) {
  if (!data) {
    return null
  }

  return {
    ...data,

    wishlist: Array.isArray(data.wishlist)
      ? data.wishlist
      : [],

    cart: Array.isArray(data.cart)
      ? data.cart
      : [],

    addresses: Array.isArray(data.addresses)
      ? data.addresses
      : [],
  }
}

/* =========================================================
   CART UPDATE HELPER
========================================================= */

function updateCartInAccount(
  account,
  bookId,
  quantity,
  bookSnapshot = null
) {
  const current =
    normalizeAccount(account) || {
      wishlist: [],
      cart: [],
      addresses: [],
    }

  const cart = [...current.cart]

  const index = cart.findIndex(
    item =>
      String(item.bookId) === String(bookId)
  )

  if (quantity <= 0) {
    if (index >= 0) {
      cart.splice(index, 1)
    }
  } else if (index >= 0) {
    cart[index] = {
      ...cart[index],
      quantity,

      ...(bookSnapshot
        ? { bookSnapshot }
        : {}),
    }
  } else {
    cart.push({
      bookId,
      quantity,
      stockReserved: false,

      ...(bookSnapshot
        ? { bookSnapshot }
        : {}),
    })
  }

  return {
    ...current,
    cart,
  }
}

/* =========================================================
   STORE PROVIDER
========================================================= */

export function StoreProvider({ children }) {
  const { user } = useAuth()

  /* =======================================================
     PUBLIC CATALOGUE CACHE
  ======================================================= */

  const [books, setBooks] = useState(() =>
    decorateBooks(
      readCache(
        PUBLIC_CACHE_KEYS.books,
        []
      )
    )
  )

  const [offers, setOffers] = useState(() =>
    readCache(
      PUBLIC_CACHE_KEYS.offers,
      []
    )
  )

  const [authors, setAuthors] = useState(() =>
    decorateAuthors(
      readCache(
        PUBLIC_CACHE_KEYS.authors,
        []
      )
    )
  )

  const [homeSections, setHomeSections] =
    useState(() =>
      readCache(
        PUBLIC_CACHE_KEYS.homeSections,
        []
      )
    )

  const [homeSettings, setHomeSettings] =
    useState(() =>
      readCache(
        PUBLIC_CACHE_KEYS.homeSettings,
        {
          bannerUrls: [],
          activeBannerIndex: 0,
        }
      )
    )

  /* =======================================================
     IMPORTANT ACCOUNT HYDRATION

     DO NOT exclude ADMIN here.

     Admin is still a logged-in user and can have:
       - cart
       - wishlist
       - addresses

     Your backend /api/account already returns the cart.
  ======================================================= */

  const initialAccount = user
    ? normalizeAccount(
        readAccountCache(user)
      )
    : null

  const [account, setAccount] =
    useState(initialAccount)

  const [accountReady, setAccountReady] =
    useState(() =>
      Boolean(initialAccount)
    )

  const [loading, setLoading] =
    useState(() =>
      books.length === 0
    )

  const [catalogueReady, setCatalogueReady] =
    useState(() =>
      books.length > 0
    )

  const [backendReady, setBackendReady] =
    useState(true)

  const [accountLoading, setAccountLoading] =
    useState(() =>
      Boolean(
        user &&
        !initialAccount
      )
    )

  /* =======================================================
     REFS
  ======================================================= */

  const mutationQueue = useRef(
    Promise.resolve()
  )

  const publicBootstrapRef = useRef(false)

  const accountLoadIdentityRef =
    useRef('')

  const booksRef = useRef(books)

  const accountRef = useRef(account)

  const mutationVersionRef =
    useRef(0)

  const accountRequestVersionRef =
    useRef(0)

  const publicRequestsRef =
    useRef(0)

  /* =======================================================
     KEEP REFS IN SYNC
  ======================================================= */

  useEffect(() => {
    booksRef.current = books
  }, [books])

  useEffect(() => {
    accountRef.current = account
  }, [account])

  /* =======================================================
     PUBLIC DATA BOOTSTRAP
  ======================================================= */

  useEffect(() => {
    if (publicBootstrapRef.current) {
      return
    }

    publicBootstrapRef.current = true

    Promise.all([
      loadBooks(false),
      loadOffers(true),
      loadAuthors(true),
      loadHomeSections(true),
      loadHomeSettings(true),
    ]).catch(() => {})
  }, [])

  /* =======================================================
     ACCOUNT BOOTSTRAP

     IMPORTANT:
     ADMIN IS INCLUDED.

     Before:
       user && user.role !== 'ADMIN'

     Now:
       user
  ======================================================= */

  useEffect(() => {
    const identity = user
      ? `${user.id || ''}:${user.email || ''}`
      : 'ANONYMOUS'

    if (
      accountLoadIdentityRef.current ===
      identity
    ) {
      return
    }

    accountLoadIdentityRef.current =
      identity

    if (user) {
      const cached =
        normalizeAccount(
          readAccountCache(user)
        )

      /*
       * Show cached cart immediately if
       * available.
       */
      setAccount(cached)

      accountRef.current = cached

      /*
       * Even if cache exists, the real
       * account must come from backend.
       */
      setAccountReady(false)
      setAccountLoading(true)

      void loadAccount(true)
    } else {
      /*
       * No logged-in user.
       */
      setAccount(null)
      accountRef.current = null

      setAccountReady(true)
      setAccountLoading(false)
    }
  }, [
    user?.id,
    user?.email,
    user?.role,
  ])

  /* =========================================================
     LOAD BOOKS
  ========================================================= */

  async function loadBooks(silent = false) {
    const previousBooks =
      booksRef.current

    const isInitialRequest =
      !catalogueReady &&
      !silent

    if (isInitialRequest) {
      publicRequestsRef.current += 1

      setLoading(true)
    }

    try {
      const data =
        await api('/books')

      const raw =
        Array.isArray(data)
          ? data
          : []

      /*
       * Never replace visible books
       * with an empty transient response.
       */
      if (
        raw.length === 0 &&
        previousBooks.length > 0
      ) {
        setBackendReady(true)
        setCatalogueReady(true)

        return previousBooks
      }

      const decorated =
        decorateBooks(raw)

      setBooks(decorated)

      booksRef.current =
        decorated

      if (raw.length > 0) {
        writeCache(
          PUBLIC_CACHE_KEYS.books,
          raw
        )
      }

      setBackendReady(true)
      setCatalogueReady(true)

      return decorated
    } catch (error) {
      setCatalogueReady(true)

      if (
        booksRef.current.length === 0
      ) {
        setBackendReady(false)
      }

      if (!silent) {
        throw error
      }

      return booksRef.current
    } finally {
      if (isInitialRequest) {
        publicRequestsRef.current =
          Math.max(
            0,
            publicRequestsRef.current - 1
          )

        if (
          publicRequestsRef.current === 0
        ) {
          setLoading(false)
        }
      }
    }
  }

  /* =========================================================
     LOAD OFFERS
  ========================================================= */

  async function loadOffers(silent = false) {
    try {
      const data =
        await api('/offers/active')

      const next =
        Array.isArray(data)
          ? data
          : []

      if (
        next.length > 0 ||
        offers.length === 0
      ) {
        setOffers(next)

        if (next.length > 0) {
          writeCache(
            PUBLIC_CACHE_KEYS.offers,
            next
          )
        }
      }

      return next.length > 0
        ? next
        : offers
    } catch (error) {
      if (!silent) {
        throw error
      }

      return offers
    }
  }

  /* =========================================================
     LOAD AUTHORS
  ========================================================= */

  async function loadAuthors(silent = false) {
    try {
      const data =
        await api('/authors')

      const raw =
        Array.isArray(data)
          ? data
          : []

      if (
        raw.length === 0 &&
        authors.length > 0
      ) {
        return authors
      }

      const decorated =
        decorateAuthors(raw)

      setAuthors(decorated)

      if (raw.length > 0) {
        writeCache(
          PUBLIC_CACHE_KEYS.authors,
          raw
        )
      }

      return decorated
    } catch (error) {
      if (!silent) {
        throw error
      }

      return authors
    }
  }

  /* =========================================================
     LOAD HOME SECTIONS
  ========================================================= */

  async function loadHomeSections(
    silent = false
  ) {
    try {
      const data =
        await api('/home-sections')

      const next =
        Array.isArray(data)
          ? data
          : []

      if (
        next.length === 0 &&
        homeSections.length > 0
      ) {
        return homeSections
      }

      setHomeSections(next)

      if (next.length > 0) {
        writeCache(
          PUBLIC_CACHE_KEYS.homeSections,
          next
        )
      }

      return next
    } catch (error) {
      if (!silent) {
        throw error
      }

      return homeSections
    }
  }

  /* =========================================================
     LOAD HOME SETTINGS
  ========================================================= */

  async function loadHomeSettings(
    silent = false
  ) {
    try {
      const data =
        await api('/home-settings')

      const next = {
        bannerUrls:
          Array.isArray(
            data?.bannerUrls
          )
            ? data.bannerUrls
            : [],

        activeBannerIndex:
          Number(
            data?.activeBannerIndex || 0
          ),
      }

      setHomeSettings(next)

      writeCache(
        PUBLIC_CACHE_KEYS.homeSettings,
        next
      )

      return next
    } catch (error) {
      if (!silent) {
        throw error
      }

      return homeSettings
    }
  }

  /* =========================================================
     HYDRATE CART WITH LIVE BOOK DATA
  ========================================================= */

  function hydrateCartSnapshots(
    data,
    sourceBooks = booksRef.current
  ) {
    const normalized =
      normalizeAccount(data)

    if (!normalized) {
      return null
    }

    const cart =
      normalized.cart.map(item => {
        const book =
          sourceBooks.find(
            candidate =>
              String(candidate.id) ===
              String(item.bookId)
          )

        return book
          ? {
              ...item,
              bookSnapshot: book,
            }
          : item
      })

    return {
      ...normalized,
      cart,
    }
  }

  /* =========================================================
     MERGE CART ORDER

     Server controls quantity/items.
     Existing UI order is preserved.
  ========================================================= */

  function mergeCartOrder(
    previousCart,
    serverCart
  ) {
    const previous =
      Array.isArray(previousCart)
        ? previousCart
        : []

    const server =
      Array.isArray(serverCart)
        ? serverCart
        : []

    const byId = new Map(
      server.map(item => [
        String(item.bookId),
        item,
      ])
    )

    const result = []

    for (const item of previous) {
      const fresh =
        byId.get(
          String(item.bookId)
        )

      if (!fresh) {
        continue
      }

      result.push({
        ...fresh,

        ...(item.bookSnapshot
          ? {
              bookSnapshot:
                item.bookSnapshot,
            }
          : {}),
      })

      byId.delete(
        String(item.bookId)
      )
    }

    for (const item of server) {
      const key =
        String(item.bookId)

      if (!byId.has(key)) {
        continue
      }

      result.push(item)

      byId.delete(key)
    }

    return result
  }

  /* =========================================================
     MERGE SERVER ACCOUNT
  ========================================================= */

  function mergeServerAccount(
    serverData,
    currentAccount = accountRef.current
  ) {
    const incoming =
      hydrateCartSnapshots(
        serverData
      )

    if (!incoming) {
      return normalizeAccount(
        currentAccount
      )
    }

    /*
     * Preserve existing cart ordering
     * and snapshots when possible.
     */
    return {
      ...incoming,

      cart: mergeCartOrder(
        currentAccount?.cart,
        incoming.cart
      ),
    }
  }

  /* =========================================================
     LOAD ACCOUNT

     IMPORTANT:
     ADMIN IS ALLOWED.

     The previous code had:

       if (!user || user.role === 'ADMIN')

     That was the reason your admin cart
     was being ignored.

     Now only an actually logged-out
     user is rejected.
  ========================================================= */

  async function loadAccount(
    silent = false
  ) {
    if (!user) {
      setAccountReady(true)
      setAccountLoading(false)

      return null
    }

    const requestId =
      ++accountRequestVersionRef.current

    const identity =
      `${user.id || ''}:${user.email || ''}`

    setAccountLoading(true)

    try {
      /*
       * This is the real source of truth.
       */
      const serverAccount =
        await api('/account')

      /*
       * Ignore stale responses.
       */
      const currentIdentity =
        `${user.id || ''}:${user.email || ''}`

      if (
        requestId !==
          accountRequestVersionRef.current ||
        identity !== currentIdentity
      ) {
        setAccountReady(true)
        setAccountLoading(false)

        return accountRef.current
      }

      /*
       * Backend returned the account.
       *
       * This includes:
       *   wishlist
       *   cart
       *   addresses
       */
      const data =
        mergeServerAccount(
          serverAccount,
          accountRef.current
        )

      setAccount(data)

      accountRef.current =
        data

      /*
       * Save the REAL backend account.
       */
      writeAccountCache(
        user,
        data
      )

      setBackendReady(true)
      setAccountReady(true)
      setAccountLoading(false)

      return data
    } catch (error) {
      console.error(
        '[Store] Failed to restore account/cart:',
        error
      )

      /*
       * Never replace an existing cached
       * account with an empty account just
       * because the network failed.
       */
      if (accountRef.current) {
        setAccountReady(true)
      } else {
        setAccountReady(false)
      }

      setAccountLoading(false)

      if (!silent) {
        throw error
      }

      return accountRef.current
    }
  }

  /* =========================================================
     MUTATION QUEUE
  ========================================================= */

  function queueMutation(work) {
    const run =
      mutationQueue.current.then(
        work,
        work
      )

    /*
     * Keep queue alive after errors.
     */
    mutationQueue.current =
      run.catch(
        () => undefined
      )

    return run
  }

  /* =========================================================
     ADD TO CART
  ========================================================= */

  async function addToCart(
    bookId,
    quantity = 1
  ) {
    const previous =
      normalizeAccount(
        accountRef.current
      )

    const bookSnapshot =
      booksRef.current.find(
        book =>
          String(book.id) ===
          String(bookId)
      )

    const current =
      normalizeAccount(
        accountRef.current
      ) || {
        wishlist: [],
        cart: [],
        addresses: [],
      }

    const existing =
      current.cart.find(
        item =>
          String(item.bookId) ===
          String(bookId)
      )

    const optimisticQuantity =
      existing
        ? Number(
            existing.quantity || 0
          ) +
          Number(quantity || 0)
        : Number(quantity || 0)

    const optimistic =
      updateCartInAccount(
        current,
        bookId,
        optimisticQuantity,
        bookSnapshot
      )

    const mutationVersion =
      ++mutationVersionRef.current

    /*
     * Optimistic UI.
     */
    setAccount(optimistic)

    accountRef.current =
      optimistic

    writeAccountCache(
      user,
      optimistic
    )

    return queueMutation(
      async () => {
        try {
          const serverAccount =
            await api(
              '/account/cart',
              {
                method: 'POST',
                body: JSON.stringify({
                  bookId,
                  quantity,
                }),
              }
            )

          if (
            mutationVersion !==
            mutationVersionRef.current
          ) {
            return accountRef.current
          }

          const data =
            mergeServerAccount(
              serverAccount,
              accountRef.current
            )

          setAccount(data)

          accountRef.current =
            data

          writeAccountCache(
            user,
            data
          )

          void loadBooks(true)
            .catch(() => {})

          return data
        } catch (error) {
          if (
            mutationVersion ===
            mutationVersionRef.current
          ) {
            setAccount(previous)

            accountRef.current =
              previous

            writeAccountCache(
              user,
              previous
            )
          }

          throw error
        }
      }
    )
  }

  /* =========================================================
     UPDATE CART
  ========================================================= */

  async function updateCart(
    bookId,
    quantity
  ) {
    const previous =
      normalizeAccount(
        accountRef.current
      )

    const bookSnapshot =
      booksRef.current.find(
        book =>
          String(book.id) ===
          String(bookId)
      )

    const optimistic =
      updateCartInAccount(
        accountRef.current,
        bookId,
        quantity,
        bookSnapshot
      )

    const mutationVersion =
      ++mutationVersionRef.current

    setAccount(optimistic)

    accountRef.current =
      optimistic

    writeAccountCache(
      user,
      optimistic
    )

    return queueMutation(
      async () => {
        try {
          const serverAccount =
            await api(
              `/account/cart/${bookId}`,
              {
                method: 'PUT',
                body: JSON.stringify({
                  quantity,
                }),
              }
            )

          if (
            mutationVersion !==
            mutationVersionRef.current
          ) {
            return accountRef.current
          }

          const data =
            mergeServerAccount(
              serverAccount,
              accountRef.current
            )

          setAccount(data)

          accountRef.current =
            data

          writeAccountCache(
            user,
            data
          )

          void loadBooks(true)
            .catch(() => {})

          return data
        } catch (error) {
          if (
            mutationVersion ===
            mutationVersionRef.current
          ) {
            setAccount(previous)

            accountRef.current =
              previous

            writeAccountCache(
              user,
              previous
            )
          }

          throw error
        }
      }
    )
  }

  /* =========================================================
     REMOVE FROM CART
  ========================================================= */

  async function removeFromCart(
    bookId
  ) {
    const previous =
      normalizeAccount(
        accountRef.current
      )

    const bookSnapshot =
      booksRef.current.find(
        book =>
          String(book.id) ===
          String(bookId)
      )

    const optimistic =
      updateCartInAccount(
        accountRef.current,
        bookId,
        0,
        bookSnapshot
      )

    const mutationVersion =
      ++mutationVersionRef.current

    setAccount(optimistic)

    accountRef.current =
      optimistic

    writeAccountCache(
      user,
      optimistic
    )

    return queueMutation(
      async () => {
        try {
          const serverAccount =
            await api(
              `/account/cart/${bookId}`,
              {
                method: 'DELETE',
              }
            )

          if (
            mutationVersion !==
            mutationVersionRef.current
          ) {
            return accountRef.current
          }

          const data =
            mergeServerAccount(
              serverAccount,
              accountRef.current
            )

          setAccount(data)

          accountRef.current =
            data

          writeAccountCache(
            user,
            data
          )

          void loadBooks(true)
            .catch(() => {})

          return data
        } catch (error) {
          if (
            mutationVersion ===
            mutationVersionRef.current
          ) {
            setAccount(previous)

            accountRef.current =
              previous

            writeAccountCache(
              user,
              previous
            )
          }

          throw error
        }
      }
    )
  }

  /* =========================================================
     WISHLIST
  ========================================================= */

  async function toggleWishlist(
    bookId
  ) {
    const currentAccount =
      normalizeAccount(
        accountRef.current
      ) || {
        wishlist: [],
        cart: [],
        addresses: [],
      }

    const selected =
      currentAccount.wishlist.some(
        id =>
          String(id) ===
          String(bookId)
      )

    const previous =
      currentAccount

    const wishlist = selected
      ? previous.wishlist.filter(
          id =>
            String(id) !==
            String(bookId)
        )
      : [
          ...previous.wishlist,
          bookId,
        ]

    const optimistic = {
      ...previous,
      wishlist,
    }

    const mutationVersion =
      ++mutationVersionRef.current

    setAccount(optimistic)

    accountRef.current =
      optimistic

    writeAccountCache(
      user,
      optimistic
    )

    return queueMutation(
      async () => {
        try {
          const serverAccount =
            await api(
              `/account/wishlist/${bookId}`,
              {
                method: selected
                  ? 'DELETE'
                  : 'POST',
              }
            )

          if (
            mutationVersion !==
            mutationVersionRef.current
          ) {
            return accountRef.current
          }

          const data =
            mergeServerAccount(
              serverAccount,
              accountRef.current
            )

          setAccount(data)

          accountRef.current =
            data

          writeAccountCache(
            user,
            data
          )

          return data
        } catch (error) {
          if (
            mutationVersion ===
            mutationVersionRef.current
          ) {
            setAccount(previous)

            accountRef.current =
              previous

            writeAccountCache(
              user,
              previous
            )
          }

          throw error
        }
      }
    )
  }

  /* =========================================================
     ADD ADDRESS
  ========================================================= */

  async function addAddress(
    address
  ) {
    const data =
      mergeServerAccount(
        await api(
          '/account/addresses',
          {
            method: 'POST',
            body: JSON.stringify(
              address
            ),
          }
        )
      )

    setAccount(data)

    accountRef.current =
      data

    writeAccountCache(
      user,
      data
    )

    return data
  }

  /* =========================================================
     UPDATE ADDRESS
  ========================================================= */

  async function updateAddress(
    addressId,
    address
  ) {
    const data =
      mergeServerAccount(
        await api(
          `/account/addresses/${addressId}`,
          {
            method: 'PUT',
            body: JSON.stringify(
              address
            ),
          }
        )
      )

    setAccount(data)

    accountRef.current =
      data

    writeAccountCache(
      user,
      data
    )

    return data
  }

  /* =========================================================
     DELETE ADDRESS
  ========================================================= */

  async function deleteAddress(
    addressId
  ) {
    const data =
      mergeServerAccount(
        await api(
          `/account/addresses/${addressId}`,
          {
            method: 'DELETE',
          }
        )
      )

    setAccount(data)

    accountRef.current =
      data

    writeAccountCache(
      user,
      data
    )

    return data
  }

  /* =========================================================
     DEFAULT ADDRESS
  ========================================================= */

  async function setDefaultAddress(
    addressId
  ) {
    const data =
      mergeServerAccount(
        await api(
          `/account/addresses/${addressId}/default`,
          {
            method: 'PUT',
          }
        )
      )

    setAccount(data)

    accountRef.current =
      data

    writeAccountCache(
      user,
      data
    )

    return data
  }

  /* =========================================================
     PLACE ORDER
  ========================================================= */

  async function placeOrder(
    payload
  ) {
    const order =
      await api(
        '/orders',
        {
          method: 'POST',
          body: JSON.stringify(
            payload
          ),
        }
      )

    await Promise.all([
      loadAccount(true),
      loadBooks(true),
    ])

    return order
  }

  /* =========================================================
     ORDERS
  ========================================================= */

  async function getOrders() {
    return api('/orders')
  }

  async function getOrder(id) {
    return api(`/orders/${id}`)
  }

  /* =========================================================
     GET BOOK
  ========================================================= */

  function getBook(id) {
    return books.find(
      book =>
        String(book.id) ===
        String(id)
    )
  }

  /* =========================================================
     CART ROWS

     This converts account.cart:

       {
         bookId,
         quantity
       }

     into:

       {
         bookId,
         quantity,
         book
       }

     Live catalogue data is preferred.
     bookSnapshot is the fallback.
  ========================================================= */

  const cartRows = useMemo(() => {
    if (!account?.cart) {
      return []
    }

    return account.cart
      .map(item => {
        const liveBook =
          books.find(
            book =>
              String(book.id) ===
              String(item.bookId)
          )

        return {
          ...item,

          book:
            liveBook ||
            item.bookSnapshot ||
            null,
        }
      })
      .filter(
        item => item.book
      )
  }, [
    account?.cart,
    books,
  ])

  /* =========================================================
     CONTEXT VALUE
  ========================================================= */

  const value = useMemo(
    () => ({
      books,
      offers,
      authors,

      homeSections,
      homeSettings,

      account,

      accountReady,
      accountLoading,

      loading,
      catalogueReady,
      backendReady,

      loadBooks,
      loadOffers,
      loadAuthors,
      loadHomeSections,
      loadHomeSettings,
      loadAccount,

      getBook,

      /*
       * Existing Cart page compatibility.
       */
      cartRows: () =>
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

      homeSections,
      homeSettings,

      account,

      accountReady,
      accountLoading,

      loading,
      catalogueReady,
      backendReady,

      cartRows,
    ]
  )

  return (
    <StoreContext.Provider
      value={value}
    >
      {children}
    </StoreContext.Provider>
  )
}

/* =========================================================
   STORE HOOK
========================================================= */

export function useStore() {
  return useContext(StoreContext)
}