import { useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown, IndianRupee, Percent } from 'lucide-react'

const CASHBACK_TYPES = [
  {
    value: 'PERCENT',
    label: 'Percentage (%)',
    description: 'Percentage of book price',
    Icon: Percent,
  },
  {
    value: 'FIXED',
    label: 'Fixed amount (₹)',
    description: 'Flat cashback in rupees',
    Icon: IndianRupee,
  },
]

/**
 * Dropdown for the per-book cashback editor only.
 * Keeps the saved types (PERCENT and FIXED) unchanged.
 */
export default function CashbackTypeDropdown({ value, bookTitle, onChange }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  const menuId = useId()
  const selected = CASHBACK_TYPES.find(option => option.value === value) || CASHBACK_TYPES[0]
  const SelectedIcon = selected.Icon

  useEffect(() => {
    if (!open) return undefined

    // Focus the checked option for keyboard and screen-reader navigation.
    menuRef.current?.querySelector('[aria-checked="true"]')?.focus()

    function closeOutside(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('pointerdown', closeOutside)
    return () => document.removeEventListener('pointerdown', closeOutside)
  }, [open])

  function choose(nextValue) {
    if (nextValue !== value) onChange(nextValue)
    setOpen(false)
    triggerRef.current?.focus()
  }

  function handleMenuKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
      triggerRef.current?.focus()
      return
    }

    if (event.key === 'Tab') {
      setOpen(false)
      return
    }

    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const options = Array.from(menuRef.current?.querySelectorAll('[role="menuitemradio"]') || [])
    if (!options.length) return
    const index = options.indexOf(document.activeElement)
    const nextIndex = event.key === 'Home' ? 0
      : event.key === 'End' ? options.length - 1
      : event.key === 'ArrowDown' ? (index + 1) % options.length
      : (index - 1 + options.length) % options.length
    options[nextIndex]?.focus()
  }

  return (
    <div ref={rootRef} className={`tv-cashback-type-select${open ? ' is-open' : ''}`}>
      <button
        ref={triggerRef}
        type="button"
        className="tv-cashback-type-trigger"
        aria-label={`Cashback type for ${bookTitle}: ${selected.label}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen(current => !current)}
        onKeyDown={event => {
          if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && !open) {
            event.preventDefault()
            setOpen(true)
          }
        }}
      >
        <span className="tv-cashback-type-symbol" aria-hidden="true"><SelectedIcon size={17} strokeWidth={2.2} /></span>
        <span className="tv-cashback-type-current">{selected.label}</span>
        <ChevronDown className="tv-cashback-type-chevron" size={16} aria-hidden="true" />
      </button>

      {open && (
        <div
          ref={menuRef}
          id={menuId}
          className="tv-cashback-type-menu"
          role="menu"
          aria-label={`Choose cashback type for ${bookTitle}`}
          onKeyDown={handleMenuKeyDown}
        >
          {CASHBACK_TYPES.map(option => {
            const Icon = option.Icon
            const isSelected = option.value === selected.value
            return (
              <button
                key={option.value}
                type="button"
                role="menuitemradio"
                aria-checked={isSelected}
                className={`tv-cashback-type-option${isSelected ? ' is-selected' : ''}`}
                onClick={() => choose(option.value)}
              >
                <span className="tv-cashback-option-symbol" aria-hidden="true"><Icon size={17} strokeWidth={2.2} /></span>
                <span className="tv-cashback-option-copy">
                  <strong>{option.label}</strong>
                  <small>{option.description}</small>
                </span>
                {isSelected && <Check className="tv-cashback-option-check" size={17} strokeWidth={2.6} aria-hidden="true" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
