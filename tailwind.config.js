/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'surface':                   'var(--color-surface)',
        'surface-container':         'var(--color-surface-container)',
        'surface-container-high':    'var(--color-surface-container-high)',
        'surface-container-highest': 'var(--color-surface-container-highest)',
        'surface-variant':           'var(--color-surface-variant)',
        'on-surface':                'var(--color-on-surface)',
        'on-surface-variant':        'var(--color-on-surface-variant)',
        'outline':                   'var(--color-outline)',
        'outline-variant':           'var(--color-outline-variant)',
        'primary':                   'var(--color-primary)',
        'on-primary':                'var(--color-on-primary)',
        'primary-container':         'var(--color-primary-container)',
        'secondary-fixed':           'var(--color-secondary-fixed)',
        'secondary-fixed-dim':       'var(--color-secondary-fixed-dim)',
        'error':                     'var(--color-error)',
        'error-container':           'var(--color-error-container)',
        'background':                'var(--color-background)',
        'on-background':             'var(--color-on-background)',
      },
      fontFamily: {
        sans:    ['IBM Plex Sans', 'IBM Plex Sans Arabic', 'sans-serif'],
        display: ['Space Grotesk', 'IBM Plex Sans Arabic', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
