import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'

const CarScene = lazy(() => import('../components/CarScene'))


export default function Home() {
  const { t } = useApp()

  return (
    <div className="pt-14 pb-16 md:pb-0">
      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-5 w-full py-8 md:py-16">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="max-w-2xl space-y-4 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container/10 border border-secondary-fixed/25 text-secondary-fixed">
                <span className="material-symbols-outlined fill-icon text-sm">auto_awesome</span>
                <span className="text-xs font-bold uppercase tracking-widest">{t("Sudan's Premier Car Wash", 'أفضل غسيل سيارات في السودان')}</span>
              </div>
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-on-surface leading-snug font-display">
                {t('The Ultimate', 'النظافة')}{' '}
                <span className="text-secondary-fixed">{t('Clean Shine', 'المثالية')}</span>
                <br />{t('For Your Car.', 'لسيارتك.')}
              </h1>
              <p className="text-on-surface-variant text-sm max-w-md leading-relaxed">
                {t("Experience Khartoum's finest car wash. Professional care, loyalty rewards, and easy online booking.", "استمتع بأفضل خدمة غسيل سيارات في الخرطوم. عناية احترافية ومكافآت ولاء وحجز سهل.")}
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                <a href="#services" className="btn-primary text-sm px-6 py-3 rounded-xl">
                  {t('Our Services', 'خدماتنا')}
                </a>
                <Link to="/register" className="btn-cyan text-sm px-6 py-3 rounded-xl">
                  {t('Join Now', 'انضم الآن')}
                </Link>
              </div>
              <div className="flex gap-6 pt-1">
                {[['500+', t('Customers', 'عميل')], ['4.9★', t('Rating', 'التقييم')], ['2', t('Services', 'خدمات')]].map(([v, l]) => (
                  <div key={l}>
                    <div className="text-xl font-extrabold text-secondary-fixed font-display">{v}</div>
                    <div className="text-xs text-on-surface-variant">{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3D Car */}
            <div className="hidden md:block relative animate-fade-in" style={{ height: '420px' }}>
              <Suspense fallback={
                <div className="w-full h-full flex items-center justify-center">
                  <div className="loader" />
                </div>
              }>
                <CarScene />
              </Suspense>
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
          <Link to="/book" state={{ service: 'full' }} className="glass rounded-3xl hover:border-secondary-fixed/40 transition-all group wet-shine block overflow-hidden">
            <div className="w-full h-48 overflow-hidden">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA_jO7XyleM3iFOJrmDPs2teXvHDS9Zltt9DAehpgjFuvenenm7_ZWWUVfjcxgzWEOR5_1fj8_qf-ejH6VFl1yIad2gT9SlKrancMX0ljwpuS2eriaJuiz-ArC-rF8n9u6wt9FQNAfe2_IFqGWUbftS46A1tcHBV_kFcfdawKdDG4Q6MvjGc_Vjq4tMNSDaPJt1tuJNctg-Srx-9dGI9LCCoMMlZHKT-7GhI5FEzTwXbEe83XoHdeQ"
                alt="Full Wash"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-8">
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
            <button className="btn-primary w-full py-3 rounded-xl">{t('Book Full Wash', 'احجز غسيل كامل')}</button>
            </div>
          </Link>

          {/* Exterior Only */}
          <Link to="/book" state={{ service: 'outside' }} className="glass rounded-3xl hover:border-secondary-fixed/40 transition-all group wet-shine block overflow-hidden">
            <div className="w-full h-48 overflow-hidden">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD3pxjVHrXFtPlLv-RGq2Sef4rqM7Lh9Gpg_QLgV5NmIcIUqSEIpyBCEPeTmX3QVoXBIiAFv8oTi80VayMXsEr35Uk73tEhu7BFNiw3vZKQfbHBQmqLyFsoUwYR085I6QQXWCETFVq3o64WaLpLxKF_nkEmheTk7wnNU9jVIpRcx1Bs_Hz90N0kHmwitil4WWI8E3WpMqLsn6BS9F-U4MAn0IBwEcSj60mMcXrTF7ROJ0gSk5a_vSA"
                alt="Exterior Wash"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-8">
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
            <button className="btn-cyan w-full py-3 rounded-xl">{t('Book Exterior', 'احجز خارجي')}</button>
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
            <p className="text-xs font-bold uppercase tracking-widest text-secondary-fixed mb-3">{t('Rasha Car Wash', 'رشة لغسيل السيارات')}</p>
            <p className="text-on-surface-variant text-sm leading-relaxed">{t("Khartoum's premier car wash. Professional care, loyalty rewards, easy online booking.", 'أفضل غسيل سيارات في الخرطوم. عناية احترافية ومكافآت ولاء وحجز سهل.')}</p>
          </div>

          {/* Link columns */}
          <div className="flex gap-14 md:gap-20 text-sm flex-wrap">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-on-surface mb-4">{t('Services', 'الخدمات')}</p>
              <div className="flex flex-col gap-3 text-on-surface-variant">
                <Link to="/book" state={{ service: 'full' }} className="hover:text-secondary-fixed transition-colors">{t('Full Wash', 'غسيل كامل')}</Link>
                <Link to="/book" state={{ service: 'outside' }} className="hover:text-secondary-fixed transition-colors">{t('Exterior Only', 'خارجي فقط')}</Link>
                <Link to="/loyalty" className="hover:text-secondary-fixed transition-colors">{t('Loyalty Card', 'بطاقة الولاء')}</Link>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-on-surface mb-4">{t('Account', 'الحساب')}</p>
              <div className="flex flex-col gap-3 text-on-surface-variant">
                <Link to="/register" className="hover:text-secondary-fixed transition-colors">{t('Sign Up', 'إنشاء حساب')}</Link>
                <Link to="/login" className="hover:text-secondary-fixed transition-colors">{t('Sign In', 'تسجيل دخول')}</Link>
                <Link to="/contact" className="hover:text-secondary-fixed transition-colors">{t('Contact Support', 'الدعم')}</Link>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-on-surface mb-4">{t('Legal', 'قانوني')}</p>
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
        <div className="px-4 md:px-6 pt-6 pb-2 overflow-hidden select-none">
          <p
            className="font-display font-black leading-none text-secondary-fixed w-full text-center"
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
