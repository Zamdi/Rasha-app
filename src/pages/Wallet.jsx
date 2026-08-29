import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { useApp, API } from '../context/AppContext'
import { fetchWithTimeout } from '../utils/fetchWithTimeout'
import QrScannerModal from '../components/QrScannerModal'

export default function Wallet() {
  const { t, lang, customer, login, token, isDark } = useApp()
  const navigate = useNavigate()

  const [balance, setBalance]         = useState(Number(customer?.wallet_balance || 0))
  const [transactions, setTransactions] = useState([])
  const [txLoading, setTxLoading]     = useState(true)
  const [txError, setTxError]         = useState(false)
  const [activeTab, setActiveTab]     = useState('history')

  // My QR modal
  const [showMyQr, setShowMyQr]       = useState(false)

  // QR scanner
  const [showScanner, setShowScanner] = useState(false)

  // Quick Send state
  const [searchQuery, setSearchQuery] = useState('')   // phone or UID typed
  const [recipient, setRecipient]     = useState(null) // { uid, name } after lookup
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupError, setLookupError] = useState('')
  const [sendAmount, setSendAmount]   = useState('')
  const [sendNote, setSendNote]       = useState('')
  const [sendLoading, setSendLoading] = useState(false)
  const [sendError, setSendError]     = useState('')
  const [sendSuccess, setSendSuccess] = useState(false)
  const lookupTimer = useRef(null)

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

  // ── lookup (debounced 600 ms) ────────────────────────────────
  const handleSearchChange = (val) => {
    setSearchQuery(val)
    setRecipient(null)
    setLookupError('')
    clearTimeout(lookupTimer.current)
    if (!val.trim()) return
    lookupTimer.current = setTimeout(() => doLookup(val.trim()), 600)
  }

  const doLookup = async (q) => {
    setLookupLoading(true); setLookupError('')
    try {
      const res = await fetch(`${API}/api/wallet/lookup?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: 'Bearer ' + token },
      })
      const data = await res.json()
      if (!res.ok) return setLookupError(data.error || t('Lookup failed', 'فشل البحث'))
      if (!data.found) return setLookupError(t('No member found with that phone or ID', 'لا يوجد عضو بهذا الرقم أو المعرّف'))
      setRecipient({ uid: data.uid, name: data.name })
    } catch {
      setLookupError(t('Connection error', 'خطأ في الاتصال'))
    } finally {
      setLookupLoading(false)
    }
  }

  // Called when the QR scanner reads a code
  const handleQrScan = (text) => {
    setShowScanner(false)
    // QR encodes the customer_uid directly
    setSearchQuery(text.trim())
    doLookup(text.trim())
    setActiveTab('send')
  }

  const handleSend = async (e) => {
    e.preventDefault()
    setSendError(''); setSendSuccess(false)
    if (!recipient) return setSendError(t('Find a recipient first', 'ابحث عن مستلم أولاً'))
    const amt = Number(sendAmount)
    if (!amt || amt <= 0) return setSendError(t('Enter a valid amount', 'أدخل مبلغاً صحيحاً'))
    if (amt > balance) return setSendError(t('Insufficient balance', 'رصيد غير كافٍ'))
    setSendLoading(true)
    try {
      const res = await fetch(`${API}/api/wallet/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ to_uid: recipient.uid, amount: amt, note: sendNote.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) return setSendError(data.error || t('Transfer failed', 'فشل التحويل'))
      setBalance(data.balance !== undefined ? data.balance : balance - amt)
      setSendSuccess(true)
      setRecipient(null); setSearchQuery(''); setSendAmount(''); setSendNote('')
      loadTransactions()
    } catch {
      setSendError(t('Connection error', 'خطأ في الاتصال'))
    } finally {
      setSendLoading(false)
    }
  }

  const fmtAmount = n => `${n < 0 ? '−' : '+'}${Math.abs(n).toLocaleString('en')}`
  const fmtDate   = iso => new Date(iso).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  const txLabel   = tx => {
    if (tx.type === 'topup')        return t('Wallet top-up', 'شحن المحفظة')
    if (tx.type === 'payment')      return tx.note || t('Wash payment', 'دفع غسيل')
    if (tx.type === 'transfer_out') return tx.note || t('Sent to member', 'أرسلت إلى عضو')
    if (tx.type === 'transfer_in')  return tx.note || t('Received from member', 'استلمت من عضو')
    return tx.note || tx.type
  }

  const sh = (c) => isDark ? `rgba(${c},0.12)` : `rgba(${c},0.09)`

  return (
    <div style={{ minHeight: '100dvh', paddingBottom: '90px', background: isDark ? '#070d1a' : '#F6F1F1', display: 'flex', flexDirection: 'column' }}>

      {/* ── Teal header ── */}
      <div style={{
        background: isDark
          ? 'linear-gradient(160deg,#0e2a32 0%,#061520 100%)'
          : 'linear-gradient(160deg,#146C94 0%,#0e3d52 100%)',
        paddingTop: 'calc(env(safe-area-inset-top) + 56px)',
        paddingBottom: '28px',
        paddingLeft: '20px', paddingRight: '20px',
      }}>
        {/* Back */}
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back_ios</span>
          {t('Back', 'رجوع')}
        </button>

        {/* Balance row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
              {t('Total Balance', 'إجمالي الرصيد')}
            </p>
            <p style={{ color: '#fff', fontSize: '40px', fontWeight: 800, lineHeight: 1.1, fontFamily: 'Space Mono,monospace', marginBottom: '4px' }}>
              <span style={{ fontSize: '16px', fontWeight: 400, opacity: 0.55, marginRight: '4px' }}>SDG</span>
              {balance.toLocaleString('en')}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.32)', fontSize: '11px', fontFamily: 'monospace' }}>
              {t('Rasha Pay', 'رشة باي')} · {customer.customer_uid}
            </p>
          </div>

          {/* My QR button */}
          <button onClick={() => setShowMyQr(true)}
            style={{ background: 'rgba(255,255,255,0.13)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: '14px', padding: '10px 12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '22px', color: '#fff' }}>qr_code_2</span>
            <span style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{t('My QR', 'رمزي')}</span>
          </button>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          {[
            { icon: 'north',             label: t('Top Up','شحن'),    action: null },
            { icon: 'send',              label: t('Send','إرسال'),    action: () => setActiveTab('send') },
            { icon: 'qr_code_scanner',   label: t('Scan','مسح'),     action: () => setShowScanner(true) },
            { icon: 'receipt_long',      label: t('History','السجل'), action: () => setActiveTab('history') },
          ].map(btn => (
            <button key={btn.label} onClick={btn.action}
              style={{ flex: 1, background: 'rgba(255,255,255,0.11)', border: '1px solid rgba(255,255,255,0.13)', borderRadius: '14px', padding: '10px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: btn.action ? 'pointer' : 'default', color: '#fff' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#fff' }}>{btn.icon}</span>
              <span style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.72)' }}>{btn.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Cream sheet ── */}
      <div style={{ flex: 1, background: isDark ? '#0b1424' : '#F6F1F1', borderRadius: '24px 24px 0 0', marginTop: '-16px', padding: '20px 16px' }}>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {[
            { key: 'history', label: t('History', 'السجل') },
            { key: 'send',    label: t('Quick Send', 'إرسال سريع') },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{ padding: '8px 18px', borderRadius: '20px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', border: 'none',
                background: activeTab === tab.key ? '#146C94' : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(20,108,148,0.08)'),
                color: activeTab === tab.key ? '#fff' : (isDark ? 'rgba(255,255,255,0.55)' : '#146C94'),
                transition: 'background 0.2s,color 0.2s' }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── History tab ── */}
        {activeTab === 'history' && (
          <div>
            {/* Quick send contacts strip */}
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#146C94', marginBottom: '10px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{t('Quick Send', 'إرسال سريع')}</p>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flexShrink: 0, cursor: 'pointer' }}
                onClick={() => { setActiveTab('send') }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', border: '2px dashed rgba(20,108,148,0.3)', background: isDark ? 'rgba(20,108,148,0.08)' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#146C94' }}>add</span>
                </div>
                <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.35)' : '#8aabb8' }}>{t('Add', 'أضف')}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flexShrink: 0, cursor: 'pointer' }}
                onClick={() => setShowScanner(true)}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: isDark ? 'rgba(20,108,148,0.15)' : 'rgba(20,108,148,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#146C94' }}>qr_code_scanner</span>
                </div>
                <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.35)' : '#8aabb8' }}>{t('Scan', 'مسح')}</span>
              </div>
              {transactions.filter(tx => tx.type === 'transfer_out').slice(0, 3).map((tx, i) => {
                const colors = ['#146C94','#19A7CE','#0e3d52']
                const label = (tx.note || '??').replace(/^(to|من|إلى)\s*/i,'').slice(0,2).toUpperCase()
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: colors[i % colors.length], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{label}</span>
                    </div>
                    <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.35)' : '#8aabb8', maxWidth: '44px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.note || '—'}</span>
                  </div>
                )
              })}
            </div>

            {/* Transactions */}
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#146C94', marginBottom: '10px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{t('Recent', 'الأخيرة')}</p>

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
                <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'rgba(20,108,148,0.3)' }}>cloud_off</span>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#146C94', marginTop: '8px' }}>{t('Could not load transactions', 'تعذر تحميل المعاملات')}</p>
                <button onClick={loadTransactions} style={{ marginTop: '8px', background: 'none', border: 'none', color: '#19A7CE', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>{t('Retry', 'إعادة المحاولة')}</button>
              </div>
            )}

            {!txLoading && !txError && transactions.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'rgba(20,108,148,0.25)' }}>receipt_long</span>
                <p style={{ fontSize: '15px', fontWeight: 700, color: '#146C94', marginTop: '12px' }}>{t('No transactions yet', 'لا توجد معاملات بعد')}</p>
              </div>
            )}

            {!txLoading && !txError && transactions.map(tx => {
              const credit = tx.amount >= 0
              const iconMap = { topup: 'arrow_downward', payment: 'local_car_wash', transfer_out: 'send', transfer_in: 'move_to_inbox' }
              return (
                <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 0', borderBottom: '1px solid ' + (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(20,108,148,0.07)') }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: sh(credit ? '25,167,206' : '20,108,148'), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: credit ? '#19A7CE' : '#146C94' }}>{iconMap[tx.type] || 'swap_horiz'}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: isDark ? '#e0e3e5' : '#0d1825', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{txLabel(tx)}</p>
                    <p style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.35)' : '#8aabb8', marginTop: '2px' }}>{fmtDate(tx.created_at)}</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: credit ? '#19A7CE' : (isDark ? '#e0e3e5' : '#0d1825'), fontFamily: 'monospace' }} dir="ltr">{fmtAmount(tx.amount)}</p>
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
            {sendSuccess && (
              <div style={{ background: 'rgba(25,167,206,0.12)', border: '1px solid rgba(25,167,206,0.2)', borderRadius: '14px', padding: '14px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="material-symbols-outlined" style={{ color: '#19A7CE', fontSize: '20px' }}>check_circle</span>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#19A7CE' }}>{t('Transfer sent successfully!', 'تم إرسال التحويل بنجاح!')}</p>
              </div>
            )}

            {/* Scan button */}
            <button onClick={() => setShowScanner(true)}
              style={{ width: '100%', padding: '12px', borderRadius: '14px', border: '2px dashed rgba(20,108,148,0.25)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', marginBottom: '16px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#146C94' }}>qr_code_scanner</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#146C94' }}>{t('Scan Recipient QR', 'مسح رمز المستلم')}</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(20,108,148,0.12)' }} />
              <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.35)' : '#8aabb8', fontWeight: 600 }}>{t('or enter manually', 'أو أدخل يدوياً')}</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(20,108,148,0.12)' }} />
            </div>

            <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Search field */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: isDark ? 'rgba(255,255,255,0.55)' : '#146C94', display: 'block', marginBottom: '6px' }}>
                  {t('Phone number or Member ID', 'رقم الجوال أو رقم العضوية')}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    value={searchQuery}
                    onChange={e => handleSearchChange(e.target.value)}
                    placeholder={t('e.g. 0912345678 or RSH-00123', 'مثال: 0912345678 أو RSH-00123')}
                    style={{ width: '100%', padding: '12px 40px 12px 14px', borderRadius: '12px', border: '1.5px solid ' + (recipient ? '#19A7CE' : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(20,108,148,0.18)'), background: isDark ? 'rgba(255,255,255,0.05)' : '#fff', color: isDark ? '#e0e3e5' : '#0d1825', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  />
                  {lookupLoading && (
                    <span className="material-symbols-outlined" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', color: '#146C94', animation: 'spin 1s linear infinite' }}>progress_activity</span>
                  )}
                  {recipient && (
                    <span className="material-symbols-outlined" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', color: '#19A7CE' }}>check_circle</span>
                  )}
                </div>

                {/* Recipient card */}
                {recipient && (
                  <div style={{ marginTop: '8px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(25,167,206,0.09)', border: '1px solid rgba(25,167,206,0.2)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#146C94', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>{recipient.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}</span>
                    </div>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: isDark ? '#e0e3e5' : '#0d1825' }}>{recipient.name}</p>
                      <p style={{ fontSize: '11px', color: '#19A7CE', fontFamily: 'monospace' }}>{recipient.uid}</p>
                    </div>
                  </div>
                )}
                {lookupError && <p style={{ fontSize: '12px', color: '#c0392b', marginTop: '6px', fontWeight: 600 }}>{lookupError}</p>}
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: isDark ? 'rgba(255,255,255,0.55)' : '#146C94', display: 'block', marginBottom: '6px' }}>
                  {t('Amount (SDG)', 'المبلغ (جنيه)')}
                </label>
                <input type="number" min="1" value={sendAmount} onChange={e => { setSendAmount(e.target.value); setSendError('') }}
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
                <input value={sendNote} onChange={e => setSendNote(e.target.value)} placeholder={t('e.g. for coffee', 'مثال: للقهوة')}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid ' + (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(20,108,148,0.18)'), background: isDark ? 'rgba(255,255,255,0.05)' : '#fff', color: isDark ? '#e0e3e5' : '#0d1825', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {sendError && <p style={{ fontSize: '13px', color: '#c0392b', fontWeight: 600 }}>{sendError}</p>}

              <button type="submit" disabled={sendLoading || !recipient}
                style={{ padding: '14px', borderRadius: '14px', background: (!recipient || sendLoading) ? '#8aabb8' : '#146C94', color: '#fff', fontSize: '15px', fontWeight: 700, border: 'none', cursor: (!recipient || sendLoading) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'background 0.2s' }}>
                {sendLoading
                  ? t('Sending…', 'جاري الإرسال…')
                  : <><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>send</span>{t('Send Money', 'إرسال المبلغ')}</>}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* ── My QR modal ── */}
      {showMyQr && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end' }}
          onClick={() => setShowMyQr(false)}>
          <div style={{ width: '100%', background: isDark ? '#0f1e30' : '#fff', borderRadius: '28px 28px 0 0', padding: '24px 24px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: 'rgba(0,0,0,0.15)', marginBottom: '4px' }} />
            <p style={{ fontSize: '16px', fontWeight: 800, color: isDark ? '#e0e3e5' : '#0d1825' }}>{t('My QR Code', 'رمز QR الخاص بي')}</p>
            <p style={{ fontSize: '12px', color: isDark ? 'rgba(255,255,255,0.45)' : '#8aabb8', textAlign: 'center' }}>
              {t('Let another member scan this to send you money', 'دع عضواً آخر يمسح هذا لإرسال مبلغ إليك')}
            </p>
            <div style={{ background: '#fff', padding: '16px', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}>
              <QRCodeSVG value={customer.customer_uid} size={200} fgColor="#12454B" />
            </div>
            <p style={{ fontFamily: 'monospace', fontSize: '15px', fontWeight: 700, color: '#146C94', letterSpacing: '0.05em' }}>{customer.customer_uid}</p>
            <button onClick={() => setShowMyQr(false)}
              style={{ width: '100%', padding: '14px', borderRadius: '14px', background: '#146C94', color: '#fff', fontSize: '15px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
              {t('Done', 'تم')}
            </button>
          </div>
        </div>
      )}

      {/* ── QR Scanner modal ── */}
      {showScanner && (
        <QrScannerModal
          onScan={handleQrScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      <style>{`@keyframes spin { to { transform: translateY(-50%) rotate(360deg); } }`}</style>
    </div>
  )
}
