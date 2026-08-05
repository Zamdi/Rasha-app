import { useEffect, useRef } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { formatTime } from '../utils/format'

export default function Confirmation() {
  const { t, lang } = useApp()
  const { state } = useLocation()
  const navigate = useNavigate()
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!state) { navigate('/'); return }
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    window.addEventListener('resize', resize); resize()
    let particles = [], alive = true

    class P {
      constructor() {
        this.x = Math.random() * canvas.width; this.y = canvas.height + 10
        this.size = Math.random() * 3 + 1
        this.vy = -(Math.random() * 3 + 2); this.vx = Math.random() * 2 - 1
        this.color = Math.random() > 0.5 ? '#00f1fe' : '#ffffff'
        this.opacity = Math.random() * 0.5 + 0.5
      }
      update() { this.y += this.vy; this.x += this.vx; this.opacity -= 0.005 }
      draw() { ctx.globalAlpha = this.opacity; ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill() }
    }

    const anim = () => {
      if (!alive) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      if (particles.length < 50 && Math.random() > 0.8) particles.push(new P())
      particles = particles.filter(p => { p.update(); p.draw(); return p.opacity > 0 })
      requestAnimationFrame(anim)
    }
    anim()
    const tid = setTimeout(() => { alive = false; canvas.style.transition = 'opacity 1s'; canvas.style.opacity = '0' }, 5000)
    return () => { alive = false; clearTimeout(tid); window.removeEventListener('resize', resize) }
  }, [])

  if (!state) return null
  const { ref, service, date, time, name, phone, vehicle } = state
  const svcLabel = service === 'full' ? t('Full Wash', 'غسيل كامل') : t('Exterior Only', 'خارجي فقط')
  const formattedDate = date ? new Date(date.slice(0,10) + 'T12:00:00').toLocaleDateString(t('en-US', 'ar-EG'), { year: 'numeric', month: 'long', day: 'numeric' }) : ''

  const downloadPDF = () => {
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Rasha Booking Receipt - ${ref}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; background: #fff; color: #111; }
    .page { max-width: 600px; margin: 0 auto; padding: 48px 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #0056b3; }
    .logo { font-size: 26px; font-weight: 900; letter-spacing: 4px; color: #0056b3; }
    .logo-sub { font-size: 11px; color: #888; letter-spacing: 1px; margin-top: 4px; }
    .badge { background: #f0f7ff; border: 1px solid #0056b3; border-radius: 6px; padding: 8px 14px; text-align: right; }
    .badge-label { font-size: 10px; color: #0056b3; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
    .badge-ref { font-size: 20px; font-weight: 800; color: #0056b3; letter-spacing: 1px; }
    .confirmed-section { text-align: center; margin-bottom: 32px; }
    .check { width: 56px; height: 56px; background: #e8f5e9; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; font-size: 28px; }
    h1 { font-size: 24px; font-weight: 800; color: #111; margin-bottom: 6px; }
    .subtitle { font-size: 13px; color: #666; }
    .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 24px; margin-bottom: 24px; }
    .card-header { display: flex; justify-content: space-between; padding-bottom: 16px; margin-bottom: 16px; border-bottom: 1px solid #e5e7eb; }
    .card-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #888; font-weight: 600; margin-bottom: 4px; }
    .card-value { font-size: 18px; font-weight: 700; color: #111; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .detail { display: flex; align-items: flex-start; gap: 10px; }
    .detail-icon { width: 36px; height: 36px; background: #e8f0fe; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
    .detail-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #888; font-weight: 600; margin-bottom: 3px; }
    .detail-value { font-size: 14px; font-weight: 600; color: #111; }
    .notice { background: #eff6ff; border-left: 4px solid #0056b3; border-radius: 4px; padding: 12px 16px; margin-bottom: 32px; font-size: 12px; color: #444; line-height: 1.6; }
    .footer { text-align: center; font-size: 11px; color: #aaa; padding-top: 24px; border-top: 1px solid #eee; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div><div class="logo">RASHA</div><div class="logo-sub">Premium Car Wash · Khartoum, Sudan</div></div>
    <div class="badge"><div class="badge-label">Confirmation</div><div class="badge-ref">${ref}</div></div>
  </div>
  <div class="confirmed-section">
    <div class="check">✓</div>
    <h1>Booking Confirmed</h1>
    <div class="subtitle">Your car wash is scheduled. See you soon!</div>
  </div>
  <div class="card">
    <div class="card-header">
      <div><div class="card-label">Service</div><div class="card-value">${svcLabel}</div></div>
      <div style="text-align:right"><div class="card-label">Reference</div><div class="card-value" style="color:#0056b3">${ref}</div></div>
    </div>
    <div class="grid">
      <div class="detail"><div class="detail-icon">📅</div><div><div class="detail-label">Date</div><div class="detail-value">${formattedDate}</div></div></div>
      <div class="detail"><div class="detail-icon">⏰</div><div><div class="detail-label">Time</div><div class="detail-value">${time}</div></div></div>
      <div class="detail"><div class="detail-icon">👤</div><div><div class="detail-label">Customer</div><div class="detail-value">${name || '—'}</div></div></div>
      ${vehicle
        ? `<div class="detail"><div class="detail-icon">🚗</div><div><div class="detail-label">Vehicle</div><div class="detail-value">${vehicle}</div></div></div>`
        : `<div class="detail"><div class="detail-icon">📍</div><div><div class="detail-label">Location</div><div class="detail-value">Rasha Car Wash, Khartoum</div></div></div>`
      }
      ${phone ? `<div class="detail"><div class="detail-icon">📞</div><div><div class="detail-label">Phone</div><div class="detail-value">${phone}</div></div></div>` : ''}
    </div>
  </div>
  <div class="notice">⏱ Please arrive <strong>15 minutes early</strong> for a pre-wash inspection with our lead detailer.</div>
  <div class="footer">© 2025 Rasha Car Wash · All rights reserved · rasha.sd</div>
</div>
</body>
</html>`
    const win = window.open('', '_blank')
    if (!win) { alert('Please allow popups to download the receipt.'); return }
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print() }, 600)
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-background)' }}>
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[200]" />

      <main className="flex flex-col items-center justify-center flex-grow px-6 py-12 pb-24 md:pb-12">
        <div className="w-full max-w-2xl flex flex-col items-center animate-fade-in">

          <div className="mb-6 flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full blur-3xl"
                style={{ background: 'rgba(0,241,254,0.2)', animation: 'pulse-cyan 3s ease-in-out infinite' }} />
              <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-secondary-fixed flex items-center justify-center backdrop-blur-xl"
                style={{ background: 'var(--glass-bg)', boxShadow: '0 0 20px rgba(0,241,254,0.3)' }}>
                <span className="material-symbols-outlined fill-icon text-secondary-fixed"
                  style={{ fontSize: '4rem' }}>check_circle</span>
              </div>
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-on-surface mb-2 tracking-tight font-display"
              style={{ fontSize: 'clamp(28px,5vw,48px)', fontWeight: 800, lineHeight: 1.15 }}>
              {t('Booking Confirmed', 'تم تأكيد الحجز')}
            </h1>
            <p className="text-on-surface-variant text-sm max-w-md mx-auto leading-relaxed">
              {t("Your premium detailing experience is locked in. We've sent a confirmation email to your inbox.",
                'تم تأكيد حجزك. سنرسل لك رسالة تأكيد.')}
            </p>
          </div>

          <div className="w-full rounded-xl p-6 md:p-8 mb-6 flex flex-col gap-6"
            style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid var(--glass-border)' }}>

            <div className="flex justify-between items-start pb-4"
              style={{ borderBottom: '1px solid rgba(66,71,82,0.2)' }}>
              <div>
                <span className="text-xs font-bold text-secondary-fixed uppercase tracking-widest mb-1 block">
                  {t('Package', 'الباقة')}
                </span>
                <h2 className="text-on-surface font-bold font-display"
                  style={{ fontSize: 'clamp(20px,4vw,32px)', lineHeight: 1.2 }}>
                  {svcLabel}
                </h2>
              </div>
              <div className="text-end">
                <span className="text-xs font-bold text-secondary-fixed uppercase tracking-widest mb-1 block">
                  {t('Confirmation', 'المرجع')}
                </span>
                <span className="text-on-surface font-bold font-display" dir="ltr" style={{unicodeBidi:'embed',
                  fontSize: 'clamp(20px,4vw,32px)', lineHeight: 1.2 }}>
                  {ref}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                ['calendar_month', t('Date', 'التاريخ'), formattedDate, false],
                ['schedule',       t('Time', 'الوقت'),   formatTime(time, lang), true],
                ['location_on',    t('Location', 'الموقع'), t('Rasha Car Wash, Khartoum', 'رشة لغسيل السيارات، الخرطوم'), false],
                vehicle
                  ? ['directions_car', t('Vehicle', 'السيارة'), vehicle, false]
                  : ['person',         t('Customer', 'العميل'), name || '—', false],
              ].map(([icon, label, value, ltr]) => (
                <div key={label} className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'var(--color-surface-container-high)', border: '1px solid var(--color-outline-variant)' }}>
                    <span className="material-symbols-outlined text-secondary-fixed text-xl">{icon}</span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-0.5">{label}</span>
                    <span className="text-on-surface font-semibold text-sm"
                      dir={ltr ? 'ltr' : undefined} style={ltr ? {unicodeBidi:'embed'} : undefined}>{value}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-lg flex items-start gap-3"
              style={{ background: 'rgba(0,241,254,0.04)', border: '1px solid rgba(0,241,254,0.1)' }}>
              <span className="material-symbols-outlined text-secondary-fixed shrink-0" style={{ fontSize: '16px', marginTop: '2px' }}>info</span>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {t('Please arrive 15 minutes prior to your appointment for a pre-wash inspection with our lead detailer.',
                  'يُرجى الحضور قبل 15 دقيقة من موعدك لإجراء فحص ما قبل الغسيل.')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <button
              onClick={downloadPDF}
              className="h-14 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all active:scale-[0.98] group"
              style={{ background: 'linear-gradient(135deg,#0056b3 0%,#115cb9 100%)', color: 'white', boxShadow: '0 0 20px rgba(0,241,254,0.3)' }}
              onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
              onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
            >
              <span className="material-symbols-outlined transition-transform group-hover:scale-110">picture_as_pdf</span>
              {t('Download PDF Receipt', 'تحميل إيصال PDF')}
            </button>

            <Link to="/book"
              className="h-14 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all active:scale-[0.98] group"
              style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(24px)', border: '1px solid var(--glass-border)', color: 'var(--color-on-surface)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-container-high)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--glass-bg)'}
            >
              <span className="material-symbols-outlined text-secondary-fixed">add</span>
              {t('Book Another Wash', 'حجز غسيل آخر')}
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-x-8 gap-y-3">
            <Link to="/contact"
              className="text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1 text-xs font-semibold">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>support_agent</span>
              {t('Contact Support', 'الدعم')}
            </Link>
            <Link to="/"
              className="text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1 text-xs font-semibold">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>home</span>
              {t('Return Home', 'العودة للرئيسية')}
            </Link>
          </div>
        </div>
      </main>

      <footer className="relative z-10 w-full py-6" style={{ background: 'var(--color-surface-container-lowest)', borderTop: '1px solid var(--color-outline-variant)' }}>
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="font-display font-extrabold text-2xl tracking-tight text-secondary-fixed">Rasha</span>
          <p className="text-on-surface-variant text-xs">© 2025 Rasha Automotive Detailing. {t('All rights reserved.', 'جميع الحقوق محفوظة.')}</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="text-on-surface-variant hover:text-secondary-fixed transition-colors text-xs">{t('Privacy Policy', 'سياسة الخصوصية')}</Link>
            <Link to="/terms" className="text-on-surface-variant hover:text-secondary-fixed transition-colors text-xs">{t('Terms of Service', 'شروط الخدمة')}</Link>
            <Link to="/contact" className="text-on-surface-variant hover:text-secondary-fixed transition-colors text-xs">{t('Contact Support', 'الدعم')}</Link>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes pulse-cyan {
          0%   { transform: scale(1);    opacity: 0.8; }
          50%  { transform: scale(1.05); opacity: 1;   }
          100% { transform: scale(1);    opacity: 0.8; }
        }
      `}</style>
    </div>
  )
}
