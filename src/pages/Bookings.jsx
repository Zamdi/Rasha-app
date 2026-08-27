import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp, API } from '../context/AppContext'
import { bookingStatus, bookingStatusLabel, formatTime } from '../utils/format'
import { fetchWithTimeout, isTimeout } from '../utils/fetchWithTimeout'

const PAGE_SIZE   = 10
const STATUS_OPTS = ['all', 'booked', 'scanned', 'cancelled', 'noshow']

export default function Bookings() {
  const { t, lang, customer, token } = useApp()
  const navigate = useNavigate()

  const [bookings, setBookings]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(false)
  const [search, setSearch]       = useState('')
  const [svcFilter, setSvcFilter] = useState('all')
  const [stFilter, setStFilter]   = useState('all')
  const [page, setPage]           = useState(1)

  useEffect(() => {
    if (!customer) { navigate('/login'); return }
    setLoading(true); setError(false)
    fetchWithTimeout(`${API}/api/bookings/my`, {
      headers: { Authorization: 'Bearer ' + token },
      timeout: 60000,
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setBookings(d.bookings || []))
      .catch(e => { if (!isTimeout(e)) setError(true) })
      .finally(() => setLoading(false))
  }, [customer, token])

  // Reset to page 1 whenever filters/search change
  useEffect(() => { setPage(1) }, [search, svcFilter, stFilter])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return bookings.filter(b => {
      const ref = b.booking_uid?.replace('BK-', '#RSH-') ?? ''
      if (q && !ref.toLowerCase().includes(q)) return false
      if (svcFilter !== 'all' && b.service_type !== svcFilter) return false
      if (stFilter !== 'all' && bookingStatus(b).key !== stFilter) return false
      return true
    }).sort((a, b) => String(b.booking_date).localeCompare(String(a.booking_date)) || b.booking_time?.localeCompare(a.booking_time))
  }, [bookings, search, svcFilter, stFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Page number list: up to 5 visible, with ellipsis
  const pageNums = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1)
    if (page <= 3) return [1, 2, 3, 4, '…', totalPages]
    if (page >= totalPages - 2) return [1, '…', totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    return [1, '…', page - 1, page, page + 1, '…', totalPages]
  }, [page, totalPages])

  const pill = (label, active, onClick, key) => (
    <button
      key={key ?? label}
      onClick={onClick}
      className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
      style={{
        background: active ? 'var(--color-secondary-fixed)' : 'var(--glass-bg)',
        color: active ? '#fff' : 'var(--color-on-surface-variant)',
        border: active ? '1px solid transparent' : '1px solid var(--color-outline-variant)',
      }}
    >
      {label}
    </button>
  )

  const svcLabel = svc =>
    svc === 'full' ? t('Full Wash', 'غسيل كامل')
    : svc === 'exterior' ? t('Exterior Only', 'خارجي فقط')
    : t('Unknown', 'غير معروف')

  const formattedDate = raw =>
    raw ? new Date(String(raw).slice(0, 10) + 'T12:00:00')
            .toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        : '—'

  const pgBtn = (label, onClick, disabled, active = false) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center min-w-[32px] h-8 px-2 rounded-lg text-xs font-bold transition-all"
      style={{
        background: active ? 'var(--color-secondary-fixed)' : 'var(--glass-bg)',
        color: active ? '#fff' : disabled ? 'var(--color-outline-variant)' : 'var(--color-on-surface)',
        border: active ? '1px solid transparent' : '1px solid var(--color-outline-variant)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {label}
    </button>
  )

  return (
    <div className="min-h-dvh" style={{ background: 'var(--color-background)' }}>
      <main className="max-w-4xl mx-auto px-4 pt-16 pb-28 md:pb-10">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:opacity-70 transition-opacity" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
            <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 20 }}>arrow_back</span>
          </button>
          <div>
            <h1 className="text-on-surface font-bold text-xl font-display">{t('My Bookings', 'حجوزاتي')}</h1>
            <p className="text-xs text-on-surface-variant mt-0.5">{t('All your bookings in one place', 'جميع حجوزاتك في مكان واحد')}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <span className="material-symbols-outlined absolute start-3 top-1/2 -translate-y-1/2 text-on-surface-variant" style={{ fontSize: 18, pointerEvents: 'none' }}>search</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('Search by reference…', 'ابحث بالمرجع…')}
            className="w-full rounded-xl ps-10 pe-4 py-2.5 text-sm text-on-surface outline-none"
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--color-outline-variant)' }}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute end-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:opacity-70">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-2 mb-5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">{t('Service', 'الخدمة')}</span>
            {pill(t('All', 'الكل'), svcFilter === 'all', () => setSvcFilter('all'))}
            {pill(t('Full Wash', 'غسيل كامل'), svcFilter === 'full', () => setSvcFilter('full'))}
            {pill(t('Exterior Only', 'خارجي'), svcFilter === 'exterior', () => setSvcFilter('exterior'))}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">{t('Status', 'الحالة')}</span>
            {STATUS_OPTS.map(s => pill(
              s === 'all' ? t('All', 'الكل') : bookingStatusLabel(s, t),
              stFilter === s,
              () => setStFilter(s),
              s
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-secondary-fixed border-t-transparent animate-spin" />
            <p className="text-xs text-on-surface-variant">{t('Loading bookings…', 'جارٍ التحميل…')}</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <span className="material-symbols-outlined text-error text-4xl">error</span>
            <p className="text-sm text-on-surface-variant">{t('Could not load bookings.', 'تعذّر تحميل الحجوزات.')}</p>
            <button onClick={() => window.location.reload()} className="text-xs font-bold text-secondary-fixed hover:opacity-70">{t('Try again', 'حاول مجدداً')}</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <span className="material-symbols-outlined text-on-surface-variant text-5xl">calendar_today</span>
            <p className="text-sm text-on-surface-variant">{t('No bookings found.', 'لا توجد حجوزات.')}</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block rounded-2xl overflow-hidden" style={{ border: '1px solid var(--color-outline-variant)' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--glass-bg)', borderBottom: '1px solid var(--color-outline-variant)' }}>
                    <th className="px-4 py-3 text-start text-xs font-bold text-on-surface-variant uppercase tracking-wide">{t('REF', 'المرجع')}</th>
                    <th className="px-4 py-3 text-start text-xs font-bold text-on-surface-variant uppercase tracking-wide">{t('Service', 'الخدمة')}</th>
                    <th className="px-4 py-3 text-start text-xs font-bold text-on-surface-variant uppercase tracking-wide">{t('Date / Time', 'التاريخ / الوقت')}</th>
                    <th className="px-4 py-3 text-start text-xs font-bold text-on-surface-variant uppercase tracking-wide">{t('Status', 'الحالة')}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((b, i) => {
                    const st  = bookingStatus(b)
                    const ref = b.booking_uid?.replace('BK-', '#RSH-') ?? '—'
                    return (
                      <tr key={b.id ?? i} style={{ borderBottom: i < paginated.length - 1 ? '1px solid var(--color-outline-variant)' : 'none', background: 'var(--color-surface, transparent)' }}>
                        <td className="px-4 py-3 font-bold text-xs text-secondary-fixed font-mono whitespace-nowrap">{ref}</td>
                        <td className="px-4 py-3 text-sm text-on-surface">{svcLabel(b.service_type)}</td>
                        <td className="px-4 py-3 text-sm text-on-surface whitespace-nowrap">
                          {formattedDate(b.booking_date)}
                          <span className="text-on-surface-variant ms-1.5 text-xs">{formatTime(b.booking_time, lang)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
                            style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                            {bookingStatusLabel(st.key, t)}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden flex flex-col gap-3">
              {paginated.map((b, i) => {
                const st  = bookingStatus(b)
                const ref = b.booking_uid?.replace('BK-', '#RSH-') ?? '—'
                return (
                  <div key={b.id ?? i} className="rounded-2xl p-4 flex flex-col gap-2" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-secondary-fixed font-mono">{ref}</span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
                        style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                        {bookingStatusLabel(st.key, t)}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-on-surface">{svcLabel(b.service_type)}</p>
                    <p className="text-xs text-on-surface-variant">{formattedDate(b.booking_date)} · {formatTime(b.booking_time, lang)}</p>
                  </div>
                )
              })}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-5 gap-3 flex-wrap">
              <p className="text-xs text-on-surface-variant">
                {t(
                  `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} of ${filtered.length} bookings`,
                  `عرض ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} من ${filtered.length} حجز`
                )}
              </p>
              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  {pgBtn(
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_left</span>,
                    () => setPage(p => Math.max(1, p - 1)),
                    page === 1
                  )}
                  {pageNums.map((n, i) =>
                    n === '…'
                      ? <span key={`ellipsis-${i}`} className="text-xs text-on-surface-variant px-1">…</span>
                      : pgBtn(n, () => setPage(n), false, n === page)
                  )}
                  {pgBtn(
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>,
                    () => setPage(p => Math.min(totalPages, p + 1)),
                    page === totalPages
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
