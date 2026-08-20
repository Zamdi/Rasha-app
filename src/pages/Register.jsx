import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useApp, API } from '../context/AppContext'
import OtpInput from '../components/OtpInput'
import PhoneInput from '../components/PhoneInput'
import FieldError, { invalidClass } from '../components/FieldError'
import { passwordStrength } from '../utils/passwordStrength'
import { apiError, isRateLimited } from '../utils/apiErrors'

const OTP_SECONDS = 60

export default function Register() {
  const { t, lang, login, showToast, showError } = useApp()
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
  // One entry per input. Errors sit under the field they belong to rather than
  // in a toast that covers the form the customer is trying to correct.
  const [errors, setErrors] = useState({})
  const timerRef = useRef(null)

  // Editing a field clears its error — the message described the old value.
  const set = (k, v) => {
    setForm(f => ({...f, [k]: v}))
    setErrors(e => (e[k] ? { ...e, [k]: null } : e))
  }
  const buildPhone = () => {
    let p = form.phone
    if (p.startsWith('00')) p = p.slice(2)
    const dialDigits = dialCode.replace('+', '')
    if (p.startsWith(dialDigits)) p = p.slice(dialDigits.length)
    if (p.startsWith('0')) p = p.slice(1)
    return dialCode + p
  }

  const startTimer = () => {
    setTimer(OTP_SECONDS)
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimer(t => { if (t <= 1) { clearInterval(timerRef.current); return 0 } return t - 1 })
    }, 1000)
  }

  useEffect(() => () => clearInterval(timerRef.current), [])

  const validate = () => {
    const next = {}
    const required = t('Required', 'مطلوب')
    if (!form.firstName.trim()) next.firstName = required
    if (!form.lastName.trim())  next.lastName  = required
    if (!form.email.trim())     next.email     = required
    else if (!/^\S+@\S+\.\S+$/.test(form.email.trim()))
      next.email = t('Enter a valid email address', 'أدخل بريداً إلكترونياً صحيحاً')
    if (!form.phone.trim())     next.phone     = required
    if (!form.password)         next.password  = required
    else if (form.password.length < 8)
      next.password = t('At least 8 characters', '8 أحرف على الأقل')
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async () => {
    if (!validate()) return
    setLoading(true)
    let retries = 0
    const attempt = async () => {
      try {
        const res = await fetch(`${API}/api/auth/register`, {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ firstName:form.firstName, lastName:form.lastName, email:form.email, phone:buildPhone(), password:form.password })
        })
        const data = await res.json()
        setLoading(false)
        if (!res.ok) {
          const msg = apiError(data.error, lang, t('Could not create your account', 'تعذر إنشاء حسابك'))
          // A duplicate belongs on the field that's duplicated, with a route to
          // sign in — that's what the customer almost certainly wants next.
          if (res.status === 409) {
            const onPhone = /phone/i.test(data.error || '')
            setErrors(e => ({ ...e, [onPhone ? 'phone' : 'email']: msg }))
            showError({
              icon: 'person_off',
              title: t('Account already exists', 'الحساب موجود بالفعل'),
              message: msg,
              actions: [
                { label: t('Edit details', 'تعديل البيانات') },
                { label: t('Sign In', 'تسجيل الدخول'), primary: true, to: '/login' },
              ],
            })
            return
          }
          if (isRateLimited(data.error)) {
            showError({
              icon: 'hourglass_top',
              title: t('Too many attempts', 'محاولات كثيرة'),
              message: msg,
            })
            return
          }
          // Field-specific rejections from the API land on their field.
          if (/first name/i.test(data.error || ''))      setErrors(e => ({ ...e, firstName: msg }))
          else if (/last name/i.test(data.error || ''))  setErrors(e => ({ ...e, lastName: msg }))
          else if (/email/i.test(data.error || ''))      setErrors(e => ({ ...e, email: msg }))
          else if (/phone/i.test(data.error || ''))      setErrors(e => ({ ...e, phone: msg }))
          else showToast(msg, 'error')
          return
        }
        setMaskedEmail(data.maskedEmail)
        setStep('otp')
        startTimer()
      } catch {
        if (retries < 2) {
          retries++
          showToast(t('Server is starting up — retrying in 8 seconds…','الخادم يعمل — إعادة المحاولة خلال 8 ثوانٍ…'),'error')
          setTimeout(attempt, 8000)
        } else {
          setLoading(false)
          showToast(t('Connection error. Please try again in a moment.','خطأ في الاتصال. حاول مجدداً بعد لحظة.'),'error')
        }
      }
    }
    attempt()
  }

  const verify = async (codeOverride) => {
    const code = (codeOverride ?? otp).trim()
    if (code.length < 6) {
      setErrors(e => ({ ...e, otp: t('Enter the full code','أدخل الرمز كاملاً') })); return
    }
    setErrors(e => ({ ...e, otp: null }))
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/auth/verify-register`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ firstName:form.firstName, lastName:form.lastName, email:form.email, phone:buildPhone(), password:form.password, otp: code })
      })
      const data = await res.json()
      if (!res.ok) {
        const msg = apiError(data.error, lang, t('Invalid or expired code','رمز غير صحيح أو منتهي الصلاحية'))
        // The attempt limit kills the code on screen — that needs stopping for,
        // not a message that fades while they retype the same digits.
        if (isRateLimited(data.error)) {
          showError({
            icon: 'hourglass_top',
            title: t('Too many attempts', 'محاولات كثيرة'),
            message: msg,
            actions: [{ label: t('Request a new code', 'طلب رمز جديد'), primary: true, onClick: resend }],
          })
        } else {
          setErrors(e => ({ ...e, otp: msg }))
        }
        setLoading(false); return
      }
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
    <div className="pt-14 pb-24 md:pb-10 min-h-dvh flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-on-surface font-display">{t('Create Account','إنشاء حساب')}</h1>
          <p className="text-on-surface-variant text-sm mt-1">{t('Join Rasha loyalty program and earn free washes.','انضم لبرنامج ولاء رشة.')}</p>
        </div>

        {step === 'form' ? (
          <div className="glass p-6 rounded-2xl space-y-4 animate-fade-in">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="reg-first" className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">{t('First Name','الاسم الأول')}</label>
                <input id="reg-first" className={'rasha-input' + invalidClass(errors.firstName)} aria-invalid={!!errors.firstName} autoComplete="given-name" name="given-name" value={form.firstName} onChange={e=>set('firstName',e.target.value)}/>
                <FieldError>{errors.firstName}</FieldError>
              </div>
              <div>
                <label htmlFor="reg-last" className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">{t('Last Name','اسم العائلة')}</label>
                <input id="reg-last" className={'rasha-input' + invalidClass(errors.lastName)} aria-invalid={!!errors.lastName} autoComplete="family-name" name="family-name" value={form.lastName} onChange={e=>set('lastName',e.target.value)}/>
                <FieldError>{errors.lastName}</FieldError>
              </div>
            </div>
            <div>
              <label htmlFor="reg-email" className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">{t('Email','البريد الإلكتروني')}</label>
              <input id="reg-email" type="email" className={'rasha-input' + invalidClass(errors.email)} aria-invalid={!!errors.email} autoComplete="email" name="email" placeholder="you@example.com" value={form.email} onChange={e=>set('email',e.target.value)}/>
              <FieldError>{errors.email}</FieldError>
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">{t('Phone','الهاتف')}</label>
              <PhoneInput
                value={form.phone}
                onChange={v => set('phone', v)}
                dialCode={dialCode}
                onDialChange={setDialCode}
              />
              <FieldError>{errors.phone}</FieldError>
            </div>
            <div>
              <label htmlFor="reg-pw" className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">{t('Password','كلمة المرور')}</label>
              <div className="relative">
                <input id="reg-pw" type={showPw?'text':'password'} placeholder={t('Min 8 characters','8 أحرف على الأقل')} autoComplete="new-password" name="new-password" className={'rasha-input pe-12' + invalidClass(errors.password)} aria-invalid={!!errors.password} value={form.password} onChange={e=>set('password',e.target.value)}/>
                <button type="button" onClick={()=>setShowPw(p=>!p)} className="absolute end-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-secondary-fixed">
                  <span className="material-symbols-outlined text-xl">{showPw?'visibility_off':'visibility'}</span>
                </button>
              </div>
              {form.password && (() => {
                const strength = passwordStrength(form.password)
                return (
                  <div className="mt-2">
                    <div className="flex gap-1">
                      {[0, 1, 2, 3].map(i => (
                        <div key={i} className="h-1 flex-1 rounded-full transition-colors"
                          style={{ background: i < strength.score ? strength.color : 'var(--color-outline-variant)' }} />
                      ))}
                    </div>
                    <p className="text-xs mt-1 font-semibold" style={{ color: strength.color }}>
                      {t(...strength.label)}
                    </p>
                  </div>
                )
              })()}
              <FieldError>{errors.password}</FieldError>
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
              <p className="text-on-surface-variant text-sm">
                {t(`We sent a 6-digit code to`,'أرسلنا رمزاً إلى')} <span className="text-secondary-fixed font-semibold">{maskedEmail}</span>{' '}
                <button type="button" onClick={() => setStep('form')} className="text-secondary-fixed hover:underline font-semibold">
                  {t('Wrong email? Edit','بريد خاطئ؟ تعديل')}
                </button>
              </p>
            </div>
            <div>
              <OtpInput value={otp} onChange={v => { setOtp(v); setErrors(e => (e.otp ? { ...e, otp: null } : e)) }} onComplete={code => verify(code)} />
              <FieldError>{errors.otp}</FieldError>
            </div>
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
    </div>
  )
}
