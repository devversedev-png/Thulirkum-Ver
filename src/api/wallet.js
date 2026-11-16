import { api } from './client'

/** Customer-only, read-only wallet endpoint. The server owns all balances. */
export async function fetchWallet() {
  const data = await api('/wallet')

  if (
    !data ||
    !Number.isSafeInteger(data.balancePaise) ||
    !Array.isArray(data.transactions)
  ) {
    throw new Error('The wallet service returned an unexpected response.')
  }

  if (data.currency && data.currency !== 'INR') {
    throw new Error('Wallet currency does not match INR.')
  }

  return {
    currency: 'INR',
    balancePaise: data.balancePaise,
    transactions: data.transactions.filter(
      (item) => item && Number.isSafeInteger(item.amountPaise)
    ),
  }
}
