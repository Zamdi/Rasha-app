import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { QRCodeCanvas } from 'qrcode.react'
import { useApp, API } from '../context/AppContext'
import { formatTime, bookingStatus, bookingStatusLabel } from '../utils/format'
import { fetchWithTimeout, isTimeout } from '../utils/fetchWithTimeout'
import BootScreen from '../components/BootScreen'

export default function Loyalty() {
  const { t, token, lang, logout } = useApp()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [upcomingBookings, setUpcomingBookings] = useState([])
  const [qrExpanded, setQrExpanded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!token) { navigate('/login'); return }
    loadAll()
  }, [token])

  const loadAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const auth = { headers: { Authorization: 'Bearer ' + token }, timeout: 60000 }
      const [loyRes, bkRes] = await Promise.all([
        fetchWithTimeout(`${API}/api/loyalty`, auth),
        fetchWithTimeout(`${API}/api/bookings/my`, auth),
      ])
      if (loyRes.status === 401) {
        logout()
        navigate('/login')
        return
      }
      if (!loyRes.ok) {
        setError(t('Could not load your card. Please try again.', 'تعذر تحميل بطاقتك. حاول مجدداً.'))
        setLoading(false)
        return
      }
      const loy = await loyRes.json()
      const bk = bkRes.ok ? await bkRes.json() : { bookings: [] }
      setData(loy)
      const upcoming = (bk.bookings || [])
        .filter(b => {
          const st = bookingStatus(b).key
          return st !== 'cancelled' && st !== 'noshow' && st !== 'scanned'
        })
        .sort((a, b) => String(a.booking_date).localeCompare(String(b.booking_date)) || a.booking_time.localeCompare(b.booking_time))
      setUpcomingBookings(upcoming)
    } catch (e) {
      setError(isTimeout(e)
        ? t('The server is taking longer than usual to wake up. Please try again.',
            'الخادم يستغرق وقتاً أطول من المعتاد. يرجى المحاولة مجدداً.')
        : t('Connection error. The server may be starting up. Please wait a moment and retry.',
            'خطأ في الاتصال. قد يكون الخادم في وضع السكون. انتظر لحظة وحاول مجدداً.'))
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <BootScreen onRetry={loadAll} />

  if (error) return (
    <div className="pt-14 min-h-dvh flex flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="material-symbols-outlined text-error text-5xl" aria-hidden="true">wifi_off</span>
      <p role="alert" className="text-on-surface text-base font-semibold">{error}</p>
      <button onClick={loadAll} className="btn-primary px-6 py-3 rounded-xl cursor-pointer">
        <span className="material-symbols-outlined text-base">refresh</span>
        {t('Retry', 'إعادة المحاولة')}
      </button>
      <button onClick={() => { logout(); navigate('/login') }} className="text-xs text-on-surface-variant hover:text-error transition-colors">
        {t('Sign out', 'تسجيل خروج')}
      </button>
    </div>
  )

  if (!data) return null

  const { stamps = 0, totalWashes = 0, freeWashesUsed = 0, name = '', customerId = '', memberSince } = data

  return (
    <div className="pt-14 pb-24 md:pb-10">
      <main className="max-w-5xl mx-auto px-4 md:px-6 py-10">
        {/* Welcome */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-secondary-fixed font-display">
            {t('Hi,', 'أهلاً')} {name.split(' ')[0]} 👋
          </h1>
          <p className="text-on-surface-variant mt-1">{t('Track your stamps and redeem your rewards.', 'تابع طوابعك واستبدل مكافآتك.')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stamp Card */}
            <div className="glass p-6 rounded-2xl wet-shine inner-glow animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-on-surface font-display">{t('Splash Stamp Card', 'بطاقة الطوابع')}</h2>
                  <p className="text-on-surface-variant text-sm mt-1">{t('5 stamps = 1 FREE wash', '5 طوابع = غسيل مجاني')}</p>
                </div>
                <div className="text-end">
                  <span className="text-2xl font-extrabold text-secondary-fixed font-display">{stamps}/5</span>
                  <p className="text-xs text-secondary-fixed uppercase tracking-wide">{t('Progress', 'التقدم')}</p>
                </div>
              </div>
              {/* Stamps grid */}
              <div className="grid grid-cols-5 gap-3">
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={i} className={`aspect-square rounded-xl flex items-center justify-center ${i < stamps ? 'stamp-filled glass' : 'stamp-empty'}`}>
                    <span className={`material-symbols-outlined text-3xl ${i < stamps ? 'fill-icon text-secondary-fixed' : 'text-outline-variant/50'}`}
                      style={i < stamps ? { filter: 'drop-shadow(0 0 6px rgba(var(--color-secondary-fixed-rgb), 0.5))' } : {}}>
                      water_drop
                    </span>
                  </div>
                ))}
              </div>
              {stamps >= 5 && (
                <div className="mt-4 p-3 rounded-xl bg-secondary-fixed/10 border border-secondary-fixed/30 text-center">
                  <p className="text-secondary-fixed font-bold text-sm">🎉 {t("You've earned a FREE wash! Show this to staff.", 'لقد ربحت غسيلاً مجانياً! أرِ هذا للموظفين.')}</p>
                </div>
              )}
              <div className="mt-4 text-sm text-on-surface-variant flex gap-4 flex-wrap">
                <span><span className="text-on-surface font-bold">{totalWashes}</span> {t('total washes', 'غسيل إجمالي')}</span>
                <span>|</span>
                <span><span className="text-on-surface font-bold">{freeWashesUsed}</span> {t('free washes used', 'غسيل مجاني مستخدم')}</span>
              </div>
            </div>

            {/* Upcoming Bookings */}
            <div className="glass rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-outline-variant/20 flex items-center justify-between">
                <h3 className="font-bold text-on-surface">{t('Upcoming Bookings', 'الحجوزات القادمة')}</h3>
                <Link to="/bookings" className="text-xs font-bold text-secondary-fixed hover:opacity-70 transition-opacity">
                  {t('View all', 'عرض الكل')}
                </Link>
              </div>
              {upcomingBookings.length === 0 ? (
                <div className="p-8 flex flex-col items-center gap-3 text-center">
                  <span className="material-symbols-outlined text-on-surface-variant text-4xl" aria-hidden="true">calendar_today</span>
                  <p className="text-sm font-semibold text-on-surface">{t('No upcoming bookings', 'لا توجد حجوزات قادمة')}</p>
                  <p className="text-xs text-on-surface-variant max-w-xs">
                    {t('Book your next wash and it will appear here.', 'احجز غسيلك القادم وسيظهر هنا.')}
                  </p>
                  <Link to="/book" className="btn-primary px-5 py-2.5 rounded-xl text-sm mt-1">
                    {t('Book a wash', 'احجز غسيل')}
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-outline-variant/10">
                  {upcomingBookings.slice(0, 5).map((b, i) => {
                    const s = bookingStatus(b)
                    return (
                      <li key={b.id ?? i} className="flex items-center gap-3 p-4">
                        <div className="bg-secondary-fixed/10 p-2 rounded-lg shrink-0">
                          <span className="material-symbols-outlined text-secondary-fixed text-base">calendar_month</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold text-on-surface text-sm truncate">
                              {b.service_type === 'full' ? t('Full Wash', 'غسيل كامل') : t('Exterior Only', 'خارجي فقط')}
                            </p>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                              style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
                              {bookingStatusLabel(s.key, t)}
                            </span>
                          </div>
                          {b.booking_uid && (
                            <p className="text-[11px] font-bold text-secondary-fixed" dir="ltr" style={{ unicodeBidi: 'embed' }}>
                              #{b.booking_uid.replace('BK-', 'RSH-')}
                            </p>
                          )}
                          <p className="text-xs text-on-surface-variant mt-0.5">
                            {new Date(String(b.booking_date).slice(0, 10) + 'T12:00:00').toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', { month: 'short', day: 'numeric', year: 'numeric' })}
                            {' · '}
                            <span dir="ltr" style={{ unicodeBidi: 'embed' }}>{formatTime(b.booking_time, lang)}</span>
                          </p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Right — Member Pass */}
          <div className="space-y-6">
            <div className="glass p-6 rounded-2xl text-center">
              <p className="text-xs font-bold text-secondary-fixed uppercase tracking-wide mb-4">{t('Member Pass', 'بطاقة العضوية')}</p>

              <button
                onClick={() => setQrExpanded(true)}
                className="relative mx-auto block group"
                title={t('Tap to enlarge', 'اضغط للتكبير')}
              >
                <div className="p-3 rounded-xl mx-auto transition-transform group-hover:scale-105 group-active:scale-95"
                  style={{ width: 170, height: 170, background: '#ffffff' }}>
                  {customerId && <QRCodeCanvas value={customerId} size={146} level="M" fgColor="#000000" bgColor="#ffffff" style={{ display: 'block' }} />}
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"
                  style={{ background: 'rgba(0,0,0,0.45)' }}>
                  <span className="material-symbols-outlined text-white text-3xl">zoom_in</span>
                </div>
              </button>

              <p className="text-xs text-on-surface-variant mt-2 mb-3">
                {t('Tap QR to enlarge for scanning', 'اضغط على QR للتكبير والمسح')}
              </p>

              <h4 className="font-bold text-on-surface font-display">{name.toUpperCase()}</h4>
              <p className="text-xs text-secondary-fixed mt-1 font-bold" dir="ltr" style={{unicodeBidi:"embed"}}>{customerId}</p>
              {memberSince && <p className="text-xs text-on-surface-variant mt-1">{t('Member since', 'عضو منذ')} {new Date(memberSince).toLocaleDateString(t('en-US','ar-EG'),{year:'numeric',month:'long'})}</p>}
            </div>
          </div>
        </div>
      </main>

      {/* QR Fullscreen Modal */}
      {qrExpanded && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-6 animate-fade-in"
          style={{ background: 'rgba(0,0,0,0.92)' }}
          onClick={() => setQrExpanded(false)}
        >
          <div className="flex flex-col items-center gap-6" onClick={e => e.stopPropagation()}>
            <div className="p-5 rounded-3xl shadow-2xl"
              style={{ background: '#ffffff', boxShadow: '0 0 60px rgba(var(--color-secondary-fixed-rgb), 0.3)' }}>
              {customerId && <QRCodeCanvas value={customerId} size={260} level="M" fgColor="#000000" bgColor="#ffffff" style={{ display: 'block' }} />}
            </div>
            <div className="text-center">
              <p className="text-secondary-fixed font-bold text-xl font-display tracking-wide" dir="ltr" style={{unicodeBidi:"embed"}}>{customerId}</p>
              <p className="text-white font-bold mt-1">{name.toUpperCase()}</p>
              <p className="text-on-surface-variant text-sm mt-1">{t('Show this to staff for scanning', 'أرِ هذا للموظف للمسح')}</p>
            </div>
            <button
              onClick={() => setQrExpanded(false)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>
              <span className="material-symbols-outlined text-base">close</span>
              {t('Close', 'إغلاق')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
