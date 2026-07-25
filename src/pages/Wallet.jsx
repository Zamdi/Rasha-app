import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp, API } from '../context/AppContext'

const QUICK_AMOUNTS = [5000, 10000, 20000]

export default function Wallet() {
  const { t, customer, token, lang } = useApp()
  const [customAmount, setCustomAmount] = useState('')
  const [selected, setSelected] = useState(10000)
  const [topUpLoading, setTopUpLoading] = useState(false)

  if (!customer) return null

  const balance = customer.wallet_balance || 0
  const transactions = [
    { date: '2024-10-24', time: '14:22', icon: 'add_circle', iconColor: '#22c55e', title: t('Wallet Top-up', 'شحن المحفظة'), sub: t('Via MBOK Bank', 'عبر بنك MBOK'), status: 'completed', amount: '+15,000', positive: true },
    { date: '2024-10-21', time: '09:10', icon: 'local_car_wash', iconColor: '#0056b3', title: t('Full Wash Payment', 'دفع غسيل كامل'), sub: '', status: 'completed', amount: '-8,500', positive: false },
    { date: '2024-10-19', time: '18:45', icon: 'auto_detailing', iconColor: '#f59e0b', title: t('Exterior Wash', 'غسيل خارجي'), sub: '', status: 'pending', amount: '-5,000', positive: false },
  ]

  const spendingDays = ['MON','TUE','WED','THU','FRI','SAT','SUN']
  const spendingData = [30, 60, 20, 45, 15, 80, 55]

  const navItems = [
    { id: 'profile', icon: 'person', label: t('Profile', 'الملف الشخصي'), href: '/settings' },
    { id: 'membership', icon: 'loyalty', label: t('Membership', 'العضوية'), href: '/loyalty' },
    { id: 'wallet', icon: 'account_balance_wallet', label: t('Wallet', 'المحفظة'), href: '/wallet' },
  ]

  const card = { background: 'var(--color-surface-container-low)', border: '1px solid var(--color-outline-variant)', boxShadow: '0 4px 24px rgba(0,86,179,0.06)', borderRadius: '1rem' }

  return (
    <div className="pt-14 min-h-screen" style={{ background: 'var(--color-background)' }}>
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
                    <span className="material-symbols-outlined text-white/70" style={{ fontSize: '14px' }}>schedule</span>
                    {t('Last top up: Oct 24', 'آخر شحن: 24 أكتوبر')}
                  </span>
                </div>
              </div>

              {/* Add Funds Card */}
              <div style={card} className="p-6">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <h3 className="text-lg font-bold text-on-surface font-display">{t('Add Funds', 'إضافة رصيد')}</h3>
                    <p className="text-xs text-on-surface-variant">{t('Instantly top up your Rasha wallet', 'اشحن محفظة رشة فوراً')}</p>
                  </div>
                  <span className="material-symbols-outlined text-secondary-fixed text-2xl">credit_card</span>
                </div>
                <div className="flex gap-3 mt-5 flex-wrap">
                  {QUICK_AMOUNTS.map(amt => (
                    <button key={amt} onClick={() => { setSelected(amt); setCustomAmount('') }}
                      className={`flex-1 min-w-[90px] py-3 rounded-xl text-sm font-bold transition-all ${selected === amt && !customAmount ? 'text-white hydro-gradient' : 'text-on-surface'}`}
                      style={selected === amt && !customAmount ? {} : { border: '1px solid var(--color-outline-variant)', background: 'var(--color-surface-container)' }}>
                      {amt.toLocaleString('en')} SDG
                    </button>
                  ))}
                </div>
                <div className="mt-4">
                  <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">{t('Custom Amount', 'مبلغ مخصص')}</p>
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <input type="number" placeholder={t('Enter amount...', 'أدخل المبلغ...')} className="rasha-input text-sm pe-14"
                        value={customAmount} onChange={e => { setCustomAmount(e.target.value); setSelected(0) }} />
                      <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant font-bold">SDG</span>
                    </div>
                    <button disabled={topUpLoading || (!selected && !customAmount)}
                      className="hydro-gradient text-white text-sm font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50 shrink-0">
                      <span className="material-symbols-outlined text-base">bolt</span>
                      {t('Top Up Now', 'اشحن الآن')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Transaction History */}
              <div style={card} className="overflow-hidden">
                <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ borderBottom: '1px solid var(--color-outline-variant)' }}>
                  <div>
                    <h3 className="text-lg font-bold text-on-surface font-display">{t('Transaction History', 'سجل المعاملات')}</h3>
                    <p className="text-xs text-on-surface-variant">{t('Track your recent top ups and wash payments', 'تتبع شحناتك الأخيرة ومدفوعات الغسيل')}</p>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'var(--color-surface-container)', border: '1px solid var(--color-outline-variant)' }}>
                    <span className="material-symbols-outlined text-on-surface-variant text-base">search</span>
                    <input className="text-sm bg-transparent outline-none text-on-surface placeholder:text-on-surface-variant" placeholder={t('Search transactions...', 'بحث في المعاملات...')} />
                  </div>
                </div>
                <div className="px-6 py-2">
                  <div className="grid grid-cols-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider" style={{ borderBottom: '1px solid var(--color-outline-variant)' }}>
                    <span>{t('DATE', 'التاريخ')}</span>
                    <span className="col-span-2">{t('DESCRIPTION', 'الوصف')}</span>
                    <span className="text-end">{t('AMOUNT', 'المبلغ')}</span>
                  </div>
                  {transactions.map((tx, i) => (
                    <div key={i} className="grid grid-cols-4 py-4 items-center" style={i < transactions.length - 1 ? { borderBottom: '1px solid var(--color-outline-variant)' } : {}}>
                      <div dir="ltr" style={{ unicodeBidi: 'embed' }}>
                        <p className="text-sm font-semibold text-on-surface">{tx.date}</p>
                        <p className="text-xs text-on-surface-variant">{tx.time}</p>
                      </div>
                      <div className="col-span-2 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: tx.positive ? 'rgba(34,197,94,0.1)' : 'rgba(0,86,179,0.08)' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: tx.iconColor }}>{tx.icon}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-on-surface">{tx.title}</p>
                          <p className="text-xs text-on-surface-variant">{tx.sub}</p>
                        </div>
                      </div>
                      <div className="text-end">
                        <p className={`text-sm font-bold ${tx.positive ? 'text-green-500' : 'text-on-surface'}`}
                          dir="ltr" style={{ unicodeBidi: 'embed' }}>{tx.amount} SDG</p>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${tx.status === 'completed' ? 'text-green-600' : 'text-amber-500'}`}
                          style={{ background: tx.status === 'completed' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)' }}>
                          • {tx.status === 'completed' ? t('Completed', 'مكتمل') : t('Pending', 'معلق')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-6 py-4 text-center" style={{ borderTop: '1px solid var(--color-outline-variant)' }}>
                  <button className="text-sm font-semibold text-secondary-fixed hover:underline">{t('View All Transactions', 'عرض جميع المعاملات')}</button>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-5">

              {/* Saved Payment Methods */}
              <div style={card} className="overflow-hidden">
                <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-outline-variant)' }}>
                  <p className="text-sm font-bold text-on-surface">{t('Saved Payment Methods', 'طرق الدفع المحفوظة')}</p>
                  <button className="text-xs font-bold text-secondary-fixed flex items-center gap-1 hover:underline">
                    <span className="material-symbols-outlined text-sm">add</span>
                    {t('Add New', 'إضافة')}
                  </button>
                </div>
                <div className="p-4 space-y-3">
                  {[
                    { icon: 'account_balance', name: t('Bank of Khartoum (MBOK)', 'بنك الخرطوم (MBOK)'), sub: '**** 9021 • Primary', primary: true },
                    { icon: 'credit_card', name: 'Visa Card', sub: '**** 4432 • Expires 08/26', primary: false },
                  ].map((pm, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--color-surface-container)', border: '1px solid var(--color-outline-variant)' }}>
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(0,86,179,0.08)' }}>
                        <span className="material-symbols-outlined text-secondary-fixed" style={{ fontSize: '18px' }}>{pm.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-on-surface truncate">{pm.name}</p>
                        <p className="text-xs text-on-surface-variant">{pm.sub}</p>
                      </div>
                      {pm.primary && <span className="material-symbols-outlined fill-icon text-secondary-fixed" style={{ fontSize: '18px' }}>check_circle</span>}
                    </div>
                  ))}
                </div>
                {/* Member Perk */}
                <div className="mx-4 mb-4 p-3 rounded-xl flex items-start gap-3" style={{ background: 'rgba(var(--color-secondary-fixed-rgb),0.06)', border: '1px solid rgba(var(--color-secondary-fixed-rgb),0.15)' }}>
                  <span className="material-symbols-outlined text-secondary-fixed text-xl shrink-0">star</span>
                  <div>
                    <p className="text-xs font-bold text-secondary-fixed">{t('Member Perk!', 'مزايا العضو!')}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">{t('Save 5% on every wash when you pay with your Rasha Wallet balance.', 'وفّر 5% على كل غسيل عند الدفع برصيد محفظة رشة.')}</p>
                  </div>
                </div>
              </div>

              {/* Spending Insights */}
              <div style={card} className="p-5">
                <p className="text-sm font-bold text-on-surface mb-4">{t('Spending Insights', 'تحليل الإنفاق')}</p>
                <div className="flex items-end gap-1.5 h-20">
                  {spendingData.map((val, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full rounded-t-sm transition-all"
                        style={{ height: `${val}%`, background: i === 5 ? '#0056b3' : i === 6 ? 'rgba(var(--color-secondary-fixed-rgb),0.4)' : 'rgba(0,86,179,0.15)', minHeight: '4px' }} />
                    </div>
                  ))}
                </div>
                <div className="flex gap-1.5 mt-2">
                  {spendingDays.map(d => (
                    <div key={d} className="flex-1 text-center">
                      <p className="text-xs text-on-surface-variant" style={{ fontSize: '9px' }}>{d}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
