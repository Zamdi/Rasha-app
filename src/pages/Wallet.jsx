import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp, API } from '../context/AppContext'

const QUICK_AMOUNTS = [5000, 10000, 20000]

export default function Wallet() {
  const { t, customer, token, lang } = useApp()
  const [customAmount, setCustomAmount] = useState('')
  const [selected, setSelected] = useState(10000)
  const [topUpLoading, setTopUpLoading] = useState(false)
  const [showAddCard, setShowAddCard] = useState(false)
  const [showRemoveCard, setShowRemoveCard] = useState(false)
  const [savedCard, setSavedCard] = useState(() => {
    try { return JSON.parse(localStorage.getItem('rasha_saved_card') || 'null') } catch { return null }
  })
  const [cardForm, setCardForm] = useState({ number: '', name: '', expiry: '', cvv: '' })
  const [cardErrors, setCardErrors] = useState({})

  if (!customer) return null

  const balance = customer.wallet_balance || 0
  const transactions = []


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
                  <div className="flex flex-col items-center gap-1">
                    <button onClick={() => setShowAddCard(true)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all hover:opacity-80"
                      style={{ background: savedCard ? 'rgba(var(--color-secondary-fixed-rgb),0.08)' : 'var(--color-surface-container)', border: '1px solid var(--color-outline-variant)' }}>
                      <span className="material-symbols-outlined text-secondary-fixed text-2xl">credit_card</span>
                      {savedCard && (
                        <span className="text-xs font-bold text-on-surface" dir="ltr">•••• {savedCard.last4}</span>
                      )}
                    </button>
                    {savedCard && (
                      <button onClick={() => setShowRemoveCard(true)}
                        className="text-xs font-semibold hover:underline" style={{ color: 'var(--color-error)' }}>
                        {t('Remove', 'إزالة')}
                      </button>
                    )}
                  </div>
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

              {/* How to top up */}
              <div style={card} className="p-5 space-y-3">
                <p className="text-sm font-bold text-on-surface">{t('How to Top Up', 'كيفية الشحن')}</p>
                {[
                  ['bolt', t('Choose an amount above', 'اختر مبلغاً أعلاه')],
                  ['payments', t('Pay via your preferred method', 'ادفع بالطريقة المفضلة لديك')],
                  ['account_balance_wallet', t('Balance added instantly', 'يُضاف الرصيد فوراً')],
                ].map(([icon, label], i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{background:'rgba(var(--color-secondary-fixed-rgb),0.08)'}}>
                      <span className="material-symbols-outlined text-secondary-fixed" style={{fontSize:'16px'}}>{icon}</span>
                    </div>
                    <p className="text-sm text-on-surface-variant">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
      {/* Add Card Popup */}
      {showAddCard && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6 animate-fade-in" style={{ background: 'var(--color-surface-container)', border: '1px solid var(--color-outline-variant)' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-on-surface font-display">{t('Add Payment Card', 'إضافة بطاقة دفع')}</h3>
              <button onClick={() => { setShowAddCard(false); setCardErrors({}) }}>
                <span className="material-symbols-outlined text-on-surface-variant">close</span>
              </button>
            </div>
            <div className="space-y-4">
              {/* Card Number */}
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">{t('Card Number', 'رقم البطاقة')}</label>
                <div className="relative">
                  <input type="text" inputMode="numeric" maxLength={19} placeholder="0000 0000 0000 0000"
                    className={`rasha-input text-sm pe-12 ${cardErrors.number ? 'border-error' : ''}`}
                    value={cardForm.number}
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 16)
                      const fmt = v.replace(/(.{4})/g, '$1 ').trim()
                      setCardForm(f => ({ ...f, number: fmt }))
                      setCardErrors(er => ({ ...er, number: '' }))
                    }} dir="ltr" style={{ unicodeBidi: 'embed' }} />
                  <span className="material-symbols-outlined text-on-surface-variant absolute end-3 top-1/2 -translate-y-1/2 text-xl">credit_card</span>
                </div>
                {cardErrors.number && <p className="text-error text-xs mt-1">{cardErrors.number}</p>}
              </div>
              {/* Cardholder Name */}
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">{t('Cardholder Name', 'اسم حامل البطاقة')}</label>
                <input type="text" placeholder={t('Name on card', 'الاسم على البطاقة')}
                  className={`rasha-input text-sm ${cardErrors.name ? 'border-error' : ''}`}
                  value={cardForm.name} onChange={e => { setCardForm(f => ({ ...f, name: e.target.value })); setCardErrors(er => ({ ...er, name: '' })) }} />
                {cardErrors.name && <p className="text-error text-xs mt-1">{cardErrors.name}</p>}
              </div>
              {/* Expiry + CVV */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">{t('Expiry', 'تاريخ الانتهاء')}</label>
                  <input type="text" inputMode="numeric" placeholder="MM/YY" maxLength={5}
                    className={`rasha-input text-sm ${cardErrors.expiry ? 'border-error' : ''}`}
                    value={cardForm.expiry}
                    onChange={e => {
                      let v = e.target.value.replace(/\D/g, '').slice(0, 4)
                      if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2)
                      setCardForm(f => ({ ...f, expiry: v }))
                      setCardErrors(er => ({ ...er, expiry: '' }))
                    }} dir="ltr" style={{ unicodeBidi: 'embed' }} />
                  {cardErrors.expiry && <p className="text-error text-xs mt-1">{cardErrors.expiry}</p>}
                </div>
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">CVV</label>
                  <input type="password" inputMode="numeric" placeholder="•••" maxLength={4}
                    className={`rasha-input text-sm ${cardErrors.cvv ? 'border-error' : ''}`}
                    value={cardForm.cvv}
                    onChange={e => { setCardForm(f => ({ ...f, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })); setCardErrors(er => ({ ...er, cvv: '' })) }}
                    dir="ltr" style={{ unicodeBidi: 'embed' }} />
                  {cardErrors.cvv && <p className="text-error text-xs mt-1">{cardErrors.cvv}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(0,86,179,0.06)', border: '1px solid rgba(0,86,179,0.12)' }}>
                <span className="material-symbols-outlined text-secondary-fixed text-base">lock</span>
                <p className="text-xs text-on-surface-variant">{t('Your card details are encrypted and stored securely.', 'تفاصيل بطاقتك مشفرة ومخزنة بأمان.')}</p>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowAddCard(false); setCardErrors({}) }}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-on-surface-variant"
                style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)' }}>
                {t('Cancel', 'إلغاء')}
              </button>
              <button onClick={() => {
                const e = {}
                const digits = cardForm.number.replace(/\s/g, '')
                if (digits.length < 16) e.number = t('Enter a valid 16-digit card number', 'أدخل رقم بطاقة صحيح من 16 رقم')
                if (!cardForm.name.trim()) e.name = t('Required', 'مطلوب')
                if (cardForm.expiry.length < 5) e.expiry = t('Invalid', 'غير صالح')
                if (cardForm.cvv.length < 3) e.cvv = t('Invalid', 'غير صالح')
                setCardErrors(e)
                if (Object.keys(e).length > 0) return
                const card = { last4: digits.slice(-4), name: cardForm.name, expiry: cardForm.expiry }
                setSavedCard(card)
                localStorage.setItem('rasha_saved_card', JSON.stringify(card))
                setCardForm({ number: '', name: '', expiry: '', cvv: '' })
                setShowAddCard(false)
              }} className="flex-1 py-3 rounded-xl text-sm font-bold hydro-gradient text-white hover:opacity-90">
                {t('Save Card', 'حفظ البطاقة')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Card Popup */}
      {showRemoveCard && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-xs rounded-2xl p-6 animate-fade-in" style={{ background: 'var(--color-surface-container)', border: '1px solid var(--color-outline-variant)' }}>
            <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(179,38,30,0.1)' }}>
              <span className="material-symbols-outlined text-error text-2xl">credit_card_off</span>
            </div>
            <h3 className="font-bold text-on-surface text-center mb-2">{t('Remove Card?', 'إزالة البطاقة؟')}</h3>
            <p className="text-xs text-on-surface-variant text-center mb-5">
              {t('Remove card ending in', 'إزالة البطاقة المنتهية بـ')} <span className="font-bold" dir="ltr">•••• {savedCard?.last4}</span>?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowRemoveCard(false)}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-on-surface-variant"
                style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)' }}>
                {t('Cancel', 'إلغاء')}
              </button>
              <button onClick={() => {
                setSavedCard(null)
                localStorage.removeItem('rasha_saved_card')
                setShowRemoveCard(false)
              }} className="flex-1 py-3 rounded-xl text-sm font-bold text-white" style={{ background: '#b3261e' }}>
                {t('Remove', 'إزالة')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
