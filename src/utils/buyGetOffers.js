/** One bundle requires ALL paid titles at their configured quantities.
 * All configured gifts are awarded together. Legacy single-title records remain valid.
 * Only backend-confirmed checkout snapshots determine final gift stock and prices. */
export const isBundle = offer => offer?.offerType === 'BUY_GET'
export const paidBooksFor = offer => Array.isArray(offer?.buyItems) && offer.buyItems.length
  ? offer.buyItems : offer?.buyBookId ? [{ bookId: offer.buyBookId, quantity: offer.buyQuantity || 1 }] : []
export const giftBooksFor = offer => Array.isArray(offer?.giftItems) && offer.giftItems.length
  ? offer.giftItems : offer?.getBookId ? [{ bookId: offer.getBookId, quantity: offer.getQuantity || 1 }] : []
export const describeBookLines = (items, books = []) => items.map(line =>
  `${line.quantity} ${books.find(book => String(book.id) === String(line.bookId))?.title || 'selected book'}`
).join(' + ')
export function activeOffers(offers = []) {
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
  return (offers || []).filter(offer => isBundle(offer) && offer.active !== false &&
    (!offer.startDate || offer.startDate <= today) && (!offer.endDate || offer.endDate >= today) &&
    paidBooksFor(offer).length && giftBooksFor(offer).length)
}
export function activeBundleForBook(bookId, offers = []) {
  return activeOffers(offers).find(offer => paidBooksFor(offer).some(item => String(item.bookId) === String(bookId))) || null
}
export function previewBuyGet(rows = [], offers = [], books = []) {
  const byId = new Map((books || []).map(book => [String(book.id), book]))
  const quantities = new Map(rows.map(row => [String(row.book.id), Number(row.quantity)]))
  const giftMap = new Map()
  const summaries = []
  const used = new Set()
  for (const offer of activeOffers(offers)) {
    const paid = paidBooksFor(offer)
    if (paid.some(item => used.has(String(item.bookId)))) continue
    const bundles = Math.min(...paid.map(line => Math.floor((quantities.get(String(line.bookId)) || 0) / Number(line.quantity))))
    if (!Number.isFinite(bundles) || bundles < 1) continue
    for (const line of giftBooksFor(offer)) {
      const count = bundles * Number(line.quantity)
      const book = byId.get(String(line.bookId))
      summaries.push({ offer, count, giftBook: book || null, bundles })
      if (!book) continue
      const key = String(book.id)
      const entry = giftMap.get(key) || { book, quantity: 0 }
      entry.quantity += count
      giftMap.set(key, entry)
    }
    paid.forEach(item => used.add(String(item.bookId)))
  }
  const gifts = [...giftMap.values()]
  const giftValuePaise = gifts.reduce((sum, {book,quantity}) => sum + Math.round(Number(book.price || 0)*100)*quantity, 0)
  return { gifts, summaries, giftValuePaise }
}
