import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp, API } from '../context/AppContext'
import FieldError, { invalidClass } from '../components/FieldError'
import { apiError, isRateLimited } from '../utils/apiErrors'
import { passwordStrength } from '../utils/passwordStrength'

// step 1 = enter email → send OTP
// step 2 = enter 6-digit code
// step 3 = enter new password
export default function ForgotPassword() {
  const { t, lang, showToast, showError } = useApp()
  const [step, setStep]         = useState(1)
  const [email, setEmail]       = useState('')
  const [otp, setOtp]           = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [showCf, setShowCf]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [done, setDone]         = useState(false)
  // One key per input across all three steps, so each message can sit under
  // the field it describes instead of stacking at the top of the card.
  const [errors, setErrors]     = useState({})
  const [resent, setResent]     = useState(false)

  const clearError = (k) => setErrors(e => (e[k] ? { ...e, [k]: null } : e))

  const sendCode = async () => {
    const value = email.trim()
    if (!value) { setErrors({ email: t('Please enter your email', 'يرجى إدخال بريدك الإلكتروني') }); return }
    if (!/^\S+@\S+\.\S+$/.test(value)) {
      setErrors({ email: t('Enter a valid email address', 'أدخل بريداً إلكترونياً صحيحاً') }); return
    }
    setErrors({}); setLoading(true)
    try {
      await fetch(`${API}/api/auth/forgot-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value.toLowerCase() }),
      })
      // Always advance (don't reveal if email exists)
      setStep(2)
    } catch {
      showToast(t('Connection error. Please try again.', 'خطأ في الاتصال. حاول مجدداً.'), 'error')
    }
    finally { setLoading(false) }
  }

  const resendCode = async () => {
    setResent(false); setErrors({})
    try {
      await fetch(`${API}/api/auth/forgot-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      setResent(true)
    } catch {
      showToast(t('Could not resend. Try again.', 'تعذر الإرسال. حاول مجدداً.'), 'error')
    }
  }

  const verifyCode = async () => {
    if (otp.trim().length !== 6) { setErrors({ otp: t('Enter the 6-digit code', 'أدخل الرمز المكوّن من 6 أرقام') }); return }
    // The code is verified server-side when the password is submitted.
    // Move to step 3 immediately to avoid an extra round-trip.
    setErrors({})
    setStep(3)
  }

  const submitReset = async () => {
    const next = {}
    if (password.length < 8) next.password = t('Password must be at least 8 characters', 'كلمة المرور 8 أحرف على الأقل')
    if (password !== confirm) next.confirm = t('Passwords do not match', 'كلمتا المرور غير متطابقتين')
    setErrors(next)
    if (Object.keys(next).length) return
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/auth/reset-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: otp.trim(), password }),
      })
      const data = await res.json()
      if (!res.ok) {
        const msg = apiError(data.error, lang, t('Could not reset password', 'تعذرت إعادة التعيين'))
        if (isRateLimited(data.error)) {
          showError({
            icon: 'hourglass_top',
            title: t('Too many attempts', 'محاولات كثيرة'),
            message: msg,
            actions: [{ label: t('Start over', 'ابدأ من جديد'), primary: true, onClick: () => { setStep(1); setOtp('') } }],
          })
          return
        }
        // A bad or expired code is a step-2 problem — send them back to the
        // input that has to change, with the error attached to it.
        if (/code|expired/i.test(data.error || '')) {
          setErrors({ otp: msg }); setStep(2)
        } else if (/password/i.test(data.error || '')) {
          setErrors({ password: msg })
        } else {
          setErrors({ password: msg })
        }
        return
      }
      setDone(true)
    } catch {
      showToast(t('Connection error. Please try again.', 'خطأ في الاتصال. حاول مجدداً.'), 'error')
    }
    finally { setLoading(false) }
  }

  const icon = (
    <div className="w-16 h-16 rounded-2xl hydro-gradient flex items-center justify-center mx-auto mb-4 teal-glow">
      <span className="material-symbols-outlined text-white text-3xl">lock_reset</span>
    </div>
  )

  if (done) return (
    <div className="pt-14 pb-24 md:pb-10 min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md glass p-8 rounded-2xl text-center animate-fade-in space-y-4">
        <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.1)' }}>
          <span className="material-symbols-outlined fill-icon text-3xl" style={{ color: '#22c55e' }}>check_circle</span>
        </div>
        <h3 className="font-bold text-on-surface text-xl">{t('Password Reset!', 'تم إعادة التعيين!')}</h3>
        <p className="text-on-surface-variant text-sm">
          {t('Your password has been reset. You can now sign in.', 'تم إعادة تعيين كلمة مرورك. يمكنك الآن تسجيل الدخول.')}
        </p>
        <Link to="/login" className="btn-primary w-full py-3 rounded-xl flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-base">login</span>
          {t('Sign In', 'تسجيل الدخول')}
        </Link>
      </div>
    </div>
  )

  return (
    <div className="pt-14 pb-24 md:pb-10 min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          {icon}
          <h1 className="text-3xl font-bold text-on-surface font-display">
            {t('Forgot Password', 'نسيت كلمة المرور')}
          </h1>
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mt-3">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                  style={{
                    background: s <= step ? 'var(--color-secondary-fixed)' : 'var(--input-bg)',
                    color: s <= step ? '#fff' : 'var(--color-on-surface-variant)',
                    border: s <= step ? 'none' : '1px solid var(--input-border)',
                  }}>
                  {s < step ? <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check</span> : s}
                </div>
                {s < 3 && <div className="w-6 h-px" style={{ background: s < step ? 'var(--color-secondary-fixed)' : 'var(--input-border)' }} />}
              </div>
            ))}
          </div>
        </div>

        <div className="glass p-6 rounded-2xl space-y-4 animate-fade-in">
          {/* Step 1: Email */}
          {step === 1 && (
            <>
              <p className="text-on-surface-variant text-sm">
                {t("Enter your email and we'll send a 6-digit code.", 'أدخل بريدك وسنرسل لك رمزاً مكوناً من 6 أرقام.')}
              </p>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">
                  {t('Email Address', 'البريد الإلكتروني')}
                </label>
                <input type="email" className={'rasha-input' + invalidClass(errors.email)} placeholder="you@example.com"
                  aria-invalid={!!errors.email}
                  value={email} onChange={e => { setEmail(e.target.value); clearError('email') }}
                  onKeyDown={e => e.key === 'Enter' && sendCode()} />
                <FieldError>{errors.email}</FieldError>
              </div>
              <button onClick={sendCode} disabled={loading} className="btn-primary w-full py-4 rounded-xl">
                {loading ? <div className="loader" /> : t('Send Code', 'إرسال الرمز')}
              </button>
            </>
          )}

          {/* Step 2: OTP */}
          {step === 2 && (
            <>
              <p className="text-on-surface-variant text-sm">
                {t('We sent a 6-digit code to', 'أرسلنا رمزاً مكوناً من 6 أرقام إلى')}{' '}
                <span className="text-secondary-fixed font-semibold">{email}</span>.
                {' '}{t('Check your inbox (and spam folder).', 'تحقق من بريدك الوارد (وملف الرسائل غير المرغوب فيها).')}
              </p>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">
                  {t('6-Digit Code', 'الرمز المكوّن من 6 أرقام')}
                </label>
                <input type="text" inputMode="numeric" maxLength={6}
                  className={'rasha-input text-center text-xl tracking-widest font-bold' + invalidClass(errors.otp)}
                  placeholder="• • • • • •" aria-invalid={!!errors.otp}
                  value={otp} onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); clearError('otp') }}
                  onKeyDown={e => e.key === 'Enter' && verifyCode()} />
                <FieldError>{errors.otp}</FieldError>
              </div>
              {resent && (
                <p className="text-xs text-center" style={{ color: 'var(--color-secondary-fixed)' }}>
                  {t('Code resent!', 'تم إعادة الإرسال!')}
                </p>
              )}
              <button onClick={verifyCode} disabled={loading} className="btn-primary w-full py-4 rounded-xl">
                {loading ? <div className="loader" /> : t('Continue', 'متابعة')}
              </button>
              <div className="flex items-center justify-between text-xs text-on-surface-variant">
                <button onClick={() => setStep(1)} className="hover:text-secondary-fixed transition-colors">
                  ← {t('Change email', 'تغيير البريد')}
                </button>
                <button onClick={resendCode} className="hover:text-secondary-fixed transition-colors">
                  {t('Resend code', 'إعادة إرسال الرمز')}
                </button>
              </div>
            </>
          )}

          {/* Step 3: New password */}
          {step === 3 && (
            <>
              <p className="text-on-surface-variant text-sm">
                {t('Choose a new password for your account.', 'اختر كلمة مرور جديدة لحسابك.')}
              </p>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">
                  {t('New Password', 'كلمة المرور الجديدة')}
                </label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} className={'rasha-input pe-12' + invalidClass(errors.password)}
                    placeholder={t('Min 8 characters', '8 أحرف على الأقل')} aria-invalid={!!errors.password}
                    value={password} onChange={e => { setPassword(e.target.value); clearError('password') }} />
                  <button type="button" onClick={() => setShowPw(p => !p)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-secondary-fixed">
                    <span className="material-symbols-outlined text-xl">{showPw ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
                {password && (() => {
                  const s = passwordStrength(password)
                  return (
                    <div className="mt-2">
                      <div className="flex gap-1">
                        {[0, 1, 2, 3].map(i => (
                          <div key={i} className="h-1 flex-1 rounded-full transition-colors"
                            style={{ background: i < s.score ? s.color : 'var(--color-outline-variant)' }} />
                        ))}
                      </div>
                      <p className="text-xs mt-1 font-semibold" style={{ color: s.color }}>{t(...s.label)}</p>
                    </div>
                  )
                })()}
                <FieldError>{errors.password}</FieldError>
              </div>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">
                  {t('Confirm Password', 'تأكيد كلمة المرور')}
                </label>
                <div className="relative">
                  <input type={showCf ? 'text' : 'password'} className={'rasha-input pe-12' + invalidClass(errors.confirm)}
                    placeholder={t('Re-enter password', 'أعد إدخال كلمة المرور')} aria-invalid={!!errors.confirm}
                    value={confirm} onChange={e => { setConfirm(e.target.value); clearError('confirm') }}
                    onKeyDown={e => e.key === 'Enter' && submitReset()} />
                  <button type="button" onClick={() => setShowCf(p => !p)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-secondary-fixed">
                    <span className="material-symbols-outlined text-xl">{showCf ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
                <FieldError>{errors.confirm}</FieldError>
              </div>
              <button onClick={submitReset} disabled={loading} className="btn-primary w-full py-4 rounded-xl">
                {loading ? <div className="loader" /> : t('Reset Password', 'إعادة تعيين كلمة المرور')}
              </button>
            </>
          )}

          <p className="text-center text-sm text-on-surface-variant">
            <Link to="/login" className="text-secondary-fixed hover:underline flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-base">arrow_back</span>
              {t('Back to Sign In', 'العودة لتسجيل الدخول')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
