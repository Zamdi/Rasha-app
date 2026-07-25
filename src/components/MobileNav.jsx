import { Link, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useEffect, useState } from 'react'

// Pages where mobile nav should be completely hidden
const HIDDEN_PAGES = ['/staff', '/confirmation', '/reset-password', '/forgot-password']

export default function MobileNav() {
  const { pathname } = useLocation()
  const { t, customer } = useApp()
  const [visible, setVisible] = useState(true)
  const [lastY, setLastY] = useState(0)

  // Hide on scroll down, show on scroll up
  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY
      if (currentY < 60) {
        setVisible(true) // always show near top
      } else if (currentY > lastY + 5) {
        setVisible(false) // scrolling down — hide
      } else if (currentY < lastY - 5) {
        setVisible(true)  // scrolling up — show
      }
      setLastY(currentY)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [lastY])

  // Reset visibility on page change
  useEffect(() => { setVisible(true) }, [pathname])

  // Hide on staff pages and confirmation
  if (HIDDEN_PAGES.some(p => pathname.startsWith(p))) return null

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 w-full z-50 border-t transition-transform duration-300"
      style={{
        background: 'var(--glass-high-bg)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderColor: 'var(--color-outline-variant)',
        transform: visible ? 'translateY(0)' : 'translateY(100%)'
      }}
    >
      <div className="flex justify-around items-center px-4 py-2">
        {[
          { to: '/', icon: 'home', en: 'Home', ar: 'الرئيسية' },
          { to: '/book', icon: 'local_car_wash', en: 'Book', ar: 'احجز' },
          { to: '/loyalty', icon: 'loyalty', en: 'Card', ar: 'بطاقتي' },
          { to: '/wallet', icon: 'account_balance_wallet', en: 'Wallet', ar: 'محفظتي' },
          { to: customer ? '/settings' : '/login', icon: 'person', en: 'Profile', ar: 'حسابي' },
        ]
          .filter(item => {
            // Hide wallet tab when not logged in
            if (item.to === '/wallet' && !customer) return false
            // Hide current page tab
            if (item.to === pathname) return false
            // For profile: hide if already on settings
            if (item.to === '/settings' && pathname === '/settings') return false
            // Hide book tab when on book page
            if (item.to === '/book' && pathname === '/book') return false
            return true
          })
          .map(item => {
            const to = item.to === '/loyalty' && !customer ? '/login' : item.to
            const isActive = pathname === to ||
              (to === '/settings' && pathname === '/settings') ||
              (to === '/wallet' && pathname === '/wallet')
            return (
              <Link key={item.to} to={to}
                className={`flex flex-col items-center gap-0.5 p-2 transition-colors ${isActive ? 'text-secondary-fixed' : 'text-on-surface-variant'}`}>
                <span className={`material-symbols-outlined text-xl ${isActive ? 'fill-icon' : ''}`}>{item.icon}</span>
                <span className="text-xs font-semibold">{t(item.en, item.ar)}</span>
              </Link>
            )
          })}
      </div>
    </nav>
  )
}
