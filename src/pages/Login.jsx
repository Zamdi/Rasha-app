import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useApp, API } from '../context/AppContext'
import OtpInput from '../components/OtpInput'

const OTP_SECONDS = 60

export default function Login() {
  const { t, login, showToast } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const returnTo = location.state?.returnTo || '/loyalty'
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [step, setStep] = useState('form')
  const [otp, setOtp] = useState('')
  const [loginEmail, setLoginEmail] = useState('')
  const [maskedEmail, setMaskedEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [timer, setTimer] = useState(0)
  const timerRef = useRef(null)

  const startTimer = () => {
    setTimer(OTP_SECONDS)
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimer(t => { if (t <= 1) { clearInterval(timerRef.current); return 0 } return t - 1 })
    }, 1000)
  }

  useEffect(() => () => clearInterval(timerRef.current), [])

  const submit = async () => {
    if (!identifier||!password) { showToast(t('Please fill all fields','يرجى ملء جميع الحقول'),'error'); return }
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({identifier,password})})
      const data = await res.json()
      if (!res.ok) { showToast(data.error||t('Invalid credentials','بيانات غير صحيحة'),'error'); return }
      setLoginEmail(data.email)
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
      const res = await fetch(`${API}/api/auth/verify-login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:loginEmail, otp: code})})
      const data = await res.json()
      if (!res.ok) { showToast(data.error||t('Invalid or expired code','رمز غير صحيح أو منتهي الصلاحية'),'error'); setLoading(false); return }
      login(data.token, data.customer)
      showToast(t('Welcome back!','مرحباً بك!'))
      navigate(returnTo)
    } catch { showToast(t('Connection error','خطأ في الاتصال'),'error') }
    finally { setLoading(false) }
  }

  const resend = async () => {
    await fetch(`${API}/api/auth/resend-otp`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:loginEmail,purpose:'login'})})
    showToast(t('Code resent','تم إعادة إرسال الرمز'))
    setOtp('')
    startTimer()
  }

  return (
    <div className="pt-14 pb-24 md:pb-10 min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-on-surface font-display">{t('Welcome Back','مرحباً بك')}</h1>
          <p className="text-on-surface-variant text-sm mt-1">{t('Sign in to access your loyalty card.','سجل دخولك للوصول لبطاقة ولائك.')}</p>
        </div>

        {step === 'form' ? (
          <div className="glass p-6 rounded-2xl space-y-4 animate-fade-in">
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">{t('Email or Phone','البريد أو الهاتف')}</label>
              <input className="rasha-input" autoComplete="username" name="username" placeholder="email@example.com" value={identifier} onChange={e=>setIdentifier(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()}/>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{t('Password','كلمة المرور')}</label>
                <Link to="/forgot-password" className="text-xs text-secondary-fixed hover:underline">{t('Forgot password?','نسيت كلمة المرور؟')}</Link>
              </div>
              <div className="relative">
                <input type={showPw?'text':'password'} autoComplete="current-password" name="current-password" className="rasha-input pe-12" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()}/>
                <button type="button" onClick={()=>setShowPw(p=>!p)} className="absolute end-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-secondary-fixed">
                  <span className="material-symbols-outlined text-xl">{showPw?'visibility_off':'visibility'}</span>
                </button>
              </div>
            </div>
            <button onClick={submit} disabled={loading} className="btn-primary w-full py-4 rounded-xl">
              {loading ? <div className="loader"/> : t('Sign In','تسجيل الدخول')}
            </button>
            <p className="text-center text-sm text-on-surface-variant">
              {t("Don't have an account?",'ليس لديك حساب؟')}{' '}
              <Link to="/register" state={{ returnTo }} className="text-secondary-fixed hover:underline">{t('Register','إنشاء حساب')}</Link>
            </p>
          </div>
        ) : (
          <div className="glass p-6 rounded-2xl space-y-6 animate-fade-in">
            <div>
              <h3 className="font-bold text-on-surface mb-1">{t('Enter Verification Code','أدخل رمز التحقق')}</h3>
              <p className="text-on-surface-variant text-sm">
                {t('Code sent to','تم الإرسال إلى')} <span className="text-secondary-fixed font-semibold">{maskedEmail}</span>{' '}
                <button type="button" onClick={() => setStep('form')} className="text-secondary-fixed hover:underline font-semibold">
                  {t('Wrong email? Edit','بريد خاطئ؟ تعديل')}
                </button>
              </p>
            </div>
            <OtpInput value={otp} onChange={setOtp} onComplete={code => verify(code)}/>
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
              {loading ? <div className="loader"/> : t('Verify & Sign In','تحقق وسجل الدخول')}
            </button>
            <button onClick={resend} disabled={timer > 0}
              className={`w-full text-sm py-2 rounded-xl transition-all ${timer > 0 ? 'text-on-surface-variant opacity-40 cursor-not-allowed' : 'text-secondary-fixed hover:underline'}`}>
              {timer > 0 ? `${t('Resend in','إعادة الإرسال خلال')} ${timer}s` : t('Resend Code','إعادة إرسال الرمز')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
