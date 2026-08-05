import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function Wallet() {
  const { t, customer } = useApp()
  const [showAddCard, setShowAddCard] = useState(false)

  // One-time cleanup: purge card data saved by earlier builds
  // (raw card details must never be stored client-side).
  useEffect(() => { try { localStorage.removeItem('rasha_saved_card') } catch {} }, [])

  if (!customer) return null

  const balance = customer.wallet_balance || 0


  const navItems = [
    { id: 'profile', icon: 'person', label: t('Profile', 'الملف الشخصي'), href: '/settings' },
    { id: 'membership', icon: 'loyalty', label: t('Membership', 'العضوية'), href: '/loyalty' },
    { id: 'wallet', icon: 'account_balance_wallet', label: t('Wallet', 'المحفظة'), href: '/wallet' },
  ]

  const card = { background: 'var(--color-surface-container-low)', border: '1px solid var(--color-outline-variant)', boxShadow: '0 4px 24px rgba(0,86,179,0.06)', borderRadius: '1rem' }

  return (
    <div className="pt-14 min-h-screen pb-24 md:pb-0" style={{ background: 'var(--color-background)' }}>
      <div className="flex max-w-7xl mx-auto">

        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-56 shrink-0 min-h-[calc(100vh-56px)] py-8 px-4"
          style={{ borderRight: '1px solid var(--color-outline-variant)' }}>
          <div className="mb-8 px-4">
            <p className="text-base font-bold text-secondary-fixed font-display">{t('Rasha Member Portal', 'بوابة رشة')}</p>
            <p className="text-xs text-on-surface-variant mt-0.5">{t('Premium Hydro Care', 'رعاية هيدرو متميزة')}</p>
          </div>
          <nav className="space-y-1 flex-1">
            {navItems.map(item => {
              const active = item.id === 'wallet'
              return (
                <Link key={item.id} to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${active ? 'text-secondary-fixed' : 'text-on-surface-variant hover:text-on-surface'}`}
                  style={active ? { background: 'rgba(var(--color-secondary-fixed-rgb),0.08)', border: '1px solid rgba(var(--color-secondary-fixed-rgb),0.15)' } : {}}>
                  <span className={`material-symbols-outlined text-xl ${active ? 'fill-icon' : ''}`}>{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <Link to="/book"
            className="flex items-center gap-2 mx-4 mb-4 py-3 px-4 rounded-xl text-sm font-bold text-white justify-center hydro-gradient hover:opacity-90">
            <span className="material-symbols-outlined text-base">local_car_wash</span>
            {t('Book Wash', 'احجز غسيل')}
          </Link>
          <Link to="/contact" className="flex items-center gap-2 px-4 py-3 text-on-surface-variant hover:text-secondary-fixed text-sm font-semibold">
            <span className="material-symbols-outlined text-xl">help</span>
            {t('Help?', 'مساعدة؟')}
          </Link>
        </aside>

        {/* Main */}
        <main className="flex-1 px-4 md:px-10 py-8 pb-28 md:pb-10 space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant mb-1">
            <Link to="/loyalty" className="hover:text-secondary-fixed">{t('Dashboard', 'لوحة التحكم')}</Link>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
            <span className="text-on-surface font-semibold">{t('Wallet', 'المحفظة')}</span>
          </div>
          <h1 className="text-3xl font-bold text-on-surface font-display">{t('My Wallet', 'محفظتي')}</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left column */}
            <div className="lg:col-span-2 space-y-5">

              {/* Balance Card */}
              <div className="rounded-2xl p-7" style={{ background: 'linear-gradient(135deg, #0056b3 0%, #003f87 100%)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-white/60 text-base">database</span>
                  <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">{t('Available Balance', 'الرصيد المتاح')}</p>
                </div>
                <p className="text-white font-display font-bold mb-5" style={{ fontSize: 'clamp(32px,5vw,48px)' }}>
                  {balance.toLocaleString('en')}<span className="text-xl font-semibold text-white/70 ms-2">SDG</span>
                </p>
                <div className="flex flex-wrap gap-3">
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white" style={{ background: 'rgba(255,255,255,0.15)' }}>
                    <span className="material-symbols-outlined text-white/70" style={{ fontSize: '14px' }}>badge</span>
                    <span dir="ltr">{customer.customer_uid}</span>
                  </span>
                </div>
              </div>

              {/* Transaction History */}
              <div style={card} className="overflow-hidden">
                <div className="px-6 py-5" style={{ borderBottom: '1px solid var(--color-outline-variant)' }}>
                  <h3 className="text-lg font-bold text-on-surface font-display">{t('Transaction History', 'سجل المعاملات')}</h3>
                  <p className="text-xs text-on-surface-variant">{t('Track your recent top ups and wash payments', 'تتبع شحناتك الأخيرة ومدفوعات الغسيل')}</p>
                </div>
                <div className="px-6 py-12 flex flex-col items-center justify-center gap-3 text-center">
                  <span className="material-symbols-outlined text-on-surface-variant text-5xl">receipt_long</span>
                  <p className="font-semibold text-on-surface">{t('No transactions yet', 'لا توجد معاملات بعد')}</p>
                  <p className="text-xs text-on-surface-variant max-w-xs">{t('Your top ups and wash payments will appear here once you start using your wallet.', 'ستظهر هنا شحناتك ومدفوعات الغسيل بمجرد بدء استخدام محفظتك.')}</p>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-5">

              {/* Member Perk */}
              <div style={card} className="p-5">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-secondary-fixed text-2xl shrink-0">star</span>
                  <div>
                    <p className="text-sm font-bold text-secondary-fixed">{t('Member Perk!', 'مزايا العضو!')}</p>
                    <p className="text-sm text-on-surface-variant mt-1">{t('Pay from your Rasha Wallet when booking to save 5% on every wash.', 'ادفع من محفظة رشة عند الحجز لتوفير 5% على كل غسيل.')}</p>
                  </div>
                </div>
              </div>

              {/* How to Top Up — mirrors the in-branch instructions shown in the
                  Top Up Methods dialog. Online payments are not live yet. */}
              <div style={card} className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary-fixed text-xl">lock</span>
                  <p className="text-sm font-bold text-on-surface">{t('How to Top Up', 'كيفية الشحن')}</p>
                </div>

                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {t('Online payments are being connected to a licensed payment provider. Until then, you can top up in person and our staff will credit your wallet instantly.',
                     'يتم حالياً ربط المدفوعات الإلكترونية بمزود دفع مرخص. حتى ذلك الحين يمكنك الشحن في الفرع وسيقوم الموظف بإضافة الرصيد فوراً.')}
                </p>

                <div className="space-y-2">
                  {[
                    t('Visit Rasha Car Wash, Khartoum', 'قم بزيارة رشة لغسيل السيارات، الخرطوم'),
                    t('Give the staff your Member ID', 'أعطِ الموظف رقم العضوية الخاص بك'),
                    t('Your balance updates immediately', 'يتم تحديث رصيدك فوراً'),
                  ].map((line, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-secondary-fixed"
                        style={{ background: 'rgba(var(--color-secondary-fixed-rgb),0.1)' }}>{i + 1}</span>
                      <span className="text-xs text-on-surface-variant">{line}</span>
                    </div>
                  ))}
                </div>

                {customer?.customer_uid && (
                  <div className="pt-3" style={{ borderTop: '1px solid var(--color-outline-variant)' }}>
                    <p className="text-xs text-on-surface-variant">{t('Your Member ID', 'رقم عضويتك')}</p>
                    <p className="text-sm font-bold text-secondary-fixed mt-0.5" dir="ltr">{customer.customer_uid}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
      {/* Payment Method Popup — no raw card data is ever collected or stored.
          Card capture must happen on the payment provider's hosted page (PCI-DSS). */}
      {showAddCard && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6 animate-fade-in" style={{ background: 'var(--color-surface-container)', border: '1px solid var(--color-outline-variant)' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-on-surface font-display">{t('Top Up Methods', 'طرق الشحن')}</h3>
              <button onClick={() => setShowAddCard(false)}>
                <span className="material-symbols-outlined text-on-surface-variant">close</span>
              </button>
            </div>

            <div className="flex flex-col items-center text-center gap-3 mb-5">
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,86,179,0.08)' }}>
                <span className="material-symbols-outlined text-secondary-fixed text-3xl">lock</span>
              </div>
              <p className="text-sm text-on-surface-variant">
                {t('Online payments are being connected to a licensed payment provider. Until then, you can top up in person and our staff will credit your wallet instantly.',
                   'يتم حالياً ربط المدفوعات الإلكترونية بمزود دفع مرخص. حتى ذلك الحين يمكنك الشحن في الفرع وسيقوم الموظف بإضافة الرصيد فوراً.')}
              </p>
            </div>

            <div className="rounded-xl p-4 mb-5 space-y-2" style={{ background: 'var(--input-bg)', border: '1px solid var(--color-outline-variant)' }}>
              <p className="text-xs font-bold text-on-surface uppercase tracking-wider">{t('How to top up now', 'كيفية الشحن الآن')}</p>
              {[
                t('Visit Rasha Car Wash, Khartoum', 'قم بزيارة رشة لغسيل السيارات، الخرطوم'),
                t('Give the staff your Member ID', 'أعطِ الموظف رقم العضوية الخاص بك'),
                t('Your balance updates immediately', 'يتم تحديث رصيدك فوراً'),
              ].map((line, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-xs font-bold text-secondary-fixed shrink-0">{i + 1}.</span>
                  <span className="text-xs text-on-surface-variant">{line}</span>
                </div>
              ))}
              {customer?.customer_uid && (
                <div className="pt-2 mt-1" style={{ borderTop: '1px solid var(--color-outline-variant)' }}>
                  <span className="text-xs text-on-surface-variant">{t('Your Member ID:', 'رقم عضويتك:')} </span>
                  <span className="text-xs font-bold text-secondary-fixed" dir="ltr">{customer.customer_uid}</span>
                </div>
              )}
            </div>

            <button onClick={() => setShowAddCard(false)}
              className="w-full py-3 rounded-xl text-sm font-bold hydro-gradient text-white hover:opacity-90">
              {t('Got it', 'حسناً')}
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
