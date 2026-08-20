import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'

/**
 * Full-page loading state, used wherever the app is waiting on its first data.
 *
 * The API sleeps after ~15 minutes idle, so a customer returning later waits
 * out a cold start. A bare spinner gives them nothing to distinguish "slow"
 * from "broken", so the copy escalates as the wait grows and finally offers a
 * way out instead of spinning forever.
 */
export default function BootScreen({ onRetry }) {
  const { t } = useApp()
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(id)
  }, [])

  // Stay quiet while the wait is still ordinary; explain once it isn't.
  const message =
    elapsed < 4
      ? t('Loading your card…', 'جارٍ تحميل بطاقتك…')
      : elapsed < 12
        ? t('Waking the server…', 'جارٍ تشغيل الخادم…')
        : t('Still waking up — this can take up to a minute after a quiet spell.',
            'ما زال قيد التشغيل — قد يستغرق ذلك دقيقة بعد فترة من الخمول.')

  return (
    <div className="pt-14 min-h-screen flex flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <span className="font-display font-extrabold text-4xl tracking-tight text-secondary-fixed">
          Rasha
        </span>
        <div className="loader" aria-hidden="true" />
      </div>

      <p role="status" aria-live="polite"
        className="text-on-surface-variant text-sm max-w-xs leading-relaxed">
        {message}
      </p>

      {/* Only offered once waiting longer has stopped being reasonable. */}
      {elapsed >= 25 && onRetry && (
        <button onClick={onRetry} className="btn-primary px-6 py-3 rounded-xl cursor-pointer">
          <span className="material-symbols-outlined text-base">refresh</span>
          {t('Try again', 'حاول مجدداً')}
        </button>
      )}
    </div>
  )
}
