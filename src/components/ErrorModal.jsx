import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

/**
 * Blocking dialog for the cases where the customer cannot carry on — a booking
 * that failed after they thought it succeeded, a slot that was taken while they
 * filled the form, an expired session, a rate-limit lockout.
 *
 * Every one of these carries a recovery action; an error with no way forward is
 * just a dead end with nicer styling.
 *
 * Driven from context via showError() so any page can raise one without
 * carrying its own copy of this markup.
 */
export default function ErrorModal() {
  const { errorModal, closeError, t } = useApp()
  const navigate = useNavigate()
  const panelRef = useRef(null)
  const primaryRef = useRef(null)
  const restoreFocusTo = useRef(null)

  const open = !!errorModal

  // Remember what had focus, move focus into the dialog, and put it back on close.
  useEffect(() => {
    if (!open) return
    restoreFocusTo.current = document.activeElement
    primaryRef.current?.focus()
    return () => {
      if (restoreFocusTo.current instanceof HTMLElement) restoreFocusTo.current.focus()
    }
  }, [open])

  // Esc closes; Tab cycles inside the dialog rather than escaping to the page.
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); closeError(); return }
      if (e.key !== 'Tab') return
      const focusables = panelRef.current?.querySelectorAll(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      )
      if (!focusables?.length) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, closeError])

  // Don't let the page behind scroll while the dialog owns the screen.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  if (!open) return null

  const { title, message, icon = 'error', actions = [] } = errorModal

  const runAction = (action) => {
    closeError()
    if (action.to) navigate(action.to)
    action.onClick?.()
  }

  // Always leave a way out, even if the caller forgot to pass one.
  const buttons = actions.length
    ? actions
    : [{ label: t('OK', 'حسناً'), primary: true }]

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) closeError() }}
    >
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="error-modal-title"
        aria-describedby="error-modal-body"
        className="w-full max-w-sm rounded-2xl p-6 animate-fade-in text-center"
        style={{
          background: 'var(--color-surface-container)',
          border: '1px solid var(--color-outline-variant)',
          boxShadow: 'var(--glass-shadow-lg)',
        }}
      >
        <div
          className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
          style={{ background: 'var(--color-error-container)' }}
        >
          <span className="material-symbols-outlined text-error text-3xl" aria-hidden="true">
            {icon}
          </span>
        </div>

        <h3 id="error-modal-title" className="font-bold text-on-surface text-lg mb-2">
          {title}
        </h3>

        <p id="error-modal-body" className="text-on-surface-variant text-sm mb-6">
          {message}
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          {buttons.map((action, i) => (
            <button
              key={action.label}
              ref={action.primary ? primaryRef : undefined}
              onClick={() => runAction(action)}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                action.primary ? 'hydro-gradient text-white' : 'text-on-surface-variant'
              }`}
              style={
                action.primary
                  ? undefined
                  : { background: 'var(--input-bg)', border: '1px solid var(--input-border)' }
              }
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
