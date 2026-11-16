/**
 * Single source of truth for how a book's price is displayed.
 *
 * The backend returns:
 *   price         the customer selling price (already includes any admin promotion)
 *   basePrice     the normal selling price
 *   discountType / discountValue   the active admin promotion, empty or zero when there is none
 *
 * A book is "on sale" only when the admin configured a positive discount. The printed MRP
 * (originalPrice) is never treated as a promotion.
 */
export function getPricing(book) {
  const selling = toAmount(book?.price)
  const base = toAmount(book?.basePrice) || selling
  const value = Number(book?.discountValue)

  const hasDiscount =
    Number.isFinite(value) && value > 0 && base > selling

  return {
    selling,
    original: hasDiscount ? base : selling,
    hasDiscount,
    percent: hasDiscount
      ? Math.max(1, Math.round(((base - selling) / base) * 100))
      : 0,
  }
}

export function formatMoney(value) {
  return toAmount(value).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function toAmount(value) {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : 0
}
