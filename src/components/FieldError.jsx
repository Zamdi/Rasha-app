/**
 * Error text that sits directly under the input it belongs to.
 *
 * role="alert" so screen readers announce it the moment it appears — a red
 * border alone is a visual-only signal and doesn't reach anyone using one.
 */
export default function FieldError({ children, id }) {
  if (!children) return null
  return (
    <p
      id={id}
      role="alert"
      className="flex items-start gap-1.5 mt-1.5 text-xs font-semibold"
      style={{ color: 'var(--color-error)' }}
    >
      <span
        className="material-symbols-outlined shrink-0"
        style={{ fontSize: '14px', lineHeight: '1.35' }}
        aria-hidden="true"
      >
        error
      </span>
      <span>{children}</span>
    </p>
  )
}

/**
 * Append to an input's className when that field is in an error state, so the
 * border turns red alongside the message.
 *
 * `.field-invalid` is authored in index.css rather than composed from Tailwind
 * utilities — this class is only ever applied from a runtime expression, which
 * the JIT scanner never sees, so a utility would never be generated.
 */
export const invalidClass = (hasError) => (hasError ? ' field-invalid' : '')
