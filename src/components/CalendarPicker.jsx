import { useState } from 'react'

const DAYS_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const DAYS_AR = ['أح', 'إث', 'ثل', 'أر', 'خم', 'جم', 'سب']

export default function CalendarPicker({ value, onChange, minDate, lang = 'en' }) {
  const days = lang === 'ar' ? DAYS_AR : DAYS_EN
  const min = minDate || new Date().toISOString().slice(0, 10)

  const [view, setView] = useState(() => {
    const d = value ? new Date(value + 'T12:00:00') : new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })

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

  return (
    <div className="rounded-xl overflow-hidden"
      style={{ background: 'var(--color-surface-container-high)', border: '1px solid var(--color-outline-variant)' }}>

      {/* Month nav */}
      <div className="flex items-center justify-between px-3 py-2.5"
        style={{ borderBottom: '1px solid var(--color-outline-variant)' }}>
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
                onClick={() => !isPast && onChange(dateStr)}
                className={`w-full aspect-square rounded-lg flex items-center justify-center transition-all
                  ${isSelected ? 'hydro-gradient text-white' : ''}
                  ${isPast ? 'cursor-not-allowed' : 'cursor-pointer'}
                `}
                style={{
                  fontSize: '12px',
                  fontWeight: isSelected || isToday ? 700 : 500,
                  color: isSelected ? '#fff'
                    : isPast ? 'var(--color-on-surface-variant)'
                    : 'var(--color-on-surface)',
                  opacity: isPast ? 0.3 : 1,
                  border: isToday && !isSelected ? '1.5px solid var(--color-secondary-fixed)' : 'none',
                  background: !isSelected && !isPast ? undefined : undefined,
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

      {/* Selected date label */}
      {value && (
        <div className="px-3 py-2 text-center text-xs font-semibold"
          style={{ borderTop: '1px solid var(--color-outline-variant)', color: 'var(--color-secondary-fixed)' }}>
          {new Date(value + 'T12:00:00').toLocaleDateString(
            lang === 'ar' ? 'ar-EG' : 'en-US',
            { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
          )}
        </div>
      )}
    </div>
  )
}
