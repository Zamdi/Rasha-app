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

export default function Terms() {
  const { t } = useApp()

  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0" style={{ background: 'var(--color-background)' }}>
      <main className="flex-grow w-full max-w-5xl mx-auto px-4 md:px-6 pt-16 pb-16">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold font-display text-on-surface mb-3">
            {t('Terms of Service', 'شروط الخدمة')}
          </h1>
          <p className="text-on-surface-variant text-sm">
            {t('Last updated: May 2024. By using Rasha services, you agree to the following terms and conditions.',
              'آخر تحديث: مايو 2024. باستخدام خدمات رشة، فإنك توافق على الشروط والأحكام التالية.')}
          </p>
        </div>

        <div className="space-y-4">
          <Section icon="handshake" title={t('Acceptance of Terms', 'قبول الشروط')}>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              {t('By accessing and using Rasha Car Wash services — including our online booking platform, loyalty program, and mobile app — you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.',
                'بالوصول إلى خدمات رشة لغسيل السيارات واستخدامها — بما في ذلك منصة الحجز الإلكترونية وبرنامج الولاء والتطبيق — فإنك توافق على الالتزام بشروط الخدمة هذه.')}
            </p>
          </Section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Section icon="local_car_wash" title={t('Services Provided', 'الخدمات المقدمة')}>
              <p className="text-on-surface-variant text-sm mb-3">
                {t('Rasha offers the following car wash services in Khartoum, Sudan:', 'تقدم رشة خدمات غسيل السيارات التالية في الخرطوم، السودان:')}
              </p>
              <ul className="space-y-2">
                {[
                  t('Full Wash (Interior & Exterior)', 'غسيل كامل (داخلي وخارجي)'),
                  t('Exterior Only Wash', 'غسيل خارجي فقط'),
                  t('Loyalty Rewards Program', 'برنامج مكافآت الولاء'),
                  t('Online Booking & Scheduling', 'الحجز والجدولة الإلكترونية'),
                ].map(item => (
                  <li key={item} className="flex items-center gap-2 text-on-surface-variant text-sm">
                    <span className="material-symbols-outlined fill-icon text-secondary-fixed-dim text-base">check_circle</span>
                    {item}
                  </li>
                ))}
              </ul>
            </Section>

            <Section icon="loyalty" title={t('Loyalty Program', 'برنامج الولاء')}>
              <ul className="space-y-3 text-on-surface-variant text-sm">
                {[
                  t('Every completed wash earns 1 stamp on your card.', 'كل غسيل مكتمل يمنحك طابعاً واحداً على بطاقتك.'),
                  t('After 5 stamps, your 6th wash is FREE.', 'بعد 5 طوابع، الغسلة السادسة مجانية.'),
                  t('Stamps are non-transferable and have no cash value.', 'الطوابع غير قابلة للتحويل وليس لها قيمة نقدية.'),
                  t('Rasha reserves the right to modify the loyalty program with notice.', 'تحتفظ رشة بحق تعديل برنامج الولاء مع إشعار مسبق.'),
                ].map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-secondary-fixed-dim shrink-0 mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </Section>
          </div>

          <Section icon="event_busy" title={t('Booking & Cancellation', 'الحجز والإلغاء')}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-on-surface-variant text-sm leading-relaxed">
              <div>
                <p className="font-semibold text-on-surface mb-2">{t('Booking Policy', 'سياسة الحجز')}</p>
                <p>{t('Bookings are confirmed upon successful submission. Please arrive 10–15 minutes before your scheduled appointment. Late arrivals may result in rescheduling.',
                  'يتم تأكيد الحجوزات عند الإرسال الناجح. يرجى الحضور قبل 10-15 دقيقة من موعدك المحدد.')}</p>
              </div>
              <div>
                <p className="font-semibold text-on-surface mb-2">{t('Cancellation Policy', 'سياسة الإلغاء')}</p>
                <p>{t('You may cancel or reschedule your booking by contacting our support team. We ask for at least 2 hours notice before your appointment time.',
                  'يمكنك إلغاء حجزك أو إعادة جدولته بالتواصل مع فريق الدعم. نطلب إشعاراً قبل موعدك بساعتين على الأقل.')}</p>
              </div>
            </div>
          </Section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Section icon="gavel" title={t('User Responsibilities', 'مسؤوليات المستخدم')}>
              <ul className="space-y-2 text-on-surface-variant text-sm">
                {[
                  t('Provide accurate personal and vehicle information.', 'تقديم معلومات شخصية وعن السيارة دقيقة.'),
                  t('Do not share your account credentials.', 'عدم مشاركة بيانات حسابك.'),
                  t('Ensure your vehicle is accessible at booking time.', 'التأكد من إمكانية الوصول إلى سيارتك في وقت الحجز.'),
                  t('Treat Rasha staff with respect.', 'التعامل مع موظفي رشة باحترام.'),
                ].map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="material-symbols-outlined fill-icon text-secondary-fixed-dim text-base mt-0.5">radio_button_checked</span>
                    {item}
                  </li>
                ))}
              </ul>
            </Section>

            <Section icon="policy" title={t('Limitation of Liability', 'حدود المسؤولية')}>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                {t('Rasha is not liable for any pre-existing damage to your vehicle. We inspect vehicles before service. Any damage claims must be reported immediately after service completion. Rasha\'s liability is limited to the cost of the service provided.',
                  'رشة غير مسؤولة عن أي أضرار موجودة مسبقاً في سيارتك. نفحص السيارات قبل الخدمة. يجب الإبلاغ عن أي مطالبات ضرر فور الانتهاء من الخدمة.')}
              </p>
            </Section>
          </div>

          {/* Contact section */}
          <div className="rounded-xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
            style={{ background: 'var(--color-surface-container)', border: '1px solid var(--color-outline-variant)' }}>
            <div>
              <h2 className="text-xl font-bold text-on-surface font-display mb-2 flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary-fixed text-2xl">contact_support</span>
                {t('Questions About These Terms', 'أسئلة حول هذه الشروط')}
              </h2>
              <p className="text-on-surface-variant text-sm">
                {t('If you have any questions about these Terms of Service, please contact our support team.', 'إذا كانت لديك أسئلة حول شروط الخدمة هذه، يرجى التواصل مع فريق الدعم.')}
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

      {/* Footer — no Terms of Service link since we're on that page */}
      <footer className="w-full py-8 border-t border-outline-variant/10" style={{ background: 'var(--color-surface-container-lowest)' }}>
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <span className="font-display font-extrabold text-2xl tracking-tight text-secondary-fixed">Rasha</span>
            <p className="text-on-surface-variant text-xs mt-1">© 2025 Rasha Carwash Sudan. {t('All rights reserved.', 'جميع الحقوق محفوظة.')}</p>
          </div>
          <nav className="flex gap-6">
            <Link to="/privacy" className="text-on-surface-variant hover:text-secondary-fixed transition-colors text-xs">{t('Privacy Policy', 'سياسة الخصوصية')}</Link>
            {/* Terms of Service not shown since we're already on it */}
            <Link to="/contact" className="text-on-surface-variant hover:text-secondary-fixed transition-colors text-xs">{t('Contact Support', 'الدعم')}</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
