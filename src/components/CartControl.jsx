import { useStore } from '../context/StoreContext'

/*
 * Add to Cart button that turns into a  "−  N item(s) added  +"  stepper
 * once the book is in the cart. Going back to 0 restores "Add to Cart".
 * All updates are optimistic (handled by StoreContext).
 */
export default function CartControl({
  book,
  available,
  className = 'market-cart-button',
  addQuantity = 1,
  addLabel = 'Add to Cart',
  guard,
  onAdd,
  onError,
}) {
  const { account, addToCart, updateCart, removeFromCart } = useStore()

  const inCart = Number(
    account?.cart?.find(
      item => String(item.bookId) === String(book.id)
    )?.quantity || 0
  )

  const maxStock = Number(book.stock || 0)

  function run(promise) {
    Promise.resolve(promise).catch(err => onError?.(err))
  }

  function add() {
    if (!available) return
    if (guard && !guard()) return
    onAdd?.()
    run(addToCart(book.id, addQuantity))
  }

  function increase() {
    if (inCart >= maxStock) return
    run(addToCart(book.id, 1))
  }

  function decrease() {
    run(
      inCart <= 1
        ? removeFromCart(book.id)
        : updateCart(book.id, inCart - 1)
    )
  }

  if (!available) {
    return (
      <button className={className} disabled>
        Out of Stock
      </button>
    )
  }

  if (inCart <= 0) {
    return (
      <button className={className} onClick={add}>
        {addLabel}
      </button>
    )
  }

  return (
    <div className="cart-stepper" role="group" aria-label="Cart quantity">
      <button
        type="button"
        onClick={decrease}
        aria-label="Decrease quantity"
      >
        −
      </button>

      <span aria-live="polite">
        {inCart} {inCart === 1 ? 'item' : 'items'} added
      </span>

      <button
        type="button"
        onClick={increase}
        disabled={inCart >= maxStock}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  )
}
