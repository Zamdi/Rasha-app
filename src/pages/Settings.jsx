import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useApp, API } from '../context/AppContext'

export default function Settings() {
  const { t, customer, token, login, logout, lang } = useApp()
  const navigate = useNavigate()

  const [activeSection, setActiveSection] = useState('profile')
  const [form, setForm] = useState({
    firstName: customer?.first_name || '',
    lastName: customer?.last_name || '',
    phone: (customer?.phone || '').replace('+249', ''),
  })
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' })
  const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false })
  const [pwLoading, setPwLoading] = useState(false)
  const [pwErrors, setPwErrors] = useState({})
  const [pwSuccess, setPwSuccess] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [freezeLoading, setFreezeLoading] = useState(false)

  const hdrs = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }

  if (!customer) { navigate('/login'); return null }

  const initials = `${customer.first_name?.[0] || ''}${customer.last_name?.[0] || ''}`

  const saveProfile = async () => {
    setProfileLoading(true); setProfileSuccess(false)
    try {
      const res = await fetch(`${API}/api/auth/me`, {
        method: 'PATCH', headers: hdrs,
        body: JSON.stringify({ firstName: form.firstName, lastName: form.lastName, phone: '+249' + form.phone })
      })
      const data = await res.json()
      if (!res.ok) return
      login(token, { ...customer, first_name: form.firstName, last_name: form.lastName, phone: '+249' + form.phone })
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
    } catch {} finally { setProfileLoading(false) }
  }

  const changePassword = async () => {
    const e = {}
    if (!pwForm.current) e.current = t('Required', 'مطلوب')
    if (pwForm.newPw.length < 8) e.newPw = t('Min 8 characters', '8 أحرف على الأقل')
    if (pwForm.newPw !== pwForm.confirm) e.confirm = t('Passwords do not match', 'كلمتا المرور غير متطابقتين')
    setPwErrors(e)
    if (Object.keys(e).length > 0) return
    setPwLoading(true); setPwSuccess(false)
    try {
      const res = await fetch(`${API}/api/auth/change-password`, {
        method: 'POST', headers: hdrs,
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.newPw })
      })
      const data = await res.json()
      if (!res.ok) { setPwErrors({ current: data.error }); return }
      setPwForm({ current: '', newPw: '', confirm: '' })
      setPwSuccess(true)
      setTimeout(() => setPwSuccess(false), 3000)
    } catch {} finally { setPwLoading(false) }
  }

  const sendResetLink = async () => {
    await fetch(`${API}/api/auth/forgot-password`, {
      method: 'POST', headers: hdrs,
      body: JSON.stringify({ email: customer.email })
    })
    setResetSent(true)
    setTimeout(() => setResetSent(false), 5000)
  }

  const deleteAccount = async () => {
    if (!window.confirm(t('Delete your account permanently?', 'حذف حسابك نهائياً؟'))) return
    try {
      await fetch(`${API}/api/auth/me`, { method: 'DELETE', headers: hdrs })
      logout(); navigate('/')
    } catch {}
  }

  const navItems = [
    { id: 'overview', icon: 'dashboard', label: t('Overview', 'نظرة عامة'), href: '/loyalty' },
    { id: 'profile', icon: 'person', label: t('Profile', 'الملف الشخصي') },
    { id: 'membership', icon: 'loyalty', label: t('Membership', 'العضوية'), href: '/loyalty' },
    { id: 'wallet', icon: 'account_balance_wallet', label: t('Wallet', 'المحفظة') },
    { id: 'settings', icon: 'settings', label: t('Settings', 'الإعدادات') },
  ]

  return (
    <div className="pt-14 min-h-screen" style={{background:'var(--color-background)'}}>
      <div className="max-w-7xl mx-auto flex">

        {/* Sidebar — desktop only */}
        <aside className="hidden md:flex flex-col w-56 shrink-0 min-h-[calc(100vh-56px)] py-8 px-4"
          style={{borderRight:'1px solid var(--color-outline-variant)'}}>
          <p className="text-xs font-bold text-secondary-fixed uppercase tracking-widest px-4 mb-3">Rasha</p>
          <nav className="space-y-1 flex-1">
            {navItems.map(item => {
              const active = item.id === 'profile'
              const El = item.href ? Link : 'button'
              return (
                <El key={item.id}
                  to={item.href}
                  onClick={item.href ? undefined : () => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    active ? 'text-secondary-fixed' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                  style={active ? {background:'rgba(var(--color-secondary-fixed-rgb),0.08)', border:'1px solid rgba(var(--color-secondary-fixed-rgb),0.15)'} : {}}>
                  <span className={`material-symbols-outlined text-xl ${active ? 'fill-icon' : ''}`}>{item.icon}</span>
                  {item.label}
                </El>
              )
            })}
          </nav>
          <Link to="/contact"
            className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:text-secondary-fixed transition-colors text-sm font-semibold">
            <span className="material-symbols-outlined text-xl">help</span>
            {t('Help?', 'مساعدة؟')}
          </Link>
        </aside>

        {/* Main content */}
        <main className="flex-1 px-4 md:px-10 py-8 pb-28 md:pb-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-2">
            <span className="hover:text-secondary-fixed cursor-pointer" onClick={() => navigate('/loyalty')}>{t('Profile', 'الملف الشخصي')}</span>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
            <span className="text-on-surface font-semibold">{t('Settings', 'الإعدادات')}</span>
          </div>
          <h1 className="text-3xl font-bold text-on-surface font-display mb-8">{t('Profile Settings', 'إعدادات الملف الشخصي')}</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left — Profile Card */}
            <div className="lg:col-span-1">
              <div className="rounded-2xl p-6 flex flex-col items-center text-center space-y-4"
                style={{background:'var(--color-surface-container-low)', border:'1px solid var(--color-outline-variant)', boxShadow:'0 4px 24px rgba(0,86,179,0.06)'}}>
                {/* Avatar */}
                <div className="relative">
                  <div className="w-24 h-24 rounded-full hydro-gradient flex items-center justify-center text-white text-3xl font-bold"
                    style={{boxShadow:'0 0 0 4px var(--color-surface-container-low), 0 0 0 6px rgba(var(--color-secondary-fixed-rgb),0.2)'}}>
                    {initials}
                  </div>
                  <div className="absolute bottom-1 end-1 w-7 h-7 rounded-full flex items-center justify-center"
                    style={{background:'var(--color-primary-container)', border:'2px solid var(--color-surface-container-low)'}}>
                    <span className="material-symbols-outlined text-white fill-icon" style={{fontSize:'14px'}}>photo_camera</span>
                  </div>
                </div>

                <div>
                  <p className="text-lg font-bold text-on-surface font-display">{customer.first_name} {customer.last_name}</p>
                  <p className="text-sm text-on-surface-variant">{customer.email}</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 w-full pt-4" style={{borderTop:'1px solid var(--color-outline-variant)'}}>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-on-surface font-display">{customer.wash_count || 0}</p>
                    <p className="text-xs text-on-surface-variant uppercase tracking-wider mt-0.5">{t('Past Washes', 'غسيلات سابقة')}</p>
                  </div>
                  <div className="text-center" style={{borderRight: lang === 'ar' ? 'none' : '1px solid var(--color-outline-variant)', borderLeft: lang === 'ar' ? '1px solid var(--color-outline-variant)' : 'none'}}>
                    <p className="text-2xl font-bold text-on-surface font-display">{customer.stamp_count || 0}</p>
                    <p className="text-xs text-on-surface-variant uppercase tracking-wider mt-0.5">{t('Stamps', 'طوابع')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — Forms */}
            <div className="lg:col-span-2 space-y-5">

              {/* Personal Information */}
              <div className="rounded-2xl overflow-hidden"
                style={{background:'var(--color-surface-container-low)', border:'1px solid var(--color-outline-variant)', boxShadow:'0 4px 24px rgba(0,86,179,0.06)'}}>
                <div className="px-6 py-5" style={{borderBottom:'1px solid var(--color-outline-variant)'}}>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{t('Personal Information', 'المعلومات الشخصية')}</p>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div>
                      <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">{t('Display Name', 'الاسم الظاهر')}</label>
                      <p className="text-sm font-semibold text-on-surface mb-3">{customer.first_name} {customer.last_name}</p>
                      <div className="grid grid-cols-2 gap-3">
                        <input className="rasha-input text-sm" placeholder={t('First','الأول')} value={form.firstName} onChange={e => setForm(f => ({...f, firstName: e.target.value}))} />
                        <input className="rasha-input text-sm" placeholder={t('Last','الأخير')} value={form.lastName} onChange={e => setForm(f => ({...f, lastName: e.target.value}))} />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">{t('Phone Number', 'رقم الهاتف')}</label>
                      <div className="flex" dir="ltr">
                        <span className="rounded-l-xl px-3 py-3 text-sm text-on-surface-variant flex items-center shrink-0"
                          style={{background:'var(--color-surface-container-high)', border:'1px solid var(--color-outline-variant)', borderRight:'none'}}>+249</span>
                        <input type="tel" className="rasha-input text-sm" style={{borderRadius:'0 0.75rem 0.75rem 0'}}
                          value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value.replace(/\D/g,'')}))} />
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">{t('Email Address', 'البريد الإلكتروني')}</label>
                      <input className="rasha-input text-sm" value={customer.email} readOnly style={{opacity:0.55, cursor:'not-allowed'}} />
                    </div>
                  </div>

                  {profileSuccess && (
                    <div className="flex items-center gap-2 mt-5 px-4 py-3 rounded-xl text-sm font-semibold" style={{background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.2)', color:'#22c55e'}}>
                      <span className="material-symbols-outlined text-base fill-icon">check_circle</span>
                      {t('Profile updated successfully!', 'تم تحديث الملف الشخصي!')}
                    </div>
                  )}

                  <div className="flex justify-end mt-6">
                    <button onClick={saveProfile} disabled={profileLoading}
                      className="hydro-gradient text-white text-sm font-bold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2">
                      {profileLoading ? <div className="loader"/> : t('Save Changes', 'حفظ التغييرات')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Security & Account */}
              <div className="rounded-2xl overflow-hidden"
                style={{background:'var(--color-surface-container-low)', border:'1px solid var(--color-outline-variant)', boxShadow:'0 4px 24px rgba(0,86,179,0.06)'}}>
                <div className="px-6 py-5 flex items-center gap-2" style={{borderBottom:'1px solid var(--color-outline-variant)'}}>
                  <span className="material-symbols-outlined text-secondary-fixed text-xl">shield</span>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{t('Security & Account', 'الأمان والحساب')}</p>
                </div>
                <div className="divide-y" style={{borderColor:'var(--color-outline-variant)'}}>
                  {/* Reset Password */}
                  <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-on-surface">{t('Reset Password', 'إعادة تعيين كلمة المرور')}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">{t('Receive a secure link to update your password.', 'احصل على رابط آمن لتحديث كلمة مرورك.')}</p>
                    </div>
                    <button onClick={sendResetLink} disabled={resetSent}
                      className="shrink-0 text-sm font-bold px-5 py-2.5 rounded-xl transition-all disabled:opacity-60"
                      style={{border:'1px solid var(--color-primary-container)', color: resetSent ? '#22c55e' : 'var(--color-primary-container)', background:'transparent'}}>
                      {resetSent ? t('Link Sent ✓', 'تم الإرسال ✓') : t('Send Reset Link', 'إرسال رابط إعادة التعيين')}
                    </button>
                  </div>
                  {/* Freeze Account */}
                  <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-error">{t('Delete Account', 'حذف الحساب')}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">{t('Permanently delete your account and all data.', 'حذف حسابك وجميع بياناتك نهائياً.')}</p>
                    </div>
                    <button onClick={deleteAccount}
                      className="shrink-0 text-sm font-bold px-5 py-2.5 rounded-xl transition-all text-error"
                      style={{border:'1px solid var(--color-error)', background:'transparent'}}>
                      {t('Delete Account', 'حذف الحساب')}
                    </button>
                  </div>
                  {/* Last login */}
                  <div className="px-6 py-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-on-surface-variant text-base">schedule</span>
                    <p className="text-xs text-on-surface-variant">{t('Member ID:', 'رقم العضو:')} <span className="font-bold text-secondary-fixed" dir="ltr">{customer.customer_uid}</span></p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
