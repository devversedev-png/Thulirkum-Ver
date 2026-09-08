import { useEffect, useRef, useState } from 'react'

export default function PremiumSelect({ value, options, onChange, placeholder = 'Select', className = '', icon = '' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const selected = options.find(option => option.value === value)

  useEffect(() => {
    function close(event) {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  function choose(nextValue) {
    onChange(nextValue)
    setOpen(false)
  }

  return (
    <div className={`premium-select ${open ? 'open' : ''} ${className}`} ref={ref}>
      <button
        type="button"
        className="premium-select-trigger"
        onClick={() => setOpen(current => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="premium-select-label-wrap">
          {icon && <span className="premium-select-icon">{icon}</span>}
          <span>{selected?.label || placeholder}</span>
        </span>
        <span className="premium-select-chevron">⌄</span>
      </button>

      {open && (
        <div className="premium-select-menu" role="listbox">
          {options.map(option => (
            <button
              type="button"
              key={option.value}
              className={option.value === value ? 'premium-select-option selected' : 'premium-select-option'}
              onClick={() => choose(option.value)}
              role="option"
              aria-selected={option.value === value}
            >
              <span>{option.label}</span>
              {option.value === value && <span className="premium-select-check">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
