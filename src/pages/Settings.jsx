import { useState, useRef, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useApp, API } from '../context/AppContext'
import FieldError from '../components/FieldError'
import { apiError } from '../utils/apiErrors'
import PhoneInput from '../components/PhoneInput'
import { buildE164, splitE164, isPlausibleLength } from '../utils/phone'

export default function Settings() {
  const { t, customer, token, login, logout, lang, showToast, showError } = useApp()
  const navigate = useNavigate()
  const fileRef = useRef(null)

  // Splitting the stored E.164 number back into its dial code and national
  // digits — rather than assuming +249 — is what makes this show the
  // customer's actual country. Before, this field always displayed a
  // hardcoded "+249" badge regardless of what they registered with, and
  // saving rewrote the number onto Sudan's country code even when it never
  // was one, corrupting it.
  const initialPhone = splitE164(customer?.phone)
  const [form, setForm] = useState({
    firstName: customer?.first_name || '',
    lastName: customer?.last_name || '',
    phone: initialPhone.national,
  })
  const [dialCode, setDialCode] = useState(initialPhone.dialCode)
  const [avatar, setAvatar] = useState(customer?.avatar_url || null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [showCrop, setShowCrop] = useState(false)
  const [cropSrc, setCropSrc] = useState(null)
  const [cropScale, setCropScale] = useState(1)
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 })
  const dragging = useRef(false)
  const dragStart = useRef(null)
  const cropImgRef = useRef(null)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [showDeletePopup, setShowDeletePopup] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const hdrs = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }
  if (!customer) { navigate('/login'); return null }

  const initials = `${customer.first_name?.[0] || ''}${customer.last_name?.[0] || ''}`
  const totalStamps = customer.stamps || 0
  const totalWashes = customer.totalWashes || customer.total_washes || 0

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setCropSrc(ev.target.result)
      setCropScale(1)
      setCropOffset({ x: 0, y: 0 })
      setShowCrop(true)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const applyCrop = () => {
    const img = cropImgRef.current
    if (!img) return
    const C = 220   // container/display size in px
    const OUT = 400 // output canvas size
    const canvas = document.createElement('canvas')
    canvas.width = OUT; canvas.height = OUT
    const ctx = canvas.getContext('2d')
    // Clip to circle
    ctx.beginPath()
    ctx.arc(OUT/2, OUT/2, OUT/2, 0, Math.PI*2)
    ctx.clip()
    // The image CSS: centered at (C/2 + offsetX, C/2 + offsetY), scaled by cropScale
    // Image display size before scale: 220 × (naturalH/naturalW * 220)
    const imgDisplayW = C
    const imgDisplayH = (img.naturalHeight / img.naturalWidth) * C
    // After CSS scale:
    const scaledW = imgDisplayW * cropScale
    const scaledH = imgDisplayH * cropScale
    // Top-left corner of scaled image in container coords:
    const imgLeft = (C / 2 + cropOffset.x) - scaledW / 2
    const imgTop  = (C / 2 + cropOffset.y) - scaledH / 2
    // Map to output canvas (OUT/C ratio)
    const r = OUT / C
    ctx.drawImage(img, imgLeft * r, imgTop * r, scaledW * r, scaledH * r)
    const base64 = canvas.toDataURL('image/jpeg', 0.9)
    setAvatar(base64)
    setAvatarFile(base64)
    setShowCrop(false)
  }

  const removeAvatar = async () => {
    const previous = avatar
    setAvatar(null); setAvatarFile(null)
    try {
      const res = await fetch(`${API}/api/auth/me`, { method: 'PATCH', headers: hdrs, body: JSON.stringify({ avatar: null }) })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        // Put the photo back — the server still has it, and leaving the UI
        // blank would tell the customer it was removed when it wasn't.
        setAvatar(previous)
        showToast(apiError(data.error, lang, t('Could not remove your photo', 'تعذرت إزالة صورتك')), 'error')
        return
      }
      login(token, { ...customer, avatar_url: null })
    } catch {
      setAvatar(previous)
      showToast(t('Connection error. Please try again.', 'خطأ في الاتصال. حاول مجدداً.'), 'error')
    }
  }

  const saveProfile = async () => {
    if (!isPlausibleLength(dialCode, form.phone)) {
      setErrors({ phone: t('Enter a complete phone number', 'أدخل رقم هاتف كاملاً') })
      return
    }
    setProfileLoading(true); setProfileSuccess(false); setErrors({})
    try {
      const res = await fetch(`${API}/api/auth/me`, {
        method: 'PATCH', headers: hdrs,
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          // Built from the country the customer actually selected — this
          // used to hardcode '+249', silently rewriting any non-Sudan
          // number onto Sudan's country code on every save.
          phone: buildE164(dialCode, form.phone),
          ...(avatarFile !== null ? { avatar: avatarFile } : {})
        })
      })
      const data = await res.json()
      if (!res.ok) {
        const msg = apiError(data.error, lang, t('Could not save your changes', 'تعذر حفظ التغييرات'))
        // Route the rejection to the field it's about; anything general goes
        // to a toast. Either way the customer now sees that nothing saved.
        if (/name/i.test(data.error || ''))       setErrors({ name: msg })
        else if (/phone/i.test(data.error || '')) setErrors({ phone: msg })
        else if (/image|avatar/i.test(data.error || '')) setErrors({ avatar: msg })
        else showToast(msg, 'error')
        return
      }
      // Use server response + merge avatar since server strips it from response
      const updatedCustomer = {
        ...data.customer,
        avatar_url: avatarFile !== null ? avatarFile : customer.avatar_url,
        stamps: customer.stamps,
        totalWashes: customer.totalWashes,
      }
      login(token, updatedCustomer)
      setAvatarFile(null)
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
    } catch {
      showToast(t('Connection error. Please try again.', 'خطأ في الاتصال. حاول مجدداً.'), 'error')
    } finally { setProfileLoading(false) }
  }

  const sendResetLink = async () => {
    try {
      const res = await fetch(`${API}/api/auth/forgot-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: customer.email })
      })
      // The tick used to appear unconditionally, so a failed send looked
      // identical to a successful one and the customer waited for an email
      // that was never going to arrive.
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        showToast(apiError(data.error, lang, t('Could not send the code', 'تعذر إرسال الرمز')), 'error')
        return
      }
      setResetSent(true)
      setTimeout(() => setResetSent(false), 5000)
    } catch {
      showToast(t('Connection error. Please try again.', 'خطأ في الاتصال. حاول مجدداً.'), 'error')
    }
  }

  const deleteAccount = async () => {
    setDeleteLoading(true)
    try {
      const res = await fetch(`${API}/api/auth/me`, { method: 'DELETE', headers: hdrs })
      // Signing out regardless of the outcome made a failed deletion look
      // exactly like a successful one, with the account still live.
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setShowDeletePopup(false)
        showError({
          icon: 'delete_forever',
          title: t('Account not deleted', 'لم يتم حذف الحساب'),
          message: apiError(data.error, lang, t('We could not delete your account. Your account is still active.',
                                                'تعذر حذف حسابك. حسابك لا يزال نشطاً.')),
          actions: [
            { label: t('Contact Support', 'اتصل بالدعم'), to: '/contact' },
            { label: t('Try Again', 'حاول مجدداً'), primary: true, onClick: () => setShowDeletePopup(true) },
          ],
        })
        return
      }
      logout(); navigate('/')
    } catch {
      setShowDeletePopup(false)
      showError({
        icon: 'delete_forever',
        title: t('Account not deleted', 'لم يتم حذف الحساب'),
        message: t('We could not reach the server. Your account is still active.',
                   'تعذر الوصول إلى الخادم. حسابك لا يزال نشطاً.'),
        actions: [
          { label: t('Contact Support', 'اتصل بالدعم'), to: '/contact' },
          { label: t('Try Again', 'حاول مجدداً'), primary: true, onClick: () => setShowDeletePopup(true) },
        ],
      })
    } finally { setDeleteLoading(false) }
  }

  const navItems = [
    { id: 'profile', icon: 'person', label: t('Profile', 'الملف الشخصي'), href: '/settings' },
    { id: 'wallet', icon: 'account_balance_wallet', label: t('Wallet', 'المحفظة'), href: '/wallet' },
  ]

  // Card style
  const card = { background: 'var(--color-surface-container-low)', border: '1px solid var(--color-outline-variant)', boxShadow: '0 4px 24px rgba(21,80,88,0.06)', borderRadius: '1rem' }
  const secRow = { borderBottom: '1px solid var(--color-outline-variant)' }

  return (
    <div className="pt-14 min-h-dvh pb-24 md:pb-0" style={{ background: 'var(--color-background)' }}>
      {/* Hidden file input */}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

      <div className="flex max-w-7xl mx-auto">

        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-56 shrink-0 min-h-[calc(100dvh-56px)] py-8 px-4"
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
        <main className="flex-1 px-4 md:px-10 pt-4 pb-28 md:pt-8 md:pb-10">
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
                    style={{ background: avatar ? 'transparent' : 'linear-gradient(135deg,#1d6b75,#0e383e)', boxShadow: '0 0 0 4px var(--color-surface-container-low), 0 0 0 6px rgba(var(--color-secondary-fixed-rgb),0.2)' }}>
                    {avatar
                      ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                      : <span>{initials}</span>
                    }
                  </div>
                  <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-xl">photo_camera</span>
                  </div>
                  <div className="absolute bottom-0.5 end-0.5 w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: '#155058', border: '2px solid var(--color-surface-container-low)' }}>
                    <span className="material-symbols-outlined text-white fill-icon" style={{ fontSize: '14px' }}>photo_camera</span>
                  </div>
                </div>
                {avatar && (
                  <button onClick={removeAvatar} className="text-xs font-semibold hover:underline transition-colors cursor-pointer" style={{color:'var(--color-error)'}}>
                    {t('Remove photo', 'إزالة الصورة')}
                  </button>
                )}
                <FieldError>{errors.avatar}</FieldError>
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
                        <input className="rasha-input text-sm" aria-invalid={!!errors.name} placeholder={t('First', 'الأول')} value={form.firstName} onChange={e => { setForm(f => ({ ...f, firstName: e.target.value })); setErrors({}) }} />
                        <input className="rasha-input text-sm" aria-invalid={!!errors.name} placeholder={t('Last', 'الأخير')} value={form.lastName} onChange={e => { setForm(f => ({ ...f, lastName: e.target.value })); setErrors({}) }} />
                      </div>
                      <FieldError>{errors.name}</FieldError>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">{t('Phone Number', 'رقم الهاتف')}</label>
                      <PhoneInput
                        value={form.phone}
                        onChange={v => { setForm(f => ({ ...f, phone: v })); setErrors({}) }}
                        dialCode={dialCode}
                        onDialChange={v => { setDialCode(v); setErrors({}) }}
                      />
                      <FieldError>{errors.phone}</FieldError>
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

      {/* Crop Avatar Popup */}
      {showCrop && cropSrc && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.85)', backdropFilter:'blur(6px)'}}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden animate-fade-in" style={{background:'var(--color-surface-container)', border:'1px solid var(--color-outline-variant)'}}>
            <div className="px-5 py-4 flex items-center justify-between" style={{borderBottom:'1px solid var(--color-outline-variant)'}}>
              <h3 className="font-bold text-on-surface">{t('Adjust Photo', 'ضبط الصورة')}</h3>
              <button onClick={() => setShowCrop(false)}>
                <span className="material-symbols-outlined text-on-surface-variant">close</span>
              </button>
            </div>
            {/* Crop preview area */}
            <div className="p-5 flex flex-col items-center gap-4">
              <div className="relative overflow-hidden rounded-full"
                style={{width:'220px', height:'220px', border:'3px solid var(--color-secondary-fixed)', cursor:'grab', touchAction:'none'}}
                onMouseDown={e => { dragging.current = true; dragStart.current = { x: e.clientX - cropOffset.x, y: e.clientY - cropOffset.y } }}
                onMouseMove={e => { if (!dragging.current) return; setCropOffset({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y }) }}
                onMouseUp={() => { dragging.current = false }}
                onMouseLeave={() => { dragging.current = false }}
                onTouchStart={e => { dragging.current = true; const t2 = e.touches[0]; dragStart.current = { x: t2.clientX - cropOffset.x, y: t2.clientY - cropOffset.y } }}
                onTouchMove={e => { if (!dragging.current) return; const t2 = e.touches[0]; setCropOffset({ x: t2.clientX - dragStart.current.x, y: t2.clientY - dragStart.current.y }) }}
                onTouchEnd={() => { dragging.current = false }}>
                <img ref={cropImgRef} src={cropSrc} alt="crop"
                  style={{
                    position:'absolute',
                    left:'50%', top:'50%',
                    transform:`translate(calc(-50% + ${cropOffset.x}px), calc(-50% + ${cropOffset.y}px)) scale(${cropScale})`,
                    transformOrigin:'center',
                    maxWidth:'none',
                    userSelect:'none',
                    pointerEvents:'none',
                    width:'220px',
                  }}
                  draggable={false}
                />
              </div>
              <p className="text-xs text-on-surface-variant text-center">{t('Drag to reposition', 'اسحب لإعادة التموضع')}</p>
              {/* Zoom slider */}
              <div className="w-full flex items-center gap-3">
                <span className="material-symbols-outlined text-on-surface-variant text-base">zoom_out</span>
                <input type="range" min="0.5" max="3" step="0.05" value={cropScale}
                  onChange={e => setCropScale(parseFloat(e.target.value))}
                  className="flex-1" style={{accentColor:'var(--color-primary-container)'}} />
                <span className="material-symbols-outlined text-on-surface-variant text-base">zoom_in</span>
              </div>
            </div>
            <div className="px-5 pb-5 flex gap-3">
              <button onClick={() => setShowCrop(false)}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-on-surface-variant"
                style={{background:'var(--input-bg)', border:'1px solid var(--input-border)'}}>
                {t('Cancel', 'إلغاء')}
              </button>
              <button onClick={applyCrop}
                className="flex-1 py-3 rounded-xl text-sm font-bold hydro-gradient text-white hover:opacity-90">
                {t('Apply', 'تطبيق')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Popup */}
      {showDeletePopup && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
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
