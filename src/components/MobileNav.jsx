import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useEffect, useState, useRef } from 'react'

const HIDDEN_PAGES = ['/staff', '/confirmation', '/reset-password', '/forgot-password']

export default function MobileNav() {
  const { pathname } = useLocation()
  const { t, customer, isDark } = useApp()
  const navigate = useNavigate()

  const navRef  = useRef(null)
  const tabRefs = useRef([])
  const [pillStyle, setPillStyle] = useState({ left: 0, top: 0, width: 0, height: 0, opacity: 0 })
  const [pillEased, setPillEased] = useState(false)

  const hidden = HIDDEN_PAGES.some(p => pathname.startsWith(p))

  const loggedInItems = [
    { to: '/loyalty',   icon: 'home',           label: t('Home', 'الرئيسية') },
    { to: '/wallet',    icon: 'credit_card',    label: t('Wallet', 'محفظتي') },
    // center button at index 2 — handled separately
    { to: '/bookings',  icon: 'calendar_month', label: t('Bookings', 'حجوزات') },
    { to: '/settings',  icon: 'account_circle',  label: t('Profile', 'حسابي') },
  ]
  const guestItems = [
    { to: '/',        icon: 'home',             label: t('Home', 'الرئيسية') },
    { to: '/login',   icon: 'login',            label: t('Sign In', 'تسجيل الدخول') },
    { to: '/contact', icon: 'support_agent',    label: t('Contact', 'تواصل') },
  ]

  const items = customer ? loggedInItems : guestItems
  const activeIdx = items.findIndex(i => i.to === pathname)

  useEffect(() => {
    if (hidden) return
    const nav = navRef.current
    if (!nav) return
    let rafId = 0, stopAt = 0
    const measure = () => {
      const tab = tabRefs.current[activeIdx]
      if (!tab) { setPillStyle(p => p.opacity === 0 ? p : { ...p, opacity: 0 }); return }
      const nr = nav.getBoundingClientRect()
      const tr = tab.getBoundingClientRect()
      const next = { left: tr.left - nr.left, top: tr.top - nr.top, width: tr.width, height: tr.height, opacity: 1 }
      setPillStyle(p =>
        Math.abs(p.left - next.left) < 0.5 && Math.abs(p.top - next.top) < 0.5 &&
        Math.abs(p.width - next.width) < 0.5 && Math.abs(p.height - next.height) < 0.5 &&
        p.opacity === next.opacity ? p : next
      )
    }
    const loop = () => { measure(); if (performance.now() < stopAt) rafId = requestAnimationFrame(loop) }
    const track = (ms = 450) => { stopAt = performance.now() + ms; cancelAnimationFrame(rafId); rafId = requestAnimationFrame(loop) }
    track()
    const ro = new ResizeObserver(() => track(200))
    ro.observe(nav)
    tabRefs.current.forEach(el => el && ro.observe(el))
    if (document.fonts?.ready) document.fonts.ready.then(() => track(200)).catch(() => {})
    const onResize = () => track(200)
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(rafId); ro.disconnect(); window.removeEventListener('resize', onResize) }
  }, [activeIdx, items.length, hidden])

  useEffect(() => {
    if (activeIdx < 0) return
    setPillEased(true)
    const id = setTimeout(() => setPillEased(false), 460)
    return () => clearTimeout(id)
  }, [activeIdx])

  if (hidden) return null

  const bg           = isDark ? 'rgba(12,22,38,0.96)' : '#ffffff'
  const shadow       = isDark
    ? '0 8px 32px rgba(0,0,0,0.5), 0 1px 0 rgba(175,211,226,0.06) inset'
    : '0 4px 24px rgba(20,108,148,0.14), 0 1px 0 rgba(255,255,255,0.8) inset'
  const activeColor   = isDark ? '#ffffff' : '#146C94'
  const inactiveColor = isDark ? 'rgba(255,255,255,0.38)' : 'rgba(14,56,62,0.35)'
  const pillBg        = isDark ? 'rgba(175,211,226,0.10)' : '#F0EDE8'

  const leftItems  = items.slice(0, 2)
  const rightItems = items.slice(2)

  const renderTab = (item, realIdx) => {
    const isActive = pathname === item.to
    return (
      <Link key={item.to} to={item.to}
        ref={el => { tabRefs.current[realIdx] = el }}
        aria-current={isActive ? 'page' : undefined}
        className="relative z-10 flex flex-col items-center justify-center gap-0.5"
        style={{ flex: 1, padding: '10px 6px', textDecoration: 'none', minWidth: 0 }}>
        <span className="material-symbols-outlined" style={{
          fontSize: '22px', lineHeight: 1,
          color: isActive ? activeColor : inactiveColor,
          fontVariationSettings: isActive ? "'FILL' 1, 'wght' 500" : "'FILL' 0, 'wght' 400",
          transition: 'color 0.25s',
        }}>{item.icon}</span>
        <span style={{
          fontSize: '10px', fontWeight: 600,
          color: isActive ? activeColor : inactiveColor,
          whiteSpace: 'nowrap',
          transition: 'color 0.25s',
        }}>{item.label}</span>
      </Link>
    )
  }

  return (
    /* Outer wrapper — positions everything above the bottom edge */
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-20"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)', paddingLeft: '16px', paddingRight: '16px' }}>

      {/* Center elevated button — QR code shortcut (logged-in only) */}
      {customer && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '-28px', position: 'relative', zIndex: 30 }}>
          <button
            onClick={() => navigate('/wallet?qr=1')}
            aria-label={t('My QR code', 'رمز QR الخاص بي')}
            style={{
              width: '56px', height: '56px',
              borderRadius: '50%',
              background: '#12454B',
              border: `4px solid ${isDark ? '#0b1424' : '#f1ede6'}`,
              boxShadow: '0 6px 20px rgba(10,20,30,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.92)'; e.currentTarget.style.transition = 'transform 0.12s' }}
            onPointerUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
            onPointerLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#ffffff', lineHeight: 1 }}>
              qr_code_2
            </span>
          </button>
        </div>
      )}

      {/* The floating pill bar */}
      <nav ref={navRef}
        style={{
          background: bg,
          borderRadius: '28px',
          boxShadow: shadow,
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          paddingTop: '4px',
          paddingBottom: '4px',
        }}>

        {/* Sliding active pill */}
        {activeIdx >= 0 && pillStyle.width > 0 && (
          <div style={{
            position: 'absolute',
            left: pillStyle.left,
            top: pillStyle.top,
            width: pillStyle.width,
            height: pillStyle.height,
            opacity: pillStyle.opacity,
            background: pillBg,
            borderRadius: '20px',
            pointerEvents: 'none',
            transition: pillEased
              ? 'left 0.38s cubic-bezier(0.34,1.15,0.64,1), width 0.38s cubic-bezier(0.34,1.15,0.64,1), opacity 0.2s'
              : 'opacity 0.2s',
          }} />
        )}

        {/* Left two tabs */}
        {leftItems.map((item, i) => renderTab(item, i))}

        {/* Spacer where the center button overlaps — only when logged in */}
        {customer && <div style={{ flex: '0 0 64px' }} />}

        {/* Right two tabs */}
        {rightItems.map((item, i) => renderTab(item, i + 2))}
      </nav>
    </div>
  )
}
