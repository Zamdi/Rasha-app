import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useApp, API } from '../context/AppContext'
import { formatTime } from '../utils/format'
import CalendarPicker from '../components/CalendarPicker'

const today = () => {
  // Use Khartoum local time (UTC+3) so the minimum date is never yesterday
  const d = new Date(Date.now() + 3 * 60 * 60 * 1000)
  return d.toISOString().slice(0, 10)
}

export default function Booking() {
  const { t, lang, customer, token, showToast, login } = useApp()
  const navigate = useNavigate()
  const location = useLocation()

  // Guests must register/sign in before booking
  useEffect(() => {
    if (!customer) {
      navigate('/register', { state: { returnTo: '/book' }, replace: true })
    }
  }, [customer, navigate])

  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    vehicle: '',
    service: location.state?.service || 'full',
    date: today(),
  })
  const [selectedSlot, setSelectedSlot] = useState('')
  const [slots, setSlots] = useState({ available: [], booked: [] })
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [payFromWallet, setPayFromWallet] = useState(false)
  const walletBalance = customer?.wallet_balance || 0
  // Pulled from the server rather than hardcoded — staff can change prices
  // from the Expenses tab and this must reflect that without a redeploy.
  // Falls back to the values that were compiled in here until recently, so
  // the page still shows something sane if the request fails.
  const [servicePrices, setServicePrices] = useState({ full: 8500, outside: 5000 })
  const price = servicePrices[form.service] || 0
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch(`${API}/api/bookings/pricing`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setServicePrices({ full: Number(d.full) || 0, outside: Number(d.outside) || 0 }))
      .catch(() => {}) // keep the fallback values
  }, [])

  useEffect(() => { if (form.date) loadSlots(form.date) }, [form.date])

  const loadSlots = async (date) => {
    setSlotsLoading(true)
    setSelectedSlot('')
    try {
      const res = await fetch(`${API}/api/bookings/slots?date=${date}`)
      const data = await res.json()
      setSlots({ available: data.available || [], booked: data.booked || [] })
    } catch { showToast(t('Could not load slots', 'تعذر تحميل المواعيد'), 'error') }
    finally { setSlotsLoading(false) }
  }

  const goToStep2 = () => {
    if (!form.date) {
      showToast(t('Please select a date', 'يرجى اختيار تاريخ'), 'error'); return
    }
    if (form.date < today()) {
      showToast(t('Please choose today or a future date', 'يرجى اختيار تاريخ اليوم أو تاريخ لاحق'), 'error')
      setForm(f => ({ ...f, date: today() }))
      return
    }
    setStep(2); window.scrollTo(0, 0)
  }

  const goToStep3 = () => {
    if (!selectedSlot) { showToast(t('Please select a time slot', 'اختر موعداً'), 'error'); return }
    setStep(3); window.scrollTo(0, 0)
  }

  const submitBooking = async () => {
    if (form.date < today()) {
      showToast(t('Please choose today or a future date', 'يرجى اختيار تاريخ اليوم أو تاريخ لاحق'), 'error')
      setForm(f => ({ ...f, date: today() }))
      setStep(1)
      return
    }
    if (payFromWallet && walletBalance < price) {
      showToast(t(`Wallet balance insufficient. You have ${walletBalance.toLocaleString()} SDG, need ${price.toLocaleString()} SDG.`, `رصيد المحفظة غير كافٍ. لديك ${walletBalance.toLocaleString()} SDG، تحتاج ${price.toLocaleString()} SDG.`), 'error')
      return
    }
    setLoading(true)
    const headers = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = 'Bearer ' + token
    try {
      const res = await fetch(`${API}/api/bookings`, {
        method: 'POST', headers,
        body: JSON.stringify({
          name: customer ? `${customer.first_name} ${customer.last_name}` : '',
          phone: customer?.phone || '',
          email: customer?.email || undefined,
          vehicle: form.vehicle || undefined,
          service: form.service,
          date: form.date,
          time: selectedSlot,
          payFromWallet: !!payFromWallet,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.code === 'INSUFFICIENT_WALLET') {
          showToast(t('Wallet balance insufficient', 'رصيد المحفظة غير كافٍ'), 'error')
        } else {
          showToast(data.error || t('Booking failed', 'فشل الحجز'), 'error')
        }
        return
      }
      // Update wallet balance in context if paid from wallet
      if (payFromWallet && data.walletBalance !== null && customer) {
        login(token, { ...customer, wallet_balance: data.walletBalance })
      }
      const ref = '#RSH-' + data.booking.booking_uid.replace('BK-', '')
      const custName = customer ? `${customer.first_name} ${customer.last_name}` : ''
      navigate('/confirmation', { state: { ref, service: form.service, date: form.date, time: selectedSlot, name: custName, phone: customer?.phone, email: customer?.email, vehicle: form.vehicle, paidFromWallet: payFromWallet, amount: price } })
    } catch { showToast(t('Connection error', 'خطأ في الاتصال'), 'error') }
    finally { setLoading(false) }
  }

  const serviceLabel = form.service === 'full' ? t('Full Wash', 'غسيل كامل') : t('Exterior Only', 'خارجي فقط')

  const StepCircle = ({ n, active }) => (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${active || step > n ? 'hydro-gradient text-white' : 'bg-surface-container-highest border border-outline-variant text-on-surface-variant'}`}>{step > n ? '✓' : n}</div>
  )

  return (
    <div className="pt-14 pb-24 md:pb-10 min-h-screen">
      <div className="max-w-xl mx-auto px-4 md:px-6 pt-4 pb-8 md:pt-8">
        <button onClick={() => step > 1 ? setStep(s => s-1) : navigate(-1)} className="flex items-center gap-2 text-on-surface-variant hover:text-secondary-fixed transition-colors text-sm mb-6">
          <span className="material-symbols-outlined rtl-flip text-base">arrow_back</span>
          {t('Back', 'رجوع')}
        </button>

        <h1 className="text-3xl font-bold text-on-surface font-display mb-1">{t('Book a Wash', 'احجز غسيل')}</h1>
        <p className="text-on-surface-variant text-sm mb-8">{t("Choose your service, pick a time, and you're done.", 'اختر خدمتك، حدد الوقت.')}</p>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          <StepCircle n={1} active={step === 1} />
          <span className={`text-xs font-semibold hidden sm:block ${step === 1 ? 'text-secondary-fixed' : 'text-on-surface-variant'}`}>{t('Details', 'التفاصيل')}</span>
          <div className="flex-1 h-px" style={{background:'var(--color-outline-variant)', opacity:0.4}} />
          <StepCircle n={2} active={step === 2} />
          <span className={`text-xs font-semibold hidden sm:block ${step === 2 ? 'text-secondary-fixed' : 'text-on-surface-variant'}`}>{t('Time Slot', 'الموعد')}</span>
          <div className="flex-1 h-px" style={{background:'var(--color-outline-variant)', opacity:0.4}} />
          <StepCircle n={3} active={step === 3} />
          <span className={`text-xs font-semibold hidden sm:block ${step === 3 ? 'text-secondary-fixed' : 'text-on-surface-variant'}`}>{t('Confirm', 'التأكيد')}</span>
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="glass p-6 rounded-2xl space-y-4 animate-fade-in">
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">{t('Vehicle Info (optional)', 'السيارة (اختياري)')}</label>
              <input className="rasha-input" placeholder={t('e.g. Toyota Camry - White', 'مثال: تويوتا كامري - أبيض')} value={form.vehicle} onChange={e => setForm(f => ({...f, vehicle: e.target.value}))} />
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">{t('Service Type', 'نوع الخدمة')} *</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'full',    label: t('Full Wash', 'غسيل كامل'),    sub: t('Interior + Exterior', 'داخلي + خارجي'), icon: 'local_car_wash', price: `${servicePrices.full.toLocaleString()} SDG` },
                  { value: 'outside', label: t('Exterior Only', 'خارجي فقط'), sub: t('Exterior cleaning', 'تنظيف خارجي'),    icon: 'water_drop',    price: `${servicePrices.outside.toLocaleString()} SDG` },
                ].map(opt => {
                  const active = form.service === opt.value
                  return (
                    <button key={opt.value} type="button"
                      onClick={() => setForm(f => ({ ...f, service: opt.value }))}
                      className="relative p-4 rounded-xl text-left transition-all"
                      style={{
                        background: active ? 'rgba(var(--color-secondary-fixed-rgb),0.08)' : 'var(--input-bg)',
                        border: active ? '2px solid var(--color-secondary-fixed)' : '1px solid var(--color-outline-variant)',
                      }}>
                      <span className={`material-symbols-outlined text-2xl mb-2 block ${active ? 'fill-icon text-secondary-fixed' : 'text-on-surface-variant'}`}>{opt.icon}</span>
                      <p className={`text-sm font-bold mb-0.5 ${active ? 'text-secondary-fixed' : 'text-on-surface'}`}>{opt.label}</p>
                      <p className="text-xs text-on-surface-variant">{opt.sub}</p>
                      <p className="text-xs font-bold mt-1.5 text-on-surface-variant">{opt.price}</p>
                      {active && (
                        <span className="material-symbols-outlined fill-icon text-secondary-fixed absolute top-2 end-2" style={{ fontSize: '16px' }}>check_circle</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">{t('Date', 'التاريخ')} *</label>
              <CalendarPicker
                value={form.date}
                onChange={picked => {
                  if (picked < today()) {
                    showToast(t('You cannot book a date in the past.', 'لا يمكنك الحجز في تاريخ سابق.'), 'error')
                    return
                  }
                  setForm(f => ({ ...f, date: picked }))
                }}
                minDate={today()}
                lang={lang}
              />
            </div>
            <button onClick={goToStep2} className="btn-primary w-full py-4 rounded-xl">
              {t('Choose Time Slot', 'اختر الموعد')}
              <span className="material-symbols-outlined rtl-flip text-base">arrow_forward</span>
            </button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div className="glass p-6 rounded-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-on-surface">{t('Available Slots', 'المواعيد المتاحة')}</h3>
                <span className="text-xs text-secondary-fixed font-bold">
                  {new Date(form.date + 'T12:00:00').toLocaleDateString(t('en-US', 'ar-EG'), { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
              </div>
              {slotsLoading ? (
                <div className="flex justify-center py-10"><div className="loader" /></div>
              ) : slots.available.length === 0 ? (
                <p className="text-center text-on-surface-variant text-sm py-4">{t('No slots available for this date.', 'لا توجد مواعيد متاحة.')}</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {slots.available.map(slot => {
                    const selected = selectedSlot === slot
                    return (
                      <button
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2 px-1 text-xs font-semibold rounded-xl transition-all ${selected ? 'slot-selected' : 'slot-available'}`}
                        dir="ltr"
                      >
                        {formatTime(slot, lang)}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="btn-glass flex-1 py-4 rounded-xl">{t('Back', 'رجوع')}</button>
              <button onClick={goToStep3} className="btn-primary flex-1 py-4 rounded-xl">{t('Continue', 'متابعة')}</button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            <div className="glass p-6 rounded-2xl">
              <h3 className="font-bold text-on-surface mb-4">{t('Review & Confirm', 'مراجعة وتأكيد')}</h3>
              <div className="space-y-3 text-sm">
                {[
                  [t('Name','الاسم'), customer ? `${customer.first_name} ${customer.last_name}` : '', false],
                  [t('Phone','الهاتف'), customer?.phone || '', true],
                  ...(customer?.email ? [[t('Email','البريد'), customer.email, false]] : []),
                  [t('Service','الخدمة'), serviceLabel, false],
                  [t('Date','التاريخ'), new Date(form.date + 'T12:00:00').toLocaleDateString(t('en-US','ar-EG'), {year:'numeric',month:'long',day:'numeric'}), false],
                  [t('Time','الوقت'), formatTime(selectedSlot, lang), true],
                  ...(form.vehicle ? [[t('Vehicle','السيارة'), form.vehicle, false]] : []),
                ].map(([label, value, ltr], idx, arr) => (
                  <div key={label} className="flex justify-between py-2"
                    style={{borderBottom: idx < arr.length - 1 ? '1px solid var(--color-outline-variant)' : 'none'}}>
                    <span className="text-on-surface-variant">{label}</span>
                    <span className={`font-semibold ${label === t('Time','الوقت') ? 'text-secondary-fixed' : 'text-on-surface'}`}
                      dir={ltr ? 'ltr' : undefined} style={ltr ? {unicodeBidi:'embed'} : undefined}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Method — only for logged-in customers */}
            {customer && (
              <div className="glass p-5 rounded-2xl space-y-3">
                <h3 className="font-bold text-on-surface text-sm">{t('Payment Method', 'طريقة الدفع')}</h3>
                <div className="space-y-2">
                  {/* Pay at location */}
                  <button onClick={() => setPayFromWallet(false)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold ${!payFromWallet ? 'text-secondary-fixed' : 'text-on-surface-variant'}`}
                    style={!payFromWallet
                      ? {background:'rgba(var(--color-secondary-fixed-rgb),0.08)', border:'1px solid rgba(var(--color-secondary-fixed-rgb),0.3)'}
                      : {background:'var(--input-bg)', border:'1px solid var(--color-outline-variant)'}}>
                    <span className="material-symbols-outlined text-xl">payments</span>
                    <div className="text-start">
                      <p>{t('Pay at Location', 'الدفع عند الموقع')}</p>
                      <p className="text-xs opacity-60 font-normal">{t('Cash or card on arrival', 'نقداً أو بطاقة عند الوصول')}</p>
                    </div>
                    {!payFromWallet && <span className="material-symbols-outlined fill-icon ms-auto">check_circle</span>}
                  </button>

                  {/* Pay from wallet — a div, not a button, because the
                      "How to top up" link below must be a real interactive
                      child; nesting an <a> inside a <button> is invalid HTML. */}
                  <div role="button" tabIndex={0}
                    onClick={() => setPayFromWallet(true)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPayFromWallet(true) } }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold cursor-pointer ${payFromWallet ? 'text-secondary-fixed' : 'text-on-surface-variant'}`}
                    style={payFromWallet
                      ? {background:'rgba(var(--color-secondary-fixed-rgb),0.08)', border:'1px solid rgba(var(--color-secondary-fixed-rgb),0.3)'}
                      : {background:'var(--input-bg)', border:'1px solid var(--color-outline-variant)'}}>
                    <span className="material-symbols-outlined text-xl">account_balance_wallet</span>
                    <div className="text-start flex-1">
                      <p>{t('Pay from Wallet', 'الدفع من المحفظة')}</p>
                      <p className={`text-xs font-normal mt-0.5 ${walletBalance < price ? 'text-error' : 'opacity-60'}`} dir="ltr" style={{unicodeBidi:'embed'}}>
                        {t('Balance:', 'الرصيد:')} {walletBalance.toLocaleString()} SDG
                        {walletBalance < price && <span className="ms-2 font-bold">{t('• Insufficient', '• غير كافٍ')}</span>}
                      </p>
                      {walletBalance < price && (
                        <Link to="/wallet" onClick={e => e.stopPropagation()}
                          className="text-xs font-bold text-secondary-fixed hover:underline mt-1 inline-block">
                          {t('How to top up →', 'كيفية الشحن ←')}
                        </Link>
                      )}
                    </div>
                    {payFromWallet && <span className="material-symbols-outlined fill-icon">check_circle</span>}
                  </div>
                </div>

                {/* Price summary */}
                <div className="flex justify-between items-center pt-2 text-sm" style={{borderTop:'1px solid var(--color-outline-variant)'}}>
                  <span className="text-on-surface-variant">{t('Service Price', 'سعر الخدمة')}</span>
                  <span className="font-bold text-on-surface" dir="ltr">{price.toLocaleString()} SDG</span>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="btn-glass flex-1 py-4 rounded-xl">{t('Back', 'رجوع')}</button>
              <button onClick={submitBooking} disabled={loading || (payFromWallet && walletBalance < price)} className="btn-primary flex-1 py-4 rounded-xl disabled:opacity-50">
                {loading ? <div className="loader" /> : t('Confirm Booking', 'تأكيد الحجز')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
