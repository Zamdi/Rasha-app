import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp, API } from '../context/AppContext'

const WHATSAPP_NUMBER = '249900088989'
const WHATSAPP_DISPLAY = '+249 9000 88989'

export default function Contact() {
  const { t } = useApp()
  const [form, setForm] = useState({ name: '', email: '', subject: 'General Inquiry', message: '' })
  const [sent, setSent] = useState(false)
  const [reference, setReference] = useState(null)
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.message) return
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        // Show the real backend error
        alert(data.error || 'Failed to send message. Please try again.')
        return
      }
      if (data.reference) setReference(data.reference)
      setSent(true)
    } catch {
      alert('Connection error. Please check your internet and try again.')
    } finally {
      setLoading(false)
    }
  }

  const openWhatsApp = () => {
    const msg = encodeURIComponent(t('Hello! I need help with my Rasha booking.', 'مرحباً! أحتاج مساعدة بخصوص حجزي في رشة.'))
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank')
  }

  const subjects = [
    t('General Inquiry', 'استفسار عام'),
    t('Booking Issue', 'مشكلة في الحجز'),
    t('Loyalty Rewards', 'مكافآت الولاء'),
    t('Feedback', 'ملاحظات'),
  ]

  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0" style={{ background: 'var(--color-background)' }}>
      <main className="flex-grow w-full max-w-6xl mx-auto px-4 md:px-6 pt-16 pb-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold font-display mb-4 text-secondary-fixed">
            {t('Contact Support', 'تواصل مع الدعم')}
          </h1>
          <p className="text-on-surface-variant text-base max-w-2xl mx-auto leading-relaxed">
            {t("We're here to ensure your Rasha experience is seamless. Whether you have a question about our services or need help with a booking, our team is ready to assist.",
              'نحن هنا لضمان تجربة سلسة مع رشة. سواء كان لديك سؤال عن خدماتنا أو تحتاج مساعدة في الحجز، فريقنا مستعد.')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          {/* Left: Email form */}
          <div className="lg:col-span-3 rounded-2xl p-6 md:p-8"
            style={{ background: 'var(--color-surface-container)', border: '1px solid var(--color-outline-variant)' }}>
            <h2 className="text-2xl font-bold text-on-surface font-display mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary-fixed text-2xl">mail</span>
              {t('Drop us an email', 'راسلنا عبر البريد')}
            </h2>

            {sent ? (
              <div className="text-center py-12">
                <span className="material-symbols-outlined fill-icon text-secondary-fixed text-6xl mb-4 block">check_circle</span>
                <h3 className="text-xl font-bold text-on-surface mb-2">{t('Message Sent!', 'تم الإرسال!')}</h3>
                <p className="text-on-surface-variant text-sm max-w-xs mx-auto">
                  {t("We've received your message and will get back to you as soon as possible.", 'استلمنا رسالتك وسنرد عليك في أقرب وقت ممكن.')}
                </p>
                {reference && (
                  <div className="mt-5 inline-flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: 'rgba(var(--color-secondary-fixed-rgb),0.08)', border: '1px solid rgba(var(--color-secondary-fixed-rgb),0.2)' }}>
                    <span className="material-symbols-outlined text-secondary-fixed text-base">confirmation_number</span>
                    <div className="text-start">
                      <p className="text-xs text-on-surface-variant">{t('Your Reference Number', 'رقم المرجع')}</p>
                      <p className="text-sm font-bold text-secondary-fixed" dir="ltr">{reference}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">
                      {t('Full Name', 'الاسم الكامل')}
                    </label>
                    <input type="text" placeholder={t('John Doe', 'محمد أحمد')} value={form.name}
                      onChange={e => set('name', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg text-on-surface text-sm placeholder:text-outline focus:outline-none transition-all"
                      style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)' }}
                      onFocus={e => { e.target.style.borderColor = 'var(--color-secondary-fixed)'; e.target.style.boxShadow = '0 0 0 1px var(--color-secondary-fixed)' }}
                      onBlur={e => { e.target.style.borderColor = 'var(--input-border)'; e.target.style.boxShadow = 'none' }} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">
                      {t('Email Address', 'البريد الإلكتروني')}
                    </label>
                    <input type="email" placeholder="john@example.com" value={form.email}
                      onChange={e => set('email', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg text-on-surface text-sm placeholder:text-outline focus:outline-none transition-all"
                      style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)' }}
                      onFocus={e => { e.target.style.borderColor = 'var(--color-secondary-fixed)'; e.target.style.boxShadow = '0 0 0 1px var(--color-secondary-fixed)' }}
                      onBlur={e => { e.target.style.borderColor = 'var(--input-border)'; e.target.style.boxShadow = 'none' }} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">
                    {t('Subject', 'الموضوع')}
                  </label>
                  <select value={form.subject} onChange={e => set('subject', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg text-on-surface text-sm focus:outline-none transition-all appearance-none"
                    style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)' }}
                    onFocus={e => { e.target.style.borderColor = 'var(--color-secondary-fixed)' }}
                    onBlur={e => { e.target.style.borderColor = 'var(--input-border)' }}>
                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">
                    {t('How can we help?', 'كيف يمكننا مساعدتك؟')}
                  </label>
                  <textarea rows={6} placeholder={t('Describe your request in detail...', 'صف طلبك بالتفصيل...')}
                    value={form.message} onChange={e => set('message', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg text-on-surface text-sm placeholder:text-outline focus:outline-none transition-all resize-none"
                    style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)' }}
                    onFocus={e => { e.target.style.borderColor = 'var(--color-secondary-fixed)'; e.target.style.boxShadow = '0 0 0 1px var(--color-secondary-fixed)' }}
                    onBlur={e => { e.target.style.borderColor = 'var(--input-border)'; e.target.style.boxShadow = 'none' }} />
                </div>
                <button onClick={handleSubmit} disabled={loading || !form.name || !form.email || !form.message}
                  className="w-full h-14 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  style={{
                    background: form.name && form.email && form.message ? 'var(--color-secondary-container)' : 'rgba(0,241,254,0.3)',
                    color: form.name && form.email && form.message ? '#002022' : 'var(--color-outline)',
                    cursor: !form.name || !form.email || !form.message ? 'not-allowed' : 'pointer',
                  }}
                  onMouseEnter={e => { if (form.name && form.email && form.message) e.currentTarget.style.boxShadow = '0 0 20px rgba(var(--color-secondary-fixed-rgb), 0.4)' }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}>
                  {loading
                    ? <><div className="loader" style={{ borderTopColor: '#002022' }} />{t('Sending...', 'جارٍ الإرسال...')}</>
                    : <><span className="material-symbols-outlined">send</span>{t('Send Message', 'إرسال الرسالة')}</>}
                </button>
              </div>
            )}
          </div>

          {/* Right: WhatsApp + Hours */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl p-6" style={{ background: 'var(--color-surface-container)', border: '1px solid var(--color-outline-variant)' }}>
              <h2 className="text-2xl font-bold text-on-surface font-display mb-2 flex items-center gap-3">
                <span className="material-symbols-outlined fill-icon text-secondary-fixed text-2xl">chat</span>
                {t('WhatsApp Support', 'دعم واتساب')}
              </h2>
              <p className="text-on-surface-variant text-sm mb-5">
                {t('Need an instant response? Chat with our dedicated support representative directly on WhatsApp.',
                  'تحتاج ردًا فوريًا؟ تحدث مع ممثل دعمنا مباشرةً على واتساب.')}
              </p>
              <div className="flex items-center gap-3 px-4 py-4 rounded-xl mb-4"
                style={{ background: 'var(--input-bg)', border: '1px solid var(--color-outline-variant)' }}>
                <span className="material-symbols-outlined text-secondary-fixed text-xl">call</span>
                <span className="text-on-surface font-bold text-lg tracking-wide" dir="ltr" style={{unicodeBidi:'embed'}}>{WHATSAPP_DISPLAY}</span>
              </div>
              <button onClick={openWhatsApp}
                className="w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                style={{ background: '#25D366', color: 'white' }}
                onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
                onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                {t('Chat on WhatsApp', 'تحدث على واتساب')}
              </button>
            </div>
            <div className="rounded-2xl p-6" style={{ background: 'var(--color-surface-container)', border: '1px solid var(--color-outline-variant)' }}>
              <h2 className="text-xl font-bold text-on-surface font-display mb-4">
                {t('Other Ways to Reach Us', 'طرق أخرى للتواصل')}
              </h2>
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-on-surface-variant text-xl mt-0.5">schedule</span>
                <div>
                  <p className="text-on-surface font-semibold text-sm">{t('Support Hours', 'ساعات الدعم')}</p>
                  <p className="text-on-surface-variant text-sm mt-0.5">
                    {t('Saturday - Thursday', 'السبت - الخميس')}
                    {': '}
                    <span dir="ltr" style={{unicodeBidi:'embed'}}>11:00 AM - 12:00 AM</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer — no Contact Support link since we're already on it */}
      <footer className="w-full py-8 border-t border-outline-variant/10" style={{ background: 'var(--color-surface-container-lowest)' }}>
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <span className="font-display font-extrabold text-2xl tracking-tight text-secondary-fixed">Rasha</span>
            <p className="text-on-surface-variant text-xs mt-1">© 2025 Rasha Hydro-Premium. {t('All rights reserved.', 'جميع الحقوق محفوظة.')}</p>
          </div>
          <nav className="flex gap-6">
            <Link to="/privacy" className="text-on-surface-variant hover:text-secondary-fixed transition-colors text-xs">{t('Privacy Policy', 'سياسة الخصوصية')}</Link>
            <Link to="/terms" className="text-on-surface-variant hover:text-secondary-fixed transition-colors text-xs">{t('Terms of Service', 'شروط الخدمة')}</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
