import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { warmUp } from '../utils/fetchWithTimeout'
const AppContext = createContext(null)
export const API = 'https://rasha-backend.onrender.com'
export function AppProvider({ children }) {
  const [lang, setLang] = useState(() =>
    localStorage.getItem('rasha_lang')
    || (navigator.language?.toLowerCase().startsWith('ar') ? 'ar' : 'en')
  )
  const [toast, setToast] = useState(null)
  // Blocking error dialog — for failures the customer can't scroll past.
  const [errorModal, setErrorModal] = useState(null)

  // Sync dir/lang on mount and whenever lang changes, not only inside
  // toggleLang — otherwise a returning Arabic-speaking customer sees an
  // English, LTR page for one render (or forever, if lang was never
  // persisted) before any toggle click fires.
  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    localStorage.setItem('rasha_lang', lang)
  }, [lang])
  const [theme, setThemeState] = useState(() =>
    localStorage.getItem('rasha_theme')
    || (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  )
  useEffect(() => {
    const root = document.documentElement
    const body = document.body
    const isLight = theme === 'light'
    const isDarkMode = !isLight

    // Light is default (no class). Dark gets 'dark' class.
    if (isDarkMode) {
      root.classList.add('dark')
      root.classList.remove('light')
    } else {
      root.classList.remove('dark')
      root.classList.add('light')
    }

    // Chrome Android needs an explicit colour to repaint its GPU layers, but
    // the value has to be the same one the stylesheet uses. Read it from the
    // token rather than hardcoding a fourth opinion — the class change above
    // has already applied, and getComputedStyle forces the recalc.
    const pageBg = getComputedStyle(root).getPropertyValue('--color-background').trim()
      || (isDarkMode ? '#070d1a' : '#f8fffe')
    const fg = isDarkMode ? '#e8f0fe' : '#0d1825'
    root.style.backgroundColor = pageBg
    root.style.color = fg
    // Transparent so html's ground shows through unbroken.
    body.style.backgroundColor = 'transparent'
    body.style.color = fg

    // Update meta theme-color — must match the page background exactly, or
    // the iOS status-bar and bottom safe-area paint a different color from
    // the app surface and you see a visible seam at both edges.
    const metaTheme = document.getElementById('theme-meta')
    if (metaTheme) metaTheme.setAttribute('content', pageBg)

    // Force mobile browsers to repaint CSS variable changes
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
  const toggleLang = () => setLang(l => l === 'en' ? 'ar' : 'en')
  const t = (en, ar) => lang === 'ar' ? ar : en
  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type, id: Date.now() })
  }, [])
  /**
   * Raise a blocking dialog. Pass { title, message, icon, actions } where each
   * action is { label, primary?, to?, onClick? }. Reserved for failures that
   * leave the customer stuck or misinformed — everything transient is a toast.
   */
  const showError = useCallback((config) => setErrorModal(config), [])
  const closeError = useCallback(() => setErrorModal(null), [])
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

  // Keep the Render free-tier server warm — ping every 14 minutes so new
  // visitors don't hit a 30-50 second cold-start timeout on their first request.
  //
  // This only runs while the app is open, so it cannot prevent the cold start a
  // customer hits when they come back hours later; the first ping fires on
  // mount so that wake-up at least starts in parallel with whatever the page
  // itself is fetching. Capped so pings can't pile up unresolved.
  useEffect(() => {
    const ping = () => warmUp(API)
    ping()
    const id = setInterval(ping, 14 * 60 * 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <AppContext.Provider value={{ lang, toggleLang, t, toast, showToast, errorModal, showError, closeError, customer, token, login, logout, staffToken, setStaffToken, staffRole, staffPermissions, isSuperAdmin, hasPerm, theme, toggleTheme, isDark }}>
      {children}
    </AppContext.Provider>
  )
}
export const useApp = () => useContext(AppContext)
