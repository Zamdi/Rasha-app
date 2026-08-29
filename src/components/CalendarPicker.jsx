import { useState, useRef, useEffect } from 'react'

const DAYS_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const DAYS_AR = ['أح', 'إث', 'ثل', 'أر', 'خم', 'جم', 'سب']

export default function CalendarPicker({ value, onChange, minDate, lang = 'en' }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const days = lang === 'ar' ? DAYS_AR : DAYS_EN
  const localToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }
  const min = minDate || localToday()

  const [view, setView] = useState(() => {
    const d = value ? new Date(value + 'T12:00:00') : new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate()
  const firstDay = new Date(view.year, view.month, 1).getDay()

  const monthLabel = new Date(view.year, view.month, 1)
    .toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { month: 'long', year: 'numeric' })

  const prev = () => setView(v =>
    v.month === 0 ? { year: v.year - 1, month: 11 } : { year: v.year, month: v.month - 1 })
  const next = () => setView(v =>
    v.month === 11 ? { year: v.year + 1, month: 0 } : { year: v.year, month: v.month + 1 })

  const ds = (day) =>
    `${view.year}-${String(view.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  const displayDate = value
    ? new Date(value + 'T12:00:00').toLocaleDateString(
        lang === 'ar' ? 'ar-EG' : 'en-US',
        { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
      )
    : lang === 'ar' ? 'اختر تاريخاً' : 'Select a date'

  const handlePick = (dateStr) => {
    onChange(dateStr)
    setOpen(false)
  }

  return (
    <div ref={wrapRef} className="relative">
      {/* Compact date bar */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left"
        style={{
          background: 'var(--input-bg)',
          border: open ? '1.5px solid var(--color-secondary-fixed)' : '1px solid var(--color-outline-variant)',
          color: 'var(--color-on-surface)',
          boxShadow: open ? '0 0 0 3px var(--input-focus)' : 'none',
        }}>
        <span className="material-symbols-outlined fill-icon text-secondary-fixed" style={{ fontSize: '20px' }}>calendar_month</span>
        <span className="flex-1 text-sm font-medium">{displayDate}</span>
        <span className="material-symbols-outlined text-on-surface-variant"
          style={{ fontSize: '18px', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          expand_more
        </span>
      </button>

      {/* Dropdown calendar — rendered inline (not absolute) so the page
          grows to fit it on mobile, keeping the bottom rows reachable. */}
      {open && (
        <div className="mt-1 rounded-xl overflow-hidden animate-fade-in"
          style={{
            background: 'var(--glass-high-bg)',
            backdropFilter: 'blur(48px) saturate(1.2)',
            WebkitBackdropFilter: 'blur(48px) saturate(1.2)',
            border: '1px solid var(--glass-high-border)',
            boxShadow: 'var(--glass-shadow-lg)',
          }}>

          {/* Month nav */}
          <div className="flex items-center justify-between px-3 py-2.5"
            style={{ borderBottom: '1px solid var(--glass-high-border)' }}>
            <button type="button" onClick={prev}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
              style={{ color: 'var(--color-on-surface-variant)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-container-highest)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_left</span>
            </button>
            <span className="text-sm font-bold" style={{ color: 'var(--color-on-surface)' }}>{monthLabel}</span>
            <button type="button" onClick={next}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
              style={{ color: 'var(--color-on-surface-variant)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-container-highest)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
            </button>
          </div>

          <div className="p-2">
            {/* Weekday labels */}
            <div className="grid grid-cols-7 mb-1">
              {days.map(d => (
                <div key={d} className="text-center py-1"
                  style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-on-surface-variant)' }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-0.5">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const dateStr = ds(day)
                const isPast = dateStr < min
                const isSelected = dateStr === value
                const isToday = dateStr === min

                return (
                  <button
                    key={day}
                    type="button"
                    disabled={isPast}
                    onClick={() => !isPast && handlePick(dateStr)}
                    className="w-full aspect-square rounded-lg flex items-center justify-center transition-all"
                    style={{
                      fontSize: '12px',
                      fontWeight: isSelected || isToday ? 700 : 500,
                      color: isSelected ? '#fff'
                        : isPast ? 'var(--color-on-surface-variant)'
                        : 'var(--color-on-surface)',
                      opacity: isPast ? 0.3 : 1,
                      cursor: isPast ? 'not-allowed' : 'pointer',
                      border: isToday && !isSelected ? '1.5px solid var(--color-secondary-fixed)' : 'none',
                      background: isSelected
                        ? 'linear-gradient(135deg, #0077cc 0%, #0055aa 50%, #003d88 100%)'
                        : 'transparent',
                    }}
                    onMouseEnter={e => { if (!isPast && !isSelected) e.currentTarget.style.background = 'var(--color-surface-container-highest)' }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
