import { Link, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useEffect, useState, useRef } from 'react'

const HIDDEN_PAGES = ['/staff', '/confirmation', '/reset-password', '/forgot-password']

export default function MobileNav() {
  const { pathname } = useLocation()
  const { t, customer } = useApp()
  const [expanded, setExpanded] = useState(true)
  const lastY = useRef(0)
  const ticking = useRef(false)

  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return
      ticking.current = true
      requestAnimationFrame(() => {
        const currentY = window.scrollY
        if (currentY < 50) {
          setExpanded(true)
        } else if (currentY > lastY.current + 8) {
          setExpanded(false) // scrolling down → shrink
        } else if (currentY < lastY.current - 8) {
          setExpanded(true)  // scrolling up → expand
        }
        lastY.current = currentY
        ticking.current = false
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Always expand on page change
  useEffect(() => { setExpanded(true) }, [pathname])

  if (HIDDEN_PAGES.some(p => pathname.startsWith(p))) return null

  const guestItems = [
    { to: '/',      icon: 'home',           label: t('Home', 'الرئيسية') },
    { to: '/book',  icon: 'local_car_wash', label: t('Book', 'احجز')     },
    { to: '/login', icon: 'person',         label: t('Profile', 'حسابي') },
  ]

  const loggedInItems = [
    { to: '/book',    icon: 'local_car_wash',         label: t('Book', 'احجز')      },
    { to: '/loyalty', icon: 'person',                 label: t('Profile', 'حسابي'), avatar: customer?.avatar_url },
    { to: '/wallet',  icon: 'account_balance_wallet', label: t('Wallet', 'محفظتي')  },
  ]

  const items = customer ? loggedInItems : guestItems

  const bg = 'rgba(20,22,24,0.75)'
  const bgLight = 'rgba(244,241,236,0.80)'

  return (
    <div className="md:hidden fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <nav
        className="pointer-events-auto flex items-center transition-all duration-300 ease-in-out"
        style={{
          background: 'var(--mobile-nav-bg, rgba(20,22,24,0.78))',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '9999px',
          padding: expanded ? '8px 12px' : '6px 10px',
          gap: expanded ? '4px' : '2px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          transition: 'padding 0.3s ease, gap 0.3s ease',
        }}
      >
        {items.map(item => {
          const isActive = pathname === item.to
          return (
            <Link key={item.to} to={item.to}
              className="flex flex-col items-center justify-center transition-all duration-300"
              style={{
                padding: expanded ? '8px 18px' : '6px 14px',
                borderRadius: '9999px',
                background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                minWidth: expanded ? '64px' : '48px',
              }}>
              {/* Avatar or icon */}
              {item.avatar ? (
                <div className="rounded-full overflow-hidden shrink-0 transition-all duration-300"
                  style={{
                    width: expanded ? '26px' : '22px',
                    height: expanded ? '26px' : '22px',
                    border: isActive ? '2px solid rgba(var(--color-secondary-fixed-rgb),0.8)' : '2px solid transparent',
                  }}>
                  <img src={item.avatar} alt="avatar" className="w-full h-full object-cover" />
                </div>
              ) : (
                <span className="material-symbols-outlined transition-all duration-300 text-white"
                  style={{
                    fontSize: expanded ? '24px' : '20px',
                    opacity: isActive ? 1 : 0.75,
                  }}>
                  {item.icon}
                </span>
              )}
              {/* Label — only when expanded */}
              <span className="transition-all duration-300 overflow-hidden text-white font-semibold"
                style={{
                  fontSize: '10px',
                  maxHeight: expanded ? '16px' : '0px',
                  opacity: expanded ? (isActive ? 1 : 0.7) : 0,
                  marginTop: expanded ? '2px' : '0px',
                }}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>
      <style>{`
        html.light .pointer-events-auto {
          --mobile-nav-bg: rgba(30,30,30,0.82);
        }
      `}</style>
    </div>
  )
}
