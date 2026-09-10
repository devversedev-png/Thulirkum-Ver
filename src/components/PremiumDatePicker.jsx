import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const WEEK = [
  'Su',
  'Mo',
  'Tu',
  'We',
  'Th',
  'Fr',
  'Sa',
]

function pad(value) {
  return String(value).padStart(2, '0')
}

function toDateValue(date) {
  return `${date.getFullYear()}-${pad(
    date.getMonth() + 1
  )}-${pad(date.getDate())}`
}

function parseValue(value) {
  if (!value) return null

  const [y, m, d] = value
    .split('-')
    .map(Number)

  if (!y || !m || !d) return null

  return new Date(y, m - 1, d)
}

function monthValue(date) {
  return `${date.getFullYear()}-${pad(
    date.getMonth() + 1
  )}`
}

export default function PremiumDatePicker({
  value = '',
  onChange,
  mode = 'date',
  placeholder,
  className = '',
}) {
  const selectedDate =
    mode === 'month'
      ? value
        ? new Date(
            Number(value.slice(0, 4)),
            Number(value.slice(5, 7)) - 1,
            1
          )
        : null
      : parseValue(value)

  const [open, setOpen] = useState(false)

  const [cursor, setCursor] = useState(
    selectedDate || new Date()
  )

  const ref = useRef(null)

  useEffect(() => {
    function close(event) {
      if (
        ref.current &&
        !ref.current.contains(event.target)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener(
      'mousedown',
      close
    )

    return () => {
      document.removeEventListener(
        'mousedown',
        close
      )
    }
  }, [])

  useEffect(() => {
    if (selectedDate) {
      setCursor(selectedDate)
    }
  }, [value])

  const label = useMemo(() => {
    if (!selectedDate) {
      return (
        placeholder ||
        (mode === 'month'
          ? 'Select month'
          : 'dd-mm-yyyy')
      )
    }

    return mode === 'month'
      ? `${MONTHS[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`
      : `${pad(
          selectedDate.getDate()
        )}-${pad(
          selectedDate.getMonth() + 1
        )}-${selectedDate.getFullYear()}`
  }, [
    value,
    mode,
    placeholder,
  ])

  const days = useMemo(() => {
    const first = new Date(
      cursor.getFullYear(),
      cursor.getMonth(),
      1
    )

    const start = new Date(
      cursor.getFullYear(),
      cursor.getMonth(),
      1 - first.getDay()
    )

    return Array.from(
      {
        length: 42,
      },
      (_, i) => {
        const date = new Date(start)

        date.setDate(
          start.getDate() + i
        )

        return date
      }
    )
  }, [cursor])

  function pickDate(date) {
    onChange(toDateValue(date))
    setOpen(false)
  }

  function pickMonth(monthIndex) {
    const next = new Date(
      cursor.getFullYear(),
      monthIndex,
      1
    )

    onChange(monthValue(next))
    setCursor(next)
    setOpen(false)
  }

  function clear() {
    onChange('')
    setOpen(false)
  }

  return (
    <div
      className={`premium-date ${
        open ? 'open' : ''
      } ${className}`}
      ref={ref}
    >
      <button
        type="button"
        className="premium-date-trigger"
        onClick={() =>
          setOpen((value) => !value)
        }
        aria-expanded={open}
      >
        <span
          className={
            value
              ? ''
              : 'placeholder'
          }
        >
          {label}
        </span>

        <span className="premium-date-icon">
          ▦
        </span>
      </button>

      {open && (
        <div
          className={`premium-date-popover ${
            mode === 'month'
              ? 'month-mode'
              : ''
          }`}
        >
          {/* Calendar Header */}
          <div className="premium-calendar-head">
            <button
              type="button"
              onClick={() =>
                setCursor(
                  new Date(
                    cursor.getFullYear() -
                      (mode === 'month'
                        ? 1
                        : 0),
                    cursor.getMonth() -
                      (mode === 'month'
                        ? 0
                        : 1),
                    1
                  )
                )
              }
            >
              ‹
            </button>

            <strong>
              {mode === 'month'
                ? cursor.getFullYear()
                : `${
                    MONTHS[
                      cursor.getMonth()
                    ]
                  } ${cursor.getFullYear()}`}
            </strong>

            <button
              type="button"
              onClick={() =>
                setCursor(
                  new Date(
                    cursor.getFullYear() +
                      (mode === 'month'
                        ? 1
                        : 0),
                    cursor.getMonth() +
                      (mode === 'month'
                        ? 0
                        : 1),
                    1
                  )
                )
              }
            >
              ›
            </button>
          </div>

          {/* Month Picker */}
          {mode === 'month' ? (
            <div className="premium-month-grid">
              {MONTHS.map(
                (month, index) => {
                  const active =
                    selectedDate &&
                    selectedDate.getFullYear() ===
                      cursor.getFullYear() &&
                    selectedDate.getMonth() ===
                      index

                  return (
                    <button
                      type="button"
                      className={
                        active
                          ? 'active'
                          : ''
                      }
                      key={month}
                      onClick={() =>
                        pickMonth(index)
                      }
                    >
                      {month.slice(0, 3)}
                    </button>
                  )
                }
              )}
            </div>
          ) : (
            <>
              {/* Week Days */}
              <div className="premium-week-row">
                {WEEK.map((day) => (
                  <span key={day}>
                    {day}
                  </span>
                ))}
              </div>

              {/* Date Grid */}
              <div className="premium-day-grid">
                {days.map((date) => {
                  const outside =
                    date.getMonth() !==
                    cursor.getMonth()

                  const active =
                    selectedDate &&
                    toDateValue(date) ===
                      toDateValue(
                        selectedDate
                      )

                  const today =
                    toDateValue(date) ===
                    toDateValue(new Date())

                  return (
                    <button
                      type="button"
                      key={date.toISOString()}
                      className={`${
                        outside
                          ? 'outside'
                          : ''
                      } ${
                        active
                          ? 'active'
                          : ''
                      } ${
                        today
                          ? 'today'
                          : ''
                      }`}
                      onClick={() =>
                        pickDate(date)
                      }
                    >
                      {date.getDate()}
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {/* Calendar Footer */}
          <div className="premium-calendar-foot">
            <button
              type="button"
              onClick={clear}
            >
              Clear
            </button>

            <button
              type="button"
              onClick={() => {
                if (mode === 'month') {
                  const now =
                    new Date()

                  onChange(
                    monthValue(now)
                  )

                  setCursor(now)
                  setOpen(false)
                } else {
                  pickDate(
                    new Date()
                  )
                }
              }}
            >
              {mode === 'month'
                ? 'This month'
                : 'Today'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

