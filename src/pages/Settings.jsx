import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useApp, API } from '../context/AppContext'

export default function Settings() {
  const { t, customer, token, login, logout, lang } = useApp()
  const navigate = useNavigate()
  const fileRef = useRef(null)

  const [form, setForm] = useState({
    firstName: customer?.first_name || '',
    lastName: customer?.last_name || '',
    phone: (customer?.phone || '').replace('+249', ''),
  })
  const [avatar, setAvatar] = useState(customer?.avatar_url || null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [showDeletePopup, setShowDeletePopup] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const hdrs = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }
  if (!customer) { navigate('/login'); return null }

  const initials = `${customer.first_name?.[0] || ''}${customer.last_name?.[0] || ''}`
  const totalStamps = customer.stamps || 0
  const totalWashes = customer.totalWashes || customer.total_washes || 0

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatar(URL.createObjectURL(file))
  }

  const saveProfile = async () => {
    setProfileLoading(true); setProfileSuccess(false)
    try {
      const res = await fetch(`${API}/api/auth/me`, {
        method: 'PATCH', headers: hdrs,
        body: JSON.stringify({ firstName: form.firstName, lastName: form.lastName, phone: '+249' + form.phone })
      })
      if (!res.ok) return
      login(token, { ...customer, first_name: form.firstName, last_name: form.lastName, phone: '+249' + form.phone })
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
    } catch {} finally { setProfileLoading(false) }
  }

  const sendResetLink = async () => {
    await fetch(`${API}/api/auth/forgot-password`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: customer.email })
    })
    setResetSent(true)
    setTimeout(() => setResetSent(false), 5000)
  }

  const deleteAccount = async () => {
    setDeleteLoading(true)
    try {
      await fetch(`${API}/api/auth/me`, { method: 'DELETE', headers: hdrs })
      logout(); navigate('/')
    } catch {} finally { setDeleteLoading(false) }
  }

  const navItems = [
    { id: 'profile', icon: 'person', label: t('Profile', 'الملف الشخصي'), href: '/settings' },
    { id: 'wallet', icon: 'account_balance_wallet', label: t('Wallet', 'المحفظة'), href: '/wallet' },
  ]

  // Card style
  const card = { background: 'var(--color-surface-container-low)', border: '1px solid var(--color-outline-variant)', boxShadow: '0 4px 24px rgba(0,86,179,0.06)', borderRadius: '1rem' }
  const secRow = { borderBottom: '1px solid var(--color-outline-variant)' }

  return (
    <div className="pt-14 min-h-screen pb-24 md:pb-0" style={{ background: 'var(--color-background)' }}>
      {/* Hidden file input */}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

      <div className="flex max-w-7xl mx-auto">

        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-56 shrink-0 min-h-[calc(100vh-56px)] py-8 px-4"
          style={{ borderRight: '1px solid var(--color-outline-variant)' }}>

          <nav className="space-y-1 flex-1">
            {navItems.map(item => {
              const active = item.id === 'profile'
              return (
                <Link key={item.id} to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${active ? 'text-secondary-fixed' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'}`}
                  style={active ? { background: 'rgba(var(--color-secondary-fixed-rgb),0.08)', border: '1px solid rgba(var(--color-secondary-fixed-rgb),0.15)' } : {}}>
                  <span className={`material-symbols-outlined text-xl ${active ? 'fill-icon' : ''}`}>{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <Link to="/contact"
            className="flex items-center gap-2 px-4 py-3 text-on-surface-variant hover:text-secondary-fixed transition-colors text-sm font-semibold">
            <span className="material-symbols-outlined text-xl">help</span>
            {t('Help?', 'مساعدة؟')}
          </Link>
        </aside>

        {/* Main */}
        <main className="flex-1 px-4 md:px-10 py-8 pb-28 md:pb-10">
          {/* Mobile top nav — sidebar is hidden on mobile */}
        <div className="md:hidden flex gap-2 px-4 pt-4 pb-2">
          {[
            { to: '/loyalty', icon: 'loyalty', label: t('Membership', 'العضوية') },
            { to: '/wallet', icon: 'account_balance_wallet', label: t('Wallet', 'المحفظة') },
          ].map(item => (
            <Link key={item.to} to={item.to}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-on-surface-variant transition-all"
              style={{background:'var(--color-surface-container)', border:'1px solid var(--color-outline-variant)'}}>
              <span className="material-symbols-outlined text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>

        {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant mb-2">
            <Link to="/loyalty" className="hover:text-secondary-fixed transition-colors">{t('Profile', 'الملف الشخصي')}</Link>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
            <span className="text-on-surface font-semibold">{t('Settings', 'الإعدادات')}</span>
          </div>
          <h1 className="text-3xl font-bold text-on-surface font-display mb-8">{t('Profile Settings', 'إعدادات الملف الشخصي')}</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Profile Card */}
            <div className="lg:col-span-1">
              <div style={card} className="p-6 flex flex-col items-center text-center gap-4">
                {/* Avatar with upload */}
                <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
                  <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center text-white text-3xl font-bold"
                    style={{ background: avatar ? 'transparent' : 'linear-gradient(135deg,#0056b3,#004491)', boxShadow: '0 0 0 4px var(--color-surface-container-low), 0 0 0 6px rgba(var(--color-secondary-fixed-rgb),0.2)' }}>
                    {avatar
                      ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                      : <span>{initials}</span>
                    }
                  </div>
                  <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-xl">photo_camera</span>
                  </div>
                  <div className="absolute bottom-0.5 end-0.5 w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: '#0056b3', border: '2px solid var(--color-surface-container-low)' }}>
                    <span className="material-symbols-outlined text-white fill-icon" style={{ fontSize: '14px' }}>photo_camera</span>
                  </div>
                </div>
                {avatarFile && (
                  <p className="text-xs text-secondary-fixed">{t('Photo selected — save to apply', 'تم اختيار الصورة — احفظ للتطبيق')}</p>
                )}
                <div>
                  <p className="text-lg font-bold text-on-surface font-display">{customer.first_name} {customer.last_name}</p>
                  <p className="text-sm text-on-surface-variant">{customer.email}</p>
                </div>
                {/* Stats */}
                <div className="grid grid-cols-2 w-full pt-4" style={{ borderTop: '1px solid var(--color-outline-variant)' }}>
                  <div className="text-center py-2">
                    <p className="text-2xl font-bold text-on-surface font-display">{totalWashes}</p>
                    <p className="text-xs text-on-surface-variant uppercase tracking-wider mt-0.5">{t('Past Washes', 'غسيلات سابقة')}</p>
                  </div>
                  <div className="text-center py-2" style={{ borderInlineStart: '1px solid var(--color-outline-variant)' }}>
                    <p className="text-2xl font-bold text-on-surface font-display">{totalStamps}</p>
                    <p className="text-xs text-on-surface-variant uppercase tracking-wider mt-0.5">{t('Total Stamps', 'إجمالي الطوابع')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right forms */}
            <div className="lg:col-span-2 space-y-5">

              {/* Personal Information */}
              <div style={card} className="overflow-hidden">
                <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--color-outline-variant)' }}>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{t('Personal Information', 'المعلومات الشخصية')}</p>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div>
                      <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">{t('Display Name', 'الاسم الظاهر')}</label>
                      <p className="text-sm font-semibold text-on-surface mb-2">{customer.first_name} {customer.last_name}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <input className="rasha-input text-sm" placeholder={t('First', 'الأول')} value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
                        <input className="rasha-input text-sm" placeholder={t('Last', 'الأخير')} value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">{t('Phone Number', 'رقم الهاتف')}</label>
                      <div className="flex" dir="ltr">
                        <span className="rounded-l-xl px-3 py-3 text-sm text-on-surface-variant flex items-center shrink-0"
                          style={{ background: 'var(--color-surface-container-high)', border: '1px solid var(--color-outline-variant)', borderRight: 'none' }}>+249</span>
                        <input type="tel" className="rasha-input text-sm" style={{ borderRadius: '0 0.75rem 0.75rem 0' }}
                          value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '') }))} />
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">{t('Email Address', 'البريد الإلكتروني')}</label>
                      <input className="rasha-input text-sm" value={customer.email} readOnly style={{ opacity: 0.5, cursor: 'not-allowed' }} />
                      <p className="text-xs text-on-surface-variant mt-1 opacity-60">{t('Email cannot be changed', 'لا يمكن تغيير البريد الإلكتروني')}</p>
                    </div>
                  </div>
                  {profileSuccess && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e' }}>
                      <span className="material-symbols-outlined text-base fill-icon">check_circle</span>
                      {t('Profile updated!', 'تم تحديث الملف الشخصي!')}
                    </div>
                  )}
                  <div className="flex justify-end">
                    <button onClick={saveProfile} disabled={profileLoading}
                      className="hydro-gradient text-white text-sm font-bold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2">
                      {profileLoading ? <div className="loader" /> : t('Save Changes', 'حفظ التغييرات')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Security & Account */}
              <div style={card} className="overflow-hidden">
                <div className="px-6 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid var(--color-outline-variant)' }}>
                  <span className="material-symbols-outlined text-secondary-fixed text-xl">shield</span>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{t('Security & Account', 'الأمان والحساب')}</p>
                </div>
                {/* Reset Password row */}
                <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  style={{ borderBottom: '1px solid var(--color-outline-variant)' }}>
                  <div>
                    <p className="text-sm font-semibold text-on-surface">{t('Reset Password', 'إعادة تعيين كلمة المرور')}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">{t('Receive a secure link to update your password.', 'احصل على رابط آمن لتحديث كلمة مرورك.')}</p>
                  </div>
                  <button onClick={sendResetLink} disabled={resetSent}
                    className="shrink-0 text-sm font-bold px-5 py-2.5 rounded-xl transition-all"
                    style={{
                      border: '1px solid var(--color-primary-container)',
                      color: resetSent ? '#22c55e' : 'white',
                      background: resetSent ? 'rgba(34,197,94,0.1)' : 'var(--color-primary-container)'
                    }}>
                    {resetSent ? t('Link Sent ✓', 'تم الإرسال ✓') : t('Send Reset Link', 'إرسال رابط')}
                  </button>
                </div>
                {/* Delete Account row */}
                <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  style={{ borderBottom: '1px solid var(--color-outline-variant)' }}>
                  <div>
                    <p className="text-sm font-semibold text-error">{t('Delete Account', 'حذف الحساب')}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">{t('Permanently delete your account and all data.', 'حذف حسابك وجميع بياناتك نهائياً.')}</p>
                  </div>
                  <button onClick={() => setShowDeletePopup(true)}
                    className="shrink-0 text-sm font-bold px-5 py-2.5 rounded-xl transition-all"
                    style={{ border: '1px solid var(--color-error)', color: 'var(--color-error)', background: 'transparent' }}>
                    {t('Delete Account', 'حذف الحساب')}
                  </button>
                </div>
                {/* Member ID */}
                <div className="px-6 py-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-on-surface-variant text-base">schedule</span>
                  <p className="text-xs text-on-surface-variant">{t('Member ID:', 'رقم العضو:')} <span className="font-bold text-secondary-fixed" dir="ltr">{customer.customer_uid}</span></p>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>

      {/* Delete Account Popup */}
      {showDeletePopup && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6 animate-fade-in" style={{ background: 'var(--color-surface-container)', border: '1px solid var(--color-outline-variant)' }}>
            <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(179,38,30,0.1)' }}>
              <span className="material-symbols-outlined text-error text-3xl">delete_forever</span>
            </div>
            <h3 className="font-bold text-on-surface text-lg text-center mb-2">{t('Delete Account?', 'حذف الحساب؟')}</h3>
            <p className="text-on-surface-variant text-sm text-center mb-6">{t('This will permanently delete your account, loyalty stamps, and all booking history. This cannot be undone.', 'سيؤدي هذا إلى حذف حسابك وطوابع الولاء وسجل الحجوزات نهائياً. لا يمكن التراجع.')}</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeletePopup(false)} disabled={deleteLoading}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-on-surface-variant"
                style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)' }}>
                {t('Cancel', 'إلغاء')}
              </button>
              <button onClick={deleteAccount} disabled={deleteLoading}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
                style={{ background: '#b3261e' }}>
                {deleteLoading ? <div className="loader" /> : t('Delete', 'حذف')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
