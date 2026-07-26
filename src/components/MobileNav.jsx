import { Link, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useEffect, useState, useRef } from 'react'

const HIDDEN_PAGES = ['/staff', '/confirmation', '/reset-password', '/forgot-password']

export default function MobileNav() {
  const { pathname } = useLocation()
  const { t, customer, isDark } = useApp()
  const [expanded, setExpanded] = useState(true)
  const lastY = useRef(0)
  const ticking = useRef(false)
  const navRef = useRef(null)
  const tabRefs = useRef([])
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 })

  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return
      ticking.current = true
      requestAnimationFrame(() => {
        const currentY = window.scrollY
        if (currentY < 50) setExpanded(true)
        else if (currentY > lastY.current + 8) setExpanded(false)
        else if (currentY < lastY.current - 8) setExpanded(true)
        lastY.current = currentY
        ticking.current = false
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setExpanded(true) }, [pathname])

  const guestItems = [
    { to: '/',      icon: 'home',                   label: t('Home',    'الرئيسية') },
    { to: '/book',  icon: 'local_car_wash',          label: t('Book',    'احجز')     },
    { to: '/login', icon: 'person',                  label: t('Profile', 'حسابي')    },
  ]
  const loggedInItems = [
    { to: '/book',    icon: 'local_car_wash',         label: t('Book',    'احجز')    },
    { to: '/loyalty', icon: 'person',                 label: t('Profile', 'حسابي'), avatar: customer?.avatar_url },
    { to: '/wallet',  icon: 'account_balance_wallet', label: t('Wallet',  'محفظتي') },
  ]
  const items = customer ? loggedInItems : guestItems
  const activeIdx = items.findIndex(item => item.to === pathname)

  // Measure tab position for sliding pill
  useEffect(() => {
    const updatePill = () => {
      const nav = navRef.current
      const tab = tabRefs.current[activeIdx]
      if (!nav || !tab) return
      const navRect = nav.getBoundingClientRect()
      const tabRect = tab.getBoundingClientRect()
      setPillStyle({
        left: tabRect.left - navRect.left,
        width: tabRect.width,
        height: tabRect.height,
      })
    }
    // Small delay to let layout settle
    const t = setTimeout(updatePill, 30)
    window.addEventListener('resize', updatePill)
    return () => { clearTimeout(t); window.removeEventListener('resize', updatePill) }
  }, [activeIdx, expanded, pathname])

  if (HIDDEN_PAGES.some(p => pathname.startsWith(p))) return null

  return (
    <div className="md:hidden fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <nav
        ref={navRef}
        className="pointer-events-auto relative flex items-center"
        style={{
          background: isDark ? 'rgba(20,22,24,0.82)' : 'rgba(255,255,255,0.65)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,86,179,0.15)',
          borderRadius: '9999px',
          padding: expanded ? '6px 8px' : '4px 6px',
          gap: '2px',
          boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.35)' : '0 8px 32px rgba(0,86,179,0.12)',
          transition: 'padding 0.3s ease, background 0.3s ease',
        }}
      >
        {/* Sliding pill */}
        {activeIdx >= 0 && pillStyle.width > 0 && (
          <div style={{
            position: 'absolute',
            top: '6px',
            left: pillStyle.left,
            width: pillStyle.width,
            height: pillStyle.height || 56,
            borderRadius: '9999px',
            background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,86,179,0.1)',
            transition: 'left 0.35s cubic-bezier(0.34,1.2,0.64,1), width 0.35s cubic-bezier(0.34,1.2,0.64,1)',
            pointerEvents: 'none',
            zIndex: 0,
          }} />
        )}

        {items.map((item, idx) => {
          const isActive = pathname === item.to
          return (
            <Link
              key={item.to}
              to={item.to}
              ref={el => tabRefs.current[idx] = el}
              className="relative flex flex-col items-center justify-center z-10"
              style={{
                padding: expanded ? '8px 20px' : '6px 16px',
                borderRadius: '9999px',
                minWidth: expanded ? '72px' : '56px',
                transition: 'padding 0.3s ease, min-width 0.3s ease',
              }}>
              {item.avatar ? (
                <div className="rounded-full overflow-hidden shrink-0"
                  style={{
                    width: expanded ? '26px' : '22px',
                    height: expanded ? '26px' : '22px',
                    border: isActive ? '2px solid rgba(116,245,255,0.8)' : '2px solid transparent',
                    transition: 'all 0.3s ease',
                  }}>
                  <img src={item.avatar} alt="avatar" className="w-full h-full object-cover" />
                </div>
              ) : (
                <span className="material-symbols-outlined"
                  style={{
                    fontSize: expanded ? '24px' : '20px',
                    opacity: isActive ? 1 : 0.65,
                    transition: 'all 0.3s ease',
                    fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                    color: isDark ? 'white' : (isActive ? 'var(--color-primary-container)' : '#333'),
                  }}>
                  {item.icon}
                </span>
              )}
              <span style={{
                fontSize: '10px',
                maxHeight: expanded ? '14px' : '0px',
                opacity: expanded ? (isActive ? 1 : 0.65) : 0,
                marginTop: expanded ? '2px' : '0px',
                transition: 'max-height 0.3s ease, opacity 0.3s ease, margin-top 0.3s ease',
                whiteSpace: 'nowrap',
                color: isDark ? 'white' : (isActive ? 'var(--color-primary-container)' : '#333'),
                fontWeight: 600,
              }}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
