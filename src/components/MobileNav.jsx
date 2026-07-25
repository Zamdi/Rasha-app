import { Link, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useEffect, useState } from 'react'

const HIDDEN_PAGES = ['/staff', '/confirmation', '/reset-password', '/forgot-password']

export default function MobileNav() {
  const { pathname } = useLocation()
  const { t, customer } = useApp()
  const [visible, setVisible] = useState(true)
  const [lastY, setLastY] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY
      if (currentY < 60) { setVisible(true) }
      else if (currentY > lastY + 5) { setVisible(false) }
      else if (currentY < lastY - 5) { setVisible(true) }
      setLastY(currentY)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [lastY])

  useEffect(() => { setVisible(true) }, [pathname])

  if (HIDDEN_PAGES.some(p => pathname.startsWith(p))) return null

  // Different tabs for logged in vs guest
  const items = customer ? [
    { to: '/book',     icon: 'local_car_wash',        en: 'Book',    ar: 'احجز'    },
    { to: '/loyalty',  icon: 'loyalty',               en: 'Card',    ar: 'بطاقتي'  },
    { to: '/wallet',   icon: 'account_balance_wallet', en: 'Wallet',  ar: 'محفظتي'  },
    { to: '/settings', icon: 'person',                en: 'Profile', ar: 'حسابي'   },
  ] : [
    { to: '/',        icon: 'home',          en: 'Home',   ar: 'الرئيسية' },
    { to: '/book',    icon: 'local_car_wash', en: 'Book',   ar: 'احجز'    },
    { to: '/loyalty', icon: 'loyalty',        en: 'Card',   ar: 'بطاقتي'  },
    { to: '/login',   icon: 'person',         en: 'Sign In', ar: 'دخول'   },
  ]

  const filtered = items.filter(item => item.to !== pathname)

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
      <div className="flex justify-around items-center px-2 py-2">
        {filtered.map(item => (
          <Link key={item.to} to={item.to}
            className="flex flex-col items-center gap-0.5 p-2 transition-colors text-on-surface-variant hover:text-secondary-fixed">
            <span className="material-symbols-outlined text-xl">{item.icon}</span>
            <span className="text-xs font-semibold">{item.en === 'Book' ? t('Book', 'احجز') : item.en === 'Card' ? t('Card', 'بطاقتي') : item.en === 'Wallet' ? t('Wallet', 'محفظتي') : item.en === 'Profile' ? t('Profile', 'حسابي') : item.en === 'Home' ? t('Home', 'الرئيسية') : item.en === 'Sign In' ? t('Sign In', 'دخول') : item.en}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
