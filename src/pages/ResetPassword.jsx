import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useApp, API } from '../context/AppContext'

export default function ResetPassword() {
  const { t } = useApp()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (password.length < 8) e.password = t('Password must be at least 8 characters', 'كلمة المرور 8 أحرف على الأقل')
    if (password !== confirm) e.confirm = t('Passwords do not match', 'كلمتا المرور غير متطابقتين')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      })
      const data = await res.json()
      if (!res.ok) {
        setErrors({ general: data.error || t('Invalid or expired link', 'رابط غير صالح أو منتهي الصلاحية') })
        return
      }
      setDone(true)
    } catch {
      setErrors({ general: t('Connection error', 'خطأ في الاتصال') })
    } finally { setLoading(false) }
  }

  if (!token) {
    return (
      <div className="pt-14 min-h-screen flex items-center justify-center px-4">
        <div className="glass p-8 rounded-2xl text-center max-w-sm space-y-4">
          <span className="material-symbols-outlined text-error text-4xl block">link_off</span>
          <p className="text-on-surface font-bold">{t('Invalid reset link', 'رابط إعادة التعيين غير صالح')}</p>
          <Link to="/forgot-password" className="btn-primary px-6 py-3 rounded-xl flex items-center justify-center">
            {t('Request new link', 'طلب رابط جديد')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-14 pb-24 md:pb-10 min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl hydro-gradient flex items-center justify-center mx-auto mb-4 teal-glow">
            <span className="material-symbols-outlined text-white text-3xl">lock_reset</span>
          </div>
          <h1 className="text-3xl font-bold text-on-surface font-display">
            {t('Reset Password', 'إعادة تعيين كلمة المرور')}
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            {t('Enter your new password below.', 'أدخل كلمة المرور الجديدة أدناه.')}
          </p>
        </div>

        {!done ? (
          <div className="glass p-6 rounded-2xl space-y-4 animate-fade-in">

            {errors.general && (
              <div className="p-3 rounded-xl text-sm text-center font-semibold"
                style={{ background: 'rgba(179,38,30,0.08)', border: '1px solid rgba(179,38,30,0.25)', color: 'var(--color-error)' }}>
                {errors.general}
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">
                {t('New Password', 'كلمة المرور الجديدة')}
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="rasha-input pe-12"
                  style={errors.password ? { borderColor: 'var(--color-error)' } : {}}
                  placeholder={t('Min 8 characters', '8 أحرف على الأقل')}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setErrors(v => ({...v, password: ''})) }}
                />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-secondary-fixed">
                  <span className="material-symbols-outlined text-xl">{showPw ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
              {errors.password && <p className="text-xs mt-1" style={{color:'var(--color-error)'}}>{errors.password}</p>}
            </div>

            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">
                {t('Confirm Password', 'تأكيد كلمة المرور')}
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  className="rasha-input pe-12"
                  style={errors.confirm ? { borderColor: 'var(--color-error)' } : {}}
                  placeholder={t('Re-enter password', 'أعد إدخال كلمة المرور')}
                  value={confirm}
                  onChange={e => { setConfirm(e.target.value); setErrors(v => ({...v, confirm: ''})) }}
                />
                <button type="button" onClick={() => setShowConfirm(p => !p)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-secondary-fixed">
                  <span className="material-symbols-outlined text-xl">{showConfirm ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
              {errors.confirm && <p className="text-xs mt-1" style={{color:'var(--color-error)'}}>{errors.confirm}</p>}
            </div>

            <button onClick={submit} disabled={loading} className="btn-primary w-full py-4 rounded-xl">
              {loading ? <div className="loader" /> : t('Reset Password', 'إعادة تعيين كلمة المرور')}
            </button>

          </div>
        ) : (
          <div className="glass p-8 rounded-2xl text-center animate-fade-in space-y-4">
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
              style={{ background: 'rgba(34,197,94,0.1)' }}>
              <span className="material-symbols-outlined fill-icon text-3xl" style={{color:'#22c55e'}}>check_circle</span>
            </div>
            <h3 className="font-bold text-on-surface text-xl">{t('Password Reset!', 'تم إعادة التعيين!')}</h3>
            <p className="text-on-surface-variant text-sm">
              {t('Your password has been reset successfully. You can now sign in with your new password.',
                'تم إعادة تعيين كلمة مرورك بنجاح. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.')}
            </p>
            <Link to="/login" className="btn-primary w-full py-3 rounded-xl flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-base">login</span>
              {t('Sign In', 'تسجيل الدخول')}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
