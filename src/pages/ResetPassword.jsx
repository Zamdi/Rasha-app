import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useEffect } from 'react'

// Old token-based reset links are no longer used. Redirect to the OTP flow.
export default function ResetPassword() {
  const { t } = useApp()
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => navigate('/forgot-password', { replace: true }), 3000)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="pt-14 min-h-dvh flex items-center justify-center px-4">
      <div className="glass p-8 rounded-2xl text-center max-w-sm space-y-4 animate-fade-in">
        <span className="material-symbols-outlined text-secondary-fixed text-4xl block">lock_reset</span>
        <p className="text-on-surface font-bold">{t('Reset links have been replaced with codes', 'تم استبدال روابط إعادة التعيين برموز')}</p>
        <p className="text-on-surface-variant text-sm">
          {t('Redirecting you to request a new code…', 'جارٍ تحويلك لطلب رمز جديد…')}
        </p>
        <Link to="/forgot-password" className="btn-primary px-6 py-3 rounded-xl flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-base">arrow_forward</span>
          {t('Go now', 'اذهب الآن')}
        </Link>
      </div>
    </div>
  )
}
