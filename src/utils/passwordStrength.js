// Mirrors the backend's actual requirement (utils/validate.js: >=8 chars,
// at least one letter and one number) plus extra signals so the meter moves
// smoothly instead of jumping straight to "Strong" the moment the minimum
// is met.
export function passwordStrength(pw) {
  if (!pw) return { score: 0, label: ['', ''] }
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const capped = Math.min(score, 4)
  const levels = [
    { label: ['Very weak', 'ضعيفة جداً'], color: 'var(--color-error)' },
    { label: ['Weak', 'ضعيفة'], color: 'var(--color-error)' },
    { label: ['Fair', 'متوسطة'], color: '#d97706' },
    { label: ['Good', 'جيدة'], color: '#d97706' },
    { label: ['Strong', 'قوية'], color: '#1a8f4c' },
  ]
  return { score: capped, ...levels[capped] }
}
