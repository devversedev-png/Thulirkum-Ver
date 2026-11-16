import '../delivery-settings.css'
import '../homepage-slides.css'
import { LayoutDashboard, ShoppingCart, BookOpen, Users, Menu, Plus, BarChart3, RefreshCw, ExternalLink, Package, IndianRupee, Bell, ArrowRight, Layers } from 'lucide-react'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useSearchParams } from 'react-router-dom'

import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'

import PremiumConfirm from '../components/PremiumConfirm'
import PremiumSelect from '../components/PremiumSelect'
import CashbackTypeDropdown from '../components/CashbackTypeDropdown'
import OfferBookDropdown from '../components/OfferBookDropdown'
import PremiumDatePicker from '../components/PremiumDatePicker'
import AmazonOrdersPanel from '../components/AmazonOrdersPanel'

const HOMEPAGE_SLIDE_PRESETS = [
  { title: 'Discover Your Next Favourite Book', eyebrow: 'DISCOVER • READ • ENJOY' },
  { title: 'New Stories, New Beginnings', eyebrow: 'FRESH ON THE SHELVES' },
  { title: 'Let Knowledge Take Root', eyebrow: 'READ • LEARN • GROW' },
  { title: 'Books That Inspire Every Day', eyebrow: 'INSPIRATION • EVERY PAGE' },
  { title: 'Explore Worlds Beyond Words', eyebrow: 'IMAGINE • EXPLORE • DISCOVER' },
  { title: 'A Little More Magic in Every Page', eyebrow: 'STORIES • WONDER • JOY' },
  { title: 'Prepare Smarter. Aim Higher.', eyebrow: 'LEARN • PREPARE • ACHIEVE' },
  { title: 'Timeless Reads, Endless Possibilities', eyebrow: 'CLASSICS • CULTURE • IDEAS' },
]
const HOMEPAGE_SLIDE_THEMES = [
  ['peach', '🍑 Peach'], ['cream', '☀️ Warm cream'], ['green', '🌿 Emerald'],
  ['sage', '🍃 Sage'], ['lavender', '💜 Lavender'], ['sky', '☁️ Sky blue'],
  ['rose', '🌸 Rose'], ['mint', '🍀 Fresh mint'], ['sand', '🏖️ Sand'],
  ['sunset', '🌅 Sunset'],
]

const emptyHomepageSlide = {
  title: '', description: '', eyebrow: '', bookId: '', imageUrl: '', theme: 'peach',
  buttonText: 'Explore book', buttonLink: '', active: true,
}

const emptyBook = {
  title: '',
  author: '',
  category: '',
  language: '',
  publisher: '',
  isbn: '',
  description: '',
  image: '',
  price: 0,
  originalPrice: 0,
  rating: 0,
  reviewCount: 0,
  stock: 0,
  featured: false,
  newArrival: false,
  available: true,
}

const emptyAuthor = {
  name: '',
  language: '',
  bio: '',
  image: '',
  featured: true,
  active: true,
  displayOrder: 0,
}

const DEFAULT_DELIVERY_SETTINGS = { enabled: true, feePaise: 6000, freeDeliveryThresholdPaise: 49900, freeShippingAll: false }

const emptyOffer = {
  title: '',
  code: '',
  description: '',
  discountType: 'PERCENT',
  discountValue: 0,
  minOrderAmount: 0,
  startDate: '',
  endDate: '',
  active: true,
  bannerImage: '',
  offerType: 'COUPON',
  buyBookId: '',
  getBookId: '',
  buyQuantity: 1,
  getQuantity: 1,
  buyItems: [{ bookId: '', quantity: 1 }],
  giftItems: [{ bookId: '', quantity: 1 }],
}

const HOME_SECTION_OPTIONS = [
  { key: 'top-selling', title: 'Top Selling Books', copy: 'Show the books customers buy most, based on actual order history.', icon: '🏆' },
  { key: 'highly-featured', title: 'Highly Featured Books', copy: 'Spotlight handpicked titles or books marked as featured.', icon: '✨' },
  { key: 'new-arrivals', title: 'New Arrivals', copy: 'Keep the newest additions to your collection in the spotlight.', icon: '📚' },
  { key: 'best-rated', title: 'Best Rated Books', copy: 'Highlight titles that readers love, using ratings and reviews.', icon: '⭐' },
  { key: 'trending', title: 'Trending Books', copy: 'Show popular titles based on recent purchases and reader interest.', icon: '📈' },
]

// Promotional controls stay available without cluttering the five main sections.
const HOME_PROMOTION_OPTIONS = [
  { key: 'discounted', title: 'Discounted Books', copy: 'Manage book-wise selling-price discounts.', icon: '🏷️' },
  { key: 'cashback', title: 'Cashback Books', copy: 'Set a separate cashback reward for each selected book.', icon: '💰' },
]
const ALL_HOME_SECTION_OPTIONS = [...HOME_SECTION_OPTIONS, ...HOME_PROMOTION_OPTIONS]

const HOME_SECTION_DEFAULTS = {
  discounted: {
    mode: 'MANUAL',
    discountPercent: 10,
    minDiscountPercent: 10,
    limit: 5,
  },

  'top-selling': {
    mode: 'MANUAL',
    periodDays: 30,
    basis: 'QUANTITY',
    limit: 5,
  },

  'highly-featured': {
    mode: 'MANUAL',
    limit: 5,
  },

  cashback: {
    mode: 'MANUAL',
    perBookCashbacks: {},
    limit: 5,
  },

  'new-arrivals': {
    mode: 'MANUAL',
    limit: 5,
  },

  'best-rated': {
    mode: 'MANUAL',
    minRating: 4,
    minReviews: 5,
    limit: 5,
  },

  trending: {
    mode: 'MANUAL',
    periodDays: 7,
    basis: 'SALES',
    limit: 5,
  },

  recommended: {
    mode: 'MANUAL',
    category: '',
    author: '',
    sourceBookId: '',
    limit: 5,
  },
}

function statusLabel(value) {
  if (!value) {
    return 'Status unavailable'
  }

  return String(value)
    .toLowerCase()
    .split('_')
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(' ')
}

function paymentAmountPaid(order) {
  const total = Number(order?.total || 0)
  const raw = Number(order?.amountPaid)
  if (Number.isFinite(raw) && raw > 0) return Math.min(raw, total)
  // Existing orders created before amountPaid was introduced can still have
  // paymentStatus=PAID. Preserve that real backend state in the UI.
  return String(order?.paymentStatus || '').toUpperCase() === 'PAID' ? total : 0
}

function paymentStatusValue(order) {
  const total = Number(order?.total || 0)
  const paid = paymentAmountPaid(order)
  if (total > 0 && paid >= total) return 'PAID'
  if (paid > 0) return 'PARTIALLY_PAID'
  return 'UNPAID'
}

function paymentStatusLabel(order) {
  return statusLabel(paymentStatusValue(order))
}

function money(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function AdminDashboardPage() {
  const { user, logout } = useAuth()

  // Keep admin sections in the URL so Android Back restores the previous section.
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') || 'overview'
  const setTab = (nextTab) => {
    const next = typeof nextTab === 'function' ? nextTab(tab) : nextTab
    if (next !== tab) setSearchParams(next === 'overview' ? {} : { tab: next })
  }

  const [books, setBooks] = useState([])
  const [orders, setOrders] = useState([])
  const [customers, setCustomers] = useState([])
  const [offers, setOffers] = useState([])
  const [deliveryForm, setDeliveryForm] = useState(DEFAULT_DELIVERY_SETTINGS)
  const [savingDelivery, setSavingDelivery] = useState(false)
  const [authors, setAuthors] = useState([])
  const [homeSections, setHomeSections] = useState([])
  const [homepageSlides, setHomepageSlides] = useState([])
  const [homepageSlideForm, setHomepageSlideForm] = useState(emptyHomepageSlide)
  const [editingHomepageSlide, setEditingHomepageSlide] = useState(null)
  const [savingHomepageSlide, setSavingHomepageSlide] = useState(false)
  const [slideSearch, setSlideSearch] = useState('')
  const [showHomePromotions, setShowHomePromotions] = useState(false)
  const [selectedHomeSectionKey, setSelectedHomeSectionKey] = useState('top-selling')
  const [selectedHomeBookIds, setSelectedHomeBookIds] = useState([])
  const [perBookDiscounts, setPerBookDiscounts] = useState({})
  const [homeBookSearch, setHomeBookSearch] = useState('')
  const [homeConfigForm, setHomeConfigForm] = useState(HOME_SECTION_DEFAULTS['top-selling'])
  const [homeSettingsForm, setHomeSettingsForm] = useState({ bannerUrls: ['', '', '', ''], activeBannerIndex: 0 })
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const [statusOptions, setStatusOptions] =
    useState([])

  const [bookForm, setBookForm] =
    useState(emptyBook)

  const [offerForm, setOfferForm] =
    useState(emptyOffer)

  const [authorForm, setAuthorForm] =
    useState(emptyAuthor)

  const [editingBook, setEditingBook] =
    useState(null)

  const [editingOffer, setEditingOffer] =
    useState(null)

  const [editingAuthor, setEditingAuthor] =
    useState(null)

  const [message, setMessage] =
    useState('')

  // Automatically dismiss admin feedback after two seconds.
  useEffect(() => {
    if (!message) return undefined
    const timer = window.setTimeout(() => setMessage(''), 2000)
    return () => window.clearTimeout(timer)
  }, [message])

  const [inventorySearch, setInventorySearch] =
    useState('')

  const [customerSearch, setCustomerSearch] =
    useState('')

  const [authorSearch, setAuthorSearch] =
    useState('')

  const [orderedOnly, setOrderedOnly] =
    useState(false)

  const [orderFilters, setOrderFilters] =
    useState({
      q: '',
      status: '',
      from: '',
      to: '',
      month: '',
    })

  const [selectedOrder, setSelectedOrder] =
    useState(null)

  const [paymentDraft, setPaymentDraft] =
    useState('0')

  const [paymentBusy, setPaymentBusy] =
    useState(false)

  const [orderActions, setOrderActions] =
    useState([])

  const [shipmentAction, setShipmentAction] =
    useState(null)

  const [shipmentForm, setShipmentForm] =
    useState({ courierName: '', trackingNumber: '' })

  const [
    orderActionBusy,
    setOrderActionBusy,
  ] = useState(false)

  const [refreshing, setRefreshing] =
    useState(false)

  const [confirmDialog, setConfirmDialog] =
    useState(null)

  const stockDrafts = useRef({})
  const stockTimers = useRef({})

  useEffect(() => {
    loadEverything()

    return () =>
      Object.values(
        stockTimers.current
      ).forEach(clearTimeout)
  }, [])

  // Reload server-backed lists after the admin APK returns to foreground.
  // Never refresh the entire WebView or reset which admin tab is open.
  const adminResumeInFlight = useRef(false)
  useEffect(() => {
    const refreshOnResume = async () => {
      if (adminResumeInFlight.current || document.visibilityState === 'hidden') return
      adminResumeInFlight.current = true
      try { await loadEverything() }
      finally { adminResumeInFlight.current = false }
    }
    window.addEventListener('tvb:app-resumed', refreshOnResume)
    return () => window.removeEventListener('tvb:app-resumed', refreshOnResume)
  }, [])

  useEffect(() => {
    const selected = homeSections.find(section => section.key === selectedHomeSectionKey)
    setSelectedHomeBookIds(selected?.bookIds || [])
    setPerBookDiscounts(selected?.config?.perBookDiscounts || {})
    setHomeConfigForm({
      ...(HOME_SECTION_DEFAULTS[selectedHomeSectionKey] || {}),
      ...(selected?.config || {}),
      // Discounted Books are always selected manually, with a discount per book.
      ...(selectedHomeSectionKey === 'discounted' ? { mode: 'MANUAL' } : {}),
    })
    setHomeBookSearch('')
  }, [selectedHomeSectionKey, homeSections])

    useEffect(() => {
    if (!mobileSidebarOpen) return

    const isMobile = window.innerWidth <= 720 && window.matchMedia('(pointer: coarse)').matches
    if (isMobile) document.body.style.overflow = 'hidden'

    const onKey = (e) => e.key === 'Escape' && setMobileSidebarOpen(false)
    const onResize = () => window.innerWidth > 720 && setMobileSidebarOpen(false)

    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', onResize)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onResize)
    }
  }, [mobileSidebarOpen])

  // Close custom discount menus when clicking outside, pressing Escape,
  // or opening another discount menu.
  useEffect(() => {
    const closeMenus = (event) => {
      document.querySelectorAll('details.tv-discount-dropdown[open]').forEach(menu => {
        if (!menu.contains(event.target)) menu.open = false
      })
    }
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        document.querySelectorAll('details.tv-discount-dropdown[open]').forEach(menu => {
          menu.open = false
        })
      }
    }
    const closeOtherMenus = (event) => {
      const opened = event.target
      if (!opened.open || !opened.matches('details.tv-discount-dropdown')) return
      document.querySelectorAll('details.tv-discount-dropdown[open]').forEach(menu => {
        if (menu !== opened) menu.open = false
      })
    }
    document.addEventListener('pointerdown', closeMenus)
    document.addEventListener('keydown', closeOnEscape)
    document.addEventListener('toggle', closeOtherMenus, true)
    return () => {
      document.removeEventListener('pointerdown', closeMenus)
      document.removeEventListener('keydown', closeOnEscape)
      document.removeEventListener('toggle', closeOtherMenus, true)
    }
  }, [])

  async function loadEverything() {
    // Load each admin area independently. One unavailable endpoint (for example
    // Home Settings on an older Render deployment) must not hide the other tabs
    // or prevent the Home Sections tab from rendering.
    const requests = [
      ['books', api('/admin/books')],
      ['orders', api('/admin/orders')],
      ['customers', api('/admin/customers')],
      ['offers', api('/admin/offers')],
      ['authors', api('/admin/authors')],
      ['homeSections', api('/admin/home-sections')],
      ['homeSettings', api('/admin/home-settings')],
      ['homepageSlides', api('/admin/homepage-slides')],
      ['deliverySettings', api('/admin/delivery-settings')],
    ]

    const results = await Promise.allSettled(
      requests.map(([, request]) => request)
    )

    const failed = []

    results.forEach((result, index) => {
      const key = requests[index][0]

      if (result.status === 'fulfilled') {
        const data = result.value

        if (key === 'books') {
          setBooks(Array.isArray(data) ? data : [])
        } else if (key === 'orders') {
          setOrders(Array.isArray(data) ? data : [])
          setStatusOptions([
            ...new Set(
              (Array.isArray(data) ? data : [])
                .map(order => order.status)
                .filter(Boolean)
            ),
          ])
        } else if (key === 'customers') {
          setCustomers(Array.isArray(data) ? data : [])
        } else if (key === 'offers') {
          setOffers(Array.isArray(data) ? data : [])
        } else if (key === 'authors') {
          setAuthors(Array.isArray(data) ? data : [])
        } else if (key === 'homepageSlides') {
          setHomepageSlides(Array.isArray(data) ? data : [])
        } else if (key === 'homeSections') {
          setHomeSections(Array.isArray(data) ? data : [])
        } else if (key === 'deliverySettings') {
          setDeliveryForm({ ...DEFAULT_DELIVERY_SETTINGS, ...data })
        } else if (key === 'homeSettings') {
          setHomeSettingsForm({
            bannerUrls: [0, 1, 2, 3].map(index => data?.bannerUrls?.[index] || ''),
            activeBannerIndex: Number(data?.activeBannerIndex || 0),
          })
        }
      } else {
        failed.push({
          key,
          message: result.reason?.message || 'Request failed',
        })
      }
    })

    if (failed.length) {
      const homeFailed = failed.some(item =>
        item.key === 'homeSections' || item.key === 'homeSettings'
      )

      // Keep the Home Sections UI usable even if the newly added backend
      // endpoints have not been deployed yet. The selected section falls back
      // to HOME_SECTION_DEFAULTS and can be saved once the backend is updated.
      if (homeFailed) {
        setHomeSections(current => current.length ? current : ALL_HOME_SECTION_OPTIONS.map(option => ({
          key: option.key,
          title: option.title,
          bookIds: [],
          config: { ...(HOME_SECTION_DEFAULTS[option.key] || {}) },
        })))
      }

      // Do not show the useless generic “Something went wrong” toast.
      // Tell the admin exactly which area needs the backend deployment.
      setMessage(
        failed.map(item => `${item.key}: ${item.message}`).join(' • ')
      )
    }
  }

  async function refreshEverything() {
    if (refreshing) {
      return
    }

    try {
      setRefreshing(true)

      await loadEverything()

      setMessage(
        'Latest store data loaded'
      )
    } finally {
      setRefreshing(false)
    }
  }

  async function loadOrders(
    filters = orderFilters
  ) {
    const params =
      new URLSearchParams()

    Object.entries(filters).forEach(
      ([key, value]) => {
        if (value) {
          params.set(key, value)
        }
      }
    )

    const query =
      params.toString()

    setOrders(
      await api(
        `/admin/orders${query ? `?${query}` : ''
        }`
      )
    )
  }

  const stats = useMemo(() => {
    const count = (status) =>
      orders.filter(
        (order) =>
          order.status === status
      ).length

    const activeRevenue = orders
      .filter(
        (order) =>
          order.status !== 'CANCELLED'
      )
      .reduce(
        (sum, order) =>
          sum +
          Number(order.total || 0),
        0
      )

    return {
      books:
        books.length,

      lowStock:
        books.filter(
          (book) =>
            book.stock <= 5 ||
            book.available === false
        ).length,

      outOfStock:
        books.filter(
          (book) =>
            book.stock === 0 ||
            book.available === false
        ).length,

      orders:
        orders.length,

      toProcess:
        count('BOOKING_CONFIRMED') +
        count('CONFIRMED') +
        count('PACKED'),

      inTransit:
        count('SHIPPED') +
        count('OUT_FOR_DELIVERY'),

      delivered:
        count('DELIVERED'),

      cancelled:
        count('CANCELLED'),

      revenue:
        activeRevenue,

      customers:
        customers.length,

      activeOffers:
        offers.filter(
          (offer) =>
            offer.active
        ).length,

      featuredAuthors:
        authors.filter(
          (author) =>
            author.active !== false &&
            author.featured !== false
        ).length,
    }
  }, [
    books,
    orders,
    customers,
    offers,
    authors,
  ])

  const filteredBooks = useMemo(() => {
    const q =
      inventorySearch
        .toLowerCase()
        .trim()

    return books.filter(
      (book) =>
        !q ||
        `${book.title} ${book.author} ${book.category} ${book.isbn || ''
          }`
          .toLowerCase()
          .includes(q)
    )
  }, [
    books,
    inventorySearch,
  ])

  const filteredCustomers =
    useMemo(() => {
      const q =
        customerSearch
          .toLowerCase()
          .trim()

      return customers.filter(
        (customer) =>
          (!orderedOnly ||
            customer.orderCount >
            0) &&
          (!q ||
            `${customer.name} ${customer.email} ${customer.mobile ||
              ''
              }`
              .toLowerCase()
              .includes(q))
      )
    }, [
      customers,
      customerSearch,
      orderedOnly,
    ])

  const filteredAuthors =
    useMemo(() => {
      const q =
        authorSearch
          .toLowerCase()
          .trim()

      return [...authors]
        .filter(
          (author) =>
            !q ||
            `${author.name} ${author.language || ''
              } ${author.bio || ''
              }`
              .toLowerCase()
              .includes(q)
        )
        .sort(
          (a, b) =>
            Number(
              a.displayOrder || 0
            ) -
            Number(
              b.displayOrder || 0
            ) ||
            String(
              a.name || ''
            ).localeCompare(
              String(
                b.name || ''
              )
            )
        )
    }, [
      authors,
      authorSearch,
    ])

  function bookChange(event) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target

    setBookForm(
      (current) => ({
        ...current,
        [name]:
          type === 'checkbox'
            ? checked
            : value,
      })
    )
  }

  function offerChange(event) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target

    setOfferForm(
      (current) => ({
        ...current,
        [name]:
          type === 'checkbox'
            ? checked
            : value,
      })
    )
  }

  function authorChange(event) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target

    setAuthorForm(
      (current) => ({
        ...current,
        [name]:
          type === 'checkbox'
            ? checked
            : value,
      })
    )
  }

  async function saveBook(event) {
    event.preventDefault()

    const payload = {
      ...bookForm,

      price:
        Number(bookForm.price),

      // Normal selling price. Promotions are managed only from Home Sections.
      basePrice:
        Number(bookForm.price),

      originalPrice:
        Number(
          bookForm.originalPrice
        ),

      rating:
        Number(bookForm.rating),

      reviewCount:
        Number(
          bookForm.reviewCount
        ),

      stock:
        Number(bookForm.stock),
    }

    if (editingBook) {
      await api(
        `/admin/books/${editingBook}`,
        {
          method: 'PUT',
          body: JSON.stringify(
            payload
          ),
        }
      )
    } else {
      await api(
        '/admin/books',
        {
          method: 'POST',
          body: JSON.stringify(
            payload
          ),
        }
      )
    }

    setMessage(
      editingBook
        ? 'Book updated successfully'
        : 'Book added successfully'
    )

    setEditingBook(null)
    setBookForm(emptyBook)

    setBooks(
      await api('/admin/books')
    )
  }

  function editBook(book) {
    setEditingBook(book.id)

    setBookForm({
      ...emptyBook,
      ...book,
      // The form edits the normal selling price, not the promotional amount.
      price: book.basePrice ?? book.price,
      available:
        book.available !== false,
    })

    setTab('inventory')

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  function deleteBook(book) {
    setConfirmDialog({
      eyebrow:
        'CATALOGUE',

      title:
        'Delete this book?',

      message:
        `${book.title} will be removed from the catalogue. ` +
        'This action cannot be undone.',

      confirmLabel:
        'Delete book',

      tone:
        'danger',

      onConfirm:
        async () => {
          await api(
            `/admin/books/${book.id}`,
            {
              method: 'DELETE',
            }
          )

          setBooks(
            (current) =>
              current.filter(
                (item) =>
                  item.id !==
                  book.id
              )
          )

          setMessage(
            `${book.title} removed from catalogue`
          )
        },
    })
  }

  function queueStockSave(
    bookId
  ) {
    clearTimeout(
      stockTimers.current[
      bookId
      ]
    )

    stockTimers.current[
      bookId
    ] = setTimeout(
      async () => {
        const draft =
          stockDrafts.current[
          bookId
          ]

        if (!draft) {
          return
        }

        const sent = {
          ...draft,
        }

        try {
          const updated =
            await api(
              `/admin/books/${bookId}/stock`,
              {
                method:
                  'PATCH',

                body:
                  JSON.stringify({
                    stock:
                      sent.stock,

                    available:
                      sent.available,
                  }),
              }
            )

          const latest =
            stockDrafts.current[
            bookId
            ]

          if (
            latest &&
            latest.stock ===
            sent.stock &&
            latest.available ===
            sent.available
          ) {
            delete stockDrafts
              .current[
              bookId
            ]

            setBooks(
              (current) =>
                current.map(
                  (item) =>
                    item.id ===
                      updated.id
                      ? updated
                      : item
                )
            )
          }
        } catch (error) {
          delete stockDrafts
            .current[
            bookId
          ]

          setMessage(
            error.message
          )

          setBooks(
            await api(
              '/admin/books'
            )
          )
        }
      },
      220
    )
  }

  function adjustStock(
    book,
    delta
  ) {
    const existing =
      stockDrafts.current[
      book.id
      ]

    const currentStock =
      existing
        ? existing.stock
        : Number(
          book.stock || 0
        )

    const available =
      existing
        ? existing.available
        : book.available !==
        false

    const stock =
      Math.max(
        0,
        currentStock + delta
      )

    stockDrafts.current[
      book.id
    ] = {
      stock,
      available,
    }

    setBooks(
      (current) =>
        current.map(
          (item) =>
            item.id === book.id
              ? {
                ...item,
                stock,
                available,
              }
              : item
        )
    )

    queueStockSave(book.id)
  }

  function toggleBookAvailability(
    book
  ) {
    const existing =
      stockDrafts.current[
      book.id
      ]

    const stock =
      existing
        ? existing.stock
        : Number(
          book.stock || 0
        )

    const available =
      !(
        existing
          ? existing.available
          : book.available !==
          false
      )

    stockDrafts.current[
      book.id
    ] = {
      stock,
      available,
    }

    setBooks(
      (current) =>
        current.map(
          (item) =>
            item.id === book.id
              ? {
                ...item,
                stock,
                available,
              }
              : item
        )
    )

    queueStockSave(book.id)
  }

  async function openOrder(
    order
  ) {
    setSelectedOrder(order)
    setPaymentDraft(String(paymentAmountPaid(order)))
    setOrderActions([])

    try {
      setOrderActions(
        await api(
          `/admin/orders/${order.id}/actions`
        )
      )
    } catch (err) {
      setMessage(err.message)
    }
  }

  async function saveOrderPayment() {
    if (!selectedOrder || paymentBusy) return

    const amount = Number(paymentDraft)
    const total = Number(selectedOrder.total || 0)

    if (!Number.isFinite(amount) || amount < 0) {
      setMessage('Enter a valid paid amount.')
      return
    }
    if (amount > total) {
      setMessage(`Amount paid cannot be greater than ${money(total)}.`)
      return
    }

    setPaymentBusy(true)
    try {
      const updated = await api(`/admin/orders/${selectedOrder.id}/payment`, {
        method: 'PUT',
        body: JSON.stringify({ amountPaid: amount }),
      })

      setOrders(current =>
        current.map(item => item.id === updated.id ? updated : item)
      )
      setSelectedOrder(updated)
      setPaymentDraft(String(paymentAmountPaid(updated)))
      setMessage(`Payment updated for order #${updated.orderNumber}.`)
    } catch (err) {
      setMessage(err.message)
    } finally {
      setPaymentBusy(false)
    }
  }

  async function executeOrderAction(
    action
  ) {
    if (
      !selectedOrder ||
      orderActionBusy
    ) {
      return
    }

    const previousOrder =
      selectedOrder

    const optimisticStatus =
      action.status ||
      selectedOrder.status

    const optimisticOrder = {
      ...selectedOrder,
      status:
        optimisticStatus,
    }

    // Update the UI immediately so status changes feel instant,
    // even if the API is waking up.
    setOrderActionBusy(true)

    setSelectedOrder(
      optimisticOrder
    )

    setOrders(
      (current) =>
        current.map(
          (item) =>
            item.id ===
              optimisticOrder.id
              ? {
                ...item,
                status:
                  optimisticStatus,
              }
              : item
        )
    )

    setOrderActions([])

    try {
      const updated =
        await api(
          `/admin/orders/${selectedOrder.id}/status`,
          {
            method: 'PUT',

            body:
              JSON.stringify({
                status:
                  action.status,

                note:
                  '',
              }),
          }
        )

      setOrders(
        (current) =>
          current.map(
            (item) =>
              item.id ===
                updated.id
                ? updated
                : item
          )
      )

      setStatusOptions(
        (current) =>
          current.includes(
            updated.status
          )
            ? current
            : [
              ...current,
              updated.status,
            ]
      )

      setSelectedOrder(
        updated
      )

      setMessage(
        `Order #${updated.orderNumber} updated to ${statusLabel(
          updated.status
        )}`
      )

      // Only the next available workflow actions
      // are needed before the modal is usable again.
      try {
        setOrderActions(
          await api(
            `/admin/orders/${updated.id}/actions`
          )
        )
      } catch {
        setOrderActions([])
      }

      // Inventory/customer totals refresh without
      // blocking the status interaction.
      Promise.allSettled([
        api('/admin/books'),
        api('/admin/customers'),
      ]).then(
        ([
          bookResult,
          customerResult,
        ]) => {
          if (
            bookResult.status ===
            'fulfilled'
          ) {
            setBooks(
              bookResult.value
            )
          }

          if (
            customerResult.status ===
            'fulfilled'
          ) {
            setCustomers(
              customerResult.value
            )
          }
        }
      )
    } catch (err) {
      // Roll back optimistic UI
      // if backend rejects the transition.
      setSelectedOrder(
        previousOrder
      )

      setOrders(
        (current) =>
          current.map(
            (item) =>
              item.id ===
                previousOrder.id
                ? previousOrder
                : item
          )
      )

      try {
        setOrderActions(
          await api(
            `/admin/orders/${previousOrder.id}/actions`
          )
        )
      } catch {
        setOrderActions([])
      }

      setMessage(
        err.message
      )
    } finally {
      setOrderActionBusy(false)
    }
  }

  function confirmShipment() {
    if (!shipmentAction) return

    const courierName = shipmentForm.courierName.trim()
    const trackingNumber = shipmentForm.trackingNumber.trim()

    if (!courierName || !trackingNumber) {
      setMessage('Courier name and tracking number are required before shipping.')
      return
    }

    const action = shipmentAction
    setShipmentAction(null)
    executeOrderAction(action)
  }

  function performOrderAction(
    action
  ) {
    if (
      !selectedOrder ||
      orderActionBusy
    ) {
      return
    }

    if (action.status === 'SHIPPED') {
      setShipmentAction(action)
      setShipmentForm({
        courierName: selectedOrder.courierName || '',
        trackingNumber: selectedOrder.trackingNumber || '',
      })
      return
    }

    if (
      action.action ===
      'CANCEL' ||
      action.action ===
      'REOPEN'
    ) {
      setConfirmDialog({
        eyebrow:
          'ORDER WORKFLOW',

        title:
          action.action ===
            'CANCEL'
            ? 'Cancel this order?'
            : 'Reopen this order?',

        message:
          action.action ===
            'CANCEL'
            ? `Order #${selectedOrder.orderNumber} will be cancelled and reserved stock will be returned.`
            : `Order #${selectedOrder.orderNumber} will move back to Booking Confirmed if stock is available.`,

        confirmLabel:
          action.label,

        tone:
          action.action ===
            'CANCEL'
            ? 'danger'
            : 'success',

        onConfirm:
          () =>
            executeOrderAction(
              action
            ),
      })

      return
    }

    executeOrderAction(
      action
    )
  }

  function orderFilterChange(
    event
  ) {
    const {
      name,
      value,
    } = event.target

    setOrderFilters(
      (current) => ({
        ...current,
        [name]: value,
      })
    )
  }

  async function applyOrderFilters(
    event
  ) {
    event?.preventDefault()

    await loadOrders(
      orderFilters
    )
  }

  async function clearOrderFilters() {
    const blank = {
      q: '',
      status: '',
      from: '',
      to: '',
      month: '',
    }

    setOrderFilters(blank)

    await loadOrders(blank)
  }

  async function saveAuthor(
    event
  ) {
    event.preventDefault()

    const payload = {
      ...authorForm,

      displayOrder:
        Number(
          authorForm.displayOrder ||
          0
        ),
    }

    if (editingAuthor) {
      await api(
        `/admin/authors/${editingAuthor}`,
        {
          method: 'PUT',

          body:
            JSON.stringify(
              payload
            ),
        }
      )
    } else {
      await api(
        '/admin/authors',
        {
          method: 'POST',

          body:
            JSON.stringify(
              payload
            ),
        }
      )
    }

    setEditingAuthor(null)
    setAuthorForm(emptyAuthor)

    const [
      authorData,
      bookData,
    ] = await Promise.all([
      api('/admin/authors'),
      api('/admin/books'),
    ])

    setAuthors(authorData)
    setBooks(bookData)

    setMessage(
      editingAuthor
        ? 'Author updated successfully'
        : 'Author added successfully'
    )
  }

  function editAuthor(
    author
  ) {
    setEditingAuthor(
      author.id
    )

    setAuthorForm({
      ...emptyAuthor,
      ...author,

      active:
        author.active !== false,

      featured:
        author.featured !==
        false,
    })

    setTab('authors')

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  function deleteAuthor(
    author
  ) {
    setConfirmDialog({
      eyebrow:
        'AUTHORS',

      title:
        'Remove this author profile?',

      message:
        `${author.name} will be removed from the featured author manager. ` +
        'Existing books will keep their author name.',

      confirmLabel:
        'Remove author',

      tone:
        'danger',

      onConfirm:
        async () => {
          await api(
            `/admin/authors/${author.id}`,
            {
              method: 'DELETE',
            }
          )

          setAuthors(
            (current) =>
              current.filter(
                (item) =>
                  item.id !==
                  author.id
              )
          )

          setMessage(
            `${author.name} removed from author manager`
          )
        },
    })
  }

  async function saveOffer(
    event
  ) {
    event.preventDefault()

    const bundle = offerForm.offerType === 'BUY_GET'
    const required = (offerForm.buyItems || []).map(line => ({ bookId: line.bookId, quantity: Number(line.quantity) }))
    const gifts = (offerForm.giftItems || []).map(line => ({ bookId: line.bookId, quantity: Number(line.quantity) }))
    const validLines = lines => lines.length > 0 && lines.length <= 15 &&
      lines.every(line => line.bookId && Number.isInteger(line.quantity) && line.quantity >= 1 && line.quantity <= 50) &&
      new Set(lines.map(line => line.bookId)).size === lines.length
    if (bundle && (!validLines(required) || !validLines(gifts))) {
      setMessage('Select each book and a quantity from 1–50. A book cannot be repeated in the same list.')
      return
    }
    const lineDescription = lines => lines.map(line => `${line.quantity} ${books.find(book => String(book.id) === String(line.bookId))?.title || 'book'}`).join(' + ')
    const generatedTitle = `Buy ${lineDescription(required)} · Receive ${lineDescription(gifts)} free`
    const payload = {
      ...offerForm,
      title: bundle && !(offerForm.title || '').trim() ? generatedTitle : offerForm.title,
      description: bundle && !(offerForm.description || '').trim() ? `Purchase ${lineDescription(required)} to receive ${lineDescription(gifts)} free. Gifts are added automatically at checkout.` : offerForm.description,
      code: bundle ? '' : offerForm.code,
      offerType: bundle ? 'BUY_GET' : 'COUPON',
      buyItems: bundle ? required : offerForm.buyItems,
      giftItems: bundle ? gifts : offerForm.giftItems,
      // Legacy fields remain populated for older clients.
      buyBookId: bundle ? required[0].bookId : offerForm.buyBookId,
      getBookId: bundle ? gifts[0].bookId : offerForm.getBookId,
      buyQuantity: bundle ? required[0].quantity : Number(offerForm.buyQuantity || 1),
      getQuantity: bundle ? gifts[0].quantity : Number(offerForm.getQuantity || 1),

      discountValue:
        Number(
          offerForm.discountValue
        ),

      minOrderAmount:
        Number(
          offerForm.minOrderAmount
        ),
    }

    if (editingOffer) {
      await api(
        `/admin/offers/${editingOffer}`,
        {
          method: 'PUT',

          body:
            JSON.stringify(
              payload
            ),
        }
      )
    } else {
      await api(
        '/admin/offers',
        {
          method: 'POST',

          body:
            JSON.stringify(
              payload
            ),
        }
      )
    }

    setEditingOffer(null)
    setOfferForm(emptyOffer)

    setOffers(await api('/admin/offers'))
    window.dispatchEvent(new Event('tv:catalogue-updated'))
    localStorage.setItem('tv:catalogue-updated', String(Date.now()))
    setMessage('Offer saved successfully')
  }

  function editOffer(
    offer
  ) {
    setEditingOffer(
      offer.id
    )

    setOfferForm({
      ...emptyOffer,
      ...offer,
      buyItems: offer.buyItems?.length ? offer.buyItems : [{ bookId: offer.buyBookId || '', quantity: offer.buyQuantity || 1 }],
      giftItems: offer.giftItems?.length ? offer.giftItems : [{ bookId: offer.getBookId || '', quantity: offer.getQuantity || 1 }],
    })

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  function deleteOffer(
    offer
  ) {
    setConfirmDialog({
      eyebrow:
        'PROMOTIONS',

      title:
        'Delete this promotion?',

      message:
        `${offer.title} will no longer be available in the admin console or customer offers.`,

      confirmLabel:
        'Delete promotion',

      tone:
        'danger',

      onConfirm:
        async () => {
          await api(
            `/admin/offers/${offer.id}`,
            {
              method: 'DELETE',
            }
          )

          setOffers(
            (current) =>
              current.filter(
                (item) =>
                  item.id !==
                  offer.id
              )
          )

          window.dispatchEvent(new Event('tv:catalogue-updated'))
          localStorage.setItem('tv:catalogue-updated', String(Date.now()))
          setMessage(`${offer.title} deleted`)
        },
    })
  }

  const [homeSectionSaving, setHomeSectionSaving] = useState(false)

  async function saveHomeSection() {
    if (homeSectionSaving) return
    const key = selectedHomeSectionKey
    const selectedIds = [...selectedHomeBookIds]
    const config = { ...homeConfigForm }
    if (key === 'cashback') {
      config.mode = 'MANUAL'
      const rules = {}
      for (const id of selectedIds) {
        const book = books.find(item => item.id === id)
        const rule = config.perBookCashbacks?.[id] || { type: 'PERCENT', value: 5 }
        const value = Number(rule.value)
        const sellingPrice = Number(book?.price || 0)
        const type = rule.type === 'FIXED' ? 'FIXED' : 'PERCENT'
        if (!book || !Number.isFinite(value) || value <= 0 || sellingPrice <= 0 ||
            (type === 'PERCENT' && value > 100) ||
            (type === 'FIXED' && value > sellingPrice)) {
          setMessage(`Enter a valid cashback for ${book?.title || id}.`)
          return
        }
        rules[id] = { type, value }
      }
      config.perBookCashbacks = rules
      delete config.cashbackType
      delete config.cashbackValue
      delete config.maxCashback
    }
    if (key === 'discounted') {
      // Discounts are always chosen per book; the removed mode / maximum controls no longer apply.
      config.mode = 'MANUAL'
      config.limit = 30
    }
    if (key === 'discounted' && config.mode === 'MANUAL') {
      if (!selectedIds.length) { setMessage('Please select at least one book.'); return }
      const discounts = {}
      for (const id of selectedIds) {
        const entry = perBookDiscounts[id] || { type: 'PERCENT', value: 0 }
        const value = Number(entry.value)
        const book = books.find(item => item.id === id)
        const original = Number(book?.basePrice || book?.price || 0)
        if (!Number.isFinite(value) || value < 0 ||
            (entry.type === 'PERCENT' && value > 100) ||
            (entry.type === 'FIXED' && value >= original)) {
          setMessage(`Enter a valid discount for ${book?.title || id}.`)
          return
        }
        discounts[id] = { type: entry.type === 'FIXED' ? 'FIXED' : 'PERCENT', value }
      }
      config.perBookDiscounts = discounts
    }
    setHomeSectionSaving(true)
    try {
      const saved = await api(`/admin/home-sections/${encodeURIComponent(key)}`, {
        method: 'PUT',
        body: JSON.stringify({ key, bookIds: selectedIds, config }),
      })
      setHomeSections(current => current.some(section => section.key === key)
        ? current.map(section => section.key === key ? saved : section)
        : [...current, saved])
      const updatedBooks = await api('/admin/books')

setBooks(updatedBooks)

// Notify the public catalogue in this browser tab
window.dispatchEvent(
  new Event('tv:catalogue-updated')
)

// Notify other open tabs
localStorage.setItem(
  'tv:catalogue-updated',
  String(Date.now())
)

setMessage(
  key === 'cashback' ? 'Book-wise cashback saved. Customers will see the updated cashback on eligible cards.'
    : 'Home section and individual discounts saved successfully'
)
    } catch (err) {
      setMessage(err.message || 'Unable to save home section')
    } finally {
      setHomeSectionSaving(false)
    }
  }

  async function saveHomeSettings() {
    try {
      const saved = await api('/admin/home-settings', {
        method: 'PUT',
        body: JSON.stringify({
          bannerUrls: homeSettingsForm.bannerUrls.filter(Boolean),
          activeBannerIndex: Number(homeSettingsForm.activeBannerIndex || 0),
        }),
      })
      setHomeSettingsForm({
        bannerUrls: [0, 1, 2, 3].map(index => saved?.bannerUrls?.[index] || ''),
        activeBannerIndex: Number(saved?.activeBannerIndex || 0),
      })
      setMessage('Home banners saved successfully')
    } catch (err) {
      setMessage(err.message)
    }
  }

  const filteredHomeBooks = useMemo(() => {
    const q = homeBookSearch.toLowerCase().trim()
    return books.filter(book =>
      !q || `${book.title} ${book.author} ${book.category}`.toLowerCase().includes(q)
    )
  }, [books, homeBookSearch])

  async function saveDeliverySettings(event) {
    event.preventDefault()
    if (savingDelivery) return
    setSavingDelivery(true)
    try {
      const saved = await api('/admin/delivery-settings', {
        method: 'PUT',
        body: JSON.stringify(deliveryForm),
      })
      setDeliveryForm({ ...DEFAULT_DELIVERY_SETTINGS, ...saved })
      setMessage('Delivery settings saved successfully')
    } catch (err) {
      setMessage(err.message || 'Unable to save delivery settings')
    } finally {
      setSavingDelivery(false)
    }
  }

  async function saveHomepageSlide(event) {
    event.preventDefault()
    if (savingHomepageSlide) return
    setSavingHomepageSlide(true)
    try {
      const url = editingHomepageSlide ? `/admin/homepage-slides/${editingHomepageSlide}` : '/admin/homepage-slides'
      await api(url, { method: editingHomepageSlide ? 'PUT' : 'POST', body: JSON.stringify({ ...homepageSlideForm, buttonLink: homepageSlideForm.buttonLink.includes('BOOK_ID') ? (homepageSlideForm.bookId ? `/book/${encodeURIComponent(homepageSlideForm.bookId)}` : '/shop') : homepageSlideForm.buttonLink }) })
      setHomepageSlides(await api('/admin/homepage-slides'))
      setHomepageSlideForm({ ...emptyHomepageSlide })
      setEditingHomepageSlide(null)
      setMessage('Homepage slide saved')
    } catch (error) { setMessage(error.message || 'Unable to save slide') }
    finally { setSavingHomepageSlide(false) }
  }

  async function deleteHomepageSlide(id) {
    if (!window.confirm('Delete this slide? Existing books and orders will not be changed.')) return
    try {
      await api(`/admin/homepage-slides/${id}`, { method: 'DELETE' })
      setHomepageSlides(await api('/admin/homepage-slides'))
      if (editingHomepageSlide === id) { setEditingHomepageSlide(null); setHomepageSlideForm({ ...emptyHomepageSlide }) }
      setMessage('Slide deleted')
    } catch (error) { setMessage(error.message || 'Unable to delete slide') }
  }

  async function moveHomepageSlide(index, offset) {
    const destination = index + offset
    if (destination < 0 || destination >= homepageSlides.length) return
    const ordered = [...homepageSlides]
    ;[ordered[index], ordered[destination]] = [ordered[destination], ordered[index]]
    try {
      setHomepageSlides(await api('/admin/homepage-slides/reorder', {
        method: 'PUT', body: JSON.stringify({ ids: ordered.map(item => item.id) }),
      }))
      setMessage('Slide order saved')
    } catch (error) { setMessage(error.message || 'Unable to reorder slides') }
  }

  const navItems = [
    [
      'overview',
      '▦',
      'Dashboard',
    ],
    [
      'orders',
      '▣',
      'Orders',
    ],
    [
      'inventory',
      '▤',
      'Books',
    ],
    [
      'customers',
      '◎',
      'Customers',
    ],
    // [
    //   'amazon',
    //   '⌁',
    //   'Amazon Orders',
    // ],
    [
      'authors',
      '✎',
      'Authors',
    ],
    [
      'offers',
      '✦',
      'Offers',
    ],
    [
      'homeSections',
      '▥',
      'Home Sections',
    ],
    ['homepageSlides', '▧', 'Homepage Banners'],
    [
      'delivery',
      '🚚',
      'Delivery Settings',
    ],
  ]

  return (

   <div className="admin-shell-v6">

      {/* Mobile logo / sidebar trigger */}
      <div className={`admin-mobile-logo-trigger ${mobileSidebarOpen ? 'is-hidden' : ''}`}>
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(true)}
          aria-label="Open admin menu"
        >
          <img src="/logo-original.png" alt="Thulirkum Ver" />
        </button>
      </div>

      {/* Tap anywhere outside the sidebar to close it */}
      {mobileSidebarOpen && (
        <button
          type="button"
          className="admin-mobile-sidebar-overlay"
          onClick={() => setMobileSidebarOpen(false)}
          onTouchStart={() => setMobileSidebarOpen(false)}
          aria-label="Close menu"
        />
      )}
      <nav className="tv-admin-bottom-nav" aria-label="Admin mobile navigation">
        {[
          ['overview', LayoutDashboard, 'Home'],
          ['orders', ShoppingCart, 'Orders'],
          ['inventory', BookOpen, 'Books'],
          ['customers', Users, 'Customers'],
        ].map(([key, Icon, label]) => (
          <button type="button" key={key} className={tab === key ? 'is-active' : ''}
            onClick={() => { setTab(key); setMobileSidebarOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            aria-current={tab === key ? 'page' : undefined}>
            <Icon size={21} strokeWidth={2} /><span>{label}</span>
          </button>
        ))}
        <button type="button" onClick={() => setMobileSidebarOpen(true)} aria-label="More admin sections">
          <Menu size={21} strokeWidth={2}/><span>More</span>
        </button>
      </nav>
      {/* Sidebar */}
      <aside
        className={`admin-sidebar-v6 glass-admin-sidebar ${mobileSidebarOpen ? 'mobile-sidebar-open' : ''
          }`}
      >
        <div className="admin-brand-v6">
          <img
            src="/logo.png"
            alt="Thulirkum Ver"
            className="admin-brand-logo"
          />
        </div>

        <div
          className="admin-sprout-glass-v73"
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 120 120"
            role="presentation"
          >
            <path d="M60 94V50" />

            <path d="M59 67C42 64 31 54 28 38c16 1 28 10 31 29Z" />

            <path d="M61 56c4-16 15-27 32-30-1 17-12 29-32 30Z" />

            <path d="M60 80c12-8 22-8 32-4-6 11-16 17-32 16" />
          </svg>
        </div>

        <nav className="admin-nav-v6">
          {navItems.map(
            ([
              key,
              icon,
              label,
            ]) => (
              <button
                key={key}
                className={
                  tab === key
                    ? 'active'
                    : ''
                }
                onClick={() => {
                  setTab(key)
                  setMobileSidebarOpen(false)
                }}
              >
                <span>
                  {icon}
                </span>

                <strong>
                  {label}
                </strong>

                {key ===
                  'orders' &&
                  stats.toProcess >
                  0 && (
                    <b>
                      {
                        stats.toProcess
                      }
                    </b>
                  )}

                {key ===
                  'inventory' &&
                  stats.lowStock >
                  0 && (
                    <b>
                      {
                        stats.lowStock
                      }
                    </b>
                  )}
              </button>
            )
          )}
        </nav>

        <div className="admin-profile-v6">
          <div className="admin-avatar-v6">
            {user?.name
              ?.charAt(0)
              ?.toUpperCase()}
          </div>

          <div>
            <strong>
              {user?.name}
            </strong>

            <small>
              {user?.email}
            </small>
          </div>

          <button
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="admin-main-v6">
        <header className="admin-top-v6 glass-panel tv-admin-premium-top">
          <div className="tv-admin-header-brand" aria-label="Thulirkum Ver admin portal">
            <img src="/logo-icon.jpeg" alt="Thulirkum Ver" />
            <div><strong>Thulirkum Ver</strong><small>ADMIN PORTAL</small></div>
          </div>
          <div className="tv-admin-header-copy">
            <span className="admin-kicker-v6">
              STORE MANAGEMENT
            </span>

            <h1>
              {
                navItems.find(
                  ([key]) =>
                    key === tab
                )?.[2]
              }
            </h1>

            <p>
              {tab === 'homeSections'
                ? 'Curate collections and discounts for your storefront.'
                : tab === 'overview'
                  ? 'Your store at a glance.'
                  : 'Manage your store with confidence.'}
            </p>
          </div>

          <div className="admin-top-actions-v6">
            <button
              type="button"
              className="admin-view-store-btn"
              onClick={() =>
                window.open(
                  `${window.location.origin}/home`,
                  '_blank',
                  'noopener,noreferrer'
                )
              }
            >
              <ExternalLink size={16} aria-hidden="true" />
              View website
            </button>

            <button
              className={
                refreshing
                  ? 'is-refreshing'
                  : ''
              }
              onClick={
                refreshEverything
              }
              disabled={
                refreshing
              }
            >
              <RefreshCw size={16} aria-hidden="true" className={refreshing ? 'tv-spin' : ''} />

              {refreshing
                ? 'Refreshing...'
                : 'Refresh'}
            </button>
          </div>
          {message && (
            <div className="tv-admin-header-notice" role="status" aria-live="polite">
              <span className="tv-admin-notice-symbol" aria-hidden="true">✓</span>
              <span className="tv-admin-notice-text">{message}</span>
              <button type="button" aria-label="Dismiss notification" onClick={() => setMessage('')}>×</button>
            </div>
          )}
        </header>

        {/* Overview */}
        {tab === 'overview' && (
          <>
            <section className="admin-hero-v6 glass-panel tv-admin-premium-hero">
              <div>
                <span>
                  STORE OVERVIEW
                </span>

                <h2>
                  Welcome back,{' '}
                  {
                    'Cheif'}
                  .
                </h2>

                <p>
                  Monitor orders, stock and
                  customers from one focused
                  workspace.
                </p>
              </div>

              <div className="admin-hero-actions-v6">
                <button
                  onClick={() =>
                    setTab(
                      'orders'
                    )
                  }
                >
                  Process orders
                </button>

                <button
                  onClick={() =>
                    setTab(
                      'inventory'
                    )
                  }
                >
                  Manage catalogue
                </button>
              </div>
            </section>

            <section className="admin-kpi-grid-v6 concept-kpi-grid tv-admin-premium-kpis">
              <KpiCard
                label="Total Orders"
                value={stats.orders}
                detail={`${stats.toProcess} need processing`}
                icon={<ShoppingCart size={25} />}
              />

              <KpiCard
                label="Total Revenue"
                value={`₹${Math.round(
                  stats.revenue
                ).toLocaleString()}`}
                detail="Excludes cancelled orders"
                icon={<IndianRupee size={25} />}
              />

              <KpiCard
                label="Total Customers"
                value={
                  stats.customers
                }
                detail="Registered accounts"
                icon={<Users size={25} />}
              />

              <KpiCard
                label="Total Books"
                value={stats.books}
                detail={`${stats.lowStock} stock alerts`}
                icon={<BookOpen size={25} />}
              />
            </section>

            <section className="tv-admin-quick-actions" aria-label="Quick actions">
              <div className="tv-admin-quick-heading"><h2>Quick Actions</h2></div>
              <div className="tv-admin-quick-grid">
                {[
                  ['inventory', Plus, 'Add Book'],
                  ['orders', ShoppingCart, 'Orders'],
                  ['customers', Users, 'Customers'],
                ].map(([key, Icon, label]) => (
                  <button type="button" key={label} onClick={() => {setTab(key); window.scrollTo({top: 0, behavior: 'smooth'})}}>
                    <Icon size={23} strokeWidth={2.1}/><span>{label}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="admin-analytics-grid-c8">
              <div className="admin-panel-v6 concept-chart-panel">
                <PanelTitle
                  eyebrow="PERFORMANCE"
                  title="Sales Overview"
                  copy="Order value trend from your live order data."
                />

                <SalesTrendChart
                  orders={orders}
                />
              </div>

              <div className="admin-panel-v6 concept-chart-panel">
                <PanelTitle
                  eyebrow="CATALOGUE"
                  title="Catalogue Overview"
                  copy="Book distribution across your main categories."
                />

                <CatalogueOverview
                  books={books}
                />
              </div>
            </section>

            <section className="admin-panel-v6 concept-recent-orders">
              <PanelTitle
                eyebrow="FULFILMENT"
                title="Recent Orders"
                copy="Latest customer orders and their current status."
                action={
                  <button
                    onClick={() =>
                      setTab(
                        'orders'
                      )
                    }
                  >
                    View all
                  </button>
                }
              />

              <OrderTable
                orders={orders.slice(
                  0,
                  7
                )}
                onOpen={openOrder}
              />
            </section>
          </>
        )}

        {/* Orders */}
        {tab === 'orders' && (
          <section className="admin-panel-v6 glass-panel">
            <PanelTitle
              eyebrow="ORDER DESK"
              title="Orders"
              copy="Search, filter and open an order to manage its next valid action."
            />

            <form
              className="admin-filters-v6"
              onSubmit={
                applyOrderFilters
              }
            >
              <input
                name="q"
                value={
                  orderFilters.q
                }
                onChange={
                  orderFilterChange
                }
                placeholder="Order number, customer, email..."
              />

              <PremiumSelect
                value={
                  orderFilters.status
                }
                options={[
                  {
                    value: '',
                    label:
                      'All statuses',
                  },

                  ...statusOptions.map(
                    (value) => ({
                      value,

                      label:
                        statusLabel(
                          value
                        ),
                    })
                  ),
                ]}
                onChange={(
                  value
                ) =>
                  setOrderFilters(
                    (
                      current
                    ) => ({
                      ...current,
                      status:
                        value,
                    })
                  )
                }
                className="admin-filter-select-c8"
              />

              <label>
                <span>
                  From
                </span>

                <PremiumDatePicker
                  value={
                    orderFilters.from
                  }
                  onChange={(
                    value
                  ) =>
                    setOrderFilters(
                      (
                        current
                      ) => ({
                        ...current,
                        from:
                          value,
                      })
                    )
                  }
                />
              </label>

              <label>
                <span>
                  To
                </span>

                <PremiumDatePicker
                  value={
                    orderFilters.to
                  }
                  onChange={(
                    value
                  ) =>
                    setOrderFilters(
                      (
                        current
                      ) => ({
                        ...current,
                        to:
                          value,
                      })
                    )
                  }
                />
              </label>

              <label>
                <span>
                  Month
                </span>

                <PremiumDatePicker
                  mode="month"
                  value={
                    orderFilters.month
                  }
                  onChange={(
                    value
                  ) =>
                    setOrderFilters(
                      (
                        current
                      ) => ({
                        ...current,
                        month:
                          value,
                      })
                    )
                  }
                />
              </label>

              <button
                className="admin-primary-v6"
                type="submit"
              >
                Apply
              </button>

              <button
                className="admin-secondary-v6"
                type="button"
                onClick={
                  clearOrderFilters
                }
              >
                Clear
              </button>
            </form>

            <OrderTable
              orders={orders}
              onOpen={openOrder}
              detailed
            />
          </section>
        )}

        {/* Inventory */}
        {tab === 'inventory' && (
          <>
            <section className="admin-panel-v6 glass-panel">
              <PanelTitle
                eyebrow="CATALOGUE EDITOR"
                title={
                  editingBook
                    ? 'Edit book'
                    : 'Add book'
                }
                copy="Catalogue data is saved through the backend and reflected on the customer store."
                action={
                  editingBook ? (
                    <button
                      onClick={() => {
                        setEditingBook(
                          null
                        )

                        setBookForm(
                          emptyBook
                        )
                      }}
                    >
                      Cancel edit
                    </button>
                  ) : null
                }
              />

              <form
                className="admin-form-grid-v6"
                onSubmit={
                  saveBook
                }
              >
                <label>
                  Book title

                  <input
                    name="title"
                    value={
                      bookForm.title
                    }
                    onChange={
                      bookChange
                    }
                    required
                  />
                </label>

                <label>
                  Author

                  <input
                    name="author"
                    value={
                      bookForm.author
                    }
                    onChange={
                      bookChange
                    }
                    required
                  />
                </label>

                <label>
                  Category

                  <input
                    name="category"
                    value={
                      bookForm.category
                    }
                    onChange={
                      bookChange
                    }
                    required
                  />
                </label>

                <label>
                  Language

                  <input
                    name="language"
                    value={
                      bookForm.language
                    }
                    onChange={
                      bookChange
                    }
                    required
                  />
                </label>

                <label>
                  Publisher

                  <input
                    name="publisher"
                    value={
                      bookForm.publisher
                    }
                    onChange={
                      bookChange
                    }
                  />
                </label>

                <label>
                  ISBN

                  <input
                    name="isbn"
                    value={
                      bookForm.isbn
                    }
                    onChange={
                      bookChange
                    }
                  />
                </label>

                <label className="wide">
                  Cover path / URL

                  <input
                    name="image"
                    value={
                      bookForm.image
                    }
                    onChange={
                      bookChange
                    }
                  />
                </label>

                <label>
                  Selling price

                  <input
                    name="price"
                    type="number"
                    min="0"
                    value={
                      bookForm.price
                    }
                    onChange={
                      bookChange
                    }
                    required
                  />
                </label>

                <label>
                  MRP

                  <input
                    name="originalPrice"
                    type="number"
                    min="0"
                    value={
                      bookForm.originalPrice
                    }
                    onChange={
                      bookChange
                    }
                    required
                  />
                </label>

                <label>
                  Stock

                  <input
                    name="stock"
                    type="number"
                    min="0"
                    value={
                      bookForm.stock
                    }
                    onChange={
                      bookChange
                    }
                    required
                  />
                </label>

                <label>
                  Rating

                  <input
                    name="rating"
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={
                      bookForm.rating
                    }
                    onChange={
                      bookChange
                    }
                  />
                </label>

                <label>
                  Review count

                  <input
                    name="reviewCount"
                    type="number"
                    min="0"
                    value={
                      bookForm.reviewCount
                    }
                    onChange={
                      bookChange
                    }
                  />
                </label>

                <label className="wide">
                  Description

                  <textarea
                    name="description"
                    value={
                      bookForm.description
                    }
                    onChange={
                      bookChange
                    }
                    rows="4"
                  />
                </label>

                <div className="admin-toggle-row-v6 wide">
                  <label className="premium-check-v73">
                    <input
                      name="available"
                      type="checkbox"
                      checked={
                        bookForm.available !==
                        false
                      }
                      onChange={
                        bookChange
                      }
                    />

                    Available for sale
                  </label>

                  <label className="premium-check-v73">
                    <input
                      name="featured"
                      type="checkbox"
                      checked={
                        bookForm.featured
                      }
                      onChange={
                        bookChange
                      }
                    />

                    Featured
                  </label>

                  <label className="premium-check-v73">
                    <input
                      name="newArrival"
                      type="checkbox"
                      checked={
                        bookForm.newArrival
                      }
                      onChange={
                        bookChange
                      }
                    />

                    New arrival
                  </label>
                </div>

                <button
                  className="admin-primary-v6"
                  type="submit"
                >
                  {editingBook
                    ? 'Update book'
                    : 'Add book'}
                </button>
              </form>
            </section>

            <section className="admin-panel-v6 glass-panel">
              <PanelTitle
                eyebrow="INVENTORY"
                title={`Catalogue (${filteredBooks.length})`}
                copy="Manage stock and availability without changing code."
                action={
                  <input
                    className="admin-search-v6"
                    value={
                      inventorySearch
                    }
                    onChange={(
                      event
                    ) =>
                      setInventorySearch(
                        event
                          .target
                          .value
                      )
                    }
                    placeholder="Search catalogue..."
                  />
                }
              />

              <div className="inventory-grid-v6">
                {filteredBooks.map(
                  (book) => (
                    <article
                      className={`inventory-card-v6 glass-card ${book.available ===
                          false ||
                          book.stock ===
                          0
                          ? 'out'
                          : ''
                        }`}
                      key={book.id}
                    >
                      <img
                        src={
                          book.image
                        }
                        alt=""
                      />

                      <div className="inventory-info-v6">
                        <strong>
                          {
                            book.title
                          }
                        </strong>

                        <span>
                          {
                            book.author
                          }
                        </span>

                        <small>
                          {
                            book.category
                          }
                        </small>
                      </div>

                      <div className="inventory-stock-v6">
                        <span>
                          Stock
                        </span>

                        <strong>
                          {
                            book.stock
                          }
                        </strong>

                        <small>
                          {book.available ===
                            false ||
                            book.stock ===
                            0
                            ? 'Unavailable'
                            : book.stock <=
                              5
                              ? 'Low stock'
                              : 'Available'}
                        </small>
                      </div>

                      <div className="inventory-stepper-v6">
                        <button
                          onClick={() =>
                            adjustStock(
                              book,
                              1
                            )
                          }
                        >
                          +1
                        </button>

                        <button
                          onClick={() =>
                            adjustStock(
                              book,
                              5
                            )
                          }
                        >
                          +5
                        </button>

                        <button
                          disabled={
                            book.stock ===
                            0
                          }
                          onClick={() =>
                            adjustStock(
                              book,
                              -1
                            )
                          }
                        >
                          −1
                        </button>
                      </div>

                      <div className="inventory-actions-v6">
                        <button
                          onClick={() =>
                            editBook(
                              book
                            )
                          }
                        >
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            toggleBookAvailability(
                              book
                            )
                          }
                        >
                          {book.available ===
                            false
                            ? 'Make available'
                            : 'Mark unavailable'}
                        </button>

                        <button
                          className="danger"
                          onClick={() =>
                            deleteBook(
                              book
                            )
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  )
                )}
              </div>
            </section>
          </>
        )}

        {/* Customers */}
        {tab === 'customers' && (
          <section className="admin-panel-v6 glass-panel customer-panel-v8">
            <PanelTitle
              eyebrow="CUSTOMER CRM"
              title="Customers"
              copy="Registered customers and order activity from your database."
            />

            <div className="customer-tools-v8">
              <input
                value={customerSearch}
                onChange={(event) => setCustomerSearch(event.target.value)}
                placeholder="Search name, email or mobile..."
              />

              <label className="premium-check-v73 customer-order-check-v8">
                <input
                  type="checkbox"
                  checked={orderedOnly}
                  onChange={(event) => setOrderedOnly(event.target.checked)}
                />
                Customers with orders only
              </label>
            </div>

            <div className="customer-card-grid-v8">
              {filteredCustomers.length === 0 ? (
                <div className="customer-empty-v8">
                  No customers match your current search.
                </div>
              ) : (
                filteredCustomers.map((customer) => (
                  <article className="customer-card-v8" key={customer.id}>
                    <div className="customer-card-head-v8">
                      <div className="customer-avatar-v8">
                        {(customer.name || 'C').trim().charAt(0).toUpperCase()}
                      </div>
                      <div className="customer-identity-v8">
                        <strong>{customer.name || 'Customer'}</strong>
                        <span>{customer.email || '—'}</span>
                      </div>
                    </div>

                    <div className="customer-card-details-v8">
                      <div className="customer-detail-v8">
                        <span>Mobile</span>
                        <strong>{customer.mobile || '—'}</strong>
                      </div>
                      <div className="customer-detail-v8">
                        <span>Registered</span>
                        <strong>{formatDate(customer.createdAt)}</strong>
                      </div>
                      <div className="customer-detail-v8">
                        <span>Last login</span>
                        <strong>{formatDateTime(customer.lastLoginAt)}</strong>
                      </div>
                      <div className="customer-detail-v8 customer-detail-highlight-v8">
                        <span>Orders</span>
                        <strong>{customer.orderCount || 0}</strong>
                      </div>
                      <div className="customer-detail-v8 customer-detail-highlight-v8">
                        <span>Total spent</span>
                        <strong>₹{Math.round(customer.totalSpent || 0).toLocaleString()}</strong>
                      </div>
                      <div className="customer-detail-v8">
                        <span>Last order</span>
                        <strong>{formatDateTime(customer.lastOrderAt)}</strong>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        )}

        {/* Amazon seller orders */}
        {/* {tab === 'amazon' && <AmazonOrdersPanel />} */}

        {/* Authors */}
        {tab === 'authors' && (
          <section className="admin-panel-v6 admin-authors-shell-c8">
            <div className="admin-authors-head-c8">
              <div>
                <span className="admin-kicker-v6">
                  AUTHOR MANAGER
                </span>

                <h2>
                  Authors
                </h2>

                <p>
                  Manage author profiles,
                  language, portrait, biography
                  and Home page visibility.
                </p>
              </div>

              <button
                className="admin-primary-v6"
                onClick={() => {
                  setEditingAuthor(
                    null
                  )

                  setAuthorForm(
                    emptyAuthor
                  )
                }}
              >
                + Add new author
              </button>
            </div>

            <div className="admin-authors-layout-c8">
              <div className="author-directory-c8">
                <div className="author-search-row-c8">
                  <input
                    value={
                      authorSearch
                    }
                    onChange={(
                      event
                    ) =>
                      setAuthorSearch(
                        event.target
                          .value
                      )
                    }
                    placeholder="Search authors..."
                  />

                  <span>
                    {
                      filteredAuthors.length
                    }{' '}
                    authors
                  </span>
                </div>

                <div className="author-list-c8">
                  {filteredAuthors.map(
                    (author) => {
                      const titleCount =
                        books.filter(
                          (book) =>
                            String(
                              book.author ||
                              ''
                            ).toLowerCase() ===
                            String(
                              author.name ||
                              ''
                            ).toLowerCase()
                        ).length

                      return (
                        <button
                          type="button"
                          key={
                            author.id
                          }
                          className={`author-list-row-c8 ${editingAuthor ===
                              author.id
                              ? 'active'
                              : ''
                            }`}
                          onClick={() =>
                            editAuthor(
                              author
                            )
                          }
                        >
                          <span className="author-list-avatar-c8">
                            {author.image ? (
                              <img
                                src={
                                  author.image
                                }
                                alt=""
                              />
                            ) : (
                              author.name
                                ?.charAt(
                                  0
                                )
                                ?.toUpperCase()
                            )}
                          </span>

                          <span className="author-list-copy-c8">
                            <strong>
                              {
                                author.name
                              }
                            </strong>

                            <small>
                              {author.language ||
                                'Language not set'}{' '}
                              ·{' '}
                              {
                                titleCount
                              }{' '}
                              {titleCount ===
                                1
                                ? 'book'
                                : 'books'}
                            </small>
                          </span>

                          <span
                            className={`author-state-dot-c8 ${author.active ===
                                false
                                ? 'off'
                                : ''
                              }`}
                          />
                        </button>
                      )
                    }
                  )}

                  {!filteredAuthors.length && (
                    <div className="admin-empty-v6">
                      No authors found.
                    </div>
                  )}
                </div>
              </div>

              <div className="author-editor-c8">
                <div className="author-editor-title-c8">
                  <div className="author-editor-avatar-c8">
                    {authorForm.image ? (
                      <img
                        src={
                          authorForm.image
                        }
                        alt=""
                      />
                    ) : (
                      <span>
                        {authorForm.name
                          ?.charAt(
                            0
                          )
                          ?.toUpperCase() ||
                          'A'}
                      </span>
                    )}
                  </div>

                  <div>
                    <span>
                      {editingAuthor
                        ? 'EDIT AUTHOR'
                        : 'NEW AUTHOR'}
                    </span>

                    <h3>
                      {authorForm.name ||
                        'Author details'}
                    </h3>

                    <p>
                      {editingAuthor
                        ? 'Update this author profile and save the changes.'
                        : 'Create a profile that can be featured on the Home page.'}
                    </p>
                  </div>
                </div>

                <form
                  className="admin-form-grid-v6 author-form-v75 author-form-c8"
                  onSubmit={
                    saveAuthor
                  }
                >
                  <label>
                    Author name

                    <input
                      name="name"
                      value={
                        authorForm.name
                      }
                      onChange={
                        authorChange
                      }
                      required
                    />
                  </label>

                  <label>
                    Language

                    <input
                      name="language"
                      value={
                        authorForm.language
                      }
                      onChange={
                        authorChange
                      }
                      placeholder="English / Tamil"
                    />
                  </label>

                  <label className="wide">
                    Portrait image URL

                    <input
                      name="image"
                      value={
                        authorForm.image
                      }
                      onChange={
                        authorChange
                      }
                      placeholder="https://..."
                    />
                  </label>

                  <label>
                    Display order

                    <input
                      type="number"
                      min="0"
                      name="displayOrder"
                      value={
                        authorForm.displayOrder
                      }
                      onChange={
                        authorChange
                      }
                    />
                  </label>

                  <label className="wide">
                    Short bio

                    <textarea
                      name="bio"
                      value={
                        authorForm.bio
                      }
                      onChange={
                        authorChange
                      }
                      rows="4"
                      placeholder="Short biography shown with this author"
                    />
                  </label>

                  <div className="admin-toggle-row-v6 wide">
                    <label className="premium-check-v73">
                      <input
                        name="featured"
                        type="checkbox"
                        checked={
                          authorForm.featured !==
                          false
                        }
                        onChange={
                          authorChange
                        }
                      />

                      Show on Home page
                    </label>

                    <label className="premium-check-v73">
                      <input
                        name="active"
                        type="checkbox"
                        checked={
                          authorForm.active !==
                          false
                        }
                        onChange={
                          authorChange
                        }
                      />

                      Active author
                    </label>
                  </div>

                  <div className="author-editor-actions-c8 wide">
                    {editingAuthor && (
                      <button
                        type="button"
                        className="admin-secondary-v6 danger"
                        onClick={() => {
                          const author =
                            authors.find(
                              (
                                item
                              ) =>
                                item.id ===
                                editingAuthor
                            )

                          if (
                            author
                          ) {
                            deleteAuthor(
                              author
                            )
                          }
                        }}
                      >
                        Remove
                      </button>
                    )}

                    <button
                      type="button"
                      className="admin-secondary-v6"
                      onClick={() => {
                        setEditingAuthor(
                          null
                        )

                        setAuthorForm(
                          emptyAuthor
                        )
                      }}
                    >
                      Cancel
                    </button>

                    <button
                      className="admin-primary-v6"
                      type="submit"
                    >
                      {editingAuthor
                        ? 'Save changes'
                        : 'Add author'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </section>
        )}

        {/* Homepage category slideshow manager; independent of existing background banner settings. */}
        {tab === 'homepageSlides' && (
          <section className="admin-panel-v6 glass-panel tv-slide-admin">
            <PanelTitle eyebrow="HOMEPAGE" title="Homepage Banners & Slideshow"
              copy="Add slides, choose real books from inventory, and control which banners appear on the customer homepage." />
            <form onSubmit={saveHomepageSlide} className="tv-slide-editor">
              <div className="tv-slide-preset-field">
                <label>Quick heading & short-label ideas</label>
                <PremiumSelect
                  value=""
                  options={[{ value: '', label: 'Choose a ready-made heading (optional)' }, ...HOMEPAGE_SLIDE_PRESETS.map((preset, index) => ({ value: String(index), label: preset.title }))]}
                  onChange={index => {
                    if (index === '') return
                    const preset = HOMEPAGE_SLIDE_PRESETS[Number(index)]
                    if (preset) setHomepageSlideForm(current => ({ ...current, title: preset.title, eyebrow: preset.eyebrow }))
                  }}
                />
                <small>Select an idea to fill both fields. You can still change the wording below.</small>
              </div>
              <div className="tv-slide-grid">
                <label>Heading *
                  <input required maxLength={130} value={homepageSlideForm.title}
                    onChange={e => setHomepageSlideForm(v => ({ ...v, title: e.target.value }))} placeholder="Prepare Smarter. Aim Higher." />
                </label>
                <label>Short label
                  <input maxLength={90} value={homepageSlideForm.eyebrow}
                    onChange={e => setHomepageSlideForm(v => ({ ...v, eyebrow: e.target.value }))} placeholder="LEARN • PREPARE • ACHIEVE" />
                </label>
                <label className="tv-slide-wide">Description
                  <textarea maxLength={350} rows={2} value={homepageSlideForm.description}
                    onChange={e => setHomepageSlideForm(v => ({ ...v, description: e.target.value }))} />
                </label>
                <div className="tv-slide-wide tv-slide-book-field">
                  <label>Featured book (optional)</label>
                  <OfferBookDropdown
                    books={books}
                    value={homepageSlideForm.bookId}
                    onChange={id => setHomepageSlideForm(v => ({ ...v, bookId: String(id), buttonLink: (!v.buttonLink || v.buttonLink.includes('BOOK_ID') || /^\/book\/[^/]+\/?$/.test(v.buttonLink)) ? (id ? `/book/${encodeURIComponent(id)}` : '/shop') : v.buttonLink }))}
                    placeholder="Select a book to feature"
                    searchLabel="Search featured books"
                  />
                  <small>Choose a book to automatically link the slide to its product page. Use a custom link below only when needed.</small>
                  {homepageSlideForm.bookId && <button type="button" className="tv-slide-clear-book" onClick={() => setHomepageSlideForm(v => ({...v, bookId: '', buttonLink: '/shop'}))}>Remove selected book</button>}
                </div>
                <div className="tv-slide-theme-field">
                  <label>Slide colour theme</label>
                  <PremiumSelect
                    value={homepageSlideForm.theme}
                    options={HOMEPAGE_SLIDE_THEMES.map(([value, label]) => ({ value, label }))}
                    onChange={theme => setHomepageSlideForm(v => ({...v, theme}))}
                  />
                </div>
                <label>Banner image URL (optional)
                  <input value={homepageSlideForm.imageUrl} onChange={e => setHomepageSlideForm(v => ({ ...v, imageUrl: e.target.value }))}
                    placeholder="Leave blank to use selected book cover" />
                </label>
                <label>Button text
                  <input maxLength={75} value={homepageSlideForm.buttonText} onChange={e => setHomepageSlideForm(v => ({ ...v, buttonText: e.target.value }))} />
                </label>
                <label>Button link
                  <input value={homepageSlideForm.buttonLink} onChange={e => setHomepageSlideForm(v => ({ ...v, buttonLink: e.target.value }))}
                    placeholder="Select a book for an automatic link, or enter /shop" />
                </label>
                <label className="tv-slide-switch"><input type="checkbox" checked={homepageSlideForm.active}
                  onChange={e => setHomepageSlideForm(v => ({ ...v, active: e.target.checked }))} /> Show this slide on the website</label>
              </div>
              <div className="tv-slide-preview" data-theme={homepageSlideForm.theme}>
                <div className="tv-slide-preview-decor" aria-hidden="true"><span>📚</span><span>✨</span><span>🌿</span><span>📖</span></div>
                <div className="tv-slide-preview-content"><small>LIVE PREVIEW</small><h3>{homepageSlideForm.title || 'Slide heading'}</h3><p>{homepageSlideForm.description || 'Description appears here.'}</p>
                  <span className="tv-slide-preview-button">{homepageSlideForm.buttonText || 'Explore book'} <span>↗</span></span></div>
                {(homepageSlideForm.imageUrl || books.find(book => book.id === homepageSlideForm.bookId)?.image) &&
                  <img src={homepageSlideForm.imageUrl || books.find(book => book.id === homepageSlideForm.bookId)?.image} alt="Selected banner preview" />}
              </div>
              <div className="tv-slide-actions">
                <button type="submit" className="admin-primary-v6" disabled={savingHomepageSlide}>
                  {savingHomepageSlide ? 'Saving...' : editingHomepageSlide ? 'Save slide changes' : 'Add slide'}
                </button>
                <button type="button" className="admin-secondary-v6" onClick={() => { setEditingHomepageSlide(null); setHomepageSlideForm({ ...emptyHomepageSlide }); setSlideSearch('') }}>Clear form</button>
              </div>
            </form>
            <h3>Slideshow order ({homepageSlides.length} slides)</h3>
            <p className="tv-slide-help">Use arrows to reorder. An inactive slide stays saved in MongoDB but will not appear to customers.</p>
            <div className="tv-slide-list">
              {homepageSlides.map((slide, index) => (
                <article key={slide.id} className="tv-slide-list-item">
                  {slide.imageUrl || slide.bookImage ? <img src={slide.imageUrl || slide.bookImage} alt="" /> : <span>📚</span>}
                  <div><strong>{slide.title}</strong><small>{slide.bookTitle || 'No featured book'} · {slide.active ? 'Published' : 'Hidden'}</small></div>
                  <div className="tv-slide-list-actions">
                    <button type="button" title="Move up" disabled={index === 0} onClick={() => moveHomepageSlide(index, -1)}>↑</button>
                    <button type="button" title="Move down" disabled={index === homepageSlides.length - 1} onClick={() => moveHomepageSlide(index, 1)}>↓</button>
                    <button type="button" onClick={() => { setEditingHomepageSlide(slide.id); setHomepageSlideForm({ ...emptyHomepageSlide, ...slide, buttonLink: String(slide.buttonLink || '').includes('BOOK_ID') ? (slide.bookId ? `/book/${encodeURIComponent(slide.bookId)}` : '/shop') : (slide.buttonLink || (slide.bookId ? `/book/${encodeURIComponent(slide.bookId)}` : '/shop')) }); setSlideSearch(''); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>Edit</button>
                    <button type="button" className="tv-slide-delete" onClick={() => deleteHomepageSlide(slide.id)}>Delete</button>
                  </div>
                </article>
              ))}
              {!homepageSlides.length && <p>No custom slides yet. Your existing homepage category slideshow remains visible until you add one.</p>}
            </div>
          </section>
        )}

        {/* Home Sections */}
        {tab === 'homeSections' && (
          <section className="admin-home-content-v7">
            <section className="admin-panel-v6 glass-panel">
              <PanelTitle
                eyebrow="HOME CONTENT"
                title="Home Sections"
                copy="Choose one of your five homepage collections, adjust its display rules, and save your changes."
              />

              <div className="tv-home-section-choice">
                <div className="tv-home-section-choice-heading">
                  <div>
                    <span className="tv-home-section-kicker">CHOOSE WHAT TO SHOW</span>
                    <h3>Featured homepage collections</h3>
                    <p>Pick a collection and fine-tune which books appear on your homepage.</p>
                  </div>
                  <button type="button" className="tv-home-promo-toggle" onClick={() => {
                    setShowHomePromotions(current => {
                      if (current) setSelectedHomeSectionKey('top-selling')
                      else setSelectedHomeSectionKey('discounted')
                      return !current
                    })
                  }}>
                    {showHomePromotions ? '← Back to collections' : 'Manage discounts & cashback'}
                  </button>
                </div>
                <div className="tv-home-section-choices" role="group" aria-label="Homepage section">
                  {(showHomePromotions ? HOME_PROMOTION_OPTIONS : HOME_SECTION_OPTIONS).map(option => (
                    <button
                      key={option.key}
                      type="button"
                      className={`tv-home-section-choice-card ${selectedHomeSectionKey === option.key ? 'is-active' : ''}`}
                      onClick={() => setSelectedHomeSectionKey(option.key)}
                      aria-pressed={selectedHomeSectionKey === option.key}
                    >
                      <span className="tv-home-choice-icon" aria-hidden="true">{option.icon}</span>
                      <span className="tv-home-choice-name">{option.title}</span>
                      {selectedHomeSectionKey === option.key && <span className="tv-home-choice-check" aria-hidden="true">✓</span>}
                    </button>
                  ))}
                </div>
                <div className="tv-home-selected-section">
                  <div className="tv-home-selected-copy">
                    <span className="tv-home-selected-eyebrow">CURRENT COLLECTION</span>
                    <strong>{ALL_HOME_SECTION_OPTIONS.find(option => option.key === selectedHomeSectionKey)?.title}</strong>
                    <p>{ALL_HOME_SECTION_OPTIONS.find(option => option.key === selectedHomeSectionKey)?.copy}</p>
                  </div>
                  <button className="admin-primary-v6" type="button" onClick={saveHomeSection} disabled={homeSectionSaving}>
                    {homeSectionSaving ? 'Saving...' : 'Save section'}
                  </button>
                </div>
              </div>

              <div className="admin-home-config-grid-v7">
                {selectedHomeSectionKey !== 'discounted' && (
                  <label>
                    Maximum books
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={homeConfigForm.limit ?? 5}
                      onChange={event => setHomeConfigForm(current => ({ ...current, limit: Number(event.target.value || 1) }))}
                    />
                  </label>
                )}

                {selectedHomeSectionKey === 'top-selling' && (
                  <>
                    <label>
                      Selection mode
                      <PremiumSelect
                        value={homeConfigForm.mode || 'MANUAL'}
                        options={[
                          {
                            value: 'AUTO',
                            label: 'Automatically selected books',
                          },
                          {
                            value: 'MANUAL',
                            label: 'Manually selected books',
                          },
                        ]}
                        onChange={value =>
                          setHomeConfigForm(current => ({
                            ...current,
                            mode: value,
                          }))
                        }
                      />
                    </label>

                    {homeConfigForm.mode === 'AUTO' && (
                      <>
                        <label>
                          Sales period
                          <PremiumSelect
                            value={String(homeConfigForm.periodDays ?? 30)}
                            options={[
                              { value: '7', label: 'Last 7 days' },
                              { value: '30', label: 'Last 30 days' },
                              { value: '90', label: 'Last 90 days' },
                              { value: '365', label: 'Last 12 months' },
                            ]}
                            onChange={value =>
                              setHomeConfigForm(current => ({
                                ...current,
                                periodDays: Number(value),
                              }))
                            }
                          />
                        </label>

                        <label>
                          Rank by
                          <PremiumSelect
                            value={homeConfigForm.basis || 'QUANTITY'}
                            options={[
                              {
                                value: 'QUANTITY',
                                label: 'Units sold',
                              },
                              {
                                value: 'REVENUE',
                                label: 'Sales revenue',
                              },
                            ]}
                            onChange={value =>
                              setHomeConfigForm(current => ({
                                ...current,
                                basis: value,
                              }))
                            }
                          />
                        </label>
                      </>
                    )}
                  </>
                )}

                {selectedHomeSectionKey === 'highly-featured' && (
                  <label>
                    Source
                    <PremiumSelect
                      value={homeConfigForm.mode || 'MANUAL'}
                      options={[
                        { value: 'FEATURED_FLAG', label: 'Books marked Featured' },
                        { value: 'MANUAL', label: 'Manually selected books' },
                      ]}
                      onChange={value => setHomeConfigForm(current => ({ ...current, mode: value }))}
                    />
                  </label>
                )}

                {selectedHomeSectionKey === 'cashback' && (
                  <div className="admin-cashback-helper">
                    <strong>Cashback is set separately for each book.</strong>
                    <span>Select a title below, choose percentage or fixed ₹ cashback, then save. These rewards appear on customer book cards and are credited to the wallet after an eligible paid order.</span>
                  </div>
                )}

                {selectedHomeSectionKey === 'new-arrivals' && (
                  <label>
                    Source
                    <PremiumSelect
                      value={homeConfigForm.mode || 'MANUAL'}
                      options={[
                        { value: 'NEW_ARRIVAL_FLAG', label: 'Books marked New Arrival' },
                        { value: 'MANUAL', label: 'Manually selected books' },
                      ]}
                      onChange={value => setHomeConfigForm(current => ({ ...current, mode: value }))}
                    />
                  </label>
                )}

                {selectedHomeSectionKey === 'best-rated' && (
                  <>
                    <label>
                      Selection mode
                      <PremiumSelect
                        value={homeConfigForm.mode || 'MANUAL'}
                        options={[
                          {
                            value: 'AUTO',
                            label: 'Automatically selected books',
                          },
                          {
                            value: 'MANUAL',
                            label: 'Manually selected books',
                          },
                        ]}
                        onChange={value =>
                          setHomeConfigForm(current => ({
                            ...current,
                            mode: value,
                          }))
                        }
                      />
                    </label>

                    {homeConfigForm.mode === 'AUTO' && (
                      <>
                        <label>
                          Minimum rating
                          <PremiumSelect
                            value={String(homeConfigForm.minRating ?? 4)}
                            options={[
                              {
                                value: '3',
                                label: '3.0 ★ and above',
                              },
                              {
                                value: '3.5',
                                label: '3.5 ★ and above',
                              },
                              {
                                value: '4',
                                label: '4.0 ★ and above',
                              },
                              {
                                value: '4.5',
                                label: '4.5 ★ and above',
                              },
                            ]}
                            onChange={value =>
                              setHomeConfigForm(current => ({
                                ...current,
                                minRating: Number(value),
                              }))
                            }
                          />
                        </label>

                        <label>
                          Minimum reviews
                          <input
                            type="number"
                            min="0"
                            value={homeConfigForm.minReviews ?? 5}
                            onChange={event =>
                              setHomeConfigForm(current => ({
                                ...current,
                                minReviews: Number(
                                  event.target.value || 0
                                ),
                              }))
                            }
                          />
                        </label>
                      </>
                    )}
                  </>
                )}

                {selectedHomeSectionKey === 'trending' && (
                  <>
                    <label>
                      Selection mode
                      <PremiumSelect
                        value={homeConfigForm.mode || 'MANUAL'}
                        options={[
                          {
                            value: 'AUTO',
                            label: 'Automatically selected books',
                          },
                          {
                            value: 'MANUAL',
                            label: 'Manually selected books',
                          },
                        ]}
                        onChange={value =>
                          setHomeConfigForm(current => ({
                            ...current,
                            mode: value,
                          }))
                        }
                      />
                    </label>

                    {homeConfigForm.mode === 'AUTO' && (
                      <>
                        <label>
                          Trending period
                          <PremiumSelect
                            value={String(homeConfigForm.periodDays ?? 7)}
                            options={[
                              {
                                value: '7',
                                label: 'Last 7 days',
                              },
                              {
                                value: '30',
                                label: 'Last 30 days',
                              },
                              {
                                value: '90',
                                label: 'Last 90 days',
                              },
                            ]}
                            onChange={value =>
                              setHomeConfigForm(current => ({
                                ...current,
                                periodDays: Number(value),
                              }))
                            }
                          />
                        </label>

                        <label>
                          Trending signal
                          <PremiumSelect
                            value={homeConfigForm.basis || 'SALES'}
                            options={[
                              {
                                value: 'SALES',
                                label: 'Recent sales',
                              },
                              {
                                value: 'RATING',
                                label: 'Rating + reviews',
                              },
                            ]}
                            onChange={value =>
                              setHomeConfigForm(current => ({
                                ...current,
                                basis: value,
                              }))
                            }
                          />
                        </label>
                      </>
                    )}
                  </>
                )}
                {selectedHomeSectionKey === 'recommended' && (
                  <label>
                    Recommendation source
                    <PremiumSelect
                      value={homeConfigForm.mode || 'MANUAL'}
                      options={[
                        { value: 'MANUAL', label: 'Manually selected books' },
                        { value: 'CATEGORY', label: 'Books from a category' },
                        { value: 'AUTHOR', label: 'Books from an author' },
                        { value: 'SIMILAR', label: 'Similar to a book' },
                      ]}
                      onChange={value => setHomeConfigForm(current => ({ ...current, mode: value }))}
                    />
                  </label>
                )}
              </div>

              {selectedHomeSectionKey === 'recommended' && homeConfigForm.mode === 'CATEGORY' && (
                <div className="admin-home-extra-grid-v7">
                  <label>
                    Category
                    <PremiumSelect
                      value={homeConfigForm.category || ''}
                      options={[
                        { value: '', label: 'Choose category' },
                        ...[...new Set(books.map(book => book.category).filter(Boolean))].sort().map(category => ({ value: category, label: category })),
                      ]}
                      onChange={value => setHomeConfigForm(current => ({ ...current, category: value }))}
                    />
                  </label>
                </div>
              )}

              {selectedHomeSectionKey === 'recommended' && homeConfigForm.mode === 'AUTHOR' && (
                <div className="admin-home-extra-grid-v7">
                  <label>
                    Author
                    <PremiumSelect
                      value={homeConfigForm.author || ''}
                      options={[
                        { value: '', label: 'Choose author' },
                        ...[...new Set(books.map(book => book.author).filter(Boolean))].sort().map(author => ({ value: author, label: author })),
                      ]}
                      onChange={value => setHomeConfigForm(current => ({ ...current, author: value }))}
                    />
                  </label>
                </div>
              )}

              {selectedHomeSectionKey === 'recommended' && homeConfigForm.mode === 'SIMILAR' && (
                <div className="admin-home-extra-grid-v7">
                  <label>
                    Similar to
                    <PremiumSelect
                      value={homeConfigForm.sourceBookId || ''}
                      options={[
                        { value: '', label: 'Choose a book' },
                        ...books.map(book => ({ value: book.id, label: book.title })),
                      ]}
                      onChange={value => setHomeConfigForm(current => ({ ...current, sourceBookId: value }))}
                    />
                  </label>
                </div>
              )}

              {((selectedHomeSectionKey === 'discounted' && homeConfigForm.mode === 'MANUAL') ||
                (selectedHomeSectionKey === 'top-selling' && homeConfigForm.mode === 'MANUAL') ||
                (selectedHomeSectionKey === 'highly-featured' && homeConfigForm.mode === 'MANUAL') ||
                (selectedHomeSectionKey === 'cashback') ||
                (selectedHomeSectionKey === 'new-arrivals' && homeConfigForm.mode === 'MANUAL') ||
                (selectedHomeSectionKey === 'best-rated' && homeConfigForm.mode === 'MANUAL') ||
                (selectedHomeSectionKey === 'trending' && homeConfigForm.mode === 'MANUAL') ||
                (selectedHomeSectionKey === 'recommended' && homeConfigForm.mode === 'MANUAL')) && (
                  <div className="admin-home-manual-picker-v7">
                    <div className="admin-home-section-meta-v7">
                      <div className="tv-home-manual-copy">
                        <strong>Select books manually</strong>
                        <small>Choose specific books for this section. Selecting any book automatically switches this section to manual mode.</small>
                      </div>
                      <span>{selectedHomeBookIds.length} selected</span>
                    </div>

                    <label className="admin-home-search-v7 admin-home-search-block-v7">
                      Find books
                      <input
                        value={homeBookSearch}
                        onChange={event => setHomeBookSearch(event.target.value)}
                        placeholder="Search title, author or category..."
                      />
                    </label>

                    {[
                      { title: 'Books in this section', selectedGroup: true, items: filteredHomeBooks.filter(book => selectedHomeBookIds.includes(book.id)) },
                      { title: 'Available books — select to add', selectedGroup: false, items: filteredHomeBooks.filter(book => !selectedHomeBookIds.includes(book.id)) },
                    ].map(group => (
                      <div key={group.title} className={`tv-curation-group ${group.selectedGroup ? 'tv-curation-selected' : 'tv-curation-available'}`}>
                        <div className="tv-curation-group-head"><div><span className="tv-curation-eyebrow">{group.selectedGroup ? 'YOUR COLLECTION' : 'DISCOVER & ADD'}</span><h3>{group.title}</h3><p>{group.selectedGroup ? 'Fine-tune the offer for each selected title.' : 'Add more titles to build your collection.'}</p></div><span className="tv-curation-count">{group.items.length} {group.items.length === 1 ? 'book' : 'books'}</span></div>
                        <div className="admin-home-book-grid-v7">
                      {group.items.map(book => {
                        const checked = selectedHomeBookIds.includes(book.id)

                        const originalPrice = Number(
                          book.basePrice || book.price || 0
                        )

                        const discountEntry = perBookDiscounts[book.id] || {
                          type: 'PERCENT', value: 0
                        }
                        const discountValue = Number(discountEntry.value || 0)
                        const cashbackEntry = homeConfigForm.perBookCashbacks?.[book.id] || { type: 'PERCENT', value: 5 }
                        const cashbackValue = Number(cashbackEntry.value || 0)
                        const cashbackPrice = Number(book.price || 0)
                        const cashbackPerCopy = cashbackEntry.type === 'FIXED'
                          ? Math.min(cashbackPrice, cashbackValue)
                          : Math.min(cashbackPrice, Math.round(cashbackPrice * cashbackValue) / 100)
                        const discountedPrice = checked && discountValue > 0
                          ? Math.max(0, Math.round((discountEntry.type === 'FIXED'
                              ? originalPrice - discountValue
                              : originalPrice * (1 - discountValue / 100)) * 100) / 100)
                          : originalPrice

                        return (
                          <div
                            className={`admin-home-book-option-v7 tv-curation-card ${checked ? 'selected' : ''
                              }`}
                            key={book.id}
                          >
                            <input
                              type="checkbox"
                              aria-label={`Select ${book.title} for this section`}
                              checked={checked}
                              onChange={() => {
                                setSelectedHomeBookIds(current =>
                                  checked ? current.filter(id => id !== book.id) : [...current, book.id]
                                )
                                if (!checked && selectedHomeSectionKey === 'cashback') {
                                  setHomeConfigForm(current => ({
                                    ...current,
                                    perBookCashbacks: {
                                      ...(current.perBookCashbacks || {}),
                                      [book.id]: current.perBookCashbacks?.[book.id] || { type: 'PERCENT', value: 5 },
                                    },
                                  }))
                                }
                              }}
                            />

                            <span className="admin-home-book-thumb-v7">
                              <img
                                src={
                                  book.image ||
                                  '/covers/atomic-habits.svg'
                                }
                                alt=""
                              />
                            </span>

                            <span className="admin-home-book-copy-v7">
                              <strong>
                                {book.title}
                              </strong>

                              <small>
                                {book.author || 'Unknown author'}
                              </small>

                              <em>
                                {book.category || 'Uncategorised'}
                              </em>

                              {selectedHomeSectionKey === 'cashback' && checked && (
                                <div className="admin-book-cashback-controls" onClick={event => event.stopPropagation()}>
                                  <span className="tv-curation-control-label">CASHBACK FOR THIS BOOK</span>
                                  <div className="admin-book-cashback-fields">
                                    <div className="tv-cashback-type-field">
                                      <span>Type</span>
                                      <CashbackTypeDropdown
                                        bookTitle={book.title}
                                        value={cashbackEntry.type === 'FIXED' ? 'FIXED' : 'PERCENT'}
                                        onChange={type => setHomeConfigForm(current => ({
                                          ...current,
                                          perBookCashbacks: {
                                            ...(current.perBookCashbacks || {}),
                                            [book.id]: { type, value: 0 },
                                          },
                                        }))}
                                      />
                                    </div>
                                    <label>
                                      <span>{cashbackEntry.type === 'FIXED' ? 'Amount (₹)' : 'Percent (%)'}</span>
                                      <input
                                        aria-label={`Cashback value for ${book.title}`}
                                        type="number" min="0" step="0.01"
                                        max={cashbackEntry.type === 'FIXED' ? cashbackPrice : 100}
                                        value={cashbackEntry.value}
                                        onChange={event => setHomeConfigForm(current => ({
                                          ...current,
                                          perBookCashbacks: {
                                            ...(current.perBookCashbacks || {}),
                                            [book.id]: { ...cashbackEntry, value: event.target.value },
                                          },
                                        }))}
                                      />
                                    </label>
                                  </div>
                                  {Number.isFinite(cashbackPerCopy) && cashbackPerCopy > 0 && (
                                    <div className="admin-book-cashback-preview">
                                      Customer card: <strong>Earn up to ₹{cashbackPerCopy.toFixed(2)} cashback</strong> per paid copy
                                    </div>
                                  )}
                                  <small>Applied to eligible online payments; free BOGO copies and wallet-funded amounts do not earn cashback.</small>
                                </div>
                              )}
                              {selectedHomeSectionKey === 'discounted' &&
                                homeConfigForm.mode === 'MANUAL' && !checked && (
                                  <span className="admin-home-price-preview-v7">
                                    <b>₹{originalPrice.toFixed(2)}</b>
                                  </span>
                                )}
                              {selectedHomeSectionKey === 'discounted' &&
                                homeConfigForm.mode === 'MANUAL' && checked && (
                                  <div className="admin-home-individual-discount"><span className="tv-curation-control-label">CUSTOM OFFER</span>
                                    <details className="tv-discount-dropdown">
                                      <summary aria-label={`Discount type for ${book.title}`}>
                                        <span className="tv-discount-dropdown-icon">{discountEntry.type === 'FIXED' ? '₹' : '%'}</span>
                                        <span>{discountEntry.type === 'FIXED' ? 'Amount off' : 'Percentage off'}</span>
                                        <span className="tv-discount-dropdown-chevron" aria-hidden="true">⌄</span>
                                      </summary>
                                      <div className="tv-discount-dropdown-menu" role="group" aria-label={`Discount type for ${book.title}`}>
                                        {[{ type: 'PERCENT', symbol: '%', label: 'Percentage off' }, { type: 'FIXED', symbol: '₹', label: 'Fixed amount off' }].map(option => (
                                          <button key={option.type} type="button"
                                            className={`tv-discount-dropdown-option ${discountEntry.type === option.type ? 'is-selected' : ''}`}
                                            aria-pressed={discountEntry.type === option.type}
                                            onClick={event => {
                                              setPerBookDiscounts(current => ({ ...current, [book.id]: { type: option.type, value: 0 } }))
                                              event.currentTarget.closest('details')?.removeAttribute('open')
                                            }}>
                                            <span className="tv-discount-dropdown-option-icon">{option.symbol}</span>
                                            <span>{option.label}</span>
                                            {discountEntry.type === option.type && <span className="tv-discount-dropdown-check" aria-hidden="true">✓</span>}
                                          </button>
                                        ))}
                                      </div>
                                    </details>
                                    <input type="number" min="0" step="0.01"
                                      max={discountEntry.type === 'PERCENT' ? 100 : originalPrice}
                                      aria-label={`Discount amount for ${book.title}`}
                                      value={discountEntry.value}
                                      onChange={event => setPerBookDiscounts(current => ({ ...current,
                                        [book.id]: { ...discountEntry, value: event.target.value }
                                      }))}
                                      style={{ width: 100, minWidth: 0 }} />
                                  </div>
                                )}
                              {selectedHomeSectionKey === 'discounted' &&
                                homeConfigForm.mode === 'MANUAL' && checked && (
                                  <span className="admin-home-price-preview-v7 tv-curation-final-price">
                                    <del>
                                      ₹{originalPrice.toFixed(2)}
                                    </del>

                                    <b>
                                      ₹{discountedPrice.toFixed(2)}
                                    </b>

                                    <mark>
                                      {discountEntry.type === 'FIXED' ? `₹${discountValue} OFF` : `${discountValue}% OFF`}
                                    </mark>
                                  </span>
                                )}
                            </span>
                            {checked && (
                              <button
                                type="button"
                                className="admin-home-remove-book-v7"
                                aria-label={`Remove ${book.title} from this section`}
                                title="Remove from this section"
                                onClick={event => {
                                  event.preventDefault()
                                  event.stopPropagation()
                                  setSelectedHomeBookIds(current => current.filter(id => id !== book.id))
                                }}
                              >
                                Remove from section
                              </button>
                            )}
                          </div>
                        )
                      })}
                        </div>
                      </div>
                    ))}

                    {!filteredHomeBooks.length && (
                      <div className="admin-empty-v6 glass-card">No books match your search.</div>
                    )}
                  </div>
                )}

              {selectedHomeSectionKey !== 'cashback' && (
                <p className="admin-home-rule-note-v7">
                  {selectedHomeSectionKey === 'discounted' && (homeConfigForm.mode === 'AUTO'
                    ? 'The percentage here is a minimum eligibility threshold. It does not change a book price; the book must already have a lower current price than its original price.'
                    : 'Manual mode lets you choose exactly which books appear in this section.')}
                  {selectedHomeSectionKey === 'top-selling' && (homeConfigForm.mode === 'AUTO'
                    ? 'Ranks books using order history for the selected period and ranking signal. Cancelled orders are excluded.'
                    : 'Manual mode lets you choose exactly which books appear in this section.')}
                  {selectedHomeSectionKey === 'highly-featured' && (homeConfigForm.mode === 'FEATURED_FLAG'
                    ? 'Only books marked Featured in the catalogue are used.'
                    : 'Manual mode lets you choose exactly which books appear in this section.')}
                  {selectedHomeSectionKey === 'new-arrivals' && (homeConfigForm.mode === 'NEW_ARRIVAL_FLAG'
                    ? 'Only books marked New Arrival in the catalogue are used.'
                    : 'Manual mode lets you choose exactly which books appear in this section.')}
                  {selectedHomeSectionKey === 'best-rated' && (homeConfigForm.mode === 'AUTO'
                    ? 'Books must meet both the minimum rating and minimum review count.'
                    : 'Manual mode lets you choose exactly which books appear in this section.')}
                  {selectedHomeSectionKey === 'trending' && (homeConfigForm.mode === 'AUTO'
                    ? 'Trending is calculated from the selected period and signal.'
                    : 'Manual mode lets you choose exactly which books appear in this section.')}
                  {selectedHomeSectionKey === 'recommended' && (homeConfigForm.mode !== 'MANUAL'
                    ? 'Recommendations are resolved from the selected category, author, or similar-book rule.'
                    : 'Manual mode lets you choose exactly which books appear in this section.')}
                </p>
              )}
            </section>

            {/* <section className="admin-panel-v6 glass-panel">
              <PanelTitle
                eyebrow="HOME BANNERS"
                title="Background Banners"
                copy="Add up to four banner image URLs. Select which saved banner the home page should use."
              />

              <div className="admin-banner-manager-v7">
                {homeSettingsForm.bannerUrls.map((url, index) => (
                  <label key={index}>
                    Banner {index + 1}
                    <input
                      value={url}
                      onChange={event => setHomeSettingsForm(current => ({
                        ...current,
                        bannerUrls: current.bannerUrls.map((item, itemIndex) => itemIndex === index ? event.target.value : item),
                      }))}
                      placeholder="/premium/home-banner-1.png or image URL"
                    />
                    {url && <img src={url} alt={`Banner ${index + 1} preview`} onError={event => { event.currentTarget.style.display = 'none' }} />}
                  </label>
                ))}

                <label>
                  Active banner
                  <PremiumSelect
                    value={String(homeSettingsForm.activeBannerIndex)}
                    options={homeSettingsForm.bannerUrls.map((url, index) => ({ value: String(index), label: `Banner ${index + 1}${url ? '' : ' — empty'}` }))}
                    onChange={value => setHomeSettingsForm(current => ({ ...current, activeBannerIndex: Number(value) }))}
                  />
                </label>

                <button className="admin-primary-v6" type="button" onClick={saveHomeSettings}>
                  Save banners
                </button>
              </div>
            </section> */}
          </section>
        )}

        {/* Delivery pricing is configured by the admin and calculated on the backend. */}
        {tab === 'delivery' && (
          <section className="admin-panel-v6 glass-panel tv-delivery-settings">
            <PanelTitle eyebrow="STORE SETTINGS" title="Delivery Settings"
              copy="Control shipping charges for new orders. Changes take effect on new checkout quotes, not existing orders." />
            <form onSubmit={saveDeliverySettings} className="tv-delivery-settings-form">
              <label className="tv-delivery-toggle">
                <input type="checkbox" checked={deliveryForm.enabled}
                  onChange={event => setDeliveryForm(current => ({ ...current, enabled: event.target.checked }))} />
                <span><strong>Enable delivery charges</strong><small>When disabled, all orders have free shipping.</small></span>
              </label>
              <div className="tv-delivery-fields">
                <label>Delivery fee (₹)
                  <input type="number" min="0" max="10000" step="0.01" required
                    disabled={!deliveryForm.enabled || deliveryForm.freeShippingAll}
                    value={(deliveryForm.feePaise / 100).toString()}
                    onChange={event => setDeliveryForm(current => ({ ...current, feePaise: Math.round(Number(event.target.value || 0) * 100) }))} />
                </label>
                <label>Free delivery from (₹)
                  <input type="number" min="0" max="1000000" step="0.01" required
                    disabled={!deliveryForm.enabled || deliveryForm.freeShippingAll}
                    value={(deliveryForm.freeDeliveryThresholdPaise / 100).toString()}
                    onChange={event => setDeliveryForm(current => ({ ...current, freeDeliveryThresholdPaise: Math.round(Number(event.target.value || 0) * 100) }))} />
                </label>
              </div>
              <label className="tv-delivery-toggle">
                <input type="checkbox" checked={deliveryForm.freeShippingAll}
                  onChange={event => setDeliveryForm(current => ({ ...current, freeShippingAll: event.target.checked }))} />
                <span><strong>Free delivery on all orders</strong><small>Overrides the fee and minimum order amount.</small></span>
              </label>
              <div className="tv-delivery-preview">
                <span>Example: ₹450 merchandise total</span>
                <strong>{!deliveryForm.enabled || deliveryForm.freeShippingAll || 45000 >= deliveryForm.freeDeliveryThresholdPaise
                  ? 'FREE delivery' : `₹${(deliveryForm.feePaise / 100).toFixed(2)} delivery`}</strong>
              </div>
              <button className="admin-primary-v6" type="submit" disabled={savingDelivery}>
                {savingDelivery ? 'Saving…' : 'Save delivery settings'}
              </button>
            </form>
          </section>
        )}

        {/* Offers */}
        {tab === 'offers' && (
          <>
            <section className="admin-panel-v6 glass-panel">
              <PanelTitle
                eyebrow="PROMOTIONS"
                title={
                  editingOffer
                    ? 'Edit offer'
                    : 'Create offer'
                }
                copy="Offers are stored in MongoDB and shown on the customer website when active."
                action={
                  editingOffer ? (
                    <button
                      onClick={() => {
                        setEditingOffer(
                          null
                        )

                        setOfferForm(
                          emptyOffer
                        )
                      }}
                    >
                      Cancel edit
                    </button>
                  ) : null
                }
              />

              <form
                className="admin-form-grid-v6"
                onSubmit={
                  saveOffer
                }
              >
                <label>
                  Offer type
                  <PremiumSelect
                    value={offerForm.offerType || 'COUPON'}
                    options={[{ value: 'COUPON', label: 'Coupon discount' }, { value: 'BUY_GET', label: 'Buy books · Get free books' }]}
                    onChange={value => setOfferForm(current => ({ ...current, offerType: value }))}
                  />
                </label>

                {offerForm.offerType === 'BUY_GET' && (
                  <div className="wide admin-bundle-fields">
                    <div className="admin-bundle-fields-title">
                      <strong>🎁 Choose books to buy and books to receive free</strong>
                      <span>Add several different titles and quantities. Customers must buy every required title to unlock every listed gift. Each complete set earns the gifts again.</span>
                    </div>
                    {[
                      { key: 'buyItems', title: 'Books customers must buy', placeholder: 'Choose a qualifying book…' },
                      { key: 'giftItems', title: 'Books customers receive FREE', placeholder: 'Choose a gift book…' },
                    ].map(group => (
                      <div className="bundle-book-group" key={group.key}>
                        <h4>{group.title}</h4>
                        {(offerForm[group.key] || []).map((line, index) => (
                          <div className="bundle-book-line" key={`${group.key}-${index}`}>
                            <OfferBookDropdown
                              books={books}
                              value={line.bookId || ''}
                              placeholder={group.placeholder}
                              searchLabel="Search books"
                              onChange={bookId => setOfferForm(current => ({ ...current, [group.key]: current[group.key].map((entry, i) => i === index ? { ...entry, bookId } : entry) }))}
                            />
                            <label className="bundle-quantity-label">Copies
                              <input aria-label={`${group.title} quantity ${index + 1}`} type="number" min="1" max="50" step="1" required value={line.quantity}
                                onChange={event => setOfferForm(current => ({ ...current, [group.key]: current[group.key].map((entry, i) => i === index ? { ...entry, quantity: event.target.value } : entry) }))} />
                            </label>
                            <button type="button" className="bundle-remove-line" disabled={offerForm[group.key].length <= 1}
                              onClick={() => setOfferForm(current => ({ ...current, [group.key]: current[group.key].filter((_, i) => i !== index) }))}>Remove</button>
                          </div>
                        ))}
                        <button type="button" className="bundle-add-line" disabled={offerForm[group.key]?.length >= 15}
                          onClick={() => setOfferForm(current => ({ ...current, [group.key]: [...(current[group.key] || []), { bookId: '', quantity: 1 }] }))}>
                          + Add another {group.key === 'buyItems' ? 'qualifying book' : 'free book'}
                        </button>
                      </div>
                    ))}
                    <p className="admin-bundle-preview">A customer must buy every listed qualifying book in the stated quantity. All free books are then included automatically; gifts never unlock other offers.</p>
                  </div>
                )}

                <label>
                  {offerForm.offerType === 'BUY_GET' ? 'Offer title (optional — generated automatically)' : 'Offer title'}

                  <input
                    name="title"
                    value={
                      offerForm.title
                    }
                    onChange={
                      offerChange
                    }
                    required={offerForm.offerType !== 'BUY_GET'}
                  />
                </label>

                {offerForm.offerType !== 'BUY_GET' && (
                  <>
                <label>
                  Coupon code

                  <input
                    name="code"
                    value={
                      offerForm.code
                    }
                    onChange={
                      offerChange
                    }
                  />
                </label>

                <label>
                  Discount type

                  <PremiumSelect
                    value={
                      offerForm.discountType
                    }
                    options={[
                      {
                        value:
                          'PERCENT',
                        label:
                          'Percentage',
                      },
                      {
                        value:
                          'FIXED',
                        label:
                          'Fixed amount',
                      },
                    ]}
                    onChange={(
                      value
                    ) =>
                      setOfferForm(
                        (
                          current
                        ) => ({
                          ...current,
                          discountType:
                            value,
                        })
                      )
                    }
                  />
                </label>

                <label>
                  Discount value

                  <input
                    type="number"
                    min="0"
                    name="discountValue"
                    value={
                      offerForm.discountValue
                    }
                    onChange={
                      offerChange
                    }
                  />
                </label>

                <label>
                  Minimum order

                  <input
                    type="number"
                    min="0"
                    name="minOrderAmount"
                    value={
                      offerForm.minOrderAmount
                    }
                    onChange={
                      offerChange
                    }
                  />
                </label>

                  </>
                )}

                <label>
                  Start date

                  <PremiumDatePicker
                    value={
                      offerForm.startDate ||
                      ''
                    }
                    onChange={(
                      value
                    ) =>
                      setOfferForm(
                        (
                          current
                        ) => ({
                          ...current,
                          startDate:
                            value,
                        })
                      )
                    }
                  />
                </label>

                <label>
                  End date

                  <PremiumDatePicker
                    value={
                      offerForm.endDate ||
                      ''
                    }
                    onChange={(
                      value
                    ) =>
                      setOfferForm(
                        (
                          current
                        ) => ({
                          ...current,
                          endDate:
                            value,
                        })
                      )
                    }
                  />
                </label>

                <label className="wide">
                  Description

                  <textarea
                    name="description"
                    value={
                      offerForm.description
                    }
                    onChange={
                      offerChange
                    }
                    rows="4"
                  />
                </label>

                <label className="wide">
                  Offer banner image URL

                  <input
                    name="bannerImage"
                    value={offerForm.bannerImage || ''}
                    onChange={offerChange}
                    placeholder="/premium/offer-banner.png or image URL"
                  />
                </label>

                <div className="admin-toggle-row-v6 wide">
                  <label className="premium-check-v73">
                    <input
                      type="checkbox"
                      name="active"
                      checked={
                        offerForm.active
                      }
                      onChange={
                        offerChange
                      }
                    />

                    Publish this offer
                  </label>
                </div>

                <button
                  className="admin-primary-v6"
                  type="submit"
                >
                  {editingOffer
                    ? 'Update offer'
                    : 'Create offer'}
                </button>
              </form>
            </section>

            <section className="promotion-grid-v6">
              {offers.map(
                (offer) => (
                  <article
                    className={`promotion-card-v6 glass-card ${!offer.active
                        ? 'inactive'
                        : ''
                      }`}
                    key={
                      offer.id
                    }
                  >
                    <span>
                      {offer.active
                        ? 'LIVE'
                        : 'INACTIVE'}
                    </span>

                    <h3>
                      {offer.title}
                    </h3>

                    <b>
                      {offer.offerType === 'BUY_GET'
                        ? 'Free-book bundle' 
                        : (offer.code || 'No coupon code')}
                    </b>

                    <p>
                      {
                        offer.description
                      }
                    </p>

                    <strong>
                      {offer.offerType === 'BUY_GET' ? (
                        <>🎁 {(offer.buyItems?.length ? offer.buyItems : [{bookId:offer.buyBookId, quantity:offer.buyQuantity}]).map(line => `${line.quantity} ${books.find(book => book.id === line.bookId)?.title || 'book'}`).join(' + ')} → {(offer.giftItems?.length ? offer.giftItems : [{bookId:offer.getBookId, quantity:offer.getQuantity}]).map(line => `${line.quantity} ${books.find(book => book.id === line.bookId)?.title || 'book'}`).join(' + ')} FREE</>
                      ) : (
                        <>{offer.discountType === 'FIXED' ? `₹${offer.discountValue}` : `${offer.discountValue}%`} OFF</>
                      )}
                    </strong>

                    <small>
                      {offer.startDate ||
                        'No start date'}{' '}
                      »{' '}
                      {offer.endDate ||
                        'No end date'}
                    </small>

                    <div>
                      <button
                        onClick={() =>
                          editOffer(
                            offer
                          )
                        }
                      >
                        Edit
                      </button>

                      <button
                        className="danger"
                        onClick={() =>
                          deleteOffer(
                            offer
                          )
                        }
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                )
              )}

              {!offers.length && (
                <div className="admin-empty-v6 glass-card">
                  No offers have been created
                  yet.
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {/* Order Modal */}
      {selectedOrder && (
        <div
          className="admin-modal-backdrop"
          onMouseDown={() =>
            setSelectedOrder(
              null
            )
          }
        >
          <section
            className="admin-order-modal glass-panel"
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
          >
            <div className="order-modal-head-v6">
              <div>
                <span>
                  ORDER MANAGEMENT
                </span>

                <h2>
                  #
                  {
                    selectedOrder.orderNumber
                  }
                </h2>

                <p>
                  {
                    selectedOrder.customerName
                  }{' '}
                  ·{' '}
                  {
                    selectedOrder.customerEmail
                  }
                </p>
              </div>

              <button
                onClick={() =>
                  setSelectedOrder(
                    null
                  )
                }
              >
                ×
              </button>
            </div>

            <div className="order-modal-summary-v6">
              <div>
                <span>
                  Current status
                </span>

                <strong
                  className={`status-chip status-${String(
                    selectedOrder.status
                  ).toLowerCase()}`}
                >
                  {statusLabel(
                    selectedOrder.status
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Order total
                </span>

                <strong>
                  ₹
                  {
                    selectedOrder.total
                  }
                </strong>
              </div>

              <div>
                <span>Payment method</span>
                <strong>{selectedOrder.paymentMethod || '—'}</strong>
              </div>

              <div className="order-payment-summary-v7">
                <span>Payment status</span>
                <strong className={`payment-chip payment-${paymentStatusValue(selectedOrder).toLowerCase()}`}>
                  {paymentStatusLabel(selectedOrder)}
                </strong>
                <div className="payment-summary-line-v7">
                  <span>Paid</span>
                  <strong>{money(paymentAmountPaid(selectedOrder))}</strong>
                </div>
                <div className="payment-summary-line-v7">
                  <span>Remaining</span>
                  <strong>{money(Math.max(0, Number(selectedOrder.total || 0) - paymentAmountPaid(selectedOrder)))}</strong>
                </div>
              </div>

              <div>
                <span>
                  Created
                </span>

                <strong>
                  {formatDateTime(
                    selectedOrder.createdAt
                  )}
                </strong>
              </div>

              {(selectedOrder.courierName || selectedOrder.trackingNumber) && (
                <div>
                  <span>Shipment</span>
                  <strong>
                    {selectedOrder.courierName || 'Courier'} · {selectedOrder.trackingNumber || '—'}
                  </strong>
                </div>
              )}
            </div>

            <div className="order-payment-editor-v7">
              <div>
                <span className="order-payment-editor-eyebrow-v7">PAYMENT COLLECTION</span>
                <h3>Record amount paid</h3>
                <p>Update the real amount received. The payment status is calculated automatically.</p>
              </div>
              <div className="order-payment-editor-controls-v7">
                <label>
                  <span>Amount paid</span>
                  <div className="payment-input-wrap-v7">
                    <span>₹</span>
                    <input
                      type="number"
                      min="0"
                      max={Number(selectedOrder.total || 0)}
                      step="0.01"
                      value={paymentDraft}
                      onChange={(event) => setPaymentDraft(event.target.value)}
                    />
                  </div>
                </label>
                <button
                  type="button"
                  className="admin-primary-v6"
                  onClick={saveOrderPayment}
                  disabled={paymentBusy}
                >
                  {paymentBusy ? 'Saving…' : 'Save payment'}
                </button>
              </div>
            </div>

            <div className="order-modal-items-v6">
              <h3>
                Items
              </h3>

              {selectedOrder.items?.map(
                (item) => (
                  <div
                    key={
                      item.bookId
                    }
                  >
                    <img
                      src={
                        item.image
                      }
                      alt=""
                    />

                    <span>
                      <strong>
                        {
                          item.title
                        }
                      </strong>

                      <small>
                        Qty{' '}
                        {
                          item.quantity
                        }
                      </small>
                    </span>

                    <b>
                      ₹
                      {item.price *
                        item.quantity}
                    </b>
                  </div>
                )
              )}
            </div>

            {shipmentAction && (
              <div className="order-modal-actions-v6">
                <h3>Shipment details</h3>
                <div className="admin-form-grid-v6">
                  <div>
                    <label>Courier / Postal Service *</label>
                    <input
                      value={shipmentForm.courierName}
                      onChange={(event) =>
                        setShipmentForm(current => ({
                          ...current,
                          courierName: event.target.value,
                        }))
                      }
                      placeholder="e.g. India Post"
                    />
                  </div>
                  <div>
                    <label>Tracking / Consignment Number *</label>
                    <input
                      value={shipmentForm.trackingNumber}
                      onChange={(event) =>
                        setShipmentForm(current => ({
                          ...current,
                          trackingNumber: event.target.value,
                        }))
                      }
                      placeholder="e.g. EM123456789IN"
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button
                    className="admin-primary-v6"
                    onClick={confirmShipment}
                    disabled={orderActionBusy}
                  >
                    Mark as Shipped
                  </button>
                  <button
                    className="admin-secondary-v6"
                    onClick={() => setShipmentAction(null)}
                    disabled={orderActionBusy}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="order-modal-actions-v6">
              <h3>
                Available actions
              </h3>

              {orderActions.length ? (
                orderActions.map(
                  (action) => (
                    <button
                      key={`${action.action}-${action.status}`}
                      className={`order-action-v6 ${action.tone ||
                        ''
                        }`}
                      onClick={() =>
                        performOrderAction(
                          action
                        )
                      }
                      disabled={
                        orderActionBusy
                      }
                    >
                      <span>
                        <strong>
                          {
                            action.label
                          }
                        </strong>

                        <small>
                          {
                            action.description
                          }
                        </small>
                      </span>
                    </button>
                  )
                )
              ) : (
                <div className="admin-empty-v6">
                  No further workflow actions
                  are available for this order.
                </div>
              )}
            </div>

            <div className="order-modal-history-v6">
              <h3>
                Status history
              </h3>

              {(
                selectedOrder.statusHistory ||
                []
              ).map(
                (
                  event,
                  index
                ) => (
                  <div
                    key={`${event.status}-${event.at || index}`}
                  >
                    <b>
                      {index +
                        1}
                    </b>

                    <span>
                      <strong>
                        {statusLabel(
                          event.status
                        )}
                      </strong>

                      <small>
                        {formatDateTime(
                          event.at
                        )}
                      </small>

                      <p>
                        {event.note}
                      </p>
                    </span>
                  </div>
                )
              )}
            </div>
          </section>
        </div>
      )}

      <PremiumConfirm
        dialog={confirmDialog}
        onClose={() =>
          setConfirmDialog(null)
        }
      />
    </div>
  )
}

function SalesTrendChart({
  orders = [],
}) {
  const months = Array.from(
    {
      length: 6,
    },
    (_, index) => {
      const date =
        new Date()

      date.setMonth(
        date.getMonth() -
        (5 - index)
      )

      return {
        key:
          `${date.getFullYear()}-` +
          `${String(
            date.getMonth() + 1
          ).padStart(2, '0')}`,

        label:
          date.toLocaleString(
            'en',
            {
              month: 'short',
            }
          ),

        value:
          0,
      }
    }
  )

  orders.forEach(
    (order) => {
      if (
        !order.createdAt ||
        order.status ===
        'CANCELLED'
      ) {
        return
      }

      const date =
        new Date(
          order.createdAt
        )

      const key =
        `${date.getFullYear()}-` +
        `${String(
          date.getMonth() + 1
        ).padStart(2, '0')}`

      const slot =
        months.find(
          (item) =>
            item.key === key
        )

      if (slot) {
        slot.value +=
          Number(
            order.total || 0
          )
      }
    }
  )

  const max =
    Math.max(
      ...months.map(
        (item) =>
          item.value
      ),
      1
    )

  const points =
    months
      .map(
        (
          item,
          index
        ) => {
          const x =
            24 +
            index *
            (352 /
              Math.max(
                months.length -
                1,
                1
              ))

          const y =
            148 -
            (item.value /
              max) *
            108

          return `${x},${y}`
        }
      )
      .join(' ')

  return (
    <div className="sales-chart-c8">
      <svg
        viewBox="0 0 400 180"
        role="img"
        aria-label="Sales trend"
      >
        {[
          40,
          76,
          112,
          148,
        ].map((y) => (
          <line
            key={y}
            x1="24"
            x2="376"
            y1={y}
            y2={y}
            className="chart-grid-line"
          />
        ))}

        <polyline
          points={
            points
          }
          className="chart-line"
          fill="none"
        />

        {points
          .split(' ')
          .map(
            (
              point,
              index
            ) => {
              const [
                cx,
                cy,
              ] =
                point.split(
                  ','
                )

              return (
                <circle
                  key={
                    index
                  }
                  cx={cx}
                  cy={cy}
                  r="4"
                  className="chart-dot"
                />
              )
            }
          )}
      </svg>

      <div className="sales-chart-labels-c8">
        {months.map(
          (item) => (
            <span
              key={
                item.key
              }
            >
              {
                item.label
              }
            </span>
          )
        )}
      </div>
    </div>
  )
}

function CatalogueOverview({
  books = [],
}) {
  const groups =
    Object.entries(
      books.reduce(
        (
          result,
          book
        ) => {
          const key =
            book.category ||
            'Other'

          result[key] =
            (result[key] ||
              0) + 1

          return result
        },
        {}
      )
    )
      .sort(
        (a, b) =>
          b[1] -
          a[1]
      )
      .slice(0, 5)

  const total =
    Math.max(
      groups.reduce(
        (
          sum,
          [, count]
        ) =>
          sum +
          count,
        0
      ),
      1
    )

  const colors = [
    '#2f6b45',
    '#78a36a',
    '#d8a85f',
    '#7d9bb7',
    '#b58a74',
  ]

  let cursor = 0

  const stops =
    groups
      .map(
        (
          [
            name,
            count,
          ],
          index
        ) => {
          const start =
            cursor

          cursor +=
            (count /
              total) *
            100

          return `${colors[index]} ${start}% ${cursor}%`
        }
      )
      .join(', ')

  return (
    <div className="catalogue-chart-c8">
      <div
        className="catalogue-donut-c8"
        style={{
          background:
            `conic-gradient(${stops ||
            '#e7eee7 0 100%'
            })`,
        }}
      >
        <span>
          <strong>
            {
              books.length
            }
          </strong>

          <small>
            Books
          </small>
        </span>
      </div>

      <div className="catalogue-legend-c8">
        {groups.map(
          (
            [
              name,
              count,
            ],
            index
          ) => (
            <div
              key={
                name
              }
            >
              <i
                style={{
                  background:
                    colors[
                    index
                    ],
                }}
              />

              <span>
                {name}
              </span>

              <b>
                {count}
              </b>
            </div>
          )
        )}

        {!groups.length && (
          <p>
            No catalogue data yet.
          </p>
        )}
      </div>
    </div>
  )
}

function KpiCard({
  label,
  value,
  detail,
  icon,
}) {
  return (
    <article className="admin-kpi-v6 glass-card">
      <span>
        {icon}
      </span>

      <div>
        <small>
          {label}
        </small>

        <strong>
          {value}
        </strong>

        <p>
          {detail}
        </p>
      </div>
    </article>
  )
}

function StatusCard({
  label,
  value,
  onClick,
}) {
  return (
    <button
      className="admin-status-card-v6 glass-card"
      onClick={onClick}
    >
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </button>
  )
}

function PanelTitle({
  eyebrow,
  title,
  copy,
  action,
}) {
  return (
    <div className="admin-panel-title-v6">
      <div>
        <span>
          {eyebrow}
        </span>

        <h2>
          {title}
        </h2>

        <p>
          {copy}
        </p>
      </div>

      {action}
    </div>
  )
}

function OrderTable({
  orders,
  onOpen,
  detailed = false,
}) {
  return (
    <div className="admin-order-cards-v7">
      {orders.map((order) => {
        const total = Number(order.total || 0)
        const paid = paymentAmountPaid(order)
        const remaining = Math.max(0, total - paid)
        const paymentStatus = paymentStatusValue(order)

        return (
          <article className="admin-order-card-v7" key={order.id}>
            <div className="admin-order-card-head-v7">
              <div>
                <span className="admin-order-eyebrow-v7">ORDER</span>
                <strong>#{order.orderNumber || order.id}</strong>
              </div>
              <span className={`status-chip status-${String(order.status || '').toLowerCase()}`}>
                {statusLabel(order.status)}
              </span>
            </div>

            <div className="admin-order-customer-v7">
              <div className="admin-order-avatar-v7">
                {(order.customerName || 'C').trim().charAt(0).toUpperCase()}
              </div>
              <div>
                <strong>{order.customerName || 'Customer'}</strong>
                <span>{order.customerEmail || order.userId || '—'}</span>
              </div>
            </div>

            <div className="admin-order-meta-grid-v7">
              <div>
                <span>Date</span>
                <strong>{formatDateTime(order.createdAt)}</strong>
              </div>
              <div>
                <span>Items</span>
                <strong>{order.items?.length || 0} item types</strong>
              </div>
              <div>
                <span>Payment</span>
                <strong>{order.paymentMethod || '—'}</strong>
              </div>
              <div>
                <span>Order total</span>
                <strong>{money(total)}</strong>
              </div>
            </div>

            <div className="admin-order-payment-v7">
              <div>
                <span>Amount paid</span>
                <strong>{money(paid)}</strong>
              </div>
              <div>
                <span>Remaining</span>
                <strong>{money(remaining)}</strong>
              </div>
              <span className={`payment-chip payment-${paymentStatus.toLowerCase()}`}>
                {statusLabel(paymentStatus)}
              </span>
            </div>

            <div className="admin-order-card-foot-v7">
              <span>{detailed ? 'Open order to manage fulfilment and payment' : 'Latest order'}</span>
              <button
                type="button"
                className="manage-order-btn-v6"
                onClick={() => onOpen(order)}
              >
                Manage order
              </button>
            </div>
          </article>
        )
      })}

      {!orders.length && (
        <div className="admin-empty-v6">
          No orders found for this filter.
        </div>
      )}
    </div>
  )
}

function formatDate(value) {
  return value
    ? new Date(
      value
    ).toLocaleDateString()
    : '—'
}

function formatDateTime(value) {
  return value
    ? new Date(
      value
    ).toLocaleString()
    : '—'
}