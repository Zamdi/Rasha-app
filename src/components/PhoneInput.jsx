import { useState, useRef, useEffect } from 'react'

// len = { min, max } digits in the national number, after the dial code and
// any leading trunk zero. A range rather than one figure because real
// numbering plans vary within a country (e.g. Germany's mobile vs landline
// lengths differ) — still narrow enough to catch a number that's obviously
// too short or has extra digits typed onto the end, which was accepted
// unconditionally before.
const COUNTRIES = [
  { code: 'SD', name: 'Sudan',          dial: '+249', flag: '🇸🇩', len: { min: 9,  max: 9  } },
  { code: 'SA', name: 'Saudi Arabia',   dial: '+966', flag: '🇸🇦', len: { min: 9,  max: 9  } },
  { code: 'AE', name: 'UAE',            dial: '+971', flag: '🇦🇪', len: { min: 9,  max: 9  } },
  { code: 'EG', name: 'Egypt',          dial: '+20',  flag: '🇪🇬', len: { min: 10, max: 10 } },
  { code: 'QA', name: 'Qatar',          dial: '+974', flag: '🇶🇦', len: { min: 8,  max: 8  } },
  { code: 'KW', name: 'Kuwait',         dial: '+965', flag: '🇰🇼', len: { min: 8,  max: 8  } },
  { code: 'BH', name: 'Bahrain',        dial: '+973', flag: '🇧🇭', len: { min: 8,  max: 8  } },
  { code: 'OM', name: 'Oman',           dial: '+968', flag: '🇴🇲', len: { min: 8,  max: 8  } },
  { code: 'JO', name: 'Jordan',         dial: '+962', flag: '🇯🇴', len: { min: 9,  max: 9  } },
  { code: 'LB', name: 'Lebanon',        dial: '+961', flag: '🇱🇧', len: { min: 7,  max: 8  } },
  { code: 'SS', name: 'South Sudan',    dial: '+211', flag: '🇸🇸', len: { min: 9,  max: 9  } },
  { code: 'ET', name: 'Ethiopia',       dial: '+251', flag: '🇪🇹', len: { min: 9,  max: 9  } },
  { code: 'LY', name: 'Libya',          dial: '+218', flag: '🇱🇾', len: { min: 9,  max: 9  } },
  { code: 'MA', name: 'Morocco',        dial: '+212', flag: '🇲🇦', len: { min: 9,  max: 9  } },
  { code: 'DZ', name: 'Algeria',        dial: '+213', flag: '🇩🇿', len: { min: 9,  max: 9  } },
  { code: 'TN', name: 'Tunisia',        dial: '+216', flag: '🇹🇳', len: { min: 8,  max: 8  } },
  { code: 'US', name: 'United States',  dial: '+1',   flag: '🇺🇸', len: { min: 10, max: 10 } },
  { code: 'GB', name: 'United Kingdom', dial: '+44',  flag: '🇬🇧', len: { min: 10, max: 10 } },
  { code: 'DE', name: 'Germany',        dial: '+49',  flag: '🇩🇪', len: { min: 10, max: 11 } },
  { code: 'FR', name: 'France',         dial: '+33',  flag: '🇫🇷', len: { min: 9,  max: 9  } },
  { code: 'TR', name: 'Turkey',         dial: '+90',  flag: '🇹🇷', len: { min: 10, max: 10 } },
  { code: 'IN', name: 'India',          dial: '+91',  flag: '🇮🇳', len: { min: 10, max: 10 } },
  { code: 'PK', name: 'Pakistan',       dial: '+92',  flag: '🇵🇰', len: { min: 10, max: 10 } },
  { code: 'CN', name: 'China',          dial: '+86',  flag: '🇨🇳', len: { min: 11, max: 11 } },
  { code: 'AU', name: 'Australia',      dial: '+61',  flag: '🇦🇺', len: { min: 9,  max: 9  } },
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
          className="absolute top-full left-0 mt-1 z-20 rounded-xl overflow-hidden animate-fade-in"
          style={{
            width: '260px',
            background: 'var(--glass-high-bg)',
            backdropFilter: 'blur(32px)',
            WebkitBackdropFilter: 'blur(32px)',
            border: '1px solid var(--glass-high-border)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.2)',
          }}
        >
          {/* Search */}
          <div className="p-2.5" style={{ borderBottom: '1px solid var(--glass-high-border)' }}>
            <input
              autoFocus
              type="text"
              placeholder="Search country…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg outline-none"
              style={{
                background: 'var(--input-bg)',
                border: '1px solid var(--input-border)',
                color: 'var(--color-on-surface)',
              }}
            />
          </div>

          {/* List */}
          <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <p className="px-3 py-6 text-xs text-center" style={{ color: 'var(--color-on-surface-variant)' }}>No results</p>
            ) : filtered.map(c => {
              const isActive = c.dial === dialCode
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => { onDialChange(c.dial); setOpen(false); setSearch('') }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors"
                  style={{
                    background: isActive ? 'rgba(var(--color-secondary-fixed-rgb),0.12)' : 'transparent',
                    color: 'var(--color-on-surface)',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--color-surface-container-high)' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                >
                  <span className="text-lg leading-none shrink-0">{c.flag}</span>
                  <span className="flex-1 text-xs font-medium">{c.name}</span>
                  <span className="text-xs font-bold" style={{ color: 'var(--color-secondary-fixed)' }}>{c.dial}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Number field */}
      <input
        type="tel"
        placeholder=""
        autoComplete="tel-national"
        name="tel"
        className="rasha-input flex-1"
        style={{ borderRadius: '0 0.75rem 0.75rem 0' }}
        value={value}
        onChange={e => {
          let v = e.target.value.replace(/\D/g, '')
          if (v.startsWith('0')) v = v.slice(1)
          // Stop accepting digits once the selected country's number is full,
          // rather than letting extra digits pile up and only rejecting them
          // at submit time.
          v = v.slice(0, selected.len.max)
          onChange(v)
        }}
      />
    </div>
  )
}
