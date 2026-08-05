import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp, API } from '../context/AppContext'

export default function ForgotPassword() {
  const { t } = useApp()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!email.trim()) { setError(t('Please enter your email','يرجى إدخال بريدك الإلكتروني')); return }
    setError(''); setLoading(true)
    try {
      const res = await fetch(`${API}/api/auth/forgot-password`, {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      })
      // Always show success (don't reveal if email exists)
      setSent(true)
    } catch { setError(t('Connection error','خطأ في الاتصال')) }
    finally { setLoading(false) }
  }

  return (
    <div className="pt-14 pb-24 md:pb-10 min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl hydro-gradient flex items-center justify-center mx-auto mb-4 cyan-glow">
            <span className="material-symbols-outlined text-white text-3xl">lock_reset</span>
          </div>
          <h1 className="text-3xl font-bold text-on-surface font-display">{t('Forgot Password','نسيت كلمة المرور')}</h1>
          <p className="text-on-surface-variant text-sm mt-1">{t("We'll send a reset link to your email.",'سنرسل رابط إعادة التعيين إلى بريدك.')}</p>
        </div>

        {!sent ? (
          <div className="glass p-6 rounded-2xl space-y-4 animate-fade-in">
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">{t('Email Address','البريد الإلكتروني')}</label>
              <input type="email" className="rasha-input" placeholder="you@example.com"
                value={email} onChange={e => { setEmail(e.target.value); setError('') }}
                onKeyDown={e => e.key==='Enter' && submit()} />
              {error && <p className="text-error text-xs mt-1">{error}</p>}
            </div>
            <button onClick={submit} disabled={loading} className="btn-primary w-full py-4 rounded-xl">
              {loading ? <div className="loader"/> : t('Send Reset Link','إرسال رابط إعادة التعيين')}
            </button>
            <p className="text-center text-sm text-on-surface-variant">
              <Link to="/login" className="text-secondary-fixed hover:underline flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-base">arrow_back</span>
                {t('Back to Sign In','العودة لتسجيل الدخول')}
              </Link>
            </p>
          </div>
        ) : (
          <div className="glass p-8 rounded-2xl text-center animate-fade-in space-y-4">
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{background:'rgba(34,197,94,0.1)'}}>
              <span className="material-symbols-outlined text-green-400 text-3xl">mark_email_read</span>
            </div>
            <h3 className="font-bold text-on-surface text-lg">{t('Check your inbox','تحقق من بريدك')}</h3>
            <p className="text-on-surface-variant text-sm">
              {t('If an account exists for','إذا كان هناك حساب لـ')} <span className="text-secondary-fixed font-semibold">{email}</span>{t(', you will receive a password reset link shortly.',', ستتلقى رابط إعادة التعيين قريباً.')}
            </p>
            <Link to="/login" className="btn-primary w-full py-3 rounded-xl flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-base">arrow_back</span>
              {t('Back to Sign In','العودة لتسجيل الدخول')}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
