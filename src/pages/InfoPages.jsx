import { useDeliverySettings } from '../utils/delivery'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import InfoShell, { InfoCard, InfoCta, InfoSection } from '../components/InfoShell'
import { SITE } from '../data/siteInfo'

/* ------------------------------ ABOUT ------------------------------ */
export function AboutPage() {
  return (
    <InfoShell
      eyebrow="Our story"
      title="About Us"
      intro="A neighbourhood bookstore at heart — bringing Tamil classics, timeless bestsellers and fresh ideas to every reader."
    >
      <div className="info-lead">
        <p>
          <strong>{SITE.name}</strong> began with a simple belief: a good book can change the way a
          person thinks, and a reading family can change a generation. We curate a thoughtful
          collection — from Kalki’s epics to modern self-growth — and deliver it carefully to your door.
        </p>
      </div>

      <div className="info-stats">
        <div><b>Curated</b><span>Hand-picked catalogue</span></div>
        <div><b>Genuine</b><span>Original, quality copies</span></div>
        <div><b>Pan-India</b><span>Reliable delivery</span></div>
        <div><b>Secure</b><span>Protected payments</span></div>
      </div>

      <div className="info-grid">
        <InfoCard icon="📖" title="Our Mission">
          To make meaningful books easy to find and affordable to own, and to nurture a lasting
          reading habit in every home.
        </InfoCard>
        <InfoCard icon="🌱" title="Our Roots">
          The name <em>Thulirkum Ver</em> speaks of roots that sprout new shoots — honouring our
          literature while welcoming new voices.
        </InfoCard>
        <InfoCard icon="🤝" title="Our Promise">
          Honest prices, careful packing and a real person to help whenever you need us.
        </InfoCard>
      </div>

      <InfoSection title="What you’ll find here">
        <ul className="info-list">
          <li>Tamil literature, history and classics, including beloved novels and biographies.</li>
          <li>Bestselling self-development, fiction and general-knowledge titles.</li>
          <li>Regular offers, new arrivals and featured picks chosen by our team.</li>
        </ul>
      </InfoSection>

      <InfoCta
        title="Ready for your next read?"
        text="Browse the full collection and find a book that stays with you."
        to="/shop"
        label="Explore All Books »"
      />
    </InfoShell>
  )
}

/* ----------------------------- SHIPPING ----------------------------- */
export function ShippingPage() {
  const delivery = useDeliverySettings()
  const freeAll = !delivery.enabled || delivery.freeShippingAll
  const threshold = (delivery.freeDeliveryThresholdPaise / 100).toLocaleString('en-IN')
  const fee = (delivery.feePaise / 100).toLocaleString('en-IN')
  return (
    <InfoShell
      eyebrow="Delivery"
      title="Shipping & Delivery"
      intro="Careful packing, clear charges and delivery you can follow every step of the way."
    >
      <div className="info-grid">
        <InfoCard icon="🎁" title="Free delivery">
          {freeAll ? 'Free delivery on every order.' : `On orders of ₹${threshold} and above, shipping is on us.`}
        </InfoCard>
        <InfoCard icon="🚚" title="Flat shipping">
          {freeAll ? 'No delivery fee is charged.' : `Orders below ₹${threshold} carry a flat ₹${fee} delivery fee.`}
        </InfoCard>
        <InfoCard icon="⏱" title="Delivery time">
          Typically {SITE.deliveryDays} after dispatch, depending on your location.
        </InfoCard>
      </div>

      <InfoSection title="How your order travels">
        <ol className="info-steps">
          <li><b>Order confirmed</b><span>We receive your order and payment confirmation instantly.</span></li>
          <li><b>Packed with care</b><span>Books are checked and packed within {SITE.processingDays}.</span></li>
          <li><b>Shipped</b><span>Your parcel is handed to our courier partner with a tracking number.</span></li>
          <li><b>Out for delivery</b><span>The courier brings it to the address you provided.</span></li>
          <li><b>Delivered</b><span>Enjoy your book! Tell us if anything is not right.</span></li>
        </ol>
      </InfoSection>

      <InfoSection title="Good to know">
        <ul className="info-list">
          <li>Please double-check your address and phone number at checkout so the courier can reach you.</li>
          <li>Delivery estimates are working days and exclude Sundays and public holidays.</li>
          <li>Remote locations or festival seasons may take a little longer — we’ll keep you updated.</li>
          <li>Track any order anytime from <Link to="/track-order">Order Tracking</Link>.</li>
        </ul>
      </InfoSection>
    </InfoShell>
  )
}

/* ------------------------------ RETURNS ------------------------------ */
export function ReturnsPage() {
  return (
    <InfoShell
      eyebrow="Peace of mind"
      title="Returns & Refunds"
      intro="If something isn’t right with your books, we’ll make it right."
    >
      <div className="info-grid">
        <InfoCard icon="📦" title={`${SITE.returnDays}-day window`}>
          Report a problem within {SITE.returnDays} days of delivery.
        </InfoCard>
        <InfoCard icon="🔁" title="Easy replacement">
          Damaged, defective or wrong item? We’ll send a replacement.
        </InfoCard>
        <InfoCard icon="💳" title="Refund to source">
          Approved refunds return to your original payment method in {SITE.refundDays}.
        </InfoCard>
      </div>

      <InfoSection title="Eligible for return or replacement">
        <ul className="info-list">
          <li>The book arrived damaged, torn or with misprinted pages.</li>
          <li>You received a different title or edition from what you ordered.</li>
          <li>The parcel arrived incomplete.</li>
        </ul>
      </InfoSection>

      <InfoSection title="Not eligible">
        <ul className="info-list">
          <li>Books that are used, written on or damaged after delivery.</li>
          <li>Requests raised after the {SITE.returnDays}-day window.</li>
          <li>Change-of-mind returns, unless the item is unopened and in original condition.</li>
        </ul>
      </InfoSection>

      <InfoSection title="How to request a return">
        <ol className="info-steps">
          <li><b>Write to us</b><span>Email {SITE.supportEmail} with your order number and clear photos of the issue.</span></li>
          <li><b>We review</b><span>Our team confirms eligibility within one working day.</span></li>
          <li><b>Pickup or replacement</b><span>We arrange a pickup or dispatch your replacement.</span></li>
          <li><b>Refund</b><span>After inspection, approved refunds are processed in {SITE.refundDays}.</span></li>
        </ol>
      </InfoSection>

      <InfoSection title="Cancellations">
        <p>
          Orders can be cancelled before they are shipped. Contact us as early as possible and we’ll
          cancel the order and refund it to the original payment method.
        </p>
      </InfoSection>
    </InfoShell>
  )
}

/* -------------------------------- FAQ -------------------------------- */
const FAQS = [
  ['How do I place an order?', 'Add books to your cart, open the cart, review the items and proceed to checkout. Enter your delivery address, pay securely online and you’re done.'],
  ['Which payment methods do you accept?', 'We accept UPI, cards and net banking through our secure Razorpay checkout. We never see or store your card details.'],
  ['How much is shipping?', `Delivery is free on orders of ₹${SITE.freeShippingAbove} and above. Smaller orders carry a flat ₹${SITE.shippingFee} fee.`],
  ['How long will delivery take?', `Orders are packed in ${SITE.processingDays} and usually arrive in ${SITE.deliveryDays} after dispatch.`],
  ['How can I track my order?', 'Open Order Tracking from the footer or your account to see live status, courier and tracking number.'],
  ['Can I cancel or change my order?', 'Yes, until it ships. Email us with your order number and we’ll help right away.'],
  ['What if my book arrives damaged?', `Contact us within ${SITE.returnDays} days of delivery with photos and we’ll arrange a replacement or refund.`],
  ['How do I use an offer code?', 'Enter the code in the coupon box on your cart or checkout page. Eligible discounts apply instantly.'],
  ['Can I save books for later?', 'Tap the heart icon on any book to add it to your wishlist, available any time from your account.'],
  ['I forgot my password. What now?', `Use the login page to reset it, or write to ${SITE.supportEmail} and we’ll help you regain access.`],
]

export function FaqPage() {
  const delivery = useDeliverySettings()
  const answers = FAQS.map(([q, a]) => q === 'How much is shipping?'
    ? [q, (!delivery.enabled || delivery.freeShippingAll)
      ? 'Delivery is free for all orders.'
      : `Delivery is free on orders of ₹${(delivery.freeDeliveryThresholdPaise / 100).toLocaleString('en-IN')} and above. Smaller orders carry a flat ₹${(delivery.feePaise / 100).toLocaleString('en-IN')} fee.`]
    : [q, a])
  const [open, setOpen] = useState(0)
  return (
    <InfoShell
      eyebrow="Help centre"
      title="Frequently Asked Questions"
      intro="Quick answers to the things readers ask us most."
    >
      <div className="faq-list">
        {answers.map(([q, a], i) => (
          <div key={q} className={`faq-item ${open === i ? 'open' : ''}`}>
            <button type="button" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
              <span>{q}</span>
              <b>{open === i ? '−' : '+'}</b>
            </button>
            {open === i && <p>{a}</p>}
          </div>
        ))}
      </div>

      <InfoCta
        title="Still need help?"
        text="Write to us and a real person will get back to you within one working day."
        to="/track-order"
        label="Track an Order »"
      />
    </InfoShell>
  )
}

/* ------------------------------- TERMS ------------------------------- */
export function TermsPage() {
  return (
    <InfoShell
      eyebrow="Legal"
      title="Terms & Conditions"
      intro="Please read these terms carefully before using our website or placing an order."
      updated
    >
      <InfoSection title="1. Acceptance of terms">
        <p>By accessing {SITE.name} or placing an order, you agree to these Terms & Conditions. If you do not agree, please do not use the website.</p>
      </InfoSection>
      <InfoSection title="2. Your account">
        <p>You are responsible for keeping your login details confidential and for all activity under your account. Please provide accurate information and tell us promptly about any unauthorised use.</p>
      </InfoSection>
      <InfoSection title="3. Products and pricing">
        <p>We try to show accurate descriptions, images and prices. Prices are in Indian Rupees (₹) and may change without notice. If an item is mispriced or unavailable, we may cancel the order and refund any payment made.</p>
      </InfoSection>
      <InfoSection title="4. Orders and payment">
        <p>An order is confirmed once payment is verified. Payments are processed securely by our payment partner; we do not store your card or UPI credentials.</p>
      </InfoSection>
      <InfoSection title="5. Shipping, returns and refunds">
        <p>Delivery, return and refund conditions are described in our <Link to="/shipping">Shipping & Delivery</Link> and <Link to="/returns">Returns & Refunds</Link> pages, which form part of these terms.</p>
      </InfoSection>
      <InfoSection title="6. Intellectual property">
        <p>All content on this website, including text, logos, graphics and layout, belongs to {SITE.name} or its licensors and may not be copied or reused without permission. Book covers and titles remain the property of their respective publishers and authors.</p>
      </InfoSection>
      <InfoSection title="7. Limitation of liability">
        <p>To the extent permitted by law, we are not liable for indirect or consequential losses arising from use of the website. Our liability for any order is limited to the amount paid for it.</p>
      </InfoSection>
      <InfoSection title="8. Changes to these terms">
        <p>We may update these terms from time to time. Continued use of the website after changes means you accept the updated terms.</p>
      </InfoSection>
      <InfoSection title="9. Contact">
        <p>Questions about these terms? Email <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>.</p>
      </InfoSection>
    </InfoShell>
  )
}

/* ------------------------------ PRIVACY ------------------------------ */
export function PrivacyPage() {
  return (
    <InfoShell
      eyebrow="Your data"
      title="Privacy Policy"
      intro="We respect your privacy and collect only what we need to deliver your books."
      updated
    >
      <InfoSection title="Information we collect">
        <ul className="info-list">
          <li>Account details such as your name, email address and mobile number.</li>
          <li>Delivery addresses you save or enter at checkout.</li>
          <li>Order history, wishlist and cart items.</li>
          <li>Technical data like browser type, used to keep the website working well.</li>
        </ul>
      </InfoSection>
      <InfoSection title="How we use it">
        <ul className="info-list">
          <li>To process, deliver and support your orders.</li>
          <li>To send order updates and important account messages.</li>
          <li>To improve our catalogue, offers and website experience.</li>
        </ul>
      </InfoSection>
      <InfoSection title="Payments">
        <p>Payments are handled by Razorpay. Your card, UPI or banking details go directly to the payment provider and are never stored on our servers.</p>
      </InfoSection>
      <InfoSection title="Sharing">
        <p>We do not sell your personal information. We share only what is necessary with courier partners to deliver your order, with our payment provider to process payment, and where required by law.</p>
      </InfoSection>
      <InfoSection title="Security">
        <p>We use industry-standard safeguards, including encrypted connections and authenticated access, to protect your information. No method of transmission is completely secure, but we work hard to protect your data.</p>
      </InfoSection>
      <InfoSection title="Your choices">
        <p>You can view and update your profile and addresses in <Link to="/account">My Account</Link>. To request correction or deletion of your data, email <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>.</p>
      </InfoSection>
    </InfoShell>
  )
}
