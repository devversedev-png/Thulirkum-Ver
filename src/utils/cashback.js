import { getPricing } from './pricing'

/**
 * A public preview of one paid copy's cashback. Checkout on the backend is authoritative:
 * BOGO-free units, wallet-funded amounts and payment status can reduce the final credit.
 */
export function cashbackForBook(book, homeSections) {
  if (!book?.id || !Array.isArray(homeSections)) return null
  const section = homeSections.find(item => item?.key === 'cashback' &&
    item.active !== false && item.config?.enabled !== false)
  if (!section) return null

  // eligibleBookIds includes every admin-selected book, even when the home page's
  // Maximum books display limit hides some of them.
  const eligibleIds = section.eligibleBookIds || section.bookIds || []
  if (!eligibleIds.includes(book.id)) return null

  const rule = section.config?.perBookCashbacks?.[book.id]
  if (!rule || !['FIXED', 'PERCENT'].includes(rule.type)) return null
  const value = Number(rule.value)
  const pricePaise = Math.round(getPricing(book).selling * 100)
  if (!Number.isFinite(value) || value <= 0 || pricePaise <= 0 ||
    (rule.type === 'PERCENT' && value > 100)) return null

  const amountPaise = rule.type === 'PERCENT'
    ? Math.min(pricePaise, Math.round(pricePaise * value / 100))
    : Math.min(pricePaise, Math.round(value * 100))
  if (amountPaise <= 0) return null
  return { type: rule.type, value, amountPaise, amount: amountPaise / 100 }
}
