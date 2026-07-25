import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useApp, API } from '../context/AppContext'

export default function Settings() {
  const { t, customer, token, login, logout } = useApp()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    firstName: customer?.first_name || '',
    lastName: customer?.last_name || '',
    phone: (customer?.phone || '').replace('+249', ''),
  })
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' })
  const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false })
  const [profileLoading, setProfileLoading] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [pwErrors, setPwErrors] = useState({})
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [pwSuccess, setPwSuccess] = useState(false)

  const hdrs = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }

  if (!customer) { navigate('/login'); return null }

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

  const deleteAccount = async () => {
    if (!window.confirm(t('Delete your account permanently?', 'حذف حسابك نهائياً؟'))) return
    try {
      await fetch(`${API}/api/auth/me`, { method: 'DELETE', headers: hdrs })
      logout(); navigate('/')
    } catch {}
  }

  const initials = `${customer.first_name?.[0] || ''}${customer.last_name?.[0] || ''}`

  return (
    <div className="pt-14 pb-24 md:pb-10 min-h-screen">
      <div className="max-w-xl mx-auto px-4 py-8 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-on-surface-variant hover:text-secondary-fixed transition-colors p-1">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-2xl font-bold text-on-surface font-display">{t('Settings', 'الإعدادات')}</h1>
        </div>

        {/* Profile Avatar Card */}
        <div className="glass rounded-2xl p-6 flex flex-col items-center text-center gap-3">
          <div className="w-20 h-20 rounded-full hydro-gradient flex items-center justify-center text-white text-3xl font-bold cyan-glow">
            {initials}
          </div>
          <div>
            <p className="text-lg font-bold text-on-surface">{customer.first_name} {customer.last_name}</p>
            <p className="text-sm text-on-surface-variant">{customer.email}</p>
            <p className="text-xs font-bold text-secondary-fixed mt-1" dir="ltr">{customer.customer_uid}</p>
          </div>
          <Link to="/loyalty" className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-secondary-fixed transition-all hover:opacity-80"
            style={{border:'1px solid rgba(var(--color-secondary-fixed-rgb),0.3)', background:'rgba(var(--color-secondary-fixed-rgb),0.06)'}}>
            <span className="material-symbols-outlined text-sm fill-icon">loyalty</span>
            {t('View Loyalty Card', 'عرض بطاقة الولاء')}
          </Link>
        </div>

        {/* Personal Info */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="px-5 py-4" style={{borderBottom:'1px solid var(--color-outline-variant)'}}>
            <p className="text-xs font-bold text-secondary-fixed uppercase tracking-widest">{t('Personal Information', 'المعلومات الشخصية')}</p>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">{t('First Name', 'الاسم الأول')}</label>
                <input className="rasha-input text-sm" value={form.firstName} onChange={e => setForm(f => ({...f, firstName: e.target.value}))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">{t('Last Name', 'اسم العائلة')}</label>
                <input className="rasha-input text-sm" value={form.lastName} onChange={e => setForm(f => ({...f, lastName: e.target.value}))} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">{t('Email', 'البريد الإلكتروني')}</label>
              <input className="rasha-input text-sm" value={customer.email} readOnly
                style={{opacity:0.5, cursor:'not-allowed'}} />
              <p className="text-xs text-on-surface-variant mt-1 opacity-60">{t('Email cannot be changed', 'لا يمكن تغيير البريد الإلكتروني')}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">{t('Phone', 'الهاتف')}</label>
              <div className="flex" dir="ltr">
                <span className="rounded-l-xl px-3 py-3 text-sm text-on-surface-variant flex items-center shrink-0"
                  style={{background:'var(--color-surface-container-high)', border:'1px solid var(--color-outline-variant)', borderRight:'none'}}>+249</span>
                <input type="tel" className="rasha-input text-sm" style={{borderRadius:'0 0.75rem 0.75rem 0'}}
                  value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value.replace(/\D/g,'')}))} />
              </div>
            </div>
            {profileSuccess && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-green-400" style={{background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.2)'}}>
                <span className="material-symbols-outlined text-base fill-icon">check_circle</span>
                {t('Profile updated successfully!', 'تم تحديث الملف الشخصي!')}
              </div>
            )}
            <button onClick={saveProfile} disabled={profileLoading} className="btn-primary w-full py-3 rounded-xl">
              {profileLoading ? <div className="loader"/> : t('Save Changes', 'حفظ التغييرات')}
            </button>
          </div>
        </div>

        {/* Change Password */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="px-5 py-4" style={{borderBottom:'1px solid var(--color-outline-variant)'}}>
            <p className="text-xs font-bold text-secondary-fixed uppercase tracking-widest">{t('Security', 'الأمان')}</p>
          </div>
          <div className="p-5 space-y-4">
            {[
              ['current', t('Current Password', 'كلمة المرور الحالية')],
              ['newPw', t('New Password', 'كلمة المرور الجديدة')],
              ['confirm', t('Confirm New Password', 'تأكيد كلمة المرور الجديدة')],
            ].map(([key, label]) => (
              <div key={key}>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">{label}</label>
                <div className="relative">
                  <input type={showPw[key] ? 'text' : 'password'}
                    className={`rasha-input text-sm pe-12 ${pwErrors[key] ? 'border-error' : ''}`}
                    value={pwForm[key]}
                    onChange={e => { setPwForm(f => ({...f, [key]: e.target.value})); setPwErrors(v => ({...v, [key]: ''})) }} />
                  <button type="button" onClick={() => setShowPw(p => ({...p, [key]: !p[key]}))}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-secondary-fixed">
                    <span className="material-symbols-outlined text-xl">{showPw[key] ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
                {pwErrors[key] && <p className="text-error text-xs mt-1">{pwErrors[key]}</p>}
              </div>
            ))}
            {pwSuccess && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-green-400" style={{background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.2)'}}>
                <span className="material-symbols-outlined text-base fill-icon">check_circle</span>
                {t('Password changed successfully!', 'تم تغيير كلمة المرور!')}
              </div>
            )}
            <button onClick={changePassword} disabled={pwLoading} className="btn-primary w-full py-3 rounded-xl">
              {pwLoading ? <div className="loader"/> : t('Change Password', 'تغيير كلمة المرور')}
            </button>
          </div>
        </div>

        {/* Account Actions */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="px-5 py-4" style={{borderBottom:'1px solid var(--color-outline-variant)'}}>
            <p className="text-xs font-bold text-secondary-fixed uppercase tracking-widest">{t('Account', 'الحساب')}</p>
          </div>
          <div className="divide-y" style={{borderColor:'var(--color-outline-variant)'}}>
            <button onClick={() => { logout(); navigate('/') }}
              className="w-full flex items-center gap-3 px-5 py-4 text-sm font-semibold text-on-surface hover:text-secondary-fixed transition-colors">
              <span className="material-symbols-outlined text-xl">logout</span>
              {t('Sign Out', 'تسجيل الخروج')}
            </button>
            <button onClick={deleteAccount}
              className="w-full flex items-center gap-3 px-5 py-4 text-sm font-semibold text-error hover:opacity-80 transition-opacity">
              <span className="material-symbols-outlined text-xl">delete_forever</span>
              {t('Delete Account', 'حذف الحساب')}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
