import { api } from './client'

export async function createRazorpayOrder({ address, couponCode = null, useWallet = false }) {
  return api('/payments/create-order', {
    method: 'POST',
    body: JSON.stringify({
      address,
      couponCode,
      useWallet,
    }),
  })
}

export async function verifyRazorpayPayment(data) {
  return api('/payments/verify', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/** Server-side quote: never trust browser-calculated wallet redemption. */
export async function quoteCheckout({ couponCode = null, useWallet = false } = {}) {
  return api('/payments/quote', {
    method: 'POST',
    body: JSON.stringify({ couponCode, useWallet }),
  })
}

/** Wallet-only purchase does not open Razorpay and requires a full wallet balance. */
export async function payFullyWithWallet({ address, couponCode = null }) {
  return api('/payments/wallet-checkout', {
    method: 'POST',
    body: JSON.stringify({ address, couponCode, useWallet: true }),
  })
}
