import { Link, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useEffect, useState, useRef } from 'react'

const HIDDEN_PAGES = ['/staff', '/confirmation', '/reset-password', '/forgot-password']

export default function MobileNav() {
  const { pathname } = useLocation()
  const { t, customer, theme } = useApp()
  const isDark = theme === 'dark'
  const [expanded, setExpanded] = useState(true)
  const lastY = useRef(0)
  const ticking = useRef(false)
  const navRef = useRef(null)
  const tabRefs = useRef([])
  const [pillStyle, setPillStyle] = useState({ left: 0, top: 6, width: 0, height: 0, opacity: 0 })

  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return
      ticking.current = true
      requestAnimationFrame(() => {
        const y = window.scrollY
        if (y < 50) setExpanded(true)
        else if (y > lastY.current + 8) setExpanded(false)
        else if (y < lastY.current - 8) setExpanded(true)
        lastY.current = y
        ticking.current = false
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setExpanded(true) }, [pathname])

  if (HIDDEN_PAGES.some(p => pathname.startsWith(p))) return null

  const avatarUrl = customer?.avatar_url || null

  const guestItems = [
    { to: '/',      icon: 'home',                   label: t('Home', 'الرئيسية') },
    { to: '/book',  icon: 'local_car_wash',          label: t('Book', 'احجز') },
    { to: '/login', icon: 'person',                  label: t('Profile', 'حسابي') },
  ]
  const loggedInItems = [
    { to: '/book',    icon: 'local_car_wash',         label: t('Book', 'احجز') },
    { to: '/loyalty', icon: 'person',                 label: t('Profile', 'حسابي'), avatar: avatarUrl },
    { to: '/wallet',  icon: 'account_balance_wallet', label: t('Wallet', 'محفظتي') },
  ]
  const items = customer ? loggedInItems : guestItems
  const activeIdx = items.findIndex(i => i.to === pathname)

  // Keep the pill locked to the active tab.
  // The tabs animate their padding/width for 0.3s on every expand/shrink, so a
  // single delayed measurement reads mid-animation values and never corrects.
  // A ResizeObserver re-measures on each layout change instead.
  useEffect(() => {
    const nav = navRef.current
    if (!nav) return

    const measure = () => {
      const tab = tabRefs.current[activeIdx]
      if (!tab) { setPillStyle(p => ({ ...p, opacity: 0 })); return }
      const nr = nav.getBoundingClientRect()
      const tr = tab.getBoundingClientRect()
      setPillStyle({
        left: tr.left - nr.left,
        top: tr.top - nr.top,
        width: tr.width,
        height: tr.height,
        opacity: 1,
      })
    }

    measure()

    const ro = new ResizeObserver(measure)
    ro.observe(nav)
    tabRefs.current.forEach(el => el && ro.observe(el))

    // Label widths shift once the icon/text fonts finish loading.
    if (document.fonts?.ready) document.fonts.ready.then(measure).catch(() => {})

    window.addEventListener('resize', measure)
    return () => { ro.disconnect(); window.removeEventListener('resize', measure) }
  }, [activeIdx, expanded, items.length])

  // Theme-aware colors — derived from theme string not isDark bool
  // so it always re-renders when theme changes
  const navBg    = isDark ? 'rgba(20,22,24,0.88)'       : 'rgba(255,255,255,0.72)'
  const navBorder= isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,86,179,0.18)'
  const navShadow= isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(0,86,179,0.14)'
  const pillBg   = isDark ? 'rgba(255,255,255,0.16)'    : 'rgba(0,86,179,0.12)'
  const iconColor= (active) => isDark ? 'white' : (active ? '#0056b3' : '#555')
  const labelColor=(active) => isDark ? 'white' : (active ? '#0056b3' : '#555')

  return (
    <div className="md:hidden fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <nav ref={navRef} className="pointer-events-auto relative flex items-center"
        style={{
          background: navBg,
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          border: navBorder,
          borderRadius: '9999px',
          padding: expanded ? '6px 8px' : '4px 6px',
          gap: '2px',
          boxShadow: navShadow,
          transition: 'padding 0.3s ease',
        }}>

        {/* Sliding pill */}
        {activeIdx >= 0 && pillStyle.width > 0 && (
          <div style={{
            position: 'absolute',
            top: pillStyle.top ?? 6,
            left: pillStyle.left,
            width: pillStyle.width,
            height: pillStyle.height,
            borderRadius: '9999px',
            background: pillBg,
            opacity: pillStyle.opacity ?? 1,
            transition: 'left 0.38s cubic-bezier(0.34,1.2,0.64,1), width 0.38s cubic-bezier(0.34,1.2,0.64,1), height 0.3s ease, top 0.3s ease, opacity 0.2s ease',
            pointerEvents: 'none',
            zIndex: 0,
          }} />
        )}

        {items.map((item, idx) => {
          const isActive = pathname === item.to
          return (
            <Link key={item.to} to={item.to}
              ref={el => tabRefs.current[idx] = el}
              className="relative flex flex-col items-center justify-center z-10"
              style={{
                padding: expanded ? '8px 20px' : '6px 16px',
                borderRadius: '9999px',
                minWidth: expanded ? '72px' : '56px',
                transition: 'padding 0.3s ease, min-width 0.3s ease',
              }}>
              {item.avatar ? (
                <div style={{
                  width: expanded ? '26px' : '22px',
                  height: expanded ? '26px' : '22px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: isActive ? '2px solid #0056b3' : '2px solid transparent',
                  transition: 'all 0.3s ease',
                  flexShrink: 0,
                }}>
                  <img src={item.avatar} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} />
                </div>
              ) : (
                <span className="material-symbols-outlined" style={{
                  fontSize: expanded ? '24px' : '20px',
                  color: iconColor(isActive),
                  opacity: isActive ? 1 : 0.6,
                  fontVariationSettings: isActive ? "'FILL' 1, 'wght' 400" : "'FILL' 0, 'wght' 400",
                  transition: 'all 0.3s ease',
                }}>{item.icon}</span>
              )}
              <span style={{
                fontSize: '10px',
                fontWeight: 600,
                color: labelColor(isActive),
                opacity: expanded ? (isActive ? 1 : 0.6) : 0,
                maxHeight: expanded ? '14px' : '0',
                marginTop: expanded ? '2px' : '0',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                transition: 'opacity 0.3s, max-height 0.3s, margin-top 0.3s',
              }}>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
