import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'


export default function Home() {
  const { t, lang, isDark } = useApp()
  const isAr = lang === 'ar'

  return (
    // Explicit background rather than relying on inherited transparency —
    // everything below the hero must commit to the page surface color so it
    // can never read as an unstyled dark gap between the hero and the cards.
    <div className="pt-14 pb-16 md:pb-0" style={{ background: 'var(--color-background)' }}>
      {/* Hero — items-start on mobile pulls the headline up close to the top
          of the viewport (with just enough clearance for the fixed navbar),
          instead of vertically centering it inside a huge splash section. */}
      <section className="relative min-h-[80vh] md:min-h-[92vh] flex items-start md:items-center overflow-hidden"
        style={{ background: isDark
          ? (isAr
              ? 'linear-gradient(255deg, #070d1a 0%, #0a1f24 35%, #155058 65%, #1d6b75 100%)'
              : 'linear-gradient(105deg, #070d1a 0%, #0a1f24 35%, #155058 65%, #1d6b75 100%)')
          : (isAr
              ? 'linear-gradient(255deg, #0a1a1c 0%, #0e2a2e 35%, #1a4a52 60%, #e8f8f8 100%)'
              : 'linear-gradient(105deg, #0a1a1c 0%, #0e2a2e 35%, #1a4a52 60%, #e8f8f8 100%)') }}>

        {/* Soft divider glow between dark and light zones */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 55% 80% at 68% 55%, rgba(240,255,255,0.18) 0%, transparent 65%)',
        }} />

        {/* Mustang — right side, sits on the light zone */}
        <img
          src="/hero-mustang.png"
          alt=""
          aria-hidden="true"
          className="absolute hidden md:block"
          style={{
            ...(isAr ? { left: '8%' } : { right: '8%' }),
            bottom: '6%',
            width: '75%',
            maxWidth: '1080px',
            filter: isDark
              ? `brightness(1.15) contrast(1.1) drop-shadow(${isAr ? '12px' : '-12px'} 0 50px rgba(116,245,255,0.25))`
              : `brightness(1.0) contrast(1.08) drop-shadow(${isAr ? '12px' : '-12px'} 0 40px rgba(21,80,88,0.5))`,
            mixBlendMode: 'normal',
            transform: isAr ? 'scaleX(-1)' : 'none',
            zIndex: 1,
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        />

        {/* Bottom fade into page bg — the hero's gradient runs at 105deg (nearly
            horizontal), so its dark stops persist across most of the width even
            near the bottom edge. A short vertical fade only masks that on the
            lighter (right) side; a taller fade with an early solid stop is
            needed to fully resolve to the page background across the full
            width before the section ends, or "Our Services" reads as sitting
            on a black block instead of the page's light surface. */}
        <div className="absolute bottom-0 left-0 right-0 h-48" style={{ zIndex: 2, background: 'linear-gradient(to bottom, transparent, var(--color-background) 75%)' }} />

        {/* Content */}
        <div className="relative w-full max-w-7xl mx-auto px-5 pt-20 pb-16 md:py-24" style={{ zIndex: 3 }}>
          <div className="max-w-xl space-y-5 animate-fade-in">

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight font-display">
              {t('Drive Clean.', 'اقد نظيفاً.')}<br />
              <span style={{ color: '#74f5ff' }}>{t('Drive Confident.', 'اقد بثقة.')}</span>
            </h1>

            <p className="text-white/70 text-base max-w-lg leading-relaxed">
              {t("Experience Khartoum's finest car wash. Professional care, loyalty rewards, and easy online booking.", "استمتع بأفضل خدمة غسيل سيارات في الخرطوم. عناية احترافية ومكافآت ولاء وحجز سهل.")}
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link to="/book" className="btn-primary text-sm px-8 py-3.5 rounded-xl flex items-center gap-2">
                {t('Book a Wash', 'احجز الآن')}
                <span className="material-symbols-outlined rtl-flip text-base">arrow_forward</span>
              </Link>
              <a href="#services" className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-white transition-all"
                style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                {t('Our Services', 'خدماتنا')}
              </a>
            </div>

            <div className="flex gap-8 pt-2">
              {[['500+', t('Happy Customers', 'عميل سعيد')], ['4.9★', t('Rating', 'التقييم')], ['2', t('Services', 'خدمات')]].map(([v, l]) => (
                <div key={l}>
                  <div className="text-2xl font-extrabold font-display" style={{ color: '#74f5ff' }}>{v}</div>
                  <div className="text-xs text-white/60">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-10 max-w-7xl mx-auto px-4 md:px-6">
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-on-surface font-display">{t('Our Services', 'خدماتنا')}</h2>
          <p className="text-on-surface-variant mt-2">{t('Professional care for every car.', 'عناية احترافية لكل سيارة.')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Full Wash */}
          <Link to="/book" state={{ service: 'full' }} className="glass rounded-3xl hover:border-secondary-fixed/40 transition-all group wet-shine flex flex-col overflow-hidden">
            <div className="w-full h-60 overflow-hidden relative">
              <img
                src="/full-wash.jpg"
                alt="Full Wash - interior and exterior cleaning"
                className="w-full h-full object-cover object-center transition-transform duration-500"
              />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.45) 100%)' }} />
              <span className="absolute bottom-3 left-4 text-white text-xs font-semibold opacity-90">Interior + Exterior</span>
            </div>
            <div className="p-8 flex flex-col flex-1">
            <div className="flex justify-between items-start mb-6">
              <span className="material-symbols-outlined fill-icon text-secondary-fixed text-4xl">local_car_wash</span>
              <span className="bg-secondary-fixed/10 text-secondary-fixed text-xs font-bold px-3 py-1 rounded-full border border-secondary-fixed/30">{t('Full Wash', 'غسيل كامل')}</span>
            </div>
            <h4 className="text-xl font-bold text-on-surface mb-3 font-display">{t('Full Wash', 'غسيل كامل')}</h4>
            <p className="text-on-surface-variant text-sm mb-6">{t('Complete interior and exterior cleaning. Vacuuming, dashboard wipe, window cleaning, exterior wash and rinse.', 'تنظيف كامل للداخل والخارج.')}</p>
            <ul className="space-y-2 text-sm text-on-surface-variant mb-6">
              {[t('Interior vacuuming', 'شفط داخلي'), t('Dashboard & console wipe', 'تلميع لوحة التحكم'), t('Full exterior wash', 'غسيل خارجي كامل'), t('Window & tire shine', 'تلميع الزجاج والإطارات')].map(item => (
                <li key={item} className="flex items-center gap-2">
                  <span className="material-symbols-outlined fill-icon text-secondary-fixed text-base">check_circle</span>
                  {item}
                </li>
              ))}
            </ul>
            <button className="btn-primary w-full py-3 rounded-xl mt-auto">{t('Book Full Wash', 'احجز غسيل كامل')}</button>
            </div>
          </Link>

          {/* Exterior Only */}
          <Link to="/book" state={{ service: 'outside' }} className="glass rounded-3xl hover:border-secondary-fixed/40 transition-all group wet-shine flex flex-col overflow-hidden">
            <div className="w-full h-60 overflow-hidden relative">
              <img
                src="/external-wash.jpg"
                alt="Exterior Wash, foam and water cleaning"
                className="w-full h-full object-cover object-center transition-transform duration-500"
              />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.45) 100%)' }} />
              <span className="absolute bottom-3 left-4 text-white text-xs font-semibold opacity-90">Exterior Cleaning</span>
            </div>
            <div className="p-8 flex flex-col flex-1">
            <div className="flex justify-between items-start mb-6">
              <span className="material-symbols-outlined text-secondary-fixed text-4xl">water_drop</span>
              <span className="bg-surface-container-highest/50 text-on-surface-variant text-xs font-bold px-3 py-1 rounded-full border border-outline-variant">{t('Exterior', 'خارجي')}</span>
            </div>
            <h4 className="text-xl font-bold text-on-surface mb-3 font-display">{t('Exterior Only', 'غسيل خارجي فقط')}</h4>
            <p className="text-on-surface-variant text-sm mb-6">{t('Quick and thorough exterior wash. Perfect for regular maintenance.', 'غسيل خارجي سريع وشامل.')}</p>
            <ul className="space-y-2 text-sm text-on-surface-variant mb-6">
              {[t('Exterior body wash', 'غسيل هيكل السيارة'), t('Rinse & dry', 'شطف وتجفيف'), t('Wheel & tire clean', 'تنظيف العجلات'), t('Window streak-free clean', 'تنظيف الزجاج')].map(item => (
                <li key={item} className="flex items-center gap-2">
                  <span className="material-symbols-outlined fill-icon text-secondary-fixed text-base">check_circle</span>
                  {item}
                </li>
              ))}
            </ul>
            <button className="btn-primary w-full py-3 rounded-xl mt-auto">{t('Book Exterior', 'احجز خارجي')}</button>
            </div>
          </Link>
        </div>

        {/* Loyalty teaser */}
        <div className="mt-6 glass p-6 rounded-3xl border border-secondary-fixed/20 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-secondary-fixed/10 p-3 rounded-xl border border-secondary-fixed/30">
              <span className="material-symbols-outlined fill-icon text-secondary-fixed text-3xl">loyalty</span>
            </div>
            <div>
              <h4 className="font-bold text-secondary-fixed font-display">{t('Loyalty Rewards', 'مكافآت الولاء')}</h4>
              <p className="text-on-surface-variant text-sm">{t('Wash 5 times, get the 6th wash FREE.', 'اغسل 5 مرات، واحصل على الغسلة السادسة مجاناً.')}</p>
            </div>
          </div>
          <Link to="/register" className="btn-primary px-6 py-3 rounded-xl whitespace-nowrap">
            {t('Join Now', 'انضم الآن')}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--color-outline-variant)', marginTop: '0' }}>
        {/* Top nav columns */}
        <div className="max-w-7xl mx-auto px-6 md:px-10 pt-14 pb-10 flex flex-col md:flex-row justify-between gap-10">
          {/* Brand blurb */}
          <div className="max-w-xs">
            <p className="text-xs font-bold uppercase tracking-wide text-secondary-fixed mb-3">{t('Rasha Car Wash', 'رشة لغسيل السيارات')}</p>
            <p className="text-on-surface-variant text-sm leading-relaxed">{t("Khartoum's premier car wash. Professional care, loyalty rewards, easy online booking.", 'أفضل غسيل سيارات في الخرطوم. عناية احترافية ومكافآت ولاء وحجز سهل.')}</p>
          </div>

          {/* Link columns */}
          <div className="flex gap-14 md:gap-20 text-sm flex-wrap">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-on-surface mb-4">{t('Services', 'الخدمات')}</p>
              <div className="flex flex-col gap-3 text-on-surface-variant">
                <Link to="/book" state={{ service: 'full' }} className="hover:text-secondary-fixed transition-colors">{t('Full Wash', 'غسيل كامل')}</Link>
                <Link to="/book" state={{ service: 'outside' }} className="hover:text-secondary-fixed transition-colors">{t('Exterior Only', 'خارجي فقط')}</Link>
                <Link to="/loyalty" className="hover:text-secondary-fixed transition-colors">{t('Loyalty Card', 'بطاقة الولاء')}</Link>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-on-surface mb-4">{t('Account', 'الحساب')}</p>
              <div className="flex flex-col gap-3 text-on-surface-variant">
                <Link to="/register" className="hover:text-secondary-fixed transition-colors">{t('Sign Up', 'إنشاء حساب')}</Link>
                <Link to="/login" className="hover:text-secondary-fixed transition-colors">{t('Sign In', 'تسجيل دخول')}</Link>
                <Link to="/contact" className="hover:text-secondary-fixed transition-colors">{t('Contact Support', 'الدعم')}</Link>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-on-surface mb-4">{t('Legal', 'قانوني')}</p>
              <div className="flex flex-col gap-3 text-on-surface-variant">
                <Link to="/privacy" className="hover:text-secondary-fixed transition-colors">{t('Privacy Policy', 'الخصوصية')}</Link>
                <Link to="/terms" className="hover:text-secondary-fixed transition-colors">{t('Terms of Service', 'الشروط')}</Link>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'var(--color-outline-variant)', opacity: 0.3, margin: '0 24px' }} />

        {/* Massive brand name */}
        <div className="px-4 md:px-6 pt-6 pb-2 overflow-hidden select-none flex justify-center">
          <p
            className="font-display font-black leading-none text-secondary-fixed"
            style={{
              fontSize: 'clamp(72px, 22vw, 220px)',
              letterSpacing: '-0.03em',
              opacity: 0.92,
            }}>
            RASHA
          </p>
        </div>

        {/* Bottom bar */}
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-5 flex flex-col sm:flex-row items-center justify-between gap-2"
          style={{ borderTop: '1px solid var(--color-outline-variant)', opacity: 0.8 }}>
          <span className="text-xs text-on-surface-variant">© 2025 Rasha Car Wash. {t('All rights reserved.', 'جميع الحقوق محفوظة.')}</span>
          <span className="text-xs text-on-surface-variant">{t('Khartoum, Sudan', 'الخرطوم، السودان')}</span>
        </div>
      </footer>
    </div>
  )
}
