import { useApp } from '../context/AppContext'

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useApp()

  return (
    <button
      onClick={toggleTheme}
      dir="ltr"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        width: '52px',
        height: '28px',
        borderRadius: '14px',
        background: isDark ? '#1d2022' : '#e8e4de',
        border: isDark ? '1px solid rgba(116,245,255,0.25)' : '1px solid rgba(0,86,179,0.2)',
        padding: '3px',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'background 0.2s, border-color 0.2s',
        direction: 'ltr',
      }}
    >
      {/* Sun icon — left side */}
      <span className="material-symbols-outlined" style={{
        position: 'absolute', left: '5px',
        fontSize: '14px',
        color: isDark ? '#8c909e' : '#f59e0b',
        opacity: isDark ? 0.4 : 1,
        transition: 'all 0.2s',
      }}>light_mode</span>

      {/* Moon icon — right side */}
      <span className="material-symbols-outlined" style={{
        position: 'absolute', right: '5px',
        fontSize: '14px',
        color: isDark ? '#74f5ff' : '#8c909e',
        opacity: isDark ? 1 : 0.4,
        transition: 'all 0.2s',
      }}>dark_mode</span>

      {/* Sliding pill — uses left position, not translateX, to avoid RTL flip */}
      <div style={{
        position: 'absolute',
        left: isDark ? '27px' : '3px',
        top: '3px',
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        background: isDark ? '#74f5ff' : '#0056b3',
        transition: 'left 0.25s cubic-bezier(0.4,0,0.2,1), background 0.2s',
        zIndex: 1,
      }} />
    </button>
  )
}
