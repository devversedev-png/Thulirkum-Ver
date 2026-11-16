const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** Backend uses integer paise (not rupee floats) for wallet amounts. */
export function formatWalletAmount(amountPaise = 0) {
  const paise = Number(amountPaise)
  return inrFormatter.format(Number.isFinite(paise) ? paise / 100 : 0)
}

export function formatWalletDate(value) {
  if (!value) return 'Date unavailable'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date unavailable'
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}
