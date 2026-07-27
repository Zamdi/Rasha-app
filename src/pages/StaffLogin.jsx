import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStaff, API } from '../context/StaffContext'
import ThemeToggle from '../components/ThemeToggle'

export default function StaffLogin() {
  const { t, setStaffToken, showToast, lang, toggleLang } = useStaff()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!username || !password) { showToast(t('Fill all fields', 'يرجى ملء جميع الحقول'), 'error'); return }
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error || t('Invalid credentials', 'بيانات غير صحيحة'), 'error'); return }
      setStaffToken(data.token, data.role, data.permissions || {}, data.displayName || data.username)
      showToast(t(`Welcome, ${data.displayName || data.username}`, `أهلاً ${data.displayName || data.username}`))
      navigate('/dashboard')
    } catch { showToast(t('Connection error', 'خطأ في الاتصال'), 'error') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      {/* Header */}
      <header className="w-full flex justify-between items-center px-6 h-14 bg-background/95 backdrop-blur-xl shadow-sm">
        <span className="font-display font-extrabold text-2xl tracking-tight text-secondary-fixed">Rasha</span>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button onClick={toggleLang} className="flex items-center gap-1 text-secondary-fixed text-xs font-bold hover:opacity-80 transition-opacity">
            <span className="material-symbols-outlined text-base">language</span>
            <span>{lang === 'en' ? 'AR' : 'EN'}</span>
          </button>
        </div>
      </header>

      <div className="flex-grow flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 hydro-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 cyan-glow">
              <span className="material-symbols-outlined text-white text-3xl">admin_panel_settings</span>
            </div>
            <h1 className="text-2xl font-bold text-on-surface font-display">{t('Staff Portal', 'بوابة الموظفين')}</h1>
            <p className="text-on-surface-variant text-sm mt-1">{t('Sign in with your staff credentials.', 'سجل دخولك ببيانات الموظف.')}</p>
          </div>

          <div className="glass p-6 rounded-2xl space-y-4">
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">{t('Username', 'اسم المستخدم')}</label>
              <input className="rasha-input" placeholder="admin" value={username}
                onChange={e => setUsername(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} />
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">{t('Password', 'كلمة المرور')}</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} className="rasha-input pe-12" value={password}
                  onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-secondary-fixed transition-colors">
                  <span className="material-symbols-outlined text-xl">{showPw ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>
            <button onClick={submit} disabled={loading} className="btn-primary w-full py-4 rounded-xl">
              {loading ? <div className="loader" /> : t('Sign In to Dashboard', 'دخول اللوحة')}
            </button>
          </div>

          <p className="text-center text-xs text-on-surface-variant mt-6 opacity-50">
            Rasha Staff Portal — Authorized Access Only
          </p>
        </div>
      </div>
    </div>
  )
}
