import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import ThemeToggle from './ThemeToggle'
import { useEffect, useState, useRef } from 'react'

function DesktopNavPill({ pathname, customer, t, lang }) {
  const { state } = useLocation()
  const tabRefs = useRef([])
  const containerRef = useRef(null)
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0, opacity: 0 })

  const navItems = [
    ...(!customer ? [{ to: '/', label: t('Home', 'الرئيسية') }] : []),
    { to: '/book', label: t('Book a Wash', 'احجز غسيل') },
    ...(customer ? [
      { to: '/loyalty', label: t('My Card', 'بطاقتي') },
      { to: '/wallet', label: t('Wallet', 'المحفظة') },
    ] : []),
    { to: '/contact', label: t('Support', 'الدعم') },
  ]

  const activeIdx = navItems.findIndex(item => item.to === pathname || item.to === state?.returnTo)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const update = () => {
      const tab = tabRefs.current[activeIdx]
      if (!tab) { setPillStyle(p => (p.opacity === 0 ? p : { ...p, opacity: 0 })); return }
      const cRect = container.getBoundingClientRect()
      const tRect = tab.getBoundingClientRect()
      // left offset from the container's physical left edge — correct in both
      // LTR and RTL, as long as it's measured after the layout has settled.
      setPillStyle({ left: tRect.left - cRect.left, width: tRect.width, height: tRect.height, opacity: 1 })
    }
    // Measure now and again next frame, after an RTL flip / label-width change
    // has reflowed. lang is in the deps so a language switch re-runs this.
    update()
    const raf = requestAnimationFrame(update)
    const ro = new ResizeObserver(update)
    ro.observe(container)
    tabRefs.current.forEach(el => el && ro.observe(el))
    if (document.fonts?.ready) document.fonts.ready.then(update).catch(() => {})
    window.addEventListener('resize', update)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [activeIdx, pathname, lang, customer])

  return (
    <div ref={containerRef} className="relative flex items-center gap-0.5">
      {/* Sliding pill */}
      {activeIdx >= 0 && (
        <div style={{
          position: 'absolute',
          left: pillStyle.left,
          width: pillStyle.width,
          height: pillStyle.height || 36,
          borderRadius: '9999px',
          background: 'rgba(var(--color-secondary-fixed-rgb), 0.12)',
          border: '1px solid rgba(var(--color-secondary-fixed-rgb), 0.2)',
          opacity: pillStyle.opacity,
          transition: 'left 0.4s cubic-bezier(0.34,1.2,0.64,1), width 0.4s cubic-bezier(0.34,1.2,0.64,1), opacity 0.2s ease',
          pointerEvents: 'none',
          zIndex: 0,
        }} />
      )}
      {navItems.map((item, idx) => {
        const isActive = pathname === item.to
        return (
          <Link key={item.to} to={item.to}
            ref={el => tabRefs.current[idx] = el}
            className="relative z-10 px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-200"
            style={{ color: isActive ? 'var(--color-secondary-fixed)' : 'var(--color-on-surface-variant)', whiteSpace: 'nowrap' }}>
            {item.label}
          </Link>
        )
      })}
    </div>
  )
}

export default function Navbar() {
  const { lang, toggleLang, t, customer, logout, isDark } = useApp()
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
    <nav className="fixed top-0 w-full z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'var(--navbar-bg)' : 'transparent',
        backdropFilter: scrolled ? 'blur(24px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(24px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--glass-border)' : 'none',
        boxShadow: scrolled ? 'var(--glass-shadow-card)' : 'none',
      }}>
      <div className="max-w-7xl mx-auto flex justify-between items-center h-14 px-4 md:px-6">
        {/* Logo */}
        <Link to="/" className="font-display font-extrabold text-xl tracking-tight text-secondary-fixed">
          Rasha
        </Link>

        {/* Desktop nav — sliding pill */}
        <div className="hidden md:flex items-center relative p-1 rounded-full gap-0.5"
          style={{background: scrolled ? 'rgba(128,128,128,0.08)' : 'transparent', transition: 'background 0.3s'}}>
          {/* Sliding pill background */}
          <DesktopNavPill pathname={location.pathname} customer={customer} t={t} lang={lang} />
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {/* Desktop only — on mobile the theme toggle lives in the bottom nav. */}
          <span className="hidden md:inline-flex">
            <ThemeToggle />
          </span>
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
                {customer.avatar_url
                  ? <img src={customer.avatar_url} alt="avatar" className="w-6 h-6 rounded-full object-cover" />
                  : <span className="material-symbols-outlined fill-icon text-sm">account_circle</span>
                }
                <span>{customer.first_name}</span>
                <span className="material-symbols-outlined" style={{fontSize:'14px', transition:'transform 0.2s', transform: menuOpen ? 'rotate(180deg)' : 'rotate(0deg)'}}>expand_more</span>
              </button>
              {menuOpen && (
                <div className="glass-popup absolute end-0 mt-2 w-48 rounded-2xl py-2 animate-fade-in z-50">
                  <div className="px-4 py-2 border-b" style={{borderColor: 'var(--color-outline-variant)'}}>
                    <p className="text-xs font-bold text-on-surface">{customer.first_name} {customer.last_name}</p>
                    <p className="text-xs text-on-surface-variant truncate">{customer.email}</p>
                  </div>
                  <Link to="/settings" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-on-surface hover:text-secondary-fixed transition-colors w-full">
                    <span className="material-symbols-outlined text-base">settings</span>
                    {t('Settings', 'الإعدادات')}
                  </Link>
                  <Link to="/contact" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-on-surface hover:text-secondary-fixed transition-colors w-full">
                    <span className="material-symbols-outlined text-base">support_agent</span>
                    {t('Support', 'الدعم')}
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
