import { useApp } from '../context/AppContext'

/**
 * Transient, non-blocking notice at the bottom of the screen.
 *
 * Reserved for things the customer didn't get wrong — a network hiccup, the
 * server waking from sleep, or a success. Anything that leaves them stuck goes
 * through ErrorModal; anything tied to one input goes through FieldError.
 */
export default function Toast() {
  const { toast } = useApp()
  if (!toast) return null

  const isError = toast.type === 'error'

  return (
    <div
      key={toast.id}
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-30 px-6 py-3 rounded-2xl text-sm font-bold shadow-xl animate-fade-in text-center ${
        isError
          ? 'bg-error-container text-error border border-error/30'
          : 'hydro-gradient text-white border border-secondary-fixed/30'
      }`}
      // Long messages have to wrap. The wallet warning carries two formatted
      // amounts and ran off the side of the screen as a single line.
      style={{ maxWidth: 'min(calc(100vw - 2rem), 26rem)' }}
    >
      {toast.msg}
    </div>
  )
}
