import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const StaffContext = createContext(null)

export const API = 'https://rasha-backend.onrender.com'

export function StaffProvider({ children }) {
  const [lang, setLang] = useState('en')
  const [toast, setToast] = useState(null)
  const [theme, setThemeState] = useState(() => localStorage.getItem('rasha_theme') || 'light')
  const [staffToken, setStaffTokenState] = useState(() => localStorage.getItem('rasha_staff_token'))
  const [staffRole, setStaffRole] = useState(() => localStorage.getItem('rasha_staff_role') || 'staff')
  const [staffPermissions, setStaffPermissions] = useState(() => {
    try { return JSON.parse(localStorage.getItem('rasha_staff_perms') || '{}') } catch { return {} }
  })
  const [staffName, setStaffName] = useState(() => localStorage.getItem('rasha_staff_name') || '')

  useEffect(() => {
    const root = document.documentElement
    const body = document.body
    const isLight = theme === 'light'
    if (isLight) { root.classList.add('light'); root.classList.remove('dark') }
    else { root.classList.remove('light'); root.classList.add('dark') }
    const bg = isLight ? '#f4f1ec' : '#101415'
    const fg = isLight ? '#1a1a18' : '#e0e3e5'
    root.style.backgroundColor = bg; root.style.color = fg
    body.style.backgroundColor = bg; body.style.color = fg
    const metaTheme = document.getElementById('theme-meta')
    if (metaTheme) metaTheme.setAttribute('content', bg)
    body.style.willChange = 'background-color, color'
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        void root.offsetHeight; void root.offsetWidth
        body.style.willChange = 'auto'
      })
    })
    localStorage.setItem('rasha_theme', theme)
  }, [theme])

  const toggleTheme = () => setThemeState(t => t === 'dark' ? 'light' : 'dark')
  const isDark = theme === 'dark'

  const toggleLang = () => {
    const next = lang === 'en' ? 'ar' : 'en'
    setLang(next)
    document.documentElement.lang = next
    document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr'
  }

  const t = (en, ar) => lang === 'ar' ? ar : en

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type, id: Date.now() })
  }, [])

  const setStaffToken = (tok, role = 'staff', permissions = {}, name = '') => {
    setStaffTokenState(tok)
    setStaffRole(role)
    setStaffPermissions(permissions)
    setStaffName(name)
    if (tok) {
      localStorage.setItem('rasha_staff_token', tok)
      localStorage.setItem('rasha_staff_role', role)
      localStorage.setItem('rasha_staff_perms', JSON.stringify(permissions))
      localStorage.setItem('rasha_staff_name', name)
    } else {
      localStorage.removeItem('rasha_staff_token')
      localStorage.removeItem('rasha_staff_role')
      localStorage.removeItem('rasha_staff_perms')
      localStorage.removeItem('rasha_staff_name')
    }
  }

  const isSuperAdmin = staffRole === 'super_admin'
  const hasPerm = (perm) => isSuperAdmin || !!staffPermissions[perm]

  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(id)
  }, [toast])

  return (
    <StaffContext.Provider value={{
      lang, toggleLang, t, toast, showToast,
      staffToken, setStaffToken, staffRole, staffPermissions, staffName,
      isSuperAdmin, hasPerm, theme, toggleTheme, isDark
    }}>
      {children}
    </StaffContext.Provider>
  )
}

export const useStaff = () => useContext(StaffContext)
