import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp, API } from '../context/AppContext'
import { fetchWithTimeout } from '../utils/fetchWithTimeout'

export default function Wallet() {
  const { t, lang, customer, login, token, isDark } = useApp()
  const navigate = useNavigate()
  const [balance, setBalance] = useState(Number(customer?.wallet_balance || 0))
  const [transactions, setTransactions] = useState([])
  const [txLoading, setTxLoading] = useState(true)
  const [txError, setTxError] = useState(false)
  const [activeTab, setActiveTab] = useState('history') // 'history' | 'send'

  // Quick Send state
  const [sendTo, setSendTo] = useState('')
  const [sendAmount, setSendAmount] = useState('')
  const [sendNote, setSendNote] = useState('')
  const [sendLoading, setSendLoading] = useState(false)
  const [sendError, setSendError] = useState('')
  const [sendSuccess, setSendSuccess] = useState(false)

  useEffect(() => { try { localStorage.removeItem('rasha_saved_card') } catch {} }, [])

  useEffect(() => {
    if (!token) return
    fetch(`${API}/api/auth/me`, { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.customer) { setBalance(Number(data.customer.wallet_balance || 0)); login(token, data.customer) } })
      .catch(() => {})
  }, [token])

  const loadTransactions = () => {
    if (!token) return
    setTxLoading(true); setTxError(false)
    fetchWithTimeout(`${API}/api/wallet/transactions`, { headers: { Authorization: 'Bearer ' + token }, timeout: 60000 })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setTransactions(d.transactions || []))
      .catch(() => setTxError(true))
      .finally(() => setTxLoading(false))
  }

  useEffect(loadTransactions, [token])

  if (!customer) return null

  const fmtAmount = (n) => `${n < 0 ? '−' : '+'}${Math.abs(n).toLocaleString('en')}`
  const fmtDate = (iso) =>
    new Date(iso).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  const txLabel = (tx) => {
    if (tx.type === 'topup') return t('Wallet top-up', 'شحن المحفظة')
    if (tx.type === 'payment') return tx.note || t('Wash payment', 'دفع غسيل')
    if (tx.type === 'transfer_out') return tx.note || t('Sent to member', 'أرسلت إلى عضو')
    if (tx.type === 'transfer_in') return tx.note || t('Received from member', 'استلمت من عضو')
    return tx.note || tx.type
  }

  const handleSend = async (e) => {
    e.preventDefault()
    setSendError(''); setSendSuccess(false)
    const amt = Number(sendAmount)
    if (!sendTo.trim()) return setSendError(t('Enter a member ID', 'أدخل رقم العضوية'))
    if (!amt || amt <= 0) return setSendError(t('Enter a valid amount', 'أدخل مبلغاً صحيحاً'))
    if (amt > balance) return setSendError(t('Insufficient balance', 'رصيد غير كافٍ'))
    setSendLoading(true)
    try {
      const res = await fetch(`${API}/api/wallet/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ to_uid: sendTo.trim(), amount: amt, note: sendNote.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) return setSendError(data.error || t('Transfer failed', 'فشل التحويل'))
      setBalance(b => b - amt)
      setSendSuccess(true)
      setSendTo(''); setSendAmount(''); setSendNote('')
      loadTransactions()
    } catch {
      setSendError(t('Connection error', 'خطأ في الاتصال'))
    } finally {
      setSendLoading(false)
    }
  }

  // Derive initials from name for avatar fallback
  const initials = customer.name ? customer.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'ME'

  return (
    <div style={{ minHeight: '100dvh', paddingBottom: '80px', background: isDark ? '#070d1a' : '#F6F1F1', display: 'flex', flexDirection: 'column' }}>

      {/* ── Teal header ── */}
      <div style={{
        background: isDark
          ? 'linear-gradient(160deg, #0e2a32 0%, #061520 100%)'
          : 'linear-gradient(160deg, #146C94 0%, #0e3d52 100%)',
        paddingTop: 'calc(env(safe-area-inset-top) + 56px)',
        paddingBottom: '24px',
        paddingLeft: '20px',
        paddingRight: '20px',
      }}>
        {/* Back button */}
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(255,255,255,0.65)', fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back_ios</span>
          {t('Back', 'رجوع')}
        </button>

        {/* Balance */}
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
          {t('Total Balance', 'إجمالي الرصيد')}
        </p>
        <p style={{ color: '#ffffff', fontSize: '40px', fontWeight: 800, lineHeight: 1.1, fontFamily: 'Space Mono, monospace', marginBottom: '6px' }}>
          <span style={{ fontSize: '18px', fontWeight: 400, opacity: 0.6, marginRight: '4px' }}>SDG</span>
          {balance.toLocaleString('en')}
        </p>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', fontFamily: 'monospace', marginBottom: '20px' }}>
          {t('Rasha Pay', 'رشة باي')} · {customer.customer_uid}
        </p>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {[
            { icon: 'north', label: t('Top Up', 'شحن'), action: null },
            { icon: 'send', label: t('Send', 'إرسال'), action: () => setActiveTab('send') },
            { icon: 'qr_code_scanner', label: t('Scan', 'مسح'), action: null },
            { icon: 'more_horiz', label: t('More', 'المزيد'), action: null },
          ].map(btn => (
            <button key={btn.label} onClick={btn.action}
              style={{ flex: 1, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '14px', padding: '10px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', color: '#fff' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#fff' }}>{btn.icon}</span>
              <span style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>{btn.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Cream sheet ── */}
      <div style={{
        flex: 1,
        background: isDark ? '#0b1424' : '#F6F1F1',
        borderRadius: '24px 24px 0 0',
        marginTop: '-16px',
        padding: '20px 16px',
      }}>

        {/* Tab row */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {[
            { key: 'history', label: t('History', 'السجل') },
            { key: 'send',    label: t('Quick Send', 'إرسال سريع') },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '8px 18px', borderRadius: '20px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', border: 'none',
                background: activeTab === tab.key ? '#146C94' : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(20,108,148,0.08)'),
                color: activeTab === tab.key ? '#fff' : (isDark ? 'rgba(255,255,255,0.55)' : '#146C94'),
                transition: 'background 0.2s, color 0.2s',
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── History tab ── */}
        {activeTab === 'history' && (
          <div>
            {/* Quick send contacts strip */}
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#146C94', marginBottom: '12px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              {t('Quick Send', 'إرسال سريع')}
            </p>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
              {/* Add new */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flexShrink: 0, cursor: 'pointer' }}
                onClick={() => setActiveTab('send')}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', border: '2px dashed rgba(20,108,148,0.3)', background: isDark ? 'rgba(20,108,148,0.08)' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#146C94' }}>add</span>
                </div>
                <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.4)' : '#8aabb8' }}>{t('Add', 'أضف')}</span>
              </div>
              {/* Placeholder contact avatars based on recent transfer_out transactions */}
              {transactions.filter(tx => tx.type === 'transfer_out').slice(0, 4).map((tx, i) => {
                const colors = ['#146C94','#19A7CE','#AFD3E2','#0e3d52']
                const label = (tx.note || tx.to_name || '?').slice(0, 2).toUpperCase()
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flexShrink: 0, cursor: 'pointer' }}
                    onClick={() => { setActiveTab('send') }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: colors[i % colors.length], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{label}</span>
                    </div>
                    <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.4)' : '#8aabb8', maxWidth: '44px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tx.to_name || tx.note || '—'}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Transaction list */}
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#146C94', marginBottom: '12px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              {t('Recent', 'الأخيرة')}
            </p>

            {txLoading && [0,1,2].map(i => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid rgba(20,108,148,0.07)' }}>
                <div className="shimmer" style={{ width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="shimmer" style={{ height: '12px', borderRadius: '6px', width: '50%', marginBottom: '6px' }} />
                  <div className="shimmer" style={{ height: '10px', borderRadius: '6px', width: '30%' }} />
                </div>
                <div className="shimmer" style={{ height: '12px', width: '60px', borderRadius: '6px' }} />
              </div>
            ))}

            {!txLoading && txError && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '40px', color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(20,108,148,0.3)' }}>cloud_off</span>
                <p style={{ fontSize: '14px', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.6)' : '#146C94', marginTop: '8px' }}>{t('Could not load transactions', 'تعذر تحميل المعاملات')}</p>
                <button onClick={loadTransactions} style={{ marginTop: '8px', background: 'none', border: 'none', color: '#19A7CE', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>{t('Retry', 'إعادة المحاولة')}</button>
              </div>
            )}

            {!txLoading && !txError && transactions.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '48px', color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(20,108,148,0.25)' }}>receipt_long</span>
                <p style={{ fontSize: '15px', fontWeight: 700, color: isDark ? 'rgba(255,255,255,0.6)' : '#146C94', marginTop: '12px' }}>{t('No transactions yet', 'لا توجد معاملات بعد')}</p>
                <p style={{ fontSize: '12px', color: isDark ? 'rgba(255,255,255,0.35)' : '#8aabb8', marginTop: '6px' }}>{t('Your payments and top-ups will appear here', 'ستظهر هنا مدفوعاتك وشحناتك')}</p>
              </div>
            )}

            {!txLoading && !txError && transactions.length > 0 && transactions.map(tx => {
              const credit = tx.amount >= 0
              const iconMap = { topup: 'arrow_downward', payment: 'local_car_wash', transfer_out: 'send', transfer_in: 'arrow_downward' }
              const icon = iconMap[tx.type] || 'swap_horiz'
              const iconColor = credit ? '#19A7CE' : '#146C94'
              const iconBg = credit ? 'rgba(25,167,206,0.12)' : 'rgba(20,108,148,0.09)'
              return (
                <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 0', borderBottom: '1px solid ' + (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(20,108,148,0.07)') }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: iconColor }}>{icon}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: isDark ? '#e0e3e5' : '#0d1825', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{txLabel(tx)}</p>
                    <p style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.35)' : '#8aabb8', marginTop: '2px' }}>{fmtDate(tx.created_at)}</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: credit ? '#19A7CE' : (isDark ? '#e0e3e5' : '#0d1825'), fontFamily: 'monospace', letterSpacing: '-0.02em' }} dir="ltr">{fmtAmount(tx.amount)}</p>
                    {tx.balance_after !== null && (
                      <p style={{ fontSize: '10px', color: isDark ? 'rgba(255,255,255,0.3)' : '#8aabb8', marginTop: '2px', fontFamily: 'monospace' }} dir="ltr">{Number(tx.balance_after).toLocaleString('en')} SDG</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Quick Send tab ── */}
        {activeTab === 'send' && (
          <div>
            <p style={{ fontSize: '13px', color: isDark ? 'rgba(255,255,255,0.45)' : '#8aabb8', marginBottom: '20px' }}>
              {t('Transfer wallet balance to another Rasha member instantly.', 'حوّل رصيد المحفظة إلى عضو رشة آخر فوراً.')}
            </p>

            {sendSuccess && (
              <div style={{ background: 'rgba(25,167,206,0.12)', border: '1px solid rgba(25,167,206,0.2)', borderRadius: '14px', padding: '14px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="material-symbols-outlined" style={{ color: '#19A7CE', fontSize: '20px' }}>check_circle</span>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#19A7CE' }}>{t('Transfer sent successfully!', 'تم إرسال التحويل بنجاح!')}</p>
              </div>
            )}

            <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: isDark ? 'rgba(255,255,255,0.55)' : '#146C94', display: 'block', marginBottom: '6px' }}>
                  {t('Recipient Member ID', 'رقم عضوية المستلم')}
                </label>
                <input
                  value={sendTo} onChange={e => { setSendTo(e.target.value); setSendError(''); setSendSuccess(false) }}
                  placeholder={t('e.g. RSH-00123', 'مثال: RSH-00123')}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid ' + (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(20,108,148,0.18)'), background: isDark ? 'rgba(255,255,255,0.05)' : '#fff', color: isDark ? '#e0e3e5' : '#0d1825', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: isDark ? 'rgba(255,255,255,0.55)' : '#146C94', display: 'block', marginBottom: '6px' }}>
                  {t('Amount (SDG)', 'المبلغ (جنيه)')}
                </label>
                <input
                  type="number" min="1" value={sendAmount} onChange={e => { setSendAmount(e.target.value); setSendError(''); setSendSuccess(false) }}
                  placeholder="0"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid ' + (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(20,108,148,0.18)'), background: isDark ? 'rgba(255,255,255,0.05)' : '#fff', color: isDark ? '#e0e3e5' : '#0d1825', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
                <p style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.3)' : '#8aabb8', marginTop: '4px' }}>
                  {t('Available:', 'المتاح:')} {balance.toLocaleString('en')} SDG
                </p>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: isDark ? 'rgba(255,255,255,0.55)' : '#146C94', display: 'block', marginBottom: '6px' }}>
                  {t('Note (optional)', 'ملاحظة (اختياري)')}
                </label>
                <input
                  value={sendNote} onChange={e => setSendNote(e.target.value)}
                  placeholder={t('e.g. for coffee', 'مثال: للقهوة')}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid ' + (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(20,108,148,0.18)'), background: isDark ? 'rgba(255,255,255,0.05)' : '#fff', color: isDark ? '#e0e3e5' : '#0d1825', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {sendError && (
                <p style={{ fontSize: '13px', color: '#c0392b', fontWeight: 600 }}>{sendError}</p>
              )}

              <button type="submit" disabled={sendLoading}
                style={{ padding: '14px', borderRadius: '14px', background: sendLoading ? '#8aabb8' : '#146C94', color: '#fff', fontSize: '15px', fontWeight: 700, border: 'none', cursor: sendLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'background 0.2s' }}>
                {sendLoading ? (
                  <>{t('Sending…', 'جاري الإرسال…')}</>
                ) : (
                  <><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>send</span>{t('Send Money', 'إرسال المبلغ')}</>
                )}
              </button>
            </form>

            {/* How to top up note */}
            <div style={{ marginTop: '28px', padding: '14px 16px', borderRadius: '14px', background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(20,108,148,0.05)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(20,108,148,0.10)') }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#146C94' }}>info</span>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#146C94' }}>{t('Top Up in Branch', 'الشحن في الفرع')}</p>
              </div>
              <p style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.35)' : '#8aabb8', lineHeight: 1.6 }}>
                {t('Visit Rasha Car Wash and give the staff your Member ID to top up your wallet instantly.', 'قم بزيارة رشة لغسيل السيارات وأعطِ الموظف رقم عضويتك لشحن محفظتك فوراً.')}
              </p>
              {customer.customer_uid && (
                <p style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: '#146C94', marginTop: '8px' }}>{customer.customer_uid}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
