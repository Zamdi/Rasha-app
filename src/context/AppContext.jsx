import { createContext, useContext, useState, useEffect, useCallback } from 'react'
const AppContext = createContext(null)
export const API = 'https://rasha-backend.onrender.com'
export function AppProvider({ children }) {
  const [lang, setLang] = useState('en')
  const [toast, setToast] = useState(null)
  const [theme, setThemeState] = useState(() => localStorage.getItem('rasha_theme') || 'light')
  useEffect(() => {
    const root = document.documentElement
    const body = document.body
    const isLight = theme === 'light'

    // Apply immediately
    if (isLight) {
      root.classList.add('light')
      root.classList.remove('dark')
    } else {
      root.classList.remove('light')
      root.classList.add('dark')
    }

    // Set explicit colors — Chrome Android needs this to repaint GPU layers
    const bg = isDarkMode ? '#0a1628' : 'transparent'
    const fg = isDarkMode ? '#e8f0fe' : '#0d1825'
    root.style.backgroundColor = bg
    root.style.color = fg
    body.style.backgroundColor = bg
    body.style.color = fg

    // Update meta theme-color (used by Mi Browser, Samsung Internet, Chrome)
    const metaTheme = document.getElementById('theme-meta')
    if (metaTheme) metaTheme.setAttribute('content', isDarkMode ? '#0a1628' : '#a8d8ea')

    // Force all mobile browsers to repaint CSS variable changes
    body.style.willChange = 'background-color, color'
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        void root.offsetHeight
        void root.offsetWidth
        body.style.willChange = 'auto'
      })
    })

    localStorage.setItem('rasha_theme', theme)
  }, [theme])
  const toggleTheme = () => setThemeState(t => t === 'dark' ? 'light' : 'dark')
  const isDark = theme === 'dark'
  const [customer, setCustomer] = useState(() => {
    const tok = localStorage.getItem('rasha_token')
    if (!tok) return null
    try {
      const cust = JSON.parse(localStorage.getItem('rasha_customer'))
      const avatar_url = localStorage.getItem('rasha_avatar') || null
      return cust ? { ...cust, avatar_url } : null
    } catch { return null }
  })
  const [token, setToken] = useState(() => {
    const tok = localStorage.getItem('rasha_token')
    if (!tok) return null
    try {
      const payload = JSON.parse(atob(tok.split('.')[1]))
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem('rasha_token')
        localStorage.removeItem('rasha_customer')
        return null
      }
    } catch {}
    return tok
  })
  const [staffToken, setStaffTokenState] = useState(() => localStorage.getItem('rasha_staff_token'))
  const [staffRole, setStaffRoleState] = useState(() => localStorage.getItem('rasha_staff_role') || 'staff')
  const [staffPermissions, setStaffPermissionsState] = useState(() => {
    try { return JSON.parse(localStorage.getItem('rasha_staff_perms') || '{}') } catch { return {} }
  })
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
  const login = (tok, cust) => {
    setToken(tok)
    setCustomer(cust)
    localStorage.setItem('rasha_token', tok)
    // Store avatar separately to avoid localStorage size limit issues
    const { avatar_url, ...custWithoutAvatar } = cust
    try {
      localStorage.setItem('rasha_customer', JSON.stringify(custWithoutAvatar))
      if (avatar_url) localStorage.setItem('rasha_avatar', avatar_url)
      else localStorage.removeItem('rasha_avatar')
    } catch (e) {
      // If storage fails (quota), save without avatar
      localStorage.setItem('rasha_customer', JSON.stringify(custWithoutAvatar))
    }
  }
  const logout = () => {
    setToken(null)
    setCustomer(null)
    localStorage.removeItem('rasha_token')
    localStorage.removeItem('rasha_customer')
    localStorage.removeItem('rasha_avatar')
  }
  const setStaffToken = (tok, role = 'staff', permissions = {}) => {
    setStaffTokenState(tok)
    setStaffRoleState(role)
    setStaffPermissionsState(permissions)
    if (tok) {
      localStorage.setItem('rasha_staff_token', tok)
      localStorage.setItem('rasha_staff_role', role)
      localStorage.setItem('rasha_staff_perms', JSON.stringify(permissions))
    } else {
      localStorage.removeItem('rasha_staff_token')
      localStorage.removeItem('rasha_staff_role')
      localStorage.removeItem('rasha_staff_perms')
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
    <AppContext.Provider value={{ lang, toggleLang, t, toast, showToast, customer, token, login, logout, staffToken, setStaffToken, staffRole, staffPermissions, isSuperAdmin, hasPerm, theme, toggleTheme, isDark }}>
      {children}
    </AppContext.Provider>
  )
}
export const useApp = () => useContext(AppContext)
