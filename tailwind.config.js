/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'surface':                   'var(--color-surface)',
        'surface-dim':               'var(--color-surface-dim)',
        'surface-container-lowest':  'var(--color-surface-container-lowest)',
        'surface-container-low':     'var(--color-surface-container-low)',
        'surface-container':         'var(--color-surface-container)',
        'surface-container-high':    'var(--color-surface-container-high)',
        'surface-container-highest': 'var(--color-surface-container-highest)',
        'surface-bright':            'var(--color-surface-bright)',
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
        'secondary-container':       'var(--color-secondary-container)',
        'error':                     'var(--color-error)',
        'error-container':           'var(--color-error-container)',
        'background':                'var(--color-background)',
        'on-background':             'var(--color-on-background)',
      },
      fontFamily: {
        sans:    ['Inter', 'Noto Kufi Arabic', 'sans-serif'],
        display: ['Montserrat', 'Noto Kufi Arabic', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
