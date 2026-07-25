import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp, API } from '../context/AppContext'

export default function Settings() {
  const { t, customer, token, login, logout } = useApp()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    firstName: customer?.first_name || '',
    lastName: customer?.last_name || '',
    email: customer?.email || '',
    phone: (customer?.phone || '').replace('+249', ''),
  })
  const [pwForm, setPwForm] = useState({ current: '', new: '', confirm: '' })
  const [showPw, setShowPw] = useState({current:false, new:false, confirm:false})
  const [profileLoading, setProfileLoading] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [pwErrors, setPwErrors] = useState({})
  const hdrs = { 'Content-Type':'application/json', Authorization: 'Bearer ' + token }

  if (!customer) { navigate('/login'); return null }

  const saveProfile = async () => {
    setProfileLoading(true)
    try {
      const res = await fetch(`${API}/api/auth/me`, {
        method: 'PATCH', headers: hdrs,
        body: JSON.stringify({ firstName: form.firstName, lastName: form.lastName, phone: '+249' + form.phone })
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error); return }
      login(token, { ...customer, first_name: form.firstName, last_name: form.lastName, phone: '+249'+form.phone })
      alert(t('Profile updated!', 'تم تحديث الملف الشخصي!'))
    } catch { alert(t('Error','خطأ')) }
    finally { setProfileLoading(false) }
  }

  const changePassword = async () => {
    const e = {}
    if (!pwForm.current) e.current = t('Required','مطلوب')
    if (pwForm.new.length < 8) e.new = t('Min 8 characters','8 أحرف على الأقل')
    if (pwForm.new !== pwForm.confirm) e.confirm = t('Passwords do not match','كلمتا المرور غير متطابقتين')
    setPwErrors(e)
    if (Object.keys(e).length > 0) return
    setPwLoading(true)
    try {
      const res = await fetch(`${API}/api/auth/change-password`, {
        method: 'POST', headers: hdrs,
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.new })
      })
      const data = await res.json()
      if (!res.ok) { setPwErrors({ current: data.error }); return }
      setPwForm({ current:'', new:'', confirm:'' })
      alert(t('Password changed!','تم تغيير كلمة المرور!'))
    } catch { alert(t('Error','خطأ')) }
    finally { setPwLoading(false) }
  }

  const deleteAccount = async () => {
    if (!window.confirm(t('Are you sure you want to delete your account? This cannot be undone.','هل أنت متأكد من حذف حسابك؟ لا يمكن التراجع.'))) return
    try {
      await fetch(`${API}/api/auth/me`, { method:'DELETE', headers: hdrs })
      logout(); navigate('/')
    } catch { alert(t('Error','خطأ')) }
  }

  return (
    <div className="pt-14 pb-24 md:pb-10 min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate(-1)} className="text-on-surface-variant hover:text-secondary-fixed transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-2xl font-bold text-on-surface font-display">{t('Settings','الإعدادات')}</h1>
        </div>

        {/* Profile Card */}
        <div className="glass rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-4 pb-4" style={{borderBottom:'1px solid var(--color-outline-variant)'}}>
            <div className="w-16 h-16 rounded-2xl hydro-gradient flex items-center justify-center text-white text-2xl font-bold shrink-0">
              {customer.first_name?.[0]}{customer.last_name?.[0]}
            </div>
            <div>
              <p className="font-bold text-on-surface text-lg">{customer.first_name} {customer.last_name}</p>
              <p className="text-sm text-on-surface-variant">{customer.email}</p>
              <p className="text-xs text-secondary-fixed font-bold mt-0.5" dir="ltr">{customer.customer_uid}</p>
            </div>
          </div>

          <h3 className="font-bold text-on-surface">{t('Personal Information','المعلومات الشخصية')}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">{t('First Name','الاسم الأول')}</label>
              <input className="rasha-input" value={form.firstName} onChange={e=>setForm(f=>({...f,firstName:e.target.value}))}/>
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">{t('Last Name','اسم العائلة')}</label>
              <input className="rasha-input" value={form.lastName} onChange={e=>setForm(f=>({...f,lastName:e.target.value}))}/>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">{t('Email','البريد الإلكتروني')}</label>
            <input type="email" className="rasha-input opacity-60 cursor-not-allowed" value={form.email} readOnly/>
            <p className="text-xs text-on-surface-variant mt-1">{t('Email cannot be changed','لا يمكن تغيير البريد الإلكتروني')}</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">{t('Phone','الهاتف')}</label>
            <div className="flex" dir="ltr">
              <span className="rounded-l-xl px-3 py-3 text-sm text-on-surface-variant flex items-center shrink-0"
                style={{background:'var(--color-surface-container-high)',border:'1px solid var(--color-outline-variant)',borderRight:'none'}}>+249</span>
              <input type="tel" className="rasha-input" style={{borderRadius:'0 0.75rem 0.75rem 0'}}
                value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value.replace(/\D/g,'')}))}/>
            </div>
          </div>
          <button onClick={saveProfile} disabled={profileLoading} className="btn-primary w-full py-3 rounded-xl">
            {profileLoading ? <div className="loader"/> : t('Save Changes','حفظ التغييرات')}
          </button>
        </div>

        {/* Change Password */}
        <div className="glass rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-on-surface">{t('Change Password','تغيير كلمة المرور')}</h3>
          {[
            ['current', t('Current Password','كلمة المرور الحالية'), 'current'],
            ['new', t('New Password','كلمة المرور الجديدة'), 'new'],
            ['confirm', t('Confirm New Password','تأكيد كلمة المرور الجديدة'), 'confirm'],
          ].map(([key, label, field]) => (
            <div key={key}>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">{label}</label>
              <div className="relative">
                <input type={showPw[field]?'text':'password'} className={`rasha-input pe-12 ${pwErrors[key]?'border-error':''}`}
                  value={pwForm[key]} onChange={e=>{setPwForm(f=>({...f,[key]:e.target.value}));setPwErrors(v=>({...v,[key]:''}) )}}/>
                <button type="button" onClick={()=>setShowPw(p=>({...p,[field]:!p[field]}))} className="absolute end-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-secondary-fixed">
                  <span className="material-symbols-outlined text-xl">{showPw[field]?'visibility_off':'visibility'}</span>
                </button>
              </div>
              {pwErrors[key] && <p className="text-error text-xs mt-1">{pwErrors[key]}</p>}
            </div>
          ))}
          <button onClick={changePassword} disabled={pwLoading} className="btn-primary w-full py-3 rounded-xl">
            {pwLoading ? <div className="loader"/> : t('Change Password','تغيير كلمة المرور')}
          </button>
        </div>

        {/* Danger Zone */}
        <div className="glass rounded-2xl p-6 space-y-3" style={{border:'1px solid rgba(179,38,30,0.2)'}}>
          <h3 className="font-bold text-error">{t('Danger Zone','منطقة الخطر')}</h3>
          <p className="text-on-surface-variant text-sm">{t('Deleting your account is permanent and cannot be undone. All your data including loyalty stamps will be lost.','حذف حسابك دائم ولا يمكن التراجع عنه. ستفقد جميع بياناتك بما في ذلك طوابع الولاء.')}</p>
          <button onClick={deleteAccount} className="w-full py-3 rounded-xl text-sm font-bold text-error transition-all hover:opacity-80 flex items-center justify-center gap-2"
            style={{background:'rgba(179,38,30,0.08)', border:'1px solid rgba(179,38,30,0.2)'}}>
            <span className="material-symbols-outlined text-base">delete_forever</span>
            {t('Delete My Account','حذف حسابي')}
          </button>
        </div>
      </div>
    </div>
  )
}
