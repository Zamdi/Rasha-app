import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function NotFound() {
  const { t } = useApp()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 pb-16 md:pb-0"
      style={{ background: 'var(--color-background)' }}>
      <span className="material-symbols-outlined text-secondary-fixed text-6xl mb-4">local_car_wash</span>
      <h1 className="text-4xl font-extrabold font-display text-on-surface mb-2">404</h1>
      <p className="text-on-surface-variant text-base max-w-sm mb-8">
        {t("This page took a wrong turn. It doesn't exist, or it's moved.",
           'هذه الصفحة سلكت طريقاً خاطئاً. غير موجودة أو تم نقلها.')}
      </p>
      <Link to="/" className="btn-primary text-sm px-8 py-3.5 rounded-xl inline-flex items-center gap-2">
        {t('Back to Home', 'العودة للرئيسية')}
      </Link>
    </div>
  )
}
