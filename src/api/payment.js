import { api } from './client'

export async function createRazorpayOrder({ address, couponCode = null }) {
  return api('/payments/create-order', {
    method: 'POST',
    body: JSON.stringify({
      address,
      couponCode,
    }),
  })
}

export async function verifyRazorpayPayment(data) {
  return api('/payments/verify', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
