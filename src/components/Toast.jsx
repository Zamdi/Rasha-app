import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'

/**
 * Toast notifications, ported from seyitahmettanriver/jquery-toast-plugin (MIT).
 *
 * The original is a jQuery plugin; this app doesn't load jQuery and pulling it
 * in for notifications alone would cost more than the feature. The markup,
 * pill shape, per-type icon and title colours, close button and 300ms
 * enter/exit are the plugin's — only the mechanism is React, and they drop from
 * the top instead of the original bottom-right.
 *
 * Reserved for transient, non-blocking notices. Anything that leaves the
 * customer stuck goes through ErrorModal; anything tied to one input goes
 * through FieldError.
 */

// Icons lifted from the plugin so the visual language matches exactly.
const ICONS = {
  success: 'M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM241 337l-17 17-17-17-80-80L161 223l63 63L351 159 385 193 241 337z',
  error:   'M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm97.9-320l-17 17-47 47 47 47 17 17L320 353.9l-17-17-47-47-47 47-17 17L158.1 320l17-17 47-47-47-47-17-17L192 158.1l17 17 47 47 47-47 17-17L353.9 192z',
  info:    'M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM216 336h24V272H216 192V224h24 48 24v24 88h8 24v48H296 216 192V336h24zm72-144H224V128h64v64z',
  warning: 'M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm24-384v24V264v24H232V264 152 128h48zM232 368V320h48v48H232z',
}

function ToastItem({ toast, onDismiss, t }) {
  // Mounted first without .show, then flipped on, so the browser has a frame
  // to paint the off-screen start state and the drop actually animates.
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const type = ICONS[toast.type] ? toast.type : 'info'
  const title = toast.title ?? {
    success: t('Success', 'تم'),
    error:   t('Error', 'خطأ'),
    info:    t('Info', 'معلومة'),
    warning: t('Warning', 'تنبيه'),
  }[type]

  return (
    <div
      className={`toast ${type}${shown ? ' show' : ''}`}
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      <div className="toast-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" aria-hidden="true">
          <path d={ICONS[type]} />
        </svg>
      </div>
      <div className="toast-body">
        {title && <p className="toast-title">{title}</p>}
        <p className="toast-message">{toast.msg}</p>
      </div>
      <button
        type="button"
        className="toast-close"
        onClick={() => onDismiss(toast.id)}
        aria-label={t('Dismiss', 'إغلاق')}
      >
        &times;
      </button>
    </div>
  )
}

export default function Toast() {
  const { toasts, dismissToast, t } = useApp()
  if (!toasts.length) return null

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} t={t} />
      ))}
    </div>
  )
}
