import { Link, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useEffect, useState, useRef } from 'react'

const HIDDEN_PAGES = ['/staff', '/confirmation', '/reset-password', '/forgot-password']

export default function MobileNav() {
  const { pathname, state } = useLocation()
  const { t, customer, isDark, toggleTheme } = useApp()

  const navRef  = useRef(null)
  const tabRefs = useRef([])
  const glareRef = useRef(null)
  const [pillStyle, setPillStyle] = useState({ left: 0, top: 0, width: 0, height: 0, opacity: 0 })

  // Compact mode: the bar draws itself smaller so it takes less of the screen
  // while reading, and returns to full size the moment it's wanted again.
  const [compact, setCompact] = useState(false)
  const idleTimer = useRef(null)
  const lastY = useRef(0)
  // The pill eases only when the active tab actually changes. See the effect
  // below for why it must not ease during a resize.
  const [pillEased, setPillEased] = useState(false)

  // NOTE: no early return above this point. Every hook below must run on every
  // render, otherwise React sees a different hook count when this component
  // hides itself on /forgot-password, /confirmation etc. and throws, blanking
  // the whole tree until a refresh. The visibility check happens at render time
  // (see `hidden` below), never by bailing out early.
  const hidden = HIDDEN_PAGES.some(p => pathname.startsWith(p))

  const avatarUrl = customer?.avatar_url || null

  const guestItems = [
    { to: '/',      icon: 'home',                   label: t('Home', 'الرئيسية') },
    { to: '/book',  icon: 'local_car_wash',         label: t('Book', 'احجز') },
    { to: '/login', icon: 'person',                 label: t('Profile', 'حسابي') },
  ]
  const loggedInItems = [
    { to: '/book',    icon: 'local_car_wash',         label: t('Book', 'احجز') },
    { to: '/loyalty', icon: 'person',                 label: t('Profile', 'حسابي'), avatar: avatarUrl },
    { to: '/wallet',  icon: 'account_balance_wallet', label: t('Wallet', 'محفظتي') },
  ]
  const items = customer ? loggedInItems : guestItems
  const activeIdx = items.findIndex(i => i.to === pathname || i.to === state?.returnTo)

  // Keep the pill locked to the active tab.
  //
  // Labels expand/collapse when the active tab changes, so a single measurement
  // taken during that transition captures mid-animation geometry and freezes
  // there. Sample every frame until the transition settles, then re-sample on
  // any later layout change.
  useEffect(() => {
    if (hidden) return
    const nav = navRef.current
    if (!nav) return

    let rafId = 0
    let stopAt = 0

    const measure = () => {
      const tab = tabRefs.current[activeIdx]
      if (!tab) { setPillStyle(p => (p.opacity === 0 ? p : { ...p, opacity: 0 })); return }
      const nr = nav.getBoundingClientRect()
      const tr = tab.getBoundingClientRect()
      const next = {
        left: tr.left - nr.left,
        top: tr.top - nr.top,
        width: tr.width,
        height: tr.height,
        opacity: 1,
      }
      setPillStyle(p =>
        (Math.abs(p.left - next.left) < 0.5 &&
         Math.abs(p.top - next.top) < 0.5 &&
         Math.abs(p.width - next.width) < 0.5 &&
         Math.abs(p.height - next.height) < 0.5 &&
         p.opacity === next.opacity) ? p : next
      )
    }

    const loop = () => {
      measure()
      if (performance.now() < stopAt) rafId = requestAnimationFrame(loop)
    }
    const track = (ms = 450) => {
      stopAt = performance.now() + ms
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(loop)
    }

    track()

    const ro = new ResizeObserver(() => track(200))
    ro.observe(nav)
    tabRefs.current.forEach(el => el && ro.observe(el))

    // Label widths shift once the icon/text fonts finish loading.
    if (document.fonts?.ready) document.fonts.ready.then(() => track(200)).catch(() => {})

    const onResize = () => track(200)
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
      window.removeEventListener('resize', onResize)
    }
  }, [activeIdx, items.length, hidden])

  // Shrink while scrolling down or after a second of stillness; return to full
  // size on any touch or upward scroll.
  //
  // Size is changed through padding and font-size, not transform: scale. The
  // sliding pill is positioned from getBoundingClientRect offsets measured
  // inside this same element, and a scaled parent would have the pill's own
  // coordinates scaled a second time, throwing it off the active tab. Real
  // layout changes keep those measurements honest, and the ResizeObserver
  // above already re-runs them.
  useEffect(() => {
    if (hidden) return

    const goCompact = () => setCompact(true)

    const wake = () => {
      setCompact(false)
      clearTimeout(idleTimer.current)
      idleTimer.current = setTimeout(goCompact, 1000)
    }

    const onScroll = () => {
      const y = Math.max(0, window.scrollY)
      const delta = y - lastY.current
      if (Math.abs(delta) < 6) return   // ignore jitter / rubber-band
      lastY.current = y
      if (delta > 0) {
        clearTimeout(idleTimer.current)
        goCompact()
      } else {
        wake()
      }
    }

    lastY.current = Math.max(0, window.scrollY)
    wake() // start full size, then let the idle timer shrink it

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('touchstart', wake, { passive: true })
    window.addEventListener('pointerdown', wake, { passive: true })

    return () => {
      clearTimeout(idleTimer.current)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('touchstart', wake)
      window.removeEventListener('pointerdown', wake)
    }
  }, [hidden])

  // Ease the pill only while it is travelling to a newly selected tab.
  //
  // Two things move it, and they want opposite behaviour. A tab change should
  // glide. A resize should not: compacting animates the bar's padding over
  // 250ms and the ResizeObserver re-measures every frame of that, so an eased
  // pill spends the whole animation chasing a value that has already moved and
  // visibly slides sideways.
  //
  // Keying this on activeIdx rather than on the resize is what makes both
  // work. Tapping a tab also wakes the bar out of compact, so a flag keyed on
  // the resize would switch easing OFF at exactly the moment the pill was
  // meant to travel — it jumped straight to the new tab instead of sliding.
  useEffect(() => {
    if (activeIdx < 0) return
    setPillEased(true)
    const id = setTimeout(() => setPillEased(false), 460) // slide 420ms + margin
    return () => clearTimeout(id)
  }, [activeIdx])

  // Specular highlight follows the finger. Written straight to the node so a
  // touchmove never triggers a React render.
  useEffect(() => {
    if (hidden) return
    const nav = navRef.current
    const glare = glareRef.current
    if (!nav || !glare) return

    const move = (clientX) => {
      const r = nav.getBoundingClientRect()
      glare.style.transform = `translateX(${clientX - r.left}px)`
      glare.style.opacity = '1'
    }
    const onPointer = e => move(e.clientX)
    const onTouch = e => { if (e.touches[0]) move(e.touches[0].clientX) }
    const leave = () => { glare.style.opacity = '0' }

    nav.addEventListener('pointermove', onPointer)
    nav.addEventListener('pointerleave', leave)
    nav.addEventListener('touchmove', onTouch, { passive: true })
    nav.addEventListener('touchend', leave)

    return () => {
      nav.removeEventListener('pointermove', onPointer)
      nav.removeEventListener('pointerleave', leave)
      nav.removeEventListener('touchmove', onTouch)
      nav.removeEventListener('touchend', leave)
    }
  }, [hidden])

  if (hidden) return null

  // White in both themes. The pill is close to fully transparent, so the
  // shadow is doing the legibility work — without it white labels wash out
  // wherever the bar happens to sit over a light patch of the page.
  // Glyphs invert with the theme so they always contrast the bar behind them:
  // dark on the light glass, white on the smoked glass.
  const activeColor   = isDark ? '#ffffff' : '#0e383e'
  const inactiveColor = isDark ? 'rgba(255,255,255,0.72)' : 'rgba(14,56,62,0.62)'
  // Only the white glyphs need a halo — the pill is near-transparent, so in
  // dark mode they can land on a bright patch of the page behind it. Dark
  // glyphs on light glass already have contrast and a shadow just muddies them.
  const glyphShadow = isDark
    ? '0 0 1px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.45)'
    : 'none'

  return (
    <div className="md:hidden fixed bottom-5 left-0 right-0 z-20 flex justify-center px-3 pointer-events-none">
      <nav ref={navRef}
        className="liquid-nav pointer-events-auto"
        style={{
          padding: compact ? '3px' : '6px',
          transition: 'padding 0.25s cubic-bezier(0.4,0,0.2,1)',
        }}>

        {/* Specular glare layer */}
        <div className="liquid-layer">
          <div ref={glareRef} className="liquid-glare" />
        </div>

        {/* Sliding highlight behind the active tab */}
        {activeIdx >= 0 && pillStyle.width > 0 && (
          <div className="liquid-pill" style={{
            left: pillStyle.left,
            top: pillStyle.top,
            width: pillStyle.width,
            height: pillStyle.height,
            opacity: pillStyle.opacity,
            transition: pillEased
              ? 'left 0.42s cubic-bezier(0.34,1.15,0.64,1), width 0.42s cubic-bezier(0.34,1.15,0.64,1), opacity 0.2s ease'
              : 'opacity 0.2s ease',
          }} />
        )}

        {items.map((item, idx) => {
          const isActive = pathname === item.to
          return (
            <Link key={item.to} to={item.to}
              ref={el => tabRefs.current[idx] = el}
              aria-current={isActive ? 'page' : undefined}
              className="relative z-10 flex items-center justify-center gap-1.5 rounded-full"
              style={{
                padding: compact ? '5px 9px' : '8px 12px',
                textDecoration: 'none',
                transition: 'padding 0.25s cubic-bezier(0.4,0,0.2,1)',
              }}>
              {item.avatar ? (
                <img src={item.avatar} alt="" style={{
                  width: compact ? '17px' : '20px', height: compact ? '17px' : '20px',
                  borderRadius: '50%', objectFit: 'cover',
                  border: isActive ? `2px solid ${activeColor}` : '2px solid transparent',
                  flexShrink: 0,
                  transition: 'border-color 0.3s ease, width 0.25s ease, height 0.25s ease',
                }} />
              ) : (
                <span className="material-symbols-outlined" style={{
                  fontSize: compact ? '17px' : '20px',
                  lineHeight: 1,
                  color: isActive ? activeColor : inactiveColor,
                  textShadow: glyphShadow,
                  fontVariationSettings: isActive ? "'FILL' 1, 'wght' 500" : "'FILL' 0, 'wght' 400",
                  transition: 'color 0.3s ease, font-size 0.25s ease',
                  flexShrink: 0,
                }}>{item.icon}</span>
              )}

              {/* Labels always visible so users can read every tab. */}
              <span style={{
                fontSize: compact ? '11px' : '12px',
                fontWeight: 700,
                color: isActive ? activeColor : inactiveColor,
                textShadow: glyphShadow,
                whiteSpace: 'nowrap',
                transition: 'color 0.3s ease, font-size 0.25s ease',
              }}>{item.label}</span>
            </Link>
          )
        })}

        <div className="liquid-divider" />

        {/* Theme toggle — moved here from the top bar */}
        <button
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="relative z-10 flex items-center justify-center rounded-full"
          style={{
            width: '38px', height: '38px', flexShrink: 0,
            background: 'transparent', border: 'none', cursor: 'pointer',
          }}>
          <span className="material-symbols-outlined" style={{
            fontSize: '21px',
            lineHeight: 1,
            color: activeColor,
            textShadow: glyphShadow,
            transition: 'transform 0.4s cubic-bezier(0.34,1.15,0.64,1)',
            transform: isDark ? 'rotate(-40deg)' : 'rotate(0deg)',
          }}>{isDark ? 'dark_mode' : 'light_mode'}</span>
        </button>
      </nav>
    </div>
  )
}
