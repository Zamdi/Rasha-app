import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'

const Section = ({ icon, title, children }) => (
  <div className="rounded-xl p-6 md:p-8" style={{ background: 'var(--color-surface-container)', border: '1px solid var(--color-outline-variant)' }}>
    <h2 className="text-xl font-bold text-on-surface font-display mb-4 flex items-center gap-3">
      <span className="material-symbols-outlined text-secondary-fixed text-2xl">{icon}</span>
      {title}
    </h2>
    {children}
  </div>
)

export default function Privacy() {
  const { t } = useApp()

  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0" style={{ background: 'var(--color-background)' }}>
      <main className="flex-grow w-full max-w-5xl mx-auto px-4 md:px-6 pt-16 pb-16">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold font-display text-on-surface mb-3">
            {t('Privacy Policy', 'سياسة الخصوصية')}
          </h1>
          <p className="text-on-surface-variant text-sm">
            {t('Last updated: May 2024. Your trust is our priority. We are committed to protecting your personal data through advanced security and transparency.',
              'آخر تحديث: مايو 2024. ثقتك أولويتنا. نلتزم بحماية بياناتك الشخصية من خلال الأمان المتقدم والشفافية.')}
          </p>
        </div>

        <div className="space-y-4">
          {/* 1. Introduction — full width */}
          <Section icon="shield" title={t('Introduction', 'المقدمة')}>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              {t('At Rasha, we value your privacy above all. This policy outlines how we handle your information when you use our premium automotive detailing services. We ensure that every interaction remains confidential and secure.',
                'في رشة، نقدّر خصوصيتك فوق كل شيء. تحدد هذه السياسة كيفية تعاملنا مع معلوماتك عند استخدام خدمات التفصيل المتميزة لدينا. نضمن أن تظل كل تفاعل سرياً وآمناً.')}
            </p>
          </Section>

          {/* 2 & 3 side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Section icon="sync" title={t('Information We Collect', 'المعلومات التي نجمعها')}>
              <ul className="space-y-3">
                {[
                  t('Phone Number (Sudan +249)', 'رقم الهاتف (السودان +249)'),
                  t('Booking & Service History', 'سجل الحجوزات والخدمات'),
                  t('Loyalty Progress & Rewards', 'تقدم الولاء والمكافآت'),
                  t('Vehicle Model & Detailing Preferences', 'نموذج السيارة وتفضيلات التفصيل'),
                ].map(item => (
                  <li key={item} className="flex items-center gap-3 text-on-surface-variant text-sm">
                    <span className="material-symbols-outlined fill-icon text-secondary-fixed-dim text-base">radio_button_checked</span>
                    {item}
                  </li>
                ))}
              </ul>
            </Section>

            <Section icon="shield_person" title={t('Data Usage', 'استخدام البيانات')}>
              <p className="text-on-surface-variant text-sm mb-3">
                {t('We use your data strictly to provide the Hydro-Premium experience:', 'نستخدم بياناتك حصراً لتوفير تجربة هيدرو بريميوم:')}
              </p>
              <ul className="space-y-2">
                {[
                  t('Facilitating seamless carwash bookings', 'تسهيل حجوزات غسيل السيارات'),
                  t('Managing your exclusive loyalty status', 'إدارة حالة الولاء الحصرية الخاصة بك'),
                  t('Personalizing detailing recommendations', 'تخصيص توصيات التفصيل'),
                ].map(item => (
                  <li key={item} className="flex items-center gap-2 text-on-surface-variant text-sm italic">
                    <span className="text-secondary-fixed-dim">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </Section>
          </div>

          {/* Security — full width */}
          <div className="rounded-xl p-6 md:p-8"
            style={{ background: 'var(--color-surface-container)', border: '1px solid var(--color-outline-variant)' }}>
            <h2 className="text-xl font-bold text-on-surface font-display mb-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary-fixed text-2xl">lock</span>
              {t('Security', 'الأمان')}
            </h2>
            <p className="text-on-surface-variant text-sm leading-relaxed max-w-2xl">
              {t('We employ professional-grade encryption protocols to safeguard your records. Your data is stored on secure servers with restricted access, ensuring that your Sudanese carwash history and loyalty progress are protected against any unauthorized entry.',
                'نستخدم بروتوكولات تشفير احترافية لحماية سجلاتك. يتم تخزين بياناتك على خوادم آمنة بوصول مقيد، مما يضمن حماية سجل غسيل سيارتك في السودان وتقدم الولاء ضد أي دخول غير مصرح به.')}
            </p>
          </div>

          {/* 5. Contact Us */}
          <div className="rounded-xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
            style={{ background: 'var(--color-surface-container)', border: '1px solid var(--color-outline-variant)' }}>
            <div>
              <h2 className="text-xl font-bold text-on-surface font-display mb-2 flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary-fixed text-2xl">location_on</span>
                {t('Contact Us', 'تواصل معنا')}
              </h2>
              <p className="text-on-surface-variant text-sm">
                {t("Have questions about your data? Our dedicated support team is here to help.", 'هل لديك أسئلة حول بياناتك؟ فريق الدعم المخصص لدينا هنا للمساعدة.')}
              </p>
            </div>
            <Link to="/contact"
              className="flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-xl whitespace-nowrap transition-all shrink-0"
              style={{ background: 'var(--input-bg)', border: '1px solid var(--color-outline-variant)', color: 'var(--color-on-surface)' }}
              onMouseDown={e => { e.currentTarget.style.borderColor = 'var(--color-secondary-fixed)'; e.currentTarget.style.color = 'var(--color-secondary-fixed)' }}
              onMouseUp={e => { e.currentTarget.style.borderColor = 'var(--color-outline-variant)'; e.currentTarget.style.color = 'var(--color-on-surface)' }}>
              {t('Contact Support', 'تواصل مع الدعم')}
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 border-t border-outline-variant/10" style={{ background: 'var(--color-surface-container-lowest)' }}>
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <span className="font-display font-extrabold text-2xl tracking-tight text-secondary-fixed">Rasha</span>
            <p className="text-on-surface-variant text-xs mt-1">© 2025 Rasha Carwash Sudan. {t('All rights reserved.', 'جميع الحقوق محفوظة.')}</p>
          </div>
          <nav className="flex gap-6">
            {/* Privacy Policy not shown here since we're on that page */}
            <Link to="/terms" className="text-on-surface-variant hover:text-secondary-fixed transition-colors text-xs">{t('Terms of Service', 'شروط الخدمة')}</Link>
            <Link to="/contact" className="text-on-surface-variant hover:text-secondary-fixed transition-colors text-xs">{t('Contact Support', 'الدعم')}</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
