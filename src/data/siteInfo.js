/*
 * Business facts used by the Footer info pages.
 * Edit these values to match your real policies — every page updates.
 */
export const SITE = {
  name: 'Thulirkum Ver Book Store',
  tagline: 'Books that take roots, readers that shape generations.',
  supportEmail: import.meta.env.VITE_SUPPORT_EMAIL || 'support@thulirkumver.com',
  freeShippingAbove: 499,
  shippingFee: 60,
  deliveryDays: '3–7 business days',
  processingDays: '1–2 business days',
  returnDays: 7,
  refundDays: '5–7 business days',
  lastUpdated: '9 October 2026',
}

export const INFO_LINKS = [
  { to: '/about', label: 'About Us' },
  { to: '/shipping', label: 'Shipping & Delivery' },
  { to: '/returns', label: 'Returns & Refunds' },
  { to: '/faq', label: 'FAQs' },
  { to: '/track-order', label: 'Order Tracking' },
  { to: '/terms', label: 'Terms & Conditions' },
  { to: '/privacy', label: 'Privacy Policy' },
]
