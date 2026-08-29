import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { useApp, API } from '../context/AppContext'
import { fetchWithTimeout } from '../utils/fetchWithTimeout'
import QrScannerModal from '../components/QrScannerModal'
import { COUNTRIES } from '../components/PhoneInput'

export default function Wallet() {
  const { t, lang, customer, login, token, isDark } = useApp()
  const navigate = useNavigate()
  const location = useLocation()

  const [balance, setBalance]           = useState(Number(customer?.wallet_balance || 0))
  const [transactions, setTransactions] = useState([])
  const [txLoading, setTxLoading]       = useState(true)
  const [txError, setTxError]           = useState(false)
  const [showMyQr, setShowMyQr]         = useState(false)
  const [showScanner, setShowScanner]   = useState(false)
  const [showSend, setShowSend]         = useState(false)
  const [showAddContact, setShowAddContact] = useState(false)
  const [balanceVisible, setBalanceVisible] = useState(true)

  // Saved Quick Send contacts (localStorage)
  const CONTACTS_KEY = `rasha_qs_${customer?.customer_uid}`
  const [contacts, setContacts] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`rasha_qs_${customer?.customer_uid}`) || '[]') } catch { return [] }
  })
  const saveContact = c => {
    if (contacts.find(x => x.uid === c.uid)) return
    const updated = [c, ...contacts].slice(0, 8)
    setContacts(updated)
    try { localStorage.setItem(CONTACTS_KEY, JSON.stringify(updated)) } catch {}
  }
  const removeContact = uid => {
    const updated = contacts.filter(c => c.uid !== uid)
    setContacts(updated)
    try { localStorage.setItem(CONTACTS_KEY, JSON.stringify(updated)) } catch {}
  }

  // Quick Send search (shared by Add modal and Send modal)
  const [searchQuery, setSearchQuery]   = useState('')
  const [searchDialCode, setSearchDialCode] = useState('+249')
  const [dialPickerOpen, setDialPickerOpen] = useState(false)
  const [dialSearch, setDialSearch]     = useState('')
  const dialPickerRef = useRef(null)
  const [recipient, setRecipient]       = useState(null)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupError, setLookupError]   = useState('')
  const [sendAmount, setSendAmount]     = useState('')
  const [sendLoading, setSendLoading]   = useState(false)
  const [sendError, setSendError]       = useState('')
  const [sendSuccess, setSendSuccess]   = useState(false)
  const lookupTimer = useRef(null)

  useEffect(() => { try { localStorage.removeItem('rasha_saved_card') } catch {} }, [])

  // Auto-open QR modal when nav bar QR button taps
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('qr') === '1') {
      setShowMyQr(true)
      navigate('/wallet', { replace: true })
    }
  }, [location.search])

  useEffect(() => {
    if (!token) return
    fetch(`${API}/api/auth/me`, { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.customer) { setBalance(Number(d.customer.wallet_balance || 0)); login(token, d.customer) } })
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

  const firstName = customer.name?.split(' ')[0] || customer.first_name || t('there', 'بك')
  const initials  = (customer.name || `${customer.first_name || ''} ${customer.last_name || ''}`)
    .trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  // Card last 4 from uid e.g. RW-00042 → 0042
  const cardLast4 = (customer.customer_uid || '').replace(/\D/g, '').slice(-4).padStart(4, '0')

  const fmtAmount = n => (n < 0 ? '−' : '+') + Math.abs(n).toLocaleString('en', { minimumFractionDigits: 2 })
  const fmtDate   = iso => new Date(iso).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  const txLabel   = tx => {
    if (tx.type === 'topup')        return t('Wallet Top-up', 'شحن المحفظة')
    if (tx.type === 'payment')      return tx.note || t('Car Wash', 'غسيل سيارة')
    if (tx.type === 'transfer_out') return tx.note || t('Transfer Sent', 'تحويل مُرسَل')
    if (tx.type === 'transfer_in')  return tx.note || t('Transfer Received', 'تحويل مُستلَم')
    return tx.note || tx.type
  }
  const txIcon = tx => {
    if (tx.type === 'topup')        return { icon: 'savings',        color: '#19A7CE', bg: 'rgba(25,167,206,0.1)' }
    if (tx.type === 'payment')      return { icon: 'local_car_wash', color: '#146C94', bg: 'rgba(20,108,148,0.09)' }
    if (tx.type === 'transfer_out') return { icon: 'send',           color: '#e67e22', bg: 'rgba(230,126,34,0.09)' }
    if (tx.type === 'transfer_in')  return { icon: 'move_to_inbox',  color: '#27ae60', bg: 'rgba(39,174,96,0.09)' }
    return { icon: 'swap_horiz', color: '#146C94', bg: 'rgba(20,108,148,0.09)' }
  }

  // Close dial picker on outside click
  useEffect(() => {
    const close = e => { if (dialPickerRef.current && !dialPickerRef.current.contains(e.target)) { setDialPickerOpen(false); setDialSearch('') } }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  // Normalize what the user typed before hitting the API
  const normalizeQuery = raw => {
    const s = raw.trim()
    // "RW-42" or "rw42" → extract number and pad (handles QR scan output)
    const rwMatch = s.match(/^rw-?(\d+)$/i)
    if (rwMatch) return `RW-${rwMatch[1].padStart(5, '0')}`
    // Number starting with 0 → strip leading 0 and prepend selected dial code
    if (/^0\d{6,12}$/.test(s)) {
      const country = COUNTRIES.find(c => c.dial === searchDialCode)
      const dialDigits = searchDialCode.replace('+', '')
      return `+${dialDigits}${s.slice(1)}`
    }
    // Already has + prefix (e.g. from QR scan)
    if (s.startsWith('+')) return s
    // Digits without dial code but long enough to be a phone → prepend selected dial code
    const country = COUNTRIES.find(c => c.dial === searchDialCode)
    if (country && s.length >= country.len.min && s.length <= country.len.max) {
      return `${searchDialCode}${s}`
    }
    // Short digits → Member ID e.g. "42" → "RW-00042"
    if (/^\d{1,9}$/.test(s)) return `RW-${s.padStart(5, '0')}`
    return s
  }

  // Lookup
  const handleSearchChange = val => {
    val = val.replace(/\D/g, '')  // digits only
    setSearchQuery(val); setRecipient(null); setLookupError('')
    clearTimeout(lookupTimer.current)
    if (!val.trim()) return
    lookupTimer.current = setTimeout(() => doLookup(val.trim()), 600)
  }
  const doLookup = async q => {
    setLookupLoading(true); setLookupError('')
    const normalized = normalizeQuery(q)
    try {
      const res  = await fetch(`${API}/api/wallet/lookup?q=${encodeURIComponent(normalized)}`, { headers: { Authorization: 'Bearer ' + token } })
      const data = await res.json()
      if (!res.ok) return setLookupError(data.error || t('Lookup failed', 'فشل البحث'))
      if (!data.found) return setLookupError(t('No member found', 'لا يوجد عضو بهذا الرقم'))
      setRecipient({ uid: data.uid, name: data.name })
    } catch { setLookupError(t('Connection error', 'خطأ في الاتصال')) }
    finally { setLookupLoading(false) }
  }
  const handleQrScan = text => {
    setShowScanner(false); setSearchQuery(text.trim()); doLookup(text.trim()); setShowSend(true)
  }
  const handleSend = async e => {
    e.preventDefault(); setSendError(''); setSendSuccess(false)
    if (!recipient) return setSendError(t('Find a recipient first', 'ابحث عن مستلم أولاً'))
    const amt = Number(sendAmount)
    if (!amt || amt <= 0) return setSendError(t('Enter a valid amount', 'أدخل مبلغاً صحيحاً'))
    if (amt > balance) return setSendError(t('Insufficient balance', 'رصيد غير كافٍ'))
    setSendLoading(true)
    try {
      const res  = await fetch(`${API}/api/wallet/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ to_uid: recipient.uid, amount: amt }),
      })
      const data = await res.json()
      if (!res.ok) return setSendError(data.error || t('Transfer failed', 'فشل التحويل'))
      setBalance(data.balance !== undefined ? data.balance : balance - amt)
      setSendSuccess(true)
      setRecipient(null); setSearchQuery(''); setSendAmount('')
      loadTransactions()
    } catch { setSendError(t('Connection error', 'خطأ في الاتصال')) }
    finally { setSendLoading(false) }
  }

  const bg   = isDark ? '#0b1220' : '#f2efe9'
  const card_text = '#ffffff'

  const avatarColors = ['#146C94','#19A7CE','#0e3d52','#1a6650']

  return (
    <div style={{ minHeight: '100dvh', background: bg, display: 'flex', flexDirection: 'column', paddingTop: 'calc(env(safe-area-inset-top) + 48px)', paddingBottom: '90px' }}>

      {/* ── Top bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {customer.avatar_url
            ? <img src={customer.avatar_url} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
            : <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#146C94', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{initials}</span>
              </div>
          }
          <div>
            <p style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', margin: 0 }}>{t('Good morning,', 'صباح الخير،')}</p>
            <p style={{ fontSize: '14px', fontWeight: 700, color: isDark ? '#e0e3e5' : '#0d1825', margin: 0 }}>{firstName}</p>
          </div>
        </div>
      </div>

      {/* ── Teal wallet card ── */}
      <div style={{ padding: '8px 20px 0' }}>
        <div style={{
          background: 'linear-gradient(135deg,#146C94 0%,#0a3d52 100%)',
          borderRadius: '20px',
          padding: '24px 22px 20px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(20,108,148,0.30)',
        }}>
          {/* Rasha R logo watermark — centered */}
          <img src="/rasha-logo.png" alt="" aria-hidden="true"
            style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 200, height: 200, objectFit: 'contain', opacity: 0.15, pointerEvents: 'none', userSelect: 'none' }} />

          {/* Spacer replacing removed currency pill */}
          <div style={{ marginBottom: '16px' }} />

          {/* Balance */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <p style={{ fontSize: '32px', fontWeight: 800, color: card_text, fontFamily: 'Space Mono,monospace', margin: 0, letterSpacing: '-0.02em' }}>
              {balanceVisible ? `${balance.toLocaleString('en', { minimumFractionDigits: 2 })}` : '••••••••'}
            </p>
            <button onClick={() => setBalanceVisible(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'rgba(255,255,255,0.5)' }}>{balanceVisible ? 'visibility_off' : 'visibility'}</span>
            </button>
          </div>

          {/* Card details row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', margin: '0 0 2px', letterSpacing: '0.05em' }}>{t('Member ID', 'رقم العضوية')}</p>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', margin: 0, fontFamily: 'monospace' }}>{customer.customer_uid}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.4)' }} />
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', marginLeft: '-8px' }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Send ── */}
      <div style={{ padding: '24px 20px 0' }}>
        <p style={{ fontSize: '15px', fontWeight: 700, color: isDark ? '#e0e3e5' : '#0d1825', margin: '0 0 14px' }}>{t('Quick send', 'إرسال سريع')}</p>
        <div style={{ display: 'flex', gap: '18px', overflowX: 'auto', paddingBottom: '4px' }}>
          {/* Add contact */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flexShrink: 0, cursor: 'pointer' }}
            onClick={() => { setSearchQuery(''); setRecipient(null); setLookupError(''); setShowAddContact(true) }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', border: '2px dashed rgba(20,108,148,0.3)', background: isDark ? 'rgba(20,108,148,0.08)' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px', color: '#146C94' }}>add</span>
            </div>
            <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.4)' : '#8aabb8', fontWeight: 500 }}>{t('Add', 'أضف')}</span>
          </div>
          {/* Saved contacts */}
          {contacts.map((c, i) => {
            const initials2 = c.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
            const firstName2 = c.name.split(' ')[0]
            return (
              <div key={c.uid} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flexShrink: 0, position: 'relative' }}>
                <div onClick={() => { setRecipient(c); setSearchQuery(c.uid); setSendAmount(''); setSendError(''); setSendSuccess(false); setShowSend(true) }}
                  style={{ width: 48, height: 48, borderRadius: '50%', background: avatarColors[i % avatarColors.length], display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{initials2}</span>
                </div>
                {/* Remove button */}
                <button onClick={() => removeContact(c.uid)}
                  style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: '#c0392b', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '10px', color: '#fff', lineHeight: 1 }}>close</span>
                </button>
                <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.4)' : '#8aabb8', fontWeight: 500, maxWidth: 48, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>{firstName2}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Transaction History ── */}
      <div style={{ padding: '24px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <p style={{ fontSize: '15px', fontWeight: 700, color: isDark ? '#e0e3e5' : '#0d1825', margin: 0 }}>{t('Transaction history', 'سجل المعاملات')}</p>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#19A7CE', cursor: 'pointer' }}>{t('View all', 'عرض الكل')}</span>
        </div>

        {txLoading && [0,1,2].map(i => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}` }}>
            <div className="shimmer" style={{ width: 44, height: 44, borderRadius: '14px', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="shimmer" style={{ height: '12px', borderRadius: '6px', width: '55%', marginBottom: '6px' }} />
              <div className="shimmer" style={{ height: '10px', borderRadius: '6px', width: '35%' }} />
            </div>
            <div className="shimmer" style={{ height: '12px', width: '60px', borderRadius: '6px' }} />
          </div>
        ))}

        {!txLoading && txError && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '36px', color: 'rgba(20,108,148,0.3)' }}>cloud_off</span>
            <p style={{ fontSize: '13px', color: '#146C94', marginTop: '8px', fontWeight: 600 }}>{t('Could not load transactions', 'تعذر التحميل')}</p>
            <button onClick={loadTransactions} style={{ background: 'none', border: 'none', color: '#19A7CE', fontWeight: 700, fontSize: '13px', cursor: 'pointer', marginTop: '6px' }}>{t('Retry', 'إعادة المحاولة')}</button>
          </div>
        )}

        {!txLoading && !txError && transactions.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '44px', color: 'rgba(20,108,148,0.2)' }}>receipt_long</span>
            <p style={{ fontSize: '14px', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.4)' : '#aaa', marginTop: '10px' }}>{t('No transactions yet', 'لا توجد معاملات بعد')}</p>
          </div>
        )}

        {!txLoading && !txError && transactions.map(tx => {
          const credit = tx.amount >= 0
          const { icon, color, bg: iconBg } = txIcon(tx)
          return (
            <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}` }}>
              <div style={{ width: 44, height: 44, borderRadius: '14px', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color }}>{icon}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '14px', fontWeight: 600, color: isDark ? '#e0e3e5' : '#0d1825', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{txLabel(tx)}</p>
                <p style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.35)' : '#aaa', margin: 0 }}>{fmtDate(tx.created_at)}</p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontSize: '14px', fontWeight: 700, color: credit ? '#27ae60' : (isDark ? '#e0e3e5' : '#0d1825'), margin: '0 0 3px', fontFamily: 'monospace' }} dir="ltr">
                  {credit ? '+' : '−'}{Math.abs(tx.amount).toLocaleString('en', { minimumFractionDigits: 2 })}
                </p>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#27ae60', background: 'rgba(39,174,96,0.1)', borderRadius: '6px', padding: '2px 6px' }}>
                  {t('Paid', 'مدفوع')}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── My QR modal ── */}
      {showMyQr && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'flex-end' }}
          onClick={() => setShowMyQr(false)}>
          <div style={{ width: '100%', background: isDark ? '#0f1e30' : '#fff', borderRadius: '28px 28px 0 0', padding: '24px 24px calc(40px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.12)' }} />
            <p style={{ fontSize: '16px', fontWeight: 800, color: isDark ? '#e0e3e5' : '#0d1825' }}>{t('My QR Code', 'رمز QR الخاص بي')}</p>
            <p style={{ fontSize: '12px', color: isDark ? 'rgba(255,255,255,0.4)' : '#999', textAlign: 'center' }}>
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

      {/* ── Add Contact modal ── */}
      {showAddContact && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'flex-end' }}
          onClick={() => { setShowAddContact(false); setRecipient(null); setSearchQuery(''); setLookupError('') }}>
          <div style={{ width: '100%', background: isDark ? '#0f1e30' : '#fff', borderRadius: '28px 28px 0 0', padding: '24px 20px calc(40px + env(safe-area-inset-bottom))' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.12)', margin: '0 auto 20px' }} />
            <p style={{ fontSize: '18px', fontWeight: 800, color: isDark ? '#e0e3e5' : '#0d1825', marginBottom: '20px' }}>{t('Add to Quick Send', 'أضف لإرسال سريع')}</p>

            <label style={{ fontSize: '12px', fontWeight: 700, color: isDark ? 'rgba(255,255,255,0.55)' : '#146C94', display: 'block', marginBottom: '6px' }}>
              {t('Phone or Member number', 'رقم الهاتف أو رقم العضو')}
            </label>
            <div style={{ display: 'flex', gap: '8px', position: 'relative' }} ref={dialPickerRef}>
              {/* Country dial picker */}
              <button type="button" onClick={() => setDialPickerOpen(o => !o)}
                style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px', padding: '0 10px', borderRadius: '12px', border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(20,108,148,0.18)'}`, background: isDark ? 'rgba(255,255,255,0.05)' : '#f9f9f9', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: isDark ? '#e0e3e5' : '#0d1825', whiteSpace: 'nowrap' }}>
                <span style={{ fontSize: '18px' }}>{COUNTRIES.find(c => c.dial === searchDialCode)?.flag}</span>
                <span>{searchDialCode}</span>
                <span className="material-symbols-outlined" style={{ fontSize: '14px', color: isDark ? 'rgba(255,255,255,0.4)' : '#888' }}>{dialPickerOpen ? 'expand_less' : 'expand_more'}</span>
              </button>
              {/* Dropdown */}
              {dialPickerOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 60, width: '240px', borderRadius: '14px', overflow: 'hidden', background: isDark ? '#0f1e30' : '#fff', boxShadow: '0 12px 40px rgba(0,0,0,0.25)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` }}>
                  <div style={{ padding: '8px' }}>
                    <input autoFocus value={dialSearch} onChange={e => setDialSearch(e.target.value)} placeholder="Search country…"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e0e0e0'}`, background: isDark ? 'rgba(255,255,255,0.05)' : '#f5f5f5', color: isDark ? '#e0e3e5' : '#0d1825', fontSize: '12px', outline: 'none' }} />
                  </div>
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {COUNTRIES.filter(c => !dialSearch || c.name.toLowerCase().includes(dialSearch.toLowerCase()) || c.dial.includes(dialSearch)).map(c => (
                      <button key={c.code} type="button"
                        onClick={() => { setSearchDialCode(c.dial); setDialPickerOpen(false); setDialSearch(''); setRecipient(null); setLookupError('') }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: c.dial === searchDialCode ? 'rgba(20,108,148,0.1)' : 'transparent', border: 'none', cursor: 'pointer', color: isDark ? '#e0e3e5' : '#0d1825', textAlign: 'left' }}>
                        <span style={{ fontSize: '16px' }}>{c.flag}</span>
                        <span style={{ flex: 1, fontSize: '12px', fontWeight: 500 }}>{c.name}</span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#146C94' }}>{c.dial}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {/* Number input */}
              <div style={{ flex: 1, position: 'relative' }}>
                <input value={searchQuery} onChange={e => handleSearchChange(e.target.value)}
                  placeholder={t('Member ID or Phone', 'رقم العضوية أو الهاتف')}
                  inputMode="numeric" pattern="[0-9]*"
                  autoFocus
                  style={{ width: '100%', padding: '12px 40px 12px 14px', borderRadius: '12px', border: `1.5px solid ${recipient ? '#19A7CE' : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(20,108,148,0.18)'}`, background: isDark ? 'rgba(255,255,255,0.05)' : '#f9f9f9', color: isDark ? '#e0e3e5' : '#0d1825', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                {lookupLoading && <span className="material-symbols-outlined" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: '18px', color: '#146C94' }}>progress_activity</span>}
                {recipient && <span className="material-symbols-outlined" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: '18px', color: '#19A7CE' }}>check_circle</span>}
              </div>
            </div>
            {lookupError && <p style={{ fontSize: '12px', color: '#c0392b', marginTop: '6px', fontWeight: 600 }}>{lookupError}</p>}

            {recipient && (
              <div style={{ marginTop: '12px', padding: '12px 14px', borderRadius: '12px', background: 'rgba(25,167,206,0.08)', border: '1px solid rgba(25,167,206,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#146C94', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{recipient.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}</span>
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: isDark ? '#e0e3e5' : '#0d1825', margin: 0 }}>{recipient.name}</p>
                    <p style={{ fontSize: '11px', color: '#19A7CE', fontFamily: 'monospace', margin: 0 }}>{recipient.uid}</p>
                  </div>
                </div>
                <button onClick={() => { saveContact(recipient); setShowAddContact(false); setRecipient(null); setSearchQuery('') }}
                  style={{ padding: '8px 16px', borderRadius: '10px', background: '#146C94', color: '#fff', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>person_add</span>
                  {t('Add', 'أضف')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Send modal ── */}
      {showSend && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'flex-end' }}
          onClick={() => { setShowSend(false); setSendSuccess(false); setSendError('') }}>
          <div style={{ width: '100%', background: isDark ? '#0f1e30' : '#fff', borderRadius: '28px 28px 0 0', padding: '24px 20px calc(40px + env(safe-area-inset-bottom))', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.12)', margin: '0 auto 20px' }} />

            <p style={{ fontSize: '18px', fontWeight: 800, color: isDark ? '#e0e3e5' : '#0d1825', marginBottom: '20px' }}>{t('Quick Send', 'إرسال سريع')}</p>

            {sendSuccess && (
              <div style={{ background: 'rgba(39,174,96,0.1)', border: '1px solid rgba(39,174,96,0.2)', borderRadius: '14px', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="material-symbols-outlined" style={{ color: '#27ae60', fontSize: '20px' }}>check_circle</span>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#27ae60' }}>{t('Transfer sent successfully!', 'تم إرسال التحويل بنجاح!')}</p>
              </div>
            )}

            {/* Scan button */}
            <button onClick={() => { setShowSend(false); setShowScanner(true) }}
              style={{ width: '100%', padding: '12px', borderRadius: '14px', border: '2px dashed rgba(20,108,148,0.25)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', marginBottom: '16px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#146C94' }}>qr_code_scanner</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#146C94' }}>{t('Scan Recipient QR', 'مسح رمز المستلم')}</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(20,108,148,0.12)' }} />
              <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.35)' : '#aaa', fontWeight: 600 }}>{t('or enter manually', 'أو أدخل يدوياً')}</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(20,108,148,0.12)' }} />
            </div>

            <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: isDark ? 'rgba(255,255,255,0.55)' : '#146C94', display: 'block', marginBottom: '6px' }}>
                  {t('Phone or Member ID', 'رقم الجوال أو رقم العضوية')}
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" onClick={() => setDialPickerOpen(o => !o)}
                    style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px', padding: '0 10px', borderRadius: '12px', border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(20,108,148,0.18)'}`, background: isDark ? 'rgba(255,255,255,0.05)' : '#f9f9f9', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: isDark ? '#e0e3e5' : '#0d1825', whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: '18px' }}>{COUNTRIES.find(c => c.dial === searchDialCode)?.flag}</span>
                    <span>{searchDialCode}</span>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px', color: isDark ? 'rgba(255,255,255,0.4)' : '#888' }}>expand_more</span>
                  </button>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <input value={searchQuery} onChange={e => handleSearchChange(e.target.value)}
                      placeholder={t('Member ID or Phone', 'رقم العضوية أو الهاتف')}
                      inputMode="numeric" pattern="[0-9]*"
                      style={{ width: '100%', padding: '12px 40px 12px 14px', borderRadius: '12px', border: `1.5px solid ${recipient ? '#19A7CE' : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(20,108,148,0.18)'}`, background: isDark ? 'rgba(255,255,255,0.05)' : '#f9f9f9', color: isDark ? '#e0e3e5' : '#0d1825', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                    {lookupLoading && <span className="material-symbols-outlined" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: '18px', color: '#146C94' }}>progress_activity</span>}
                    {recipient && <span className="material-symbols-outlined" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: '18px', color: '#19A7CE' }}>check_circle</span>}
                  </div>
                </div>
                {recipient && (
                  <div style={{ marginTop: '8px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(25,167,206,0.08)', border: '1px solid rgba(25,167,206,0.2)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#146C94', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>{recipient.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}</span>
                    </div>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: isDark ? '#e0e3e5' : '#0d1825', margin: 0 }}>{recipient.name}</p>
                      <p style={{ fontSize: '11px', color: '#19A7CE', fontFamily: 'monospace', margin: 0 }}>{recipient.uid}</p>
                    </div>
                  </div>
                )}
                {lookupError && <p style={{ fontSize: '12px', color: '#c0392b', marginTop: '6px', fontWeight: 600 }}>{lookupError}</p>}
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: isDark ? 'rgba(255,255,255,0.55)' : '#146C94', display: 'block', marginBottom: '6px' }}>{t('Amount (SDG)', 'المبلغ (جنيه)')}</label>
                <input type="number" min="1" value={sendAmount} onChange={e => { setSendAmount(e.target.value); setSendError('') }}
                  placeholder="0"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(20,108,148,0.18)'}`, background: isDark ? 'rgba(255,255,255,0.05)' : '#f9f9f9', color: isDark ? '#e0e3e5' : '#0d1825', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                <p style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.3)' : '#aaa', marginTop: '4px' }}>{t('Balance:', 'رصيدك:')} {balance.toLocaleString('en')} SDG</p>
              </div>

              {sendError && <p style={{ fontSize: '13px', color: '#c0392b', fontWeight: 600 }}>{sendError}</p>}

              <button type="submit" disabled={sendLoading || !recipient}
                style={{ padding: '14px', borderRadius: '14px', background: (!recipient || sendLoading) ? '#c0d8e4' : '#146C94', color: '#fff', fontSize: '15px', fontWeight: 700, border: 'none', cursor: (!recipient || sendLoading) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {sendLoading ? t('Sending…', 'جاري الإرسال…') : <><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>send</span>{t('Send Money', 'إرسال المبلغ')}</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── QR Scanner ── */}
      {showScanner && <QrScannerModal onScan={handleQrScan} onClose={() => setShowScanner(false)} />}
    </div>
  )
}
