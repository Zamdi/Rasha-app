import { useState, useRef, useEffect } from 'react'

const COUNTRIES = [
  { code: 'SD', name: 'Sudan',          dial: '+249', flag: '🇸🇩' },
  { code: 'SA', name: 'Saudi Arabia',   dial: '+966', flag: '🇸🇦' },
  { code: 'AE', name: 'UAE',            dial: '+971', flag: '🇦🇪' },
  { code: 'EG', name: 'Egypt',          dial: '+20',  flag: '🇪🇬' },
  { code: 'QA', name: 'Qatar',          dial: '+974', flag: '🇶🇦' },
  { code: 'KW', name: 'Kuwait',         dial: '+965', flag: '🇰🇼' },
  { code: 'BH', name: 'Bahrain',        dial: '+973', flag: '🇧🇭' },
  { code: 'OM', name: 'Oman',           dial: '+968', flag: '🇴🇲' },
  { code: 'JO', name: 'Jordan',         dial: '+962', flag: '🇯🇴' },
  { code: 'LB', name: 'Lebanon',        dial: '+961', flag: '🇱🇧' },
  { code: 'SS', name: 'South Sudan',    dial: '+211', flag: '🇸🇸' },
  { code: 'ET', name: 'Ethiopia',       dial: '+251', flag: '🇪🇹' },
  { code: 'LY', name: 'Libya',          dial: '+218', flag: '🇱🇾' },
  { code: 'MA', name: 'Morocco',        dial: '+212', flag: '🇲🇦' },
  { code: 'DZ', name: 'Algeria',        dial: '+213', flag: '🇩🇿' },
  { code: 'TN', name: 'Tunisia',        dial: '+216', flag: '🇹🇳' },
  { code: 'US', name: 'United States',  dial: '+1',   flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', dial: '+44',  flag: '🇬🇧' },
  { code: 'DE', name: 'Germany',        dial: '+49',  flag: '🇩🇪' },
  { code: 'FR', name: 'France',         dial: '+33',  flag: '🇫🇷' },
  { code: 'TR', name: 'Turkey',         dial: '+90',  flag: '🇹🇷' },
  { code: 'IN', name: 'India',          dial: '+91',  flag: '🇮🇳' },
  { code: 'PK', name: 'Pakistan',       dial: '+92',  flag: '🇵🇰' },
  { code: 'CN', name: 'China',          dial: '+86',  flag: '🇨🇳' },
  { code: 'AU', name: 'Australia',      dial: '+61',  flag: '🇦🇺' },
]

export { COUNTRIES }

export default function PhoneInput({ value, onChange, dialCode, onDialChange }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const wrapRef = useRef(null)

  const selected = COUNTRIES.find(c => c.dial === dialCode) || COUNTRIES[0]

  const filtered = search.trim()
    ? COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.dial.includes(search))
    : COUNTRIES

  useEffect(() => {
    const close = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return (
    <div className="flex relative" dir="ltr" ref={wrapRef}>
      {/* Country selector */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-3 rounded-l-xl shrink-0 transition-all"
        style={{
          background: 'var(--color-surface-container-high)',
          border: '1px solid var(--color-outline-variant)',
          borderRight: 'none',
          color: 'var(--color-on-surface)',
          minWidth: '96px',
        }}
      >
        <span className="text-lg leading-none">{selected.flag}</span>
        <span className="text-xs font-bold">{selected.dial}</span>
        <span className="material-symbols-outlined text-on-surface-variant leading-none" style={{ fontSize: '14px' }}>
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute top-full left-0 mt-1 z-[200] rounded-xl overflow-hidden animate-fade-in"
          style={{
            width: '240px',
            background: 'var(--color-surface-container)',
            border: '1px solid var(--color-outline-variant)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
          }}
        >
          <div className="p-2" style={{ borderBottom: '1px solid var(--color-outline-variant)' }}>
            <input
              autoFocus
              type="text"
              placeholder="Search country…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg outline-none"
              style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--color-on-surface)' }}
            />
          </div>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <p className="px-3 py-6 text-xs text-center text-on-surface-variant">No results</p>
            ) : filtered.map(c => (
              <button
                key={c.code}
                type="button"
                onClick={() => { onDialChange(c.dial); setOpen(false); setSearch('') }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors"
                style={{ color: 'var(--color-on-surface)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-container-high)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span className="text-lg leading-none shrink-0">{c.flag}</span>
                <span className="flex-1 text-xs">{c.name}</span>
                <span className="text-xs font-bold" style={{ color: 'var(--color-secondary-fixed)' }}>{c.dial}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Number field */}
      <input
        type="tel"
        placeholder="9XX XXX XXXX"
        autoComplete="tel-national"
        name="tel"
        className="rasha-input flex-1"
        style={{ borderRadius: '0 0.75rem 0.75rem 0' }}
        value={value}
        onChange={e => onChange(e.target.value.replace(/\D/g, ''))}
      />
    </div>
  )
}
