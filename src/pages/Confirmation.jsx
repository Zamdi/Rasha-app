import { useEffect, useRef } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { formatTime } from '../utils/format'

export default function Confirmation() {
  const { t, lang, showToast } = useApp()
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
  const { ref, service, date, time, name, phone, vehicle, paidFromWallet, amount } = state
  const svcLabel = service === 'full' ? t('Full Wash', 'غسيل كامل') : t('Exterior Only', 'خارجي فقط')
  const formattedDate = date ? new Date(date.slice(0,10) + 'T12:00:00').toLocaleDateString(t('en-US', 'ar-EG'), { year: 'numeric', month: 'long', day: 'numeric' }) : ''

  const downloadPDF = () => {
    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
    const svcDesc = service === 'full' ? 'Interior &amp; Exterior Detailed Cleaning' : 'Exterior Body Wash &amp; Rinse'
    const payLabel = paidFromWallet ? 'Paid via Wallet' : 'Pay at Location (Cash)'
    const bookingUid = ref.replace('#RSH-', 'BK-')
    const qrData = bookingUid
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Rasha - Booking Confirmation ${esc(ref)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@600;700;800&display=swap" rel="stylesheet"/>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"><\/script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', 'Segoe UI', sans-serif; background: #e5e2e1; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .msi { font-family: 'Material Symbols Outlined'; font-weight: normal; font-style: normal; line-height: 1; letter-spacing: normal; text-transform: none; display: inline-block; white-space: nowrap; word-wrap: normal; direction: ltr; -webkit-font-smoothing: antialiased; font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
    .msi-f { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
    .doc { background: #fff; width: 100%; max-width: 820px; margin: 0 auto; border-radius: 14px; overflow: hidden; box-shadow: 0 24px 80px rgba(0,0,0,0.18); }
    .top-bar { height: 8px; background: #003f87; }
    .inner { padding: 48px; position: relative; min-height: 1000px; }
    .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); opacity: 0.03; pointer-events: none; color: #003f87; font-size: 400px; line-height: 1; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 28px; margin-bottom: 32px; border-bottom: 1px solid #c2c6d4; position: relative; z-index: 1; }
    .brand-name { font-family: 'Montserrat', sans-serif; font-size: 34px; font-weight: 700; color: #003f87; letter-spacing: -0.02em; }
    .brand-sub { font-size: 10px; font-weight: 600; color: #00677d; letter-spacing: 0.14em; text-transform: uppercase; margin-top: 5px; }
    .header-right { text-align: right; }
    .doc-title { font-family: 'Montserrat', sans-serif; font-size: 18px; font-weight: 600; color: #1c1b1b; text-transform: uppercase; letter-spacing: 0.06em; }
    .ref-num { font-size: 12px; color: #727784; letter-spacing: 0.04em; margin-top: 6px; }
    .status-pill { display: inline-flex; align-items: center; gap: 4px; margin-top: 10px; padding: 3px 12px; background: #E0F2F7; border-radius: 100px; font-size: 10px; font-weight: 700; color: #003f87; letter-spacing: 0.06em; }
    .status-pill .msi { font-size: 14px; color: #003f87; }
    .body-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; position: relative; z-index: 1; }
    .left { display: flex; flex-direction: column; gap: 28px; }
    .right { display: flex; flex-direction: column; gap: 28px; }
    .sec-label { font-size: 11px; font-weight: 600; color: #00677d; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 12px; display: flex; align-items: center; gap: 6px; }
    .sec-label .msi { font-size: 18px; }
    .card { background: #f6f3f2; padding: 20px; border-radius: 8px; border: 1px solid rgba(194,198,212,0.4); box-shadow: 0 4px 20px rgba(0,63,135,0.03); }
    .cust-name { font-family: 'Montserrat', sans-serif; font-size: 20px; font-weight: 600; color: #1c1b1b; margin-bottom: 6px; }
    .cust-phone { font-size: 14px; color: #424752; display: flex; align-items: center; gap: 6px; }
    .cust-phone .msi { font-size: 14px; color: #727784; }
    .appt-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .appt-lbl { font-size: 10px; font-weight: 600; color: #727784; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 4px; }
    .appt-val { font-size: 16px; font-weight: 600; color: #1c1b1b; line-height: 1.3; }
    .appt-val.accent { color: #003f87; }
    .svc-divider { border: none; border-top: 1px solid rgba(194,198,212,0.4); margin: 12px 0; }
    .svc-name { font-size: 16px; font-weight: 600; color: #1c1b1b; margin-bottom: 3px; }
    .svc-desc { font-size: 13px; color: #424752; margin-bottom: 14px; }
    .svc-badge { display: flex; align-items: center; gap: 5px; font-size: 10px; font-weight: 600; color: #00677d; letter-spacing: 0.08em; text-transform: uppercase; }
    .svc-badge .msi { font-size: 14px; }
    .pay-row { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 8px; background: ${paidFromWallet ? 'rgba(240,253,248,1)' : '#f6f3f2'}; border: 1px solid ${paidFromWallet ? 'rgba(34,197,94,0.25)' : 'rgba(194,198,212,0.4)'}; }
    .pay-row .msi { font-size: 22px; color: ${paidFromWallet ? '#15803d' : '#727784'}; }
    .pay-lbl { font-size: 10px; font-weight: 600; color: #727784; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 2px; }
    .pay-val { font-size: 13px; font-weight: 600; color: ${paidFromWallet ? '#15803d' : '#424752'}; }
    .qr-box { flex: 1; background: #f6f3f2; border-radius: 12px; border: 1px solid rgba(194,198,212,0.4); padding: 28px; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 8px 30px rgba(0,63,135,0.06); }
    .qr-lbl { font-size: 11px; font-weight: 600; color: #00677d; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 20px; text-align: center; }
    .qr-frame { background: #fff; padding: 16px; border-radius: 8px; border: 1px solid #c2c6d4; display: inline-block; position: relative; }
    .qr-corner { position: absolute; width: 14px; height: 14px; border-color: #003f87; border-style: solid; }
    .qr-corner.tl { top: 6px; left: 6px; border-width: 2px 0 0 2px; }
    .qr-corner.tr { top: 6px; right: 6px; border-width: 2px 2px 0 0; }
    .qr-corner.bl { bottom: 6px; left: 6px; border-width: 0 0 2px 2px; }
    .qr-corner.br { bottom: 6px; right: 6px; border-width: 0 2px 2px 0; }
    .qr-ref { font-size: 11px; font-weight: 600; color: #727784; letter-spacing: 0.05em; margin-top: 16px; font-family: monospace; }
    .loc-row { display: flex; gap: 14px; align-items: flex-start; }
    .loc-icon { width: 40px; height: 40px; border-radius: 50%; background: #E0F2F7; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .loc-icon .msi { font-size: 20px; color: #003f87; }
    .loc-name { font-size: 15px; font-weight: 600; color: #1c1b1b; margin-bottom: 3px; }
    .loc-addr { font-size: 13px; color: #424752; line-height: 1.55; }
    .notice { background: #E0F2F7; border-left: 4px solid #003f87; border-radius: 4px; padding: 12px 16px; font-size: 12px; color: #444; line-height: 1.7; margin-top: 32px; position: relative; z-index: 1; }
    .footer { margin-top: 28px; padding-top: 24px; border-top: 1px solid rgba(194,198,212,0.5); text-align: center; position: relative; z-index: 1; }
    .footer-main { font-size: 14px; font-weight: 600; color: #1c1b1b; margin-bottom: 4px; }
    .footer-sub { font-size: 12px; color: #727784; }
    .footer-copy { font-size: 11px; color: #aaa; margin-top: 16px; }
    @media print {
      body { background: white; padding: 0; }
      .doc { box-shadow: none; border-radius: 0; }
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
<div class="doc">
  <div class="top-bar"></div>
  <div class="inner">
    <div class="watermark"><span class="msi msi-f">water_drop</span></div>
    <div class="header">
      <div>
        <div class="brand-name">Rasha</div>
        <div class="brand-sub">Premium Carwash</div>
      </div>
      <div class="header-right">
        <div class="doc-title">Booking Confirmation</div>
        <div class="ref-num">REF: ${esc(ref)}</div>
        <div class="status-pill"><span class="msi msi-f" style="font-size:14px">check_circle</span> CONFIRMED</div>
      </div>
    </div>
    <div class="body-grid">
      <div class="left">
        <div>
          <div class="sec-label"><span class="msi">person</span> Customer Details</div>
          <div class="card">
            <div class="cust-name">${esc(name || 'N/A')}</div>
            ${phone ? `<div class="cust-phone"><span class="msi">call</span> ${esc(phone)}</div>` : ''}
          </div>
        </div>
        <div>
          <div class="sec-label"><span class="msi">calendar_month</span> Appointment</div>
          <div class="card">
            <div class="appt-grid">
              <div><div class="appt-lbl">Date</div><div class="appt-val">${formattedDate}</div></div>
              <div><div class="appt-lbl">Time</div><div class="appt-val accent">${esc(time)}</div></div>
            </div>
          </div>
        </div>
        <div>
          <div class="sec-label"><span class="msi">design_services</span> Service Summary</div>
          <div class="card">
            <div class="svc-name">${svcLabel}</div>
            <div class="svc-desc">${svcDesc}</div>
            <hr class="svc-divider"/>
            <div class="svc-badge"><span class="msi msi-f">water_drop</span> Hydro-Premium Service</div>
          </div>
        </div>
        <div>
          <div class="sec-label"><span class="msi">${paidFromWallet ? 'account_balance_wallet' : 'payments'}</span> Payment</div>
          <div class="pay-row">
            <span class="msi msi-f" style="font-size:24px">${paidFromWallet ? 'account_balance_wallet' : 'payments'}</span>
            <div><div class="pay-lbl">Status</div><div class="pay-val">${payLabel}</div></div>
          </div>
        </div>
      </div>
      <div class="right">
        <div class="qr-box">
          <div class="qr-lbl">Scan at Service Bay</div>
          <div class="qr-frame">
            <div class="qr-corner tl"></div><div class="qr-corner tr"></div>
            <div class="qr-corner bl"></div><div class="qr-corner br"></div>
            <div id="qrcode"></div>
          </div>
          <div class="qr-ref">${esc(ref)}</div>
        </div>
        <div>
          <div class="sec-label"><span class="msi">location_on</span> Location</div>
          <div class="card">
            <div class="loc-row">
              <div class="loc-icon"><span class="msi msi-f">pin_drop</span></div>
              <div>
                <div class="loc-name">Rasha Main Center</div>
                <div class="loc-addr">Al-Amarat, Street 15<br/>Khartoum, Sudan</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="notice">Please arrive <strong>15 minutes early</strong> for a pre-wash inspection. Present this slip or scan the QR code at the service bay. ${paidFromWallet ? 'This booking has been <strong>paid in full</strong> via your Rasha wallet.' : 'Payment is due <strong>at the location</strong>. Please have cash ready upon arrival.'}</div>
    <div class="footer">
      <div class="footer-main">Thank you for choosing Rasha.</div>
      <div class="footer-sub">Please present this confirmation upon arrival at the service bay.</div>
      <div class="footer-copy">© 2025 Rasha Car Wash · All rights reserved · Khartoum, Sudan</div>
    </div>
  </div>
</div>
<script>
  new QRCode(document.getElementById('qrcode'), {
    text: '${qrData}',
    width: 168,
    height: 168,
    colorDark: '#003f87',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H
  });
  window.addEventListener('load', function() { setTimeout(function() { window.print(); }, 900); });
<\/script>
</body>
</html>`
    const win = window.open('', '_blank')
    if (!win) { showToast(t('Please allow popups to download the receipt.', 'يرجى السماح بالنوافذ المنبثقة لتحميل الإيصال.'), 'error'); return }
    win.document.write(html)
    win.document.close()
    win.focus()
  }

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--color-background)' }}>
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-30" />

      <main className="flex flex-col items-center justify-center flex-grow px-6 py-12 pb-24 md:pb-12">
        <div className="w-full max-w-2xl flex flex-col items-center animate-fade-in">

          <div className="mb-6 flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full blur-3xl"
                style={{ background: 'rgba(var(--color-secondary-fixed-rgb),0.2)', animation: 'pulse-glow 3s ease-in-out infinite' }} />
              <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-secondary-fixed flex items-center justify-center backdrop-blur-xl"
                style={{ background: 'var(--glass-bg)', boxShadow: '0 0 20px rgba(var(--color-secondary-fixed-rgb),0.3)' }}>
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
                <span className="text-xs font-bold text-secondary-fixed uppercase tracking-wide mb-1 block">
                  {t('Package', 'الباقة')}
                </span>
                <h2 className="text-on-surface font-bold font-display"
                  style={{ fontSize: 'clamp(20px,4vw,32px)', lineHeight: 1.2 }}>
                  {svcLabel}
                </h2>
              </div>
              <div className="text-end">
                <span className="text-xs font-bold text-secondary-fixed uppercase tracking-wide mb-1 block">
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
                  : ['person',         t('Customer', 'العميل'), name || 'N/A', false],
                paidFromWallet
                  ? ['account_balance_wallet', t('Payment', 'الدفع'), t('Paid via Wallet', 'مدفوع من المحفظة'), false]
                  : ['payments', t('Payment', 'الدفع'), t('Pay at location (Cash)', 'الدفع عند الوصول (نقداً)'), false],
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
              style={{ background: 'rgba(var(--color-secondary-fixed-rgb),0.04)', border: '1px solid rgba(var(--color-secondary-fixed-rgb),0.1)' }}>
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
              className="hydro-gradient teal-glow h-14 rounded-xl flex items-center justify-center gap-2 font-bold text-sm text-white transition-all active:scale-[0.98] group"
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
        @keyframes pulse-glow {
          0%   { transform: scale(1);    opacity: 0.8; }
          50%  { transform: scale(1.05); opacity: 1;   }
          100% { transform: scale(1);    opacity: 0.8; }
        }
      `}</style>
    </div>
  )
}
