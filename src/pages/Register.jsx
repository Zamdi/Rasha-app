import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useApp, API } from '../context/AppContext'
import OtpInput from '../components/OtpInput'
import PhoneInput from '../components/PhoneInput'

const OTP_SECONDS = 60

export default function Register() {
  const { t, login, showToast } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const returnTo = location.state?.returnTo || '/loyalty'
  const [form, setForm] = useState({ firstName:'', lastName:'', email:'', phone:'', password:'' })
  const [dialCode, setDialCode] = useState('+249')
  const [showPw, setShowPw] = useState(false)
  const [step, setStep] = useState('form')
  const [otp, setOtp] = useState('')
  const [maskedEmail, setMaskedEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [timer, setTimer] = useState(0)
  const [dupError, setDupError] = useState(null) // popup error
  const timerRef = useRef(null)

  const set = (k, v) => setForm(f => ({...f, [k]: v}))

  const startTimer = () => {
    setTimer(OTP_SECONDS)
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimer(t => { if (t <= 1) { clearInterval(timerRef.current); return 0 } return t - 1 })
    }, 1000)
  }

  useEffect(() => () => clearInterval(timerRef.current), [])

  const submit = async () => {
    if (!form.firstName||!form.lastName||!form.email||!form.phone||!form.password) {
      showToast(t('Please fill all fields','يرجى ملء جميع الحقول'),'error'); return
    }
    if (form.password.length < 8) { showToast(t('Password must be at least 8 characters','كلمة المرور 8 أحرف على الأقل'),'error'); return }
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ firstName:form.firstName, lastName:form.lastName, email:form.email, phone:dialCode+form.phone, password:form.password })
      })
      const data = await res.json()
      if (!res.ok) {
        // Show duplicate errors as popup
        if (res.status === 409) { setDupError(data.error); return }
        showToast(data.error||t('Error','خطأ'),'error'); return
      }
      setMaskedEmail(data.maskedEmail)
      setStep('otp')
      startTimer()
    } catch { showToast(t('Connection error','خطأ في الاتصال'),'error') }
    finally { setLoading(false) }
  }

  const verify = async (codeOverride) => {
    const code = (codeOverride ?? otp).trim()
    if (code.length < 6) { showToast(t('Enter the full code','أدخل الرمز كاملاً'),'error'); return }
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/auth/verify-register`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ firstName:form.firstName, lastName:form.lastName, email:form.email, phone:dialCode+form.phone, password:form.password, otp: code })
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error||t('Invalid or expired code','رمز غير صحيح أو منتهي الصلاحية'),'error'); setLoading(false); return }
      login(data.token, data.customer)
      showToast(t('Account created!','تم إنشاء حسابك!'))
      navigate(returnTo)
    } catch { showToast(t('Connection error','خطأ في الاتصال'),'error') }
    finally { setLoading(false) }
  }

  const resend = async () => {
    await fetch(`${API}/api/auth/resend-otp`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:form.email,purpose:'register'})})
    showToast(t('Code resent','تم إعادة إرسال الرمز'))
    setOtp('')
    startTimer()
  }

  return (
    <div className="pt-14 pb-24 md:pb-10 min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-on-surface font-display">{t('Create Account','إنشاء حساب')}</h1>
          <p className="text-on-surface-variant text-sm mt-1">{t('Join Rasha loyalty program and earn free washes.','انضم لبرنامج ولاء رشة.')}</p>
        </div>

        {step === 'form' ? (
          <div className="glass p-6 rounded-2xl space-y-4 animate-fade-in">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">{t('First Name','الاسم الأول')}</label>
                <input className="rasha-input" autoComplete="given-name" name="given-name" value={form.firstName} onChange={e=>set('firstName',e.target.value)}/>
              </div>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">{t('Last Name','اسم العائلة')}</label>
                <input className="rasha-input" autoComplete="family-name" name="family-name" value={form.lastName} onChange={e=>set('lastName',e.target.value)}/>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">{t('Email','البريد الإلكتروني')}</label>
              <input type="email" className="rasha-input" autoComplete="email" name="email" placeholder="you@example.com" value={form.email} onChange={e=>set('email',e.target.value)}/>
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">{t('Phone','الهاتف')}</label>
              <PhoneInput
                value={form.phone}
                onChange={v => set('phone', v)}
                dialCode={dialCode}
                onDialChange={setDialCode}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">{t('Password','كلمة المرور')}</label>
              <div className="relative">
                <input type={showPw?'text':'password'} placeholder={t('Min 8 characters','8 أحرف على الأقل')} autoComplete="new-password" name="new-password" className="rasha-input pe-12" value={form.password} onChange={e=>set('password',e.target.value)}/>
                <button type="button" onClick={()=>setShowPw(p=>!p)} className="absolute end-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-secondary-fixed">
                  <span className="material-symbols-outlined text-xl">{showPw?'visibility_off':'visibility'}</span>
                </button>
              </div>
            </div>
            <button onClick={submit} disabled={loading} className="btn-primary w-full py-4 rounded-xl">
              {loading ? <div className="loader"/> : t('Create Account','إنشاء الحساب')}
            </button>
            <p className="text-center text-sm text-on-surface-variant">
              {t('Already have an account?','لديك حساب بالفعل؟')}{' '}
              <Link to="/login" state={{ returnTo }} className="text-secondary-fixed hover:underline">{t('Sign In','تسجيل الدخول')}</Link>
            </p>
          </div>
        ) : (
          <div className="glass p-6 rounded-2xl space-y-6 animate-fade-in">
            <div>
              <h3 className="font-bold text-on-surface mb-1">{t('Verify Your Email','تحقق من بريدك الإلكتروني')}</h3>
              <p className="text-on-surface-variant text-sm">{t(`We sent a 6-digit code to`,'أرسلنا رمزاً إلى')} <span className="text-secondary-fixed font-semibold">{maskedEmail}</span></p>
            </div>
            <OtpInput value={otp} onChange={setOtp} onComplete={code => verify(code)} />
            {/* Timer */}
            <div className="text-center">
              {timer > 0 ? (
                <p className="text-sm text-on-surface-variant">
                  {t('Code expires in','ينتهي الرمز خلال')} <span className="font-bold text-secondary-fixed">{timer}s</span>
                </p>
              ) : (
                <p className="text-sm text-error">{t('Code expired','انتهت صلاحية الرمز')}</p>
              )}
            </div>
            <button onClick={verify} disabled={loading || timer === 0} className="btn-primary w-full py-4 rounded-xl disabled:opacity-50">
              {loading ? <div className="loader"/> : t('Verify & Create Account','تحقق وأنشئ الحساب')}
            </button>
            <button onClick={resend} disabled={timer > 0}
              className={`w-full text-sm py-2 rounded-xl transition-all ${timer > 0 ? 'text-on-surface-variant opacity-40 cursor-not-allowed' : 'text-secondary-fixed hover:underline'}`}>
              {timer > 0 ? `${t('Resend in','إعادة الإرسال خلال')} ${timer}s` : t('Resend Code','إعادة إرسال الرمز')}
            </button>
          </div>
        )}
      </div>

      {/* Duplicate error popup */}
      {dupError && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)'}}>
          <div className="w-full max-w-sm rounded-2xl p-6 animate-fade-in text-center" style={{background:'var(--color-surface-container)', border:'1px solid var(--color-outline-variant)'}}>
            <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{background:'rgba(179,38,30,0.1)'}}>
              <span className="material-symbols-outlined text-error text-3xl">person_off</span>
            </div>
            <h3 className="font-bold text-on-surface text-lg mb-2">{t('Account Already Exists','الحساب موجود بالفعل')}</h3>
            <p className="text-on-surface-variant text-sm mb-6">{dupError}</p>
            <div className="flex gap-3">
              <button onClick={() => setDupError(null)} className="flex-1 py-3 rounded-xl text-sm font-bold text-on-surface-variant" style={{background:'var(--input-bg)', border:'1px solid var(--input-border)'}}>
                {t('Try Again','حاول مجدداً')}
              </button>
              <Link to="/login" state={{ returnTo }} onClick={() => setDupError(null)} className="flex-1 py-3 rounded-xl text-sm font-bold text-white text-center hydro-gradient">
                {t('Sign In','تسجيل الدخول')}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
