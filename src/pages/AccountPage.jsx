import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  Link,
  useLocation,
} from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'
import { useWallet } from '../hooks/useWallet'
import { formatWalletAmount } from '../utils/wallet'

import PremiumConfirm from '../components/PremiumConfirm'
import PremiumSelect from '../components/PremiumSelect'
import { getAccuratePosition, reverseGeocode, addressFromPlace, locationErrorMessage, accuracyNote } from '../utils/location'

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

function blankAddress(user) {
  return {
    label: 'Home',
    fullName: user?.name || '',
    mobile: user?.mobile || '',
    line1: '',
    locality: '',
    line2: '',
    city: '',
    district: '',
    state: '',
    pincode: '',
    latitude: null,
    longitude: null,
    locationLabel: '',
    defaultAddress: false,
  }
}

function mapEmbedUrl(latitude, longitude) {
  if (
    latitude == null ||
    longitude == null
  ) {
    return ''
  }

  const lat = Number(latitude)
  const lon = Number(longitude)

  const left = lon - 0.008
  const right = lon + 0.008
  const bottom = lat - 0.005
  const top = lat + 0.005

  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(
    `${left},${bottom},${right},${top}`
  )}&layer=mapnik&marker=${encodeURIComponent(
    `${lat},${lon}`
  )}`
}

function mapOpenUrl(latitude, longitude) {
  return `https://www.openstreetmap.org/?mlat=${encodeURIComponent(
    latitude
  )}&mlon=${encodeURIComponent(
    longitude
  )}#map=17/${encodeURIComponent(
    latitude
  )}/${encodeURIComponent(longitude)}`
}

export default function AccountPage() {
  const location = useLocation()

  const {
    user,
    logout,
  } = useAuth()

  const {
    account,
    getOrders,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
  } = useStore()

  const { wallet, loading: walletLoading, error: walletError } = useWallet()

  const [orders, setOrders] =
    useState([])

  const [selectedId, setSelectedId] =
    useState(null)

  const [filter, setFilter] =
    useState('ALL')

  const [
    addressEditorOpen,
    setAddressEditorOpen,
  ] = useState(false)

  const [
    editingAddressId,
    setEditingAddressId,
  ] = useState(null)

  const [
    addressForm,
    setAddressForm,
  ] = useState(
    () => blankAddress(user)
  )

  const [
    addressBusy,
    setAddressBusy,
  ] = useState(false)

  const [
    addressError,
    setAddressError,
  ] = useState('')

  const [
    locationBusy,
    setLocationBusy,
  ] = useState(false)

  const [
    locationMessage,
    setLocationMessage,
  ] = useState('')

  const [
    accountNotice,
    setAccountNotice,
  ] = useState('')

  const [
    confirmDialog,
    setConfirmDialog,
  ] = useState(null)

  async function loadOrders() {
    try {
      const data =
        await getOrders()

      setOrders(data)

      setSelectedId(
        (current) =>
          current ||
          data[0]?.id ||
          null
      )
    } catch {
      setOrders([])
    }
  }

  useEffect(() => {
    loadOrders()

    const timer = setInterval(
      loadOrders,
      15000
    )

    return () =>
      clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!location.hash) {
      return
    }

    const timer = setTimeout(
      () => {
        document
          .getElementById(
            location.hash.slice(1)
          )
          ?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          })
      },
      80
    )

    return () =>
      clearTimeout(timer)
  }, [location.hash])

  const visibleOrders =
    useMemo(
      () =>
        orders.filter((order) => {
          if (filter === 'ALL') {
            return true
          }

          if (
            filter === 'ACTIVE'
          ) {
            return ![
              'DELIVERED',
              'CANCELLED',
            ].includes(order.status)
          }

          return (
            order.status === filter
          )
        }),
      [orders, filter]
    )

  const selected =
    visibleOrders.find(
      (order) =>
        order.id === selectedId
    ) ||
    visibleOrders[0] ||
    null

  const addresses =
    account?.addresses || []

  const wishlistCount =
    account?.wishlist?.length || 0

  const defaultAddress =
    addresses.find(
      (address) =>
        address.defaultAddress
    ) || addresses[0]

  function openAddAddress() {
    const draft =
      blankAddress(user)

    draft.defaultAddress =
      addresses.length === 0

    setEditingAddressId(null)
    setAddressForm(draft)
    setAddressError('')
    setLocationMessage('')
    setAddressEditorOpen(true)
  }

  function openEditAddress(
    address
  ) {
    setEditingAddressId(
      address.id
    )

    setAddressForm({
      ...blankAddress(user),
      ...address,
    })

    setAddressError('')

    setLocationMessage(
      address.latitude != null &&
        address.longitude != null
        ? 'Saved map location loaded.'
        : ''
    )

    setAddressEditorOpen(true)
  }

  function closeAddressEditor() {
    if (
      addressBusy ||
      locationBusy
    ) {
      return
    }

    setAddressEditorOpen(false)
    setEditingAddressId(null)
    setAddressError('')
    setLocationMessage('')
  }

  function changeAddress(event) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target

    setAddressForm(
      (current) => ({
        ...current,
        [name]:
          type === 'checkbox'
            ? checked
            : value,
      })
    )
  }

  async function useCurrentLocation() {
    setAddressError('')
    setLocationMessage('')
    setLocationBusy(true)

    let pending = Promise.resolve()
    let latest = 0
    let geocoded = false

    const fill = async position => {
      const run = ++latest
      const latitude = Number(position.coords.latitude.toFixed(6))
      const longitude = Number(position.coords.longitude.toFixed(6))
      setAddressForm(current => ({ ...current, latitude, longitude }))
      try {
        const found = addressFromPlace(await reverseGeocode(latitude, longitude))
        if (run !== latest) return
        geocoded = true
        setAddressForm(current => ({
          ...current,
          latitude,
          longitude,
          line1: current.line1 || found.line1,
          locality: found.locality || current.locality,
          line2: current.line2,
          city: found.city || current.city,
          district: found.district || current.district,
          state: found.state || current.state,
          pincode: found.pincode || current.pincode,
          locationLabel: found.locationLabel || current.locationLabel,
        }))
      } catch {
        /* keep coordinates; user can type the address */
      }
    }

    try {
      const best = await getAccuratePosition({
        onFix: position => { pending = pending.then(() => fill(position)) },
      })
      await pending
      const note = accuracyNote(best.coords.accuracy)
      setLocationMessage(
        (geocoded
          ? 'Live location captured and address details filled. You can edit them before saving.'
          : 'Live location captured. Please complete the address fields before saving.') + note
      )
    } catch (err) {
      setAddressError(locationErrorMessage(err))
    } finally {
      setLocationBusy(false)
    }
  }

  async function saveAddress(
    event
  ) {
    event.preventDefault()

    setAddressBusy(true)
    setAddressError('')

    try {
      if (editingAddressId) {
        await updateAddress(
          editingAddressId,
          addressForm
        )
      } else {
        await addAddress(
          addressForm
        )
      }

      setAddressEditorOpen(false)
      setEditingAddressId(null)
      setLocationMessage('')
    } catch (error) {
      setAddressError(
        error.message
      )
    } finally {
      setAddressBusy(false)
    }
  }

  function removeAddress(
    address
  ) {
    setConfirmDialog({
      eyebrow:
        'SAVED ADDRESS',

      title:
        'Remove this address?',

      message:
        `${address.label || 'This'
        } address will be removed from your saved delivery addresses.`,

      confirmLabel:
        'Remove address',

      tone:
        'danger',

      onConfirm:
        async () => {
          try {
            await deleteAddress(
              address.id
            )

            setAccountNotice(
              'Address removed'
            )
          } catch (error) {
            setAccountNotice(
              error.message
            )
          }
        },
    })
  }

  async function makeDefault(
    address
  ) {
    try {
      await setDefaultAddress(
        address.id
      )

      setAccountNotice(
        `${address.label ||
        'Address'
        } set as default`
      )
    } catch (error) {
      setAccountNotice(
        error.message
      )
    }
  }

  return (
    <>
      <div className="page-title-banner account-title-banner">
        <div className="page-width page-title-row">
          <div>
            <div className="breadcrumbs">
              Home &nbsp;›&nbsp; My Account
            </div>

            <h1>
              My Account
            </h1>

            <p>
              Manage your orders, wishlist,
              addresses and more.
            </p>
          </div>

          <blockquote>
            “A reader today,
            <br />
            a brighter tomorrow.”
          </blockquote>
        </div>
      </div>

      <section className="page-width account-page premium-account-page min-page account-page-v7">
        {accountNotice && (
          <button
            className="account-action-toast-v73"
            onClick={() =>
              setAccountNotice('')
            }
          >
            {accountNotice}

            <span>
              ×
            </span>
          </button>
        )}

        <aside className="account-sidebar premium-account-sidebar glass-panel account-sidebar-v7">
          <h2 className="account-sidebar-title">
            My Account
          </h2>

          <nav>
            <a href="#overview">
              <span>
                ⌂
              </span>

              Overview
            </a>

            <a href="#orders">
              <span>
                ▣
              </span>

              My Orders
            </a>

            <Link to="/wishlist">
              <span>
                ♡
              </span>

              Wishlist

              {wishlistCount > 0 && (
                <b>{wishlistCount}</b>
              )}
            </Link>

            <a href="#address">
              <span>
                ⌖
              </span>

              Addresses
            </a>

            <Link to="/wallet">
              <span aria-hidden="true">₹</span>
              My Wallet
            </Link>

            <Link to="/account/profile">
              <span>♙</span>
              Profile Settings
            </Link>

            <button
              onClick={logout}
            >
              <span>
                ↪
              </span>

              Logout
            </button>
          </nav>

          <div className="account-sidebar-quote">
            <span>
              🌿
            </span>

            <blockquote>
              “Good books
              <br />
              grow better
              <br />
              human beings.”
            </blockquote>
          </div>
        </aside>

        <div className="account-content">
          <div
            id="overview"
            className="account-welcome premium-account-welcome glass-panel account-welcome-v7"
          >
            <div className="account-welcome-profile">
              <div className="avatar">
                {user?.name
                  ?.charAt(0)
                  ?.toUpperCase()}
              </div>

              <div>
                <span className="eyebrow">
                  ACCOUNT OVERVIEW
                </span>

                <h1>
                  Welcome back,{' '}
                  {
                    user?.name?.split(
                      ' '
                    )[0]
                  }
                </h1>

                <p>
                  {user?.email}
                </p>
              </div>
            </div>

            <div className="account-welcome-actions">
              <Link
                className="outline-btn compact"
                to="/shop"
              >
                Continue shopping
              </Link>

              <button
                className="primary-btn compact"
                onClick={
                  openAddAddress
                }
              >
                + Add address
              </button>
            </div>
          </div>

          <div className="account-overview-grid">
            <a
              href="#orders"
              className="account-overview-card glass-card"
            >
              <span>
                ▣
              </span>

              <div>
                <strong>
                  {orders.length}
                </strong>

                <small>
                  Orders & tracking
                </small>
              </div>

              <b>
                »
              </b>
            </a>

            <Link
              to="/wishlist"
              className="account-overview-card glass-card"
            >
              <span>
                ♡
              </span>

              <div>
                <strong>
                  {wishlistCount}
                </strong>

                <small>
                  Saved books
                </small>
              </div>

              <b>
                »
              </b>
            </Link>

            <a
              href="#address"
              className="account-overview-card glass-card"
            >
              <span>
                ⌖
              </span>

              <div>
                <strong>
                  {addresses.length}
                </strong>

                <small>
                  Delivery addresses
                </small>
              </div>

              <b>
                »
              </b>
            </a>
            <Link
              to="/wallet"
              className="account-overview-card glass-card"
              aria-label="View my cashback wallet"
            >
              <span aria-hidden="true">₹</span>
              <div>
                <strong>
                  {walletLoading ? 'Loading…' : walletError ? 'Unavailable' : formatWalletAmount(wallet?.balancePaise ?? 0)}
                </strong>
                <small>My cashback wallet</small>
              </div>
              <b aria-hidden="true">»</b>
            </Link>
          </div>

          <section
            id="orders"
            className="account-box premium-orders-box glass-panel account-section-v7"
          >
            <div className="section-heading order-section-head">
              <div>
                <span className="eyebrow">
                  PURCHASES
                </span>

                <h2>
                  My Orders
                </h2>

                <p>
                  Select an order to see items
                  and live status history.
                </p>
              </div>

              <button
                className="outline-btn compact"
                onClick={loadOrders}
              >
                ↻ Refresh
              </button>
            </div>

            <div className="order-filter-tabs">
              {[
                'ALL',
                'ACTIVE',
                'DELIVERED',
                'CANCELLED',
              ].map((item) => (
                <button
                  key={item}
                  className={
                    filter === item
                      ? 'active'
                      : ''
                  }
                  onClick={() =>
                    setFilter(item)
                  }
                >
                  {item === 'ALL'
                    ? 'All orders'
                    : item ===
                      'ACTIVE'
                      ? 'Active'
                      : statusLabel(
                        item
                      )}
                </button>
              ))}
            </div>

            <div className="customer-order-layout">
              <div className="customer-order-list">
                {visibleOrders.length ? (
                  visibleOrders.map(
                    (order) => (
                      <button
                        className={`customer-order-card glass-card ${selected?.id ===
                          order.id
                          ? 'selected'
                          : ''
                          }`}
                        key={
                          order.id
                        }
                        onClick={() =>
                          setSelectedId(
                            order.id
                          )
                        }
                      >
                        <div className="order-card-top">
                          <strong>
                            #
                            {
                              order.orderNumber
                            }
                          </strong>

                          <span
                            className={`status-chip status-${String(
                              order.status
                            ).toLowerCase()}`}
                          >
                            {statusLabel(
                              order.status
                            )}
                          </span>
                        </div>

                        <span className="order-date">
                          {order.createdAt
                            ? new Date(
                              order.createdAt
                            ).toLocaleString()
                            : 'Date unavailable'}
                        </span>

                        <div className="order-card-bottom">
                          <span>
                            {order.items?.reduce(
                              (
                                sum,
                                item
                              ) =>
                                sum +
                                Number(
                                  item.quantity ||
                                  0
                                ),
                              0
                            ) || 0}{' '}
                            books
                          </span>

                          <strong>
                            ₹
                            {
                              order.total
                            }
                          </strong>
                        </div>
                      </button>
                    )
                  )
                ) : (
                  <div className="account-empty-v7">
                    <span>
                      ▣
                    </span>

                    <h4>
                      No orders here
                    </h4>

                    <p>
                      Orders matching this
                      filter will appear here.
                    </p>

                    <Link to="/shop">
                      Browse books
                    </Link>
                  </div>
                )}
              </div>

              {selected ? (
                <div className="order-track-panel glass-card">
                  <div className="track-panel-head">
                    <div>
                      <span className="eyebrow">
                        ORDER TRACKING
                      </span>

                      <h3>
                        #
                        {
                          selected.orderNumber
                        }
                      </h3>

                      <small>
                        {selected.createdAt
                          ? new Date(
                            selected.createdAt
                          ).toLocaleString()
                          : ''}
                      </small>
                    </div>

                    <span
                      className={`status-chip status-${String(
                        selected.status
                      ).toLowerCase()}`}
                    >
                      {statusLabel(
                        selected.status
                      )}
                    </span>
                  </div>

                  {selected.status ===
                    'CANCELLED' && (
                      <div className="cancelled-order-banner">
                        <b>
                          Order cancelled
                        </b>

                        <span>
                          If the store reopens this
                          order, the next tracking
                          event will appear here
                          automatically.
                        </span>
                      </div>
                    )}

                  {(selected.courierName || selected.trackingNumber) && (
                    <div className="tracking-shipment-v7">
                      <strong>Shipment details</strong>
                      <span>
                        {selected.courierName || 'Courier'} · {selected.trackingNumber || '—'}
                      </span>
                      {selected.trackingNumber && (
                        <a
                          href="https://www.indiapost.gov.in/"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Track on India Post ↗
                        </a>
                      )}
                    </div>
                  )}

                  <div className="tracking-history-v6">
                    {(selected.statusHistory ||
                      []).length ? (
                      [
                        ...selected.statusHistory,
                      ].map(
                        (
                          event,
                          index
                        ) => (
                          <div
                            className="history-step-v6"
                            key={`${event.status
                              }-${event.at ||
                              index
                              }`}
                          >
                            <span className="history-dot-v6">
                              {index +
                                1}
                            </span>

                            <div>
                              <strong>
                                {statusLabel(
                                  event.status
                                )}
                              </strong>

                              <small>
                                {event.at
                                  ? new Date(
                                    event.at
                                  ).toLocaleString()
                                  : 'Time unavailable'}
                              </small>

                              {event.note && (
                                <p>
                                  {
                                    event.note
                                  }
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      )
                    ) : (
                      <p className="muted">
                        Tracking updates will
                        appear here as your order
                        progresses.
                      </p>
                    )}
                  </div>

                  <div className="tracked-items">
                    <h4>
                      Items in this order
                    </h4>

                    {selected.items?.map(
                      (item) => (
                        <div
                          className="tracked-item"
                          key={`${selected.id}-${item.bookId}`}
                        >
                          <img
                            src={
                              item.image
                            }
                            alt=""
                          />

                          <div>
                            <strong>
                              {
                                item.title
                              }
                            </strong>

                            <span>
                              Qty{' '}
                              {
                                item.quantity
                              }
                            </span>
                          </div>

                          <b>
                            ₹
                            {item.price *
                              item.quantity}
                          </b>
                        </div>
                      )
                    )}
                  </div>
                </div>
              ) : (
                <div className="order-track-panel empty-track glass-card">
                  <span className="empty-icon-v7">
                    ◎
                  </span>

                  <h3>
                    No order selected
                  </h3>

                  <p>
                    Select an order to view
                    tracking details.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section
            id="address"
            className="account-box glass-panel account-section-v7 address-section-v7"
          >
            <div className="section-heading address-heading-v7">
              <div>
                <span className="eyebrow">
                  DELIVERY
                </span>

                <h2>
                  My Addresses
                </h2>

                <p>
                  Save multiple addresses, use
                  your live location and choose
                  a default delivery address.
                </p>
              </div>

              <button
                className="primary-btn compact"
                onClick={
                  openAddAddress
                }
              >
                + Add new address
              </button>
            </div>

            {addresses.length ? (
              <div className="address-grid-v7">
                {addresses.map(
                  (address) => (
                    <article
                      className={`address-card-v7 glass-card ${address.defaultAddress
                        ? 'is-default'
                        : ''
                        }`}
                      key={address.id}
                    >
                      <div className="address-card-head-v7">
                        <div>
                          <span className="address-label-v7">
                            {address.label ||
                              'Address'}
                          </span>

                          {address.defaultAddress && (
                            <span className="default-address-chip">
                              Default
                            </span>
                          )}
                        </div>

                        {address.latitude !=
                          null &&
                          address.longitude !=
                          null && (
                            <span className="location-saved-chip">
                              ⌖ Location saved
                            </span>
                          )}
                      </div>

                      <strong>
                        {address.fullName}
                      </strong>

                      <p>
                        {address.line1}
                        {address.locality ? `, ${address.locality}` : ''}

                        {address.line2
                          ? `, ${address.line2}`
                          : ''}

                        <br />

                        {address.city}
                        {address.district ? `, ${address.district}` : ''},{' '}
                        {address.state} -{' '}
                        {address.pincode}
                      </p>

                      <span className="address-mobile-v7">
                        ☎ {address.mobile}
                      </span>

                      {address.locationLabel && (
                        <small className="address-location-label-v7">
                          {
                            address.locationLabel
                          }
                        </small>
                      )}

                      <div className="address-actions-v7">
                        <button
                          onClick={() =>
                            openEditAddress(
                              address
                            )
                          }
                        >
                          Edit
                        </button>

                        {!address.defaultAddress && (
                          <button
                            onClick={() =>
                              makeDefault(
                                address
                              )
                            }
                          >
                            Set default
                          </button>
                        )}

                        {address.latitude !=
                          null &&
                          address.longitude !=
                          null && (
                            <a
                              href={mapOpenUrl(
                                address.latitude,
                                address.longitude
                              )}
                              target="_blank"
                              rel="noreferrer"
                            >
                              View map
                            </a>
                          )}

                        <button
                          className="danger-link-v7"
                          onClick={() =>
                            removeAddress(
                              address
                            )
                          }
                        >
                          Remove
                        </button>
                      </div>
                    </article>
                  )
                )}
              </div>
            ) : (
              <div className="address-empty-v7">
                <div className="address-empty-icon-v7">
                  ⌖
                </div>

                <div>
                  <h3>
                    No saved address yet
                  </h3>

                  <p>
                    Add a delivery address
                    manually or fetch your
                    current location from the
                    map.
                  </p>
                </div>

                <button
                  className="primary-btn compact"
                  onClick={
                    openAddAddress
                  }
                >
                  + Add address
                </button>
              </div>
            )}

            {defaultAddress && (
              <div className="default-delivery-note-v7">
                ✓

                <span>
                  <b>
                    {defaultAddress.label ||
                      'Default address'}
                  </b>{' '}
                  will be preselected during
                  checkout.
                </span>
              </div>
            )}
          </section>
        </div>

        {addressEditorOpen && (
          <div
            className="address-modal-backdrop-v7"
            onMouseDown={(event) =>
              event.target ===
              event.currentTarget &&
              closeAddressEditor()
            }
          >
            <div
              className="address-modal-v7 glass-panel"
              role="dialog"
              aria-modal="true"
              aria-label={
                editingAddressId
                  ? 'Edit address'
                  : 'Add address'
              }
            >
              <div className="address-modal-head-v7">
                <div>
                  <span className="eyebrow">
                    DELIVERY ADDRESS
                  </span>

                  <h2>
                    {editingAddressId
                      ? 'Edit saved address'
                      : 'Add a new address'}
                  </h2>

                  <p>
                    Enter the address manually
                    or capture your live
                    location.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    closeAddressEditor
                  }
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <div className="location-capture-panel-v7">
                <div>
                  <span className="location-icon-v7">
                    ⌖
                  </span>

                  <div>
                    <strong>
                      Use your current location
                    </strong>

                    <p>
                      We will ask for browser
                      permission, show the
                      location on a map and fill
                      available address fields.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="location-button-v7"
                  onClick={
                    useCurrentLocation
                  }
                  disabled={
                    locationBusy
                  }
                >
                  {locationBusy
                    ? 'Locating...'
                    : addressForm.latitude !=
                      null
                      ? '↻ Refresh location'
                      : '⌖ Use current location'}
                </button>
              </div>

              {addressForm.latitude !=
                null &&
                addressForm.longitude !=
                null && (
                  <div className="address-map-wrap-v7">
                    <iframe
                      title="Saved delivery location"
                      src={mapEmbedUrl(
                        addressForm.latitude,
                        addressForm.longitude
                      )}
                      loading="lazy"
                    />

                    <div>
                      <span>
                        Latitude{' '}
                        {
                          addressForm.latitude
                        }{' '}
                        · Longitude{' '}
                        {
                          addressForm.longitude
                        }
                      </span>

                      <a
                        href={mapOpenUrl(
                          addressForm.latitude,
                          addressForm.longitude
                        )}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open full map ↗
                      </a>
                    </div>
                  </div>
                )}

              {locationMessage && (
                <div className="location-success-v7">
                  ✓ {locationMessage}
                </div>
              )}

              {addressError && (
                <div className="form-error">
                  {addressError}
                </div>
              )}

              <form
                className="address-form-v7"
                onSubmit={
                  saveAddress
                }
              >
                <div className="address-form-grid-v7">
                  <div>
                    <label>
                      Address label
                    </label>

                    <PremiumSelect
                      value={
                        addressForm.label
                      }
                      options={[
                        {
                          value:
                            'Home',
                          label:
                            'Home',
                        },
                        {
                          value:
                            'Work',
                          label:
                            'Work',
                        },
                        {
                          value:
                            'Other',
                          label:
                            'Other',
                        },
                      ]}
                      onChange={(
                        value
                      ) =>
                        setAddressForm(
                          (
                            current
                          ) => ({
                            ...current,
                            label:
                              value,
                          })
                        )
                      }
                    />
                  </div>

                  <div>
                    <label>
                      Full name
                    </label>

                    <input
                      name="fullName"
                      value={
                        addressForm.fullName
                      }
                      onChange={
                        changeAddress
                      }
                      required
                    />
                  </div>

                  <div>
                    <label>
                      Mobile number
                    </label>

                    <input
                      name="mobile"
                      value={
                        addressForm.mobile
                      }
                      onChange={
                        changeAddress
                      }
                      required
                    />
                  </div>

                  <div className="wide">
                    <label>
                      Flat / House / Street
                    </label>

                    <input
                      name="line1"
                      value={
                        addressForm.line1
                      }
                      onChange={
                        changeAddress
                      }
                      required
                    />
                  </div>

                  <div className="wide">
                    <label>Area / Locality</label>
                    <input name="locality" value={addressForm.locality || ''} onChange={changeAddress} placeholder="e.g. Madipakkam, Periyar Nagar" />
                  </div>

                  <div className="wide">
                    <label>
                      Delivery notes / Landmark
                    </label>

                    <input
                      name="line2"
                      value={
                        addressForm.line2
                      }
                      onChange={
                        changeAddress
                      }
                    />
                  </div>

                  <div>
                    <label>
                      City
                    </label>

                    <input
                      name="city"
                      value={
                        addressForm.city
                      }
                      onChange={
                        changeAddress
                      }
                      required
                    />
                  </div>

                  <div>
                    <label>
                      District
                    </label>

                    <input
                      name="district"
                      value={
                        addressForm.district
                      }
                      onChange={
                        changeAddress
                      }
                    />
                  </div>

                  <div>
                    <label>
                      State
                    </label>

                    <input
                      name="state"
                      value={
                        addressForm.state
                      }
                      onChange={
                        changeAddress
                      }
                      required
                    />
                  </div>

                  <div>
                    <label>
                      Pincode
                    </label>

                    <input
                      name="pincode"
                      value={
                        addressForm.pincode
                      }
                      onChange={
                        changeAddress
                      }
                      inputMode="numeric"
                      required
                    />
                  </div>
                </div>

                <label className="default-address-check-v7 premium-check-v73">
                  <input
                    type="checkbox"
                    name="defaultAddress"
                    checked={Boolean(
                      addressForm.defaultAddress
                    )}
                    onChange={
                      changeAddress
                    }
                  />

                  <span>
                    Use this as my default
                    delivery address
                  </span>
                </label>

                <div className="address-modal-actions-v7">
                  <button
                    type="button"
                    className="outline-btn"
                    onClick={
                      closeAddressEditor
                    }
                  >
                    Cancel
                  </button>

                  <button
                    className="primary-btn"
                    disabled={
                      addressBusy
                    }
                  >
                    {addressBusy
                      ? 'Saving...'
                      : editingAddressId
                        ? 'Save changes'
                        : 'Save address'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <PremiumConfirm
          dialog={confirmDialog}
          onClose={() =>
            setConfirmDialog(null)
          }
        />
      </section>
    </>
  )
}

