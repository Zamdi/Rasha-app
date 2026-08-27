import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useApp, API } from '../context/AppContext'
import { fetchWithTimeout } from '../utils/fetchWithTimeout'

export default function Wallet() {
  const { t, lang, customer, login, token } = useApp()
  const [balance, setBalance] = useState(Number(customer?.wallet_balance || 0))
  const [transactions, setTransactions] = useState([])
  const [txLoading, setTxLoading] = useState(true)
  const [txError, setTxError] = useState(false)

  // One-time cleanup: purge card data saved by earlier builds
  useEffect(() => { try { localStorage.removeItem('rasha_saved_card') } catch {} }, [])

  // Fetch fresh balance from server every time this page is opened
  useEffect(() => {
    if (!token) return
    fetch(`${API}/api/auth/me`, { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.customer) {
          setBalance(Number(data.customer.wallet_balance || 0))
          login(token, data.customer)
        }
      })
      .catch(() => {})
  }, [token])

  const loadTransactions = () => {
    if (!token) return
    setTxLoading(true); setTxError(false)
    fetchWithTimeout(`${API}/api/wallet/transactions`, {
      headers: { Authorization: 'Bearer ' + token },
      timeout: 60000,
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setTransactions(d.transactions || []))
      .catch(() => setTxError(true))
      .finally(() => setTxLoading(false))
  }

  useEffect(loadTransactions, [token])

  if (!customer) return null

  const fmtAmount = (n) =>
    `${n < 0 ? '−' : '+'}${Math.abs(n).toLocaleString('en')}`

  const fmtDate = (iso) =>
    new Date(iso).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US',
      { day: 'numeric', month: 'short', year: 'numeric' })

  const txLabel = (tx) => {
    if (tx.type === 'topup') return t('Wallet top-up', 'شحن المحفظة')
    if (tx.type === 'payment') return tx.note || t('Wash payment', 'دفع غسيل')
    return tx.note || tx.type
  }


  const card = { background: 'var(--color-surface-container-low)', border: '1px solid var(--color-outline-variant)', boxShadow: '0 4px 24px rgba(21,80,88,0.06)', borderRadius: '1rem' }

  return (
    <div className="pt-14 min-h-dvh pb-24 md:pb-0" style={{ background: 'var(--color-background)' }}>
      <div className="max-w-5xl mx-auto">
        {/* Main */}
        <main className="px-4 md:px-8 pt-4 pb-28 md:pt-8 md:pb-10 space-y-6">
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
              <div className="rounded-2xl p-7" style={{ background: 'linear-gradient(135deg, #1d6b75 0%, #0e383e 100%)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-white/60 text-base">account_balance_wallet</span>
                  <p className="text-white/70 text-xs font-semibold uppercase tracking-wide">{t('Available Balance', 'الرصيد المتاح')}</p>
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
                {/* aria-live so the list arriving is announced, not silent. */}
                <div aria-live="polite" aria-busy={txLoading}>

                  {/* Skeleton rows rather than a spinner or a blank panel — they
                      hold the same height the real rows will, so the card
                      doesn't jump when the data lands. */}
                  {txLoading && (
                    <ul className="divide-y" style={{ borderColor: 'var(--color-outline-variant)' }}>
                      {[0, 1, 2].map(i => (
                        <li key={i} className="px-6 py-4 flex items-center gap-4">
                          <div className="w-9 h-9 rounded-full shrink-0 shimmer" />
                          <div className="flex-1 space-y-2">
                            <div className="h-3 rounded shimmer" style={{ width: '45%' }} />
                            <div className="h-2.5 rounded shimmer" style={{ width: '30%' }} />
                          </div>
                          <div className="h-3.5 w-20 rounded shimmer" />
                        </li>
                      ))}
                    </ul>
                  )}

                  {!txLoading && txError && (
                    <div className="px-6 py-10 flex flex-col items-center justify-center gap-3 text-center">
                      <span className="material-symbols-outlined text-on-surface-variant text-4xl" aria-hidden="true">cloud_off</span>
                      <p role="alert" className="text-sm font-semibold text-on-surface">
                        {t('Could not load your transactions', 'تعذر تحميل معاملاتك')}
                      </p>
                      <button onClick={loadTransactions}
                        className="text-sm font-bold text-secondary-fixed hover:underline cursor-pointer">
                        {t('Try again', 'حاول مجدداً')}
                      </button>
                    </div>
                  )}

                  {!txLoading && !txError && transactions.length === 0 && (
                    <div className="px-6 py-12 flex flex-col items-center justify-center gap-3 text-center">
                      <span className="material-symbols-outlined text-on-surface-variant text-5xl" aria-hidden="true">receipt_long</span>
                      <p className="font-semibold text-on-surface">{t('No transactions yet', 'لا توجد معاملات بعد')}</p>
                      <p className="text-xs text-on-surface-variant max-w-xs">{t('Your top ups and wash payments will appear here once you start using your wallet.', 'ستظهر هنا شحناتك ومدفوعات الغسيل بمجرد بدء استخدام محفظتك.')}</p>
                      <a href="#how-to-top-up" className="text-sm font-bold text-secondary-fixed hover:underline mt-1">
                        {t('How to top up →', 'كيفية الشحن ←')}
                      </a>
                    </div>
                  )}

                  {!txLoading && !txError && transactions.length > 0 && (
                    <ul className="divide-y" style={{ borderColor: 'var(--color-outline-variant)' }}>
                      {transactions.map(tx => {
                        const credit = tx.amount >= 0
                        return (
                          <li key={tx.id} className="px-6 py-4 flex items-center gap-4">
                            <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                              style={{ background: credit
                                ? 'rgba(34,197,94,0.12)'
                                : 'rgba(var(--color-secondary-fixed-rgb),0.10)' }}>
                              <span className="material-symbols-outlined"
                                style={{ fontSize: '18px', color: credit ? '#22c55e' : 'var(--color-secondary-fixed)' }}
                                aria-hidden="true">
                                {credit ? 'add' : 'local_car_wash'}
                              </span>
                            </span>

                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-on-surface line-clamp-2">{txLabel(tx)}</p>
                              <p className="text-xs text-on-surface-variant mt-0.5">{fmtDate(tx.created_at)}</p>
                            </div>

                            <div className="text-end shrink-0">
                              {/* tabular-nums so the column of figures lines up */}
                              <p className="text-sm font-bold" dir="ltr"
                                style={{
                                  fontVariantNumeric: 'tabular-nums',
                                  color: credit ? '#22c55e' : 'var(--color-on-surface)',
                                }}>
                                {fmtAmount(tx.amount)}
                              </p>
                              {tx.balance_after !== null && (
                                <p className="text-xs text-on-surface-variant mt-0.5" dir="ltr"
                                  style={{ fontVariantNumeric: 'tabular-nums' }}>
                                  {Number(tx.balance_after).toLocaleString('en')} SDG
                                </p>
                              )}
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  )}
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
              <div id="how-to-top-up" style={card} className="p-5 space-y-4 scroll-mt-20">
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
    </div>
  )
}
