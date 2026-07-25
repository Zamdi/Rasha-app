import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import ThemeToggle from './ThemeToggle'
import { useEffect, useState, useRef } from 'react'

export default function Navbar() {
  const { lang, toggleLang, t, customer, logout } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close menu on outside click
  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const isStaff = location.pathname.startsWith('/staff')
  if (isStaff) return null

  const handleLogout = () => { logout(); navigate('/'); setMenuOpen(false) }

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      scrolled ? 'backdrop-blur-xl shadow-md' : 'bg-transparent'
    }`} style={scrolled ? {background:'var(--navbar-bg)'} : {}}>
      <div className="max-w-7xl mx-auto flex justify-between items-center h-14 px-4 md:px-6">
        {/* Logo */}
        <Link to="/" className="font-display font-extrabold text-xl tracking-tight text-secondary-fixed">
          Rasha
        </Link>

        {/* Desktop nav — hide link for current page */}
        <div className="hidden md:flex items-center gap-6 text-sm font-semibold">
          {!customer && location.pathname !== '/' && (
            <Link to="/" className="text-on-surface-variant hover:text-secondary-fixed transition-colors">{t('Home', 'الرئيسية')}</Link>
          )}
          {location.pathname !== '/book' && (
            <Link to="/book" className="text-on-surface-variant hover:text-secondary-fixed transition-colors">{t('Book a Wash', 'احجز غسيل')}</Link>
          )}
          {customer && location.pathname !== '/loyalty' && (
            <Link to="/loyalty" className="text-on-surface-variant hover:text-secondary-fixed transition-colors">{t('My Card', 'بطاقتي')}</Link>
          )}
          {customer && location.pathname !== '/wallet' && (
            <Link to="/wallet" className="text-on-surface-variant hover:text-secondary-fixed transition-colors">{t('Wallet', 'المحفظة')}</Link>
          )}
          {location.pathname !== '/contact' && (
            <Link to="/contact" className="text-on-surface-variant hover:text-secondary-fixed transition-colors">{t('Support', 'الدعم')}</Link>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button onClick={toggleLang} className="flex items-center gap-1 text-secondary-fixed text-xs font-bold hover:opacity-80 transition-opacity">
            <span className="material-symbols-outlined text-base">language</span>
            <span>{lang === 'en' ? 'AR' : 'EN'}</span>
          </button>

          {customer ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(o => !o)}
                className="flex items-center gap-1.5 text-xs font-bold text-secondary-fixed px-3 py-1.5 rounded-full transition-all"
                style={{ border: '1px solid rgba(var(--color-secondary-fixed-rgb), 0.3)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(var(--color-secondary-fixed-rgb), 0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span className="material-symbols-outlined fill-icon text-sm">account_circle</span>
                <span>{customer.first_name}</span>
                <span className="material-symbols-outlined" style={{fontSize:'14px', transition:'transform 0.2s', transform: menuOpen ? 'rotate(180deg)' : 'rotate(0deg)'}}>expand_more</span>
              </button>
              {menuOpen && (
                <div className="absolute end-0 mt-2 w-48 rounded-2xl py-2 animate-fade-in z-50"
                  style={{ background: 'var(--color-surface-container)', border: '1px solid var(--color-outline-variant)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
                  <div className="px-4 py-2 border-b" style={{borderColor: 'var(--color-outline-variant)'}}>
                    <p className="text-xs font-bold text-on-surface">{customer.first_name} {customer.last_name}</p>
                    <p className="text-xs text-on-surface-variant truncate">{customer.email}</p>
                  </div>
                  <Link to="/loyalty" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-on-surface hover:text-secondary-fixed transition-colors w-full">
                    <span className="material-symbols-outlined text-base">loyalty</span>
                    {t('My Loyalty Card', 'بطاقتي')}
                  </Link>
                  <Link to="/settings" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-on-surface hover:text-secondary-fixed transition-colors w-full">
                    <span className="material-symbols-outlined text-base">settings</span>
                    {t('Settings', 'الإعدادات')}
                  </Link>
                  <div className="border-t my-1" style={{borderColor: 'var(--color-outline-variant)'}} />
                  <button onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-error hover:opacity-80 transition-opacity w-full">
                    <span className="material-symbols-outlined text-base">logout</span>
                    {t('Sign Out', 'تسجيل الخروج')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            // Sign In — hidden on mobile since Profile tab in MobileNav handles it
            <Link to="/login" className="hidden md:block text-xs font-bold text-on-surface-variant hover:text-secondary-fixed transition-colors">
              {t('Sign In', 'تسجيل الدخول')}
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
