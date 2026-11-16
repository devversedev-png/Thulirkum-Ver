import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { BookOpen, Check, ChevronDown, Search, X } from 'lucide-react'

const formatPrice = amount => `₹${Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

/** Searchable, keyboard-accessible book selection for Buy X Get Y offers. */
export default function OfferBookDropdown({ books = [], value = '', placeholder = 'Select a book…', searchLabel = 'Search books', onChange }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const rootRef = useRef(null)
  const triggerRef = useRef(null)
  const searchRef = useRef(null)
  const listRef = useRef(null)
  const listId = useId()
  const selected = books.find(book => String(book.id) === String(value))
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()
    return books.filter(book => !needle || `${book.title || ''} ${book.author || ''} ${book.category || ''}`.toLocaleLowerCase().includes(needle))
  }, [books, query])

  useEffect(() => {
    if (!open) return undefined
    const onOutside = event => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    const onEscape = event => {
      if (event.key === 'Escape') { event.preventDefault(); setOpen(false); triggerRef.current?.focus() }
    }
    document.addEventListener('pointerdown', onOutside)
    document.addEventListener('keydown', onEscape)
    searchRef.current?.focus()
    return () => { document.removeEventListener('pointerdown', onOutside); document.removeEventListener('keydown', onEscape) }
  }, [open])

  useEffect(() => { setActiveIndex(0) }, [query, open])

  const choose = id => {
    onChange(id)
    setQuery('')
    setOpen(false)
    triggerRef.current?.focus()
  }
  const handleKeys = event => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!filtered.length) return
      const next = event.key === 'ArrowDown' ? (activeIndex + 1) % filtered.length : (activeIndex - 1 + filtered.length) % filtered.length
      setActiveIndex(next)
      listRef.current?.querySelector(`[data-book-index="${next}"]`)?.scrollIntoView({ block: 'nearest' })
    } else if (event.key === 'Enter' && filtered[activeIndex]) {
      event.preventDefault()
      choose(filtered[activeIndex].id)
    }
  }

  return (
    <div className={`tv-offer-book-select${open ? ' is-open' : ''}`} ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="tv-offer-book-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => { setQuery(''); setOpen(previous => !previous) }}
      >
        <span className="tv-offer-book-trigger-icon"><BookOpen size={17} /></span>
        <span className={`tv-offer-book-trigger-copy${selected ? '' : ' is-placeholder'}`}>
          <strong>{selected?.title || placeholder}</strong>
          {selected && <small>{formatPrice(selected.price)}{selected.author ? ` · ${selected.author}` : ''}</small>}
        </span>
        <ChevronDown size={17} className="tv-offer-book-chevron" />
      </button>

      {open && (
        <div className="tv-offer-book-popover">
          <div className="tv-offer-book-search-row">
            <Search size={17} aria-hidden="true" />
            <input
              ref={searchRef}
              type="search"
              value={query}
              aria-label={searchLabel}
              placeholder="Search title, author or category…"
              onChange={event => setQuery(event.target.value)}
              onKeyDown={handleKeys}
            />
            {query && <button type="button" className="tv-offer-book-clear" aria-label="Clear search" onClick={() => { setQuery(''); searchRef.current?.focus() }}><X size={15}/></button>}
          </div>
          <div className="tv-offer-book-results" ref={listRef} id={listId} role="listbox" aria-label={searchLabel}>
            {filtered.length ? filtered.map((book, index) => {
              const isSelected = String(book.id) === String(value)
              return (
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  key={book.id}
                  data-book-index={index}
                  className={`tv-offer-book-option${isSelected ? ' is-selected' : ''}${index === activeIndex ? ' is-active' : ''}`}
                  onPointerMove={() => setActiveIndex(index)}
                  onClick={() => choose(book.id)}
                >
                  <span className="tv-offer-book-cover">{book.image ? <img src={book.image} alt="" loading="lazy" /> : <BookOpen size={19} />}</span>
                  <span className="tv-offer-book-info"><strong>{book.title}</strong><small>{book.author || 'Book'} · {formatPrice(book.price)}</small></span>
                  {isSelected && <Check size={17} className="tv-offer-book-check" />}
                </button>
              )
            }) : <div className="tv-offer-book-empty">No matching books. Try a different search.</div>}
          </div>
          <div className="tv-offer-book-footer">{filtered.length} {filtered.length === 1 ? 'book' : 'books'} available</div>
        </div>
      )}
    </div>
  )
}
