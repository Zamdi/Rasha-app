import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStaff, API } from '../context/StaffContext'
import jsQR from 'jsqr'
import { formatTime } from '../utils/format'
import ThemeToggle from '../components/ThemeToggle'


const MODAL_BLANK = { firstName: '', lastName: '', email: '', phone: '', password: '' }

export default function StaffDashboard() {
  const { t, staffToken, setStaffToken, showToast, lang, toggleLang, isSuperAdmin, staffName, staffRole } = useStaff()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [stats, setStats] = useState(null)
  const [bookings, setBookings] = useState([])
  const [bookingFilter, setBookingFilter] = useState('all') // 'all'|'confirmed'|'cancelled'
  const [customerBookingFilter, setCustomerBookingFilter] = useState('all')
  const [customerBookingSearch, setCustomerBookingSearch] = useState('')
  const [showDeleteCustomerPopup, setShowDeleteCustomerPopup] = useState(false)
  const [cancelTarget, setCancelTarget] = useState(null) // booking object for popup
  const [customerBookings, setCustomerBookings] = useState([]) // bookings for searched customer
  const [messages, setMessages] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [allCustomers, setAllCustomers] = useState([])
  const [customersLoading, setCustomersLoading] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')
  const [staffList, setStaffList] = useState([])
  const [staffLoading, setStaffLoading] = useState(false)
  const [showStaffModal, setShowStaffModal] = useState(false)
  const [staffModalMode, setStaffModalMode] = useState('add')
  const [staffModalData, setStaffModalData] = useState({ id: null, username: '', password: '', displayName: '', role: 'staff', permissions: {} })
  const [inventory, setInventory] = useState([])
  const [inventoryLoading, setInventoryLoading] = useState(false)
  const [showAddInventory, setShowAddInventory] = useState(false)
  const [newItem, setNewItem] = useState({ name: '', unit: 'liters', quantity: 0, min_quantity: 10 })
  const [inventorySubTab, setInventorySubTab] = useState('items')
  // Message reply
  const [expandedThread, setExpandedThread] = useState(null)
  const [messageSearch, setMessageSearch] = useState('')
  const [activityLogs, setActivityLogs] = useState([])
  const [activitySummary, setActivitySummary] = useState([])
  const [activityTrend, setActivityTrend] = useState([])
  const [activityBreakdown, setActivityBreakdown] = useState([])
  const [activityLoading, setActivityLoading] = useState(false)
  const [activitySearch, setActivitySearch] = useState('')
  const [activityFrom, setActivityFrom] = useState('')
  const [activityTo, setActivityTo] = useState('')
  const [replyTarget, setReplyTarget] = useState(null)
  const [replyBody, setReplyBody] = useState('')
  const [replyLoading, setReplyLoading] = useState(false)
  const [replyError, setReplyError] = useState('') // 'items' | 'requests'
  const [refillTarget, setRefillTarget] = useState(null)
  const [refillQty, setRefillQty] = useState(10)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [showRefillRequest, setShowRefillRequest] = useState(false)
  const [refillRequestItem, setRefillRequestItem] = useState('')
  const [refillRequests, setRefillRequests] = useState(() => {
    try { return JSON.parse(localStorage.getItem('rasha_refill_requests') || '[]') } catch { return [] }
  })
  const [cooldownInfo, setCooldownInfo] = useState(null) // { nextScanAt, canForce }
  const [loading, setLoading] = useState(true)
  const [uidInput, setUidInput] = useState('')
  const [customer, setCustomer] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [scannerOn, setScannerOn] = useState(false)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const searchTimeout = useRef(null)
  // Customer modal
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('add') // 'add' | 'edit'
  const [modalForm, setModalForm] = useState(MODAL_BLANK)
  const [modalLoading, setModalLoading] = useState(false)

  useEffect(() => {
    if (!staffToken) { navigate('/'); return }
    // Refresh role from server in case it was changed
    fetch(`${API}/api/admin/staff/me`, { headers: hdrs })
      .then(r => r.json())
      .then(data => {
        if (data.role && data.role !== staffRole) {
          setStaffToken(staffToken, data.role, data.permissions || {}, staffName)
        }
      }).catch(() => {})
    loadData()
    loadInventory()
  }, [staffToken])

  const hdrs = { Authorization: 'Bearer ' + staffToken, 'Content-Type': 'application/json' }

  const loadData = async () => {
    setLoading(true)
    try {
      const [sRes, bRes] = await Promise.all([
        fetch(`${API}/api/admin/stats`, { headers: hdrs }),
        fetch(`${API}/api/admin/bookings`, { headers: hdrs }),
      ])
      if (sRes.status === 401) { setStaffToken(null); navigate('/'); return }
      const s = await sRes.json()
      const b = await bRes.json()
      setStats(s)
      setBookings(b.bookings || [])
    } catch { showToast(t('Failed to load', 'فشل التحميل'), 'error') }
    finally { setLoading(false) }
  }

  const loadMessages = async () => {
    try {
      const res = await fetch(`${API}/api/messages`, { headers: hdrs })
      if (res.ok) {
        const data = await res.json()
        const msgs = data.messages || []
        setMessages(msgs)
        setUnreadCount(msgs.filter(m => !m.is_read).length)
      }
    } catch {}
  }

  const loadAllCustomers = async (search = '') => {
    setCustomersLoading(true)
    try {
      const url = search ? `${API}/api/admin/customers?search=${encodeURIComponent(search)}` : `${API}/api/admin/customers`
      const res = await fetch(url, { headers: hdrs })
      if (res.ok) { const data = await res.json(); setAllCustomers(data.customers || []) }
    } catch {}
    finally { setCustomersLoading(false) }
  }

  const loadStaff = async () => {
    setStaffLoading(true)
    try {
      const res = await fetch(`${API}/api/admin/staff`, { headers: hdrs })
      if (res.ok) { const data = await res.json(); setStaffList(data.staff || []) }
    } catch {}
    finally { setStaffLoading(false) }
  }

  // Poll unread count every 30 seconds while on dashboard
  useEffect(() => {
    if (!staffToken) return
    loadMessages() // load count on mount
    const interval = setInterval(loadMessages, 30000)
    return () => clearInterval(interval)
  }, [staffToken])

  useEffect(() => {
    if (activeTab === 'customers') loadAllCustomers(customerSearch)
  }, [activeTab])

  const lookup = async (uid) => {
    const id = (uid || uidInput).trim().toUpperCase()
    if (!id) { showToast(t('Enter customer ID', 'أدخل رمز العميل'), 'error'); return }
    try {
      const res = await fetch(`${API}/api/admin/customers/${id}`, { headers: hdrs })
      const data = await res.json()
      if (!res.ok) { showToast(data.error || t('Not found', 'غير موجود'), 'error'); setCustomer(null); setCustomerBookings([]); return }
      setCustomer(data.customer)
      loadCustomerBookings(data.customer.customer_uid)
    } catch { showToast(t('Error', 'خطأ'), 'error') }
  }

  const markWash = async (forceRescan = false) => {
    if (!customer) return
    setCooldownInfo(null)
    try {
      const res = await fetch(`${API}/api/admin/customers/${customer.customer_uid}/mark-wash`, {
        method: 'POST', headers: hdrs,
        body: JSON.stringify(forceRescan ? { forceRescan: true } : {})
      })
      const data = await res.json()
      if (res.status === 429) {
        // QR cooldown active
        setCooldownInfo({ nextScanAt: data.nextScanAt, canForce: data.canForce, hoursSince: data.hoursSince })
        showToast(data.error, 'error')
        return
      }
      if (!res.ok) { showToast(data.error || t('Error', 'خطأ'), 'error'); return }
      showToast(data.message)
      if (data.earnedFreeWash) showToast(`🎉 ${t('Free wash ready! Mark wash again to redeem.', 'غسيل مجاني جاهز! اضغط مجدداً للاستخدام.')}`)
      if (data.usedFreeWash)  showToast(`✅ ${t('Free wash redeemed. Stamps reset.', 'تم استخدام الغسيل المجاني. تمت إعادة الطوابع.')}`)
      setCustomer(c => ({ ...c, stamps: data.stampsNow, total_washes: data.totalWashes,
        free_washes_used: data.usedFreeWash ? (c.free_washes_used ?? 0) + 1 : c.free_washes_used }))
      loadData()
    } catch { showToast(t('Error', 'خطأ'), 'error') }
  }

  const toggleAccess = async () => {
    if (!customer) return
    try {
      const res = await fetch(`${API}/api/admin/customers/${customer.customer_uid}/toggle-access`, { method: 'PATCH', headers: hdrs })
      const data = await res.json()
      if (!res.ok) { showToast(data.error || t('Error', 'خطأ'), 'error'); return }
      showToast(data.message)
      setCustomer(c => ({ ...c, is_active: data.isActive }))
    } catch { showToast(t('Error', 'خطأ'), 'error') }
  }

  const deleteCustomer = async (cust) => {
    const c = cust || customer
    if (!c) return
    setShowDeleteCustomerPopup(true)
  }

  const confirmDeleteCustomer = async () => {
    const c = customer
    if (!c) return
    setShowDeleteCustomerPopup(false)
    try {
      const res = await fetch(`${API}/api/admin/customers/${c.customer_uid}`, { method: 'DELETE', headers: hdrs })
      const data = await res.json()
      if (!res.ok) { showToast(data.error || t('Error', 'خطأ'), 'error'); return }
      showToast(t('Customer deleted', 'تم حذف العميل'))
      setCustomer(null); setUidInput('')
      loadData()
      if (activeTab === 'customers') loadAllCustomers(customerSearch)
    } catch { showToast(t('Error', 'خطأ'), 'error') }
  }

  const openAddModal = () => {
    setModalMode('add')
    setModalForm(MODAL_BLANK)
    setShowModal(true)
  }

  const openEditModal = (cust) => {
    setModalMode('edit')
    const c = cust || customer
    if (!c) return
    setModalForm({
      firstName: c.first_name || '',
      lastName: c.last_name || '',
      email: c.email || '',
      phone: (c.phone || '').replace('+249', ''),
      password: '',
      uid: c.customer_uid,
    })
    if (cust) setCustomer(cust)
    setShowModal(true)
  }

  const submitModal = async () => {
    setModalLoading(true)
    try {
      if (modalMode === 'add') {
        const res = await fetch(`${API}/api/admin/customers`, {
          method: 'POST', headers: hdrs,
          body: JSON.stringify({
            firstName: modalForm.firstName, lastName: modalForm.lastName,
            email: modalForm.email, phone: '+249' + modalForm.phone, password: modalForm.password,
          })
        })
        const data = await res.json()
        if (!res.ok) { showToast(data.error || t('Error', 'خطأ'), 'error'); setModalLoading(false); return }
        showToast(t('Customer added!', 'تم إضافة العميل!'))
      } else {
        const editUid = modalForm.uid || customer?.customer_uid
        const body = {
          firstName: modalForm.firstName, lastName: modalForm.lastName,
          email: modalForm.email, phone: '+249' + modalForm.phone,
        }
        if (modalForm.password) body.password = modalForm.password
        const res = await fetch(`${API}/api/admin/customers/${editUid}`, {
          method: 'PATCH', headers: hdrs, body: JSON.stringify(body)
        })
        const data = await res.json()
        if (!res.ok) { showToast(data.error || t('Error', 'خطأ'), 'error'); setModalLoading(false); return }
        showToast(t('Customer updated!', 'تم تحديث العميل!'))
        if (customer && customer.customer_uid === editUid) {
          setCustomer(c => ({ ...c, first_name: modalForm.firstName, last_name: modalForm.lastName, email: modalForm.email, phone: '+249' + modalForm.phone }))
        }
      }
      setShowModal(false)
      loadData()
      if (activeTab === 'customers') loadAllCustomers(customerSearch)
    } catch { showToast(t('Error', 'خطأ'), 'error') }
    finally { setModalLoading(false) }
  }

  const cancelBooking = async (id) => {
    try {
      await fetch(`${API}/api/admin/bookings/${id}/cancel`, { method: 'PATCH', headers: hdrs })
      showToast(t('Booking cancelled', 'تم إلغاء الحجز'))
      setCancelTarget(null)
      loadData()
      if (customerBookings.length > 0 && customer) loadCustomerBookings(customer.customer_uid)
    } catch {}
  }

  const loadCustomerBookings = async (uid) => {
    try {
      const res = await fetch(`${API}/api/admin/bookings?customer_uid=${uid}`, { headers: hdrs })
      const data = await res.json()
      setCustomerBookings(data.bookings || [])
    } catch {}
  }

  const loadInventory = async () => {
    setInventoryLoading(true)
    try {
      const res = await fetch(`${API}/api/admin/inventory`, { headers: hdrs })
      const data = await res.json()
      setInventory(data.items || [])
    } catch {}
    finally { setInventoryLoading(false) }
  }

  const loadActivity = async (overrides = {}) => {
    setActivityLoading(true)
    try {
      const q = new URLSearchParams()
      const u = overrides.username !== undefined ? overrides.username : activitySearch
      const f = overrides.from !== undefined ? overrides.from : activityFrom
      const to2 = overrides.to !== undefined ? overrides.to : activityTo
      if (u) q.set('username', u)
      if (f) q.set('from', f)
      if (to2) q.set('to', to2)
      const res = await fetch(`${API}/api/admin/activity?${q}`, { headers: hdrs })
      const data = await res.json()
      if (res.ok) {
        setActivityLogs(data.logs || [])
        setActivitySummary(data.summary || [])
        setActivityTrend(data.trend || [])
        setActivityBreakdown(data.actionBreakdown || [])
      }
    } catch (e) { console.error(e) }
    finally { setActivityLoading(false) }
  }

  const exportActivityPDF = () => {
    const win = window.open('', '_blank')
    const rows = activityLogs.map(l => `
      <tr>
        <td>${l.display_name || l.username}</td>
        <td>${l.username}</td>
        <td style="text-transform:capitalize">${(l.action||'').replace(/_/g,' ')}</td>
        <td>${l.entity || ''}</td>
        <td>${l.detail || ''}</td>
        <td dir="ltr">${new Date(l.created_at).toLocaleString('en-GB')}</td>
      </tr>`).join('')
    const summaryRows = activitySummary.map(s => `
      <tr>
        <td>${s.display_name || s.username}</td>
        <td>${s.username}</td>
        <td>${s.total}</td>
        <td dir="ltr">${s.last_active ? new Date(s.last_active).toLocaleString('en-GB') : '-'}</td>
      </tr>`).join('')
    const breakdownRows = activityBreakdown.map(b => `
      <tr><td style="text-transform:capitalize">${(b.action||'').replace(/_/g,' ')}</td><td>${b.count}</td></tr>`).join('')
    win.document.write(`<!DOCTYPE html><html><head><title>Staff Activity Report</title>
    <style>
      body{font-family:Arial,sans-serif;font-size:11px;color:#111;padding:24px;margin:0}
      h1{font-size:18px;margin-bottom:2px;color:#0056b3}
      h2{font-size:13px;margin:22px 0 8px;color:#333;border-bottom:1px solid #e0e0e0;padding-bottom:4px}
      .meta{color:#888;font-size:10px;margin-bottom:18px}
      table{width:100%;border-collapse:collapse;margin-bottom:20px;font-size:10px}
      th{background:#0056b3;color:#fff;text-align:left;padding:6px 8px}
      td{padding:5px 8px;border-bottom:1px solid #ebebeb}
      tr:nth-child(even)td{background:#f7f9ff}
    </style></head><body>
    <h1>&#128202; Staff Activity Report</h1>
    <p class="meta">Rasha Car Wash &nbsp;|&nbsp; Generated: ${new Date().toLocaleString('en-GB')} &nbsp;|&nbsp; ${activityLogs.length} entries</p>
    <h2>Activity Summary by Staff</h2>
    <table><thead><tr><th>Name</th><th>Username</th><th>Total Actions</th><th>Last Active</th></tr></thead><tbody>${summaryRows||'<tr><td colspan="4">No data</td></tr>'}</tbody></table>
    <h2>Action Breakdown</h2>
    <table><thead><tr><th>Action</th><th>Count</th></tr></thead><tbody>${breakdownRows||'<tr><td colspan="2">No data</td></tr>'}</tbody></table>
    <h2>Activity Log (${activityLogs.length} entries)</h2>
    <table><thead><tr><th>Name</th><th>Username</th><th>Action</th><th>Entity</th><th>Detail</th><th>Timestamp</th></tr></thead><tbody>${rows||'<tr><td colspan="6">No entries</td></tr>'}</tbody></table>
    </body></html>`)
    win.document.close()
    setTimeout(() => win.print(), 400)
  }

  const handleSearch = (q) => {
    setSearchQuery(q)
    clearTimeout(searchTimeout.current)
    if (q.length < 2) { setSearchResults([]); return }
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API}/api/admin/customers?search=${encodeURIComponent(q)}`, { headers: hdrs })
        const data = await res.json()
        setSearchResults((data.customers || []).slice(0, 5))
      } catch {}
    }, 400)
  }

  const scanAnimRef = useRef(null)
  const canvasRef   = useRef(document.createElement('canvas')) // persistent off-screen canvas

  const toggleScanner = async () => {
    if (scannerOn) { stopScanner(); return }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      streamRef.current = stream
      setScannerOn(true)
    } catch (err) {
      const msg = err.name === 'NotAllowedError'
        ? t('Camera permission denied. Please allow camera access in your browser settings.', 'تم رفض إذن الكاميرا. يرجى السماح بالوصول من إعدادات المتصفح.')
        : t('Could not open camera.', 'تعذر فتح الكاميرا.')
      showToast(msg, 'error')
    }
  }

  // Callback ref — fires when video element mounts after scannerOn=true
  const setVideoRef = (el) => {
    videoRef.current = el
    if (el && streamRef.current) {
      el.srcObject = streamRef.current
      el.setAttribute('playsinline', '')
      el.muted = true
      el.play().catch(() => {})
      // Wait for video to be ready before starting scan loop
      el.addEventListener('playing', () => startQRLoop(el), { once: true })
      // Fallback: also try after short delay
      setTimeout(() => { if (streamRef.current && !scanAnimRef.current) startQRLoop(el) }, 1000)
    }
  }

  const startQRLoop = (videoEl) => {
    if (scanAnimRef.current) return // already running
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d', { willReadFrequently: true })

    const tick = () => {
      if (!streamRef.current || !videoEl) return

      if (videoEl.readyState >= 2 && videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
        canvas.width  = videoEl.videoWidth
        canvas.height = videoEl.videoHeight
        ctx.drawImage(videoEl, 0, 0)

        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          if (jsQR) {
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'attemptBoth'
            })
            if (code && code.data) {
              const uid = code.data.trim().toUpperCase()
              stopScanner()
              setUidInput(uid)
              lookup(uid)
              return
            }
          }
        } catch {}
      }

      scanAnimRef.current = requestAnimationFrame(tick)
    }

    scanAnimRef.current = requestAnimationFrame(tick)
  }

  const stopScanner = () => {
    if (scanAnimRef.current) { cancelAnimationFrame(scanAnimRef.current); scanAnimRef.current = null }
    streamRef.current?.getTracks().forEach(tr => tr.stop())
    streamRef.current = null
    setScannerOn(false)
  }

  const staffLogout = () => { stopScanner(); setStaffToken(null); navigate('/') }

  const now = new Date()
  const shiftInfo = `${now.toLocaleDateString(t('en-US','ar-EG'),{weekday:'long',month:'long',day:'numeric'})} | ${now.toLocaleTimeString(t('en-US','ar-EG'),{hour:'2-digit',minute:'2-digit'})}`

  return (
    <div className="min-h-screen" style={{background:"transparent"}}>
      {/* Staff top bar */}
      <header className="fixed top-0 w-full z-50" style={{background:"var(--navbar-bg)",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",borderBottom:"1px solid var(--glass-border)"}}>
        <div className="max-w-7xl mx-auto flex justify-between items-center h-14 px-4 md:px-6">
          <div className="flex items-center gap-3">
            <span className="font-display font-extrabold text-xl tracking-tight text-secondary-fixed">Rasha</span>
            <span className="hidden md:block h-4 w-px bg-outline-variant/40 mx-1" />
            <span className="hidden md:block text-xs text-on-surface-variant font-semibold uppercase tracking-widest">{t('Staff Portal', 'بوابة الموظفين')}</span>
          </div>
          <div className="flex gap-2 items-center">
            <ThemeToggle />
            <button
              onClick={toggleLang}
              className="glass px-3 py-2 rounded-xl text-secondary-fixed text-xs font-bold flex items-center gap-1 hover:border-secondary-fixed/50 transition-all"
            >
              <span className="material-symbols-outlined text-base">language</span>
              <span>{lang === 'en' ? 'AR' : 'EN'}</span>
            </button>
            <button onClick={loadData} className="glass px-4 py-2 rounded-xl text-secondary-fixed text-xs font-bold flex items-center gap-1 hover:border-secondary-fixed/50 transition-all">
              <span className="material-symbols-outlined text-base">refresh</span>
              <span className="hidden sm:block">{t('Refresh', 'تحديث')}</span>
            </button>
            <button onClick={staffLogout} className="glass px-4 py-2 rounded-xl text-error text-xs font-bold flex items-center gap-1 hover:bg-error/5 transition-all">
              <span className="material-symbols-outlined text-base">logout</span>
              <span className="hidden sm:block">{t('Logout', 'خروج')}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="pt-16 pb-10 max-w-7xl mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-secondary-fixed font-display">{t('Operations Overview', 'لوحة العمليات')}</h1>
            <p className="text-on-surface-variant text-sm">{shiftInfo}</p>
          </div>
          {activeTab === 'dashboard' && (
            <button onClick={openAddModal} className="hydro-gradient px-5 py-2.5 rounded-xl text-white text-xs font-bold flex items-center gap-2 hover:opacity-90 transition-opacity cyan-glow">
              <span className="material-symbols-outlined text-base">person_add</span>
              {t('Add Customer', 'إضافة عميل')}
            </button>
          )}

        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: 'var(--color-surface-container)', border: '1px solid var(--color-outline-variant)' }}>
          {[
            ['dashboard', 'dashboard', t('Dashboard', 'اللوحة'), null, true],
            ['customers', 'group', t('Customers', 'العملاء'), null, true],
            ['messages', 'mail', t('Messages', 'الرسائل'), unreadCount, true],
            ['staff', 'manage_accounts', t('Staff', 'الموظفون'), null, isSuperAdmin],
            ['inventory', 'inventory_2', t('Inventory', 'المخزون'), isSuperAdmin ? refillRequests.filter(r=>!r.read).length : null, isSuperAdmin],
            ['activity', 'monitoring', t('Activity', 'النشاط'), null, isSuperAdmin],
          ].filter(([,,,,show]) => show).map(([tab, icon, label, badge]) => (
            <button key={tab}
              onClick={() => {
                setActiveTab(tab)
                if (tab === 'messages') { loadMessages(); setUnreadCount(0) }
                if (tab === 'customers') loadAllCustomers('')
                if (tab === 'staff') loadStaff()
                if (tab === 'activity') loadActivity()
                if (tab === 'inventory') {
                  loadInventory()
                  const updated = refillRequests.map(r => ({...r, read: true}))
                  setRefillRequests(updated)
                  localStorage.setItem('rasha_refill_requests', JSON.stringify(updated))
                }
              }}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === tab ? 'hydro-gradient text-white' : 'text-on-surface-variant hover:text-on-surface'}`}>
              <span className="material-symbols-outlined text-base">{icon}</span>
              <span className="hidden sm:block">{label}</span>
              {badge > 0 && (
                <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-white font-extrabold px-1"
                  style={{ background: '#e53935', fontSize: '10px', boxShadow: '0 0 0 2px var(--color-background)', lineHeight: 1 }}>
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Customers Tab */}
        {activeTab === 'customers' && (
          <div className="space-y-4 animate-fade-in">
            {/* Search + Add bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl pointer-events-none">search</span>
                <input
                  type="text"
                  placeholder={t('Search by name, phone, email or ID...', 'ابحث بالاسم أو الهاتف أو البريد أو الرمز...')}
                  value={customerSearch}
                  onChange={e => {
                    setCustomerSearch(e.target.value)
                    clearTimeout(searchTimeout.current)
                    searchTimeout.current = setTimeout(() => loadAllCustomers(e.target.value), 400)
                  }}
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-on-surface text-sm focus:outline-none"
                  style={{ background: 'var(--color-surface-container)', border: '1px solid var(--color-outline-variant)' }}
                  onFocus={e => e.target.style.borderColor = '#74f5ff'}
                  onBlur={e => e.target.style.borderColor = 'var(--input-border)'}
                />
              </div>
              <button onClick={openAddModal} className="hydro-gradient px-5 py-3 rounded-xl text-white text-xs font-bold flex items-center gap-2 hover:opacity-90 transition-opacity shrink-0 cyan-glow">
                <span className="material-symbols-outlined text-base">person_add</span>
                {t('Add Customer', 'إضافة عميل')}
              </button>
            </div>

            {/* Customers table */}
            <div className="glass rounded-2xl overflow-hidden">
              <div className="p-4  flex justify-between items-center">
                <h3 className="font-bold text-on-surface">
                  {t('All Customers', 'جميع العملاء')}
                  {!customersLoading && <span className="ms-2 text-xs text-on-surface-variant font-normal">({allCustomers.length})</span>}
                </h3>
                <button onClick={() => loadAllCustomers(customerSearch)} className="text-secondary-fixed text-xs flex items-center gap-1 hover:underline">
                  <span className="material-symbols-outlined text-base">refresh</span>{t('Refresh', 'تحديث')}
                </button>
              </div>

              {customersLoading ? (
                <div className="flex justify-center py-12"><div className="loader" /></div>
              ) : allCustomers.length === 0 ? (
                <div className="p-12 text-center">
                  <span className="material-symbols-outlined text-on-surface-variant text-5xl mb-3 block">group_off</span>
                  <p className="text-on-surface-variant text-sm">{t('No customers found', 'لا يوجد عملاء')}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" dir="ltr">
                    <thead style={{ background: 'var(--color-surface-container-high)' }}>
                      <tr>
                        {[t('Customer','العميل'), t('ID','الرمز'), t('Phone','الهاتف'), t('Stamps','الطوابع'), t('Washes','الغسيلات'), t('Status','الحالة'), t('Joined','الانضمام'), ''].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs text-on-surface-variant uppercase font-semibold whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {allCustomers.map(c => (
                        <tr key={c.id} className="hover:bg-surface-variant/5 transition-colors group">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full hydro-gradient flex items-center justify-center text-white text-xs font-bold shrink-0">
                                {c.first_name?.[0]}{c.last_name?.[0]}
                              </div>
                              <div>
                                <p className="font-semibold text-on-surface text-sm">{c.first_name} {c.last_name}</p>
                                <p className="text-xs text-on-surface-variant">{c.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs font-bold text-secondary-fixed">{c.customer_uid}</td>
                          <td className="px-4 py-3 text-xs text-on-surface-variant">{c.phone}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <span className="text-secondary-fixed font-bold">{c.stamps}</span>
                              <span className="text-on-surface-variant text-xs">/5</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-on-surface-variant text-xs">{c.total_washes ?? 0}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${c.is_active ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-error/10 text-error border border-error/20'}`} dir="rtl">
                              {c.is_active ? t('Active', 'نشط') : t('Suspended', 'موقوف')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-on-surface-variant whitespace-nowrap">
                            {c.created_at ? new Date(c.created_at).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {/* Quick lookup in dashboard */}
                              <button title={t('View in Dashboard', 'عرض في اللوحة')}
                                onClick={() => {
                                  setUidInput(c.customer_uid)
                                  setActiveTab('dashboard')
                                  setTimeout(() => lookup(c.customer_uid), 100)
                                }}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-secondary-fixed hover:bg-secondary-fixed/10 transition-colors">
                                <span className="material-symbols-outlined text-base">open_in_new</span>
                              </button>
                              {/* Edit */}
                              <button title={t('Edit', 'تعديل')}
                                onClick={() => openEditModal(c)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-secondary-fixed hover:bg-secondary-fixed/10 transition-colors">
                                <span className="material-symbols-outlined text-base">edit</span>
                              </button>
                              {/* Delete */}
                              <button title={t('Delete', 'حذف')}
                                onClick={async () => {
                                  if (!confirm(t(`Delete ${c.first_name} ${c.last_name}?`, `حذف ${c.first_name}؟`))) return
                                  try {
                                    const res = await fetch(`${API}/api/admin/customers/${c.customer_uid}`, { method: 'DELETE', headers: hdrs })
                                    const data = await res.json()
                                    if (!res.ok) { showToast(data.error || t('Error','خطأ'), 'error'); return }
                                    showToast(data.message || t('Customer deleted','تم حذف العميل'))
                                    loadAllCustomers(customerSearch)
                                    loadData()
                                  } catch { showToast(t('Error','خطأ'), 'error') }
                                }}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-error hover:bg-error/10 transition-colors">
                                <span className="material-symbols-outlined text-base">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="glass rounded-2xl overflow-hidden animate-fade-in">
            <div className="p-4 flex justify-between items-center gap-3 flex-wrap">
              <h3 className="font-bold text-on-surface">{t('Customer Messages', 'رسائل العملاء')}</h3>
              <div className="flex items-center gap-2 flex-1 min-w-0 max-w-xs">
                <div className="flex items-center gap-2 flex-1 px-3 py-1.5 rounded-xl" style={{ background: 'var(--input-bg)', border: '1px solid var(--color-outline-variant)' }}>
                  <span className="material-symbols-outlined text-on-surface-variant text-base shrink-0">search</span>
                  <input
                    className="flex-1 bg-transparent outline-none text-xs text-on-surface placeholder:text-on-surface-variant"
                    placeholder={t('Search by name or email…', 'بحث بالاسم أو البريد…')}
                    value={messageSearch}
                    onChange={e => setMessageSearch(e.target.value)} />
                  {messageSearch && (
                    <button onClick={() => setMessageSearch('')} className="text-on-surface-variant hover:text-error shrink-0">
                      <span className="material-symbols-outlined text-base">close</span>
                    </button>
                  )}
                </div>
                <button onClick={loadMessages} className="text-secondary-fixed text-xs hover:underline flex items-center gap-1 shrink-0">
                  <span className="material-symbols-outlined text-base">refresh</span>
                </button>
              </div>
            </div>
            {messages.length === 0 ? (
              <div className="p-12 text-center">
                <span className="material-symbols-outlined text-on-surface-variant text-5xl mb-3 block">mark_email_read</span>
                <p className="text-on-surface-variant text-sm">{t('No messages yet', 'لا توجد رسائل بعد')}</p>
              </div>
            ) : (
              <div className="">
                {messages
                  .filter(msg => {
                    if (!messageSearch) return true
                    const q = messageSearch.toLowerCase()
                    return msg.name?.toLowerCase().includes(q) || msg.email?.toLowerCase().includes(q) || msg.reference?.toLowerCase().includes(q)
                  })
                  .map((msg) => {
                  const isOpen = expandedThread === msg.id
                  const thread = msg.thread || []
                  const unread = !msg.is_read || (msg.unreadInbound || 0) > 0
                  const awaitingReply = msg.lastDirection === 'inbound' || (!msg.is_read && thread.length === 0)

                  return (
                    <div key={msg.id}
                      className={`transition-colors ${unread ? 'bg-secondary-fixed/5' : ''}`}
                      style={{ borderBottom: '1px solid var(--color-outline-variant)' }}>

                      {/* Header — click toggles the thread open/closed */}
                      <div
                        className="p-5 cursor-pointer hover:bg-surface-variant/5 transition-colors"
                        onClick={async () => {
                          const opening = !isOpen
                          setExpandedThread(opening ? msg.id : null)
                          if (opening && unread) {
                            await fetch(`${API}/api/messages/${msg.id}/thread-read`, { method: 'PATCH', headers: hdrs })
                            setMessages(msgs => msgs.map(m => m.id === msg.id
                              ? { ...m, is_read: 1, unreadInbound: 0,
                                  thread: (m.thread || []).map(i => ({ ...i, is_read: 1 })) }
                              : m))
                            setUnreadCount(cnt => Math.max(0, cnt - 1))
                          }
                        }}>
                        <div className="flex justify-between items-start gap-4 mb-2">
                          <div className="flex items-center gap-2">
                            {unread && <span className="w-2 h-2 rounded-full bg-secondary-fixed shrink-0" />}
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className={`font-semibold text-sm ${unread ? 'text-secondary-fixed' : 'text-on-surface'}`}>{msg.name}</p>
                                {msg.reference && (
                                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" dir="ltr"
                                    style={{ background: 'rgba(var(--color-secondary-fixed-rgb),0.1)', color: 'var(--color-secondary-fixed)', border: '1px solid rgba(var(--color-secondary-fixed-rgb),0.2)' }}>
                                    {msg.reference}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-on-surface-variant">{msg.email}</p>
                            </div>
                          </div>
                          <div className="text-end shrink-0 flex flex-col items-end gap-1">
                            <span className="text-xs font-bold px-2 py-1 rounded-full bg-surface-container-high text-on-surface-variant">{msg.subject}</span>
                            <p className="text-xs text-on-surface-variant">{msg.created_at ? new Date(msg.created_at).toLocaleDateString('en-GB') : ''}</p>
                          </div>
                        </div>

                        {/* Collapsed preview */}
                        {!isOpen && (
                          <p className="text-on-surface-variant text-sm leading-relaxed line-clamp-2">{msg.message}</p>
                        )}

                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          {thread.length > 0 && (
                            <span className="text-xs text-on-surface-variant flex items-center gap-1">
                              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>forum</span>
                              {thread.length} {thread.length === 1 ? t('reply', 'رد') : t('replies', 'ردود')}
                            </span>
                          )}
                          {awaitingReply && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                              style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
                              {t('Awaiting reply', 'بانتظار الرد')}
                            </span>
                          )}
                          {!awaitingReply && thread.length > 0 && (
                            <span className="text-xs flex items-center gap-1" style={{ color: '#22c55e' }}>
                              <span className="material-symbols-outlined fill-icon" style={{ fontSize: '14px' }}>check_circle</span>
                              {t('Replied', 'تم الرد')}
                            </span>
                          )}
                          <span className="text-xs text-on-surface-variant ms-auto flex items-center gap-1">
                            {isOpen ? t('Hide', 'إخفاء') : t('View thread', 'عرض المحادثة')}
                            <span className="material-symbols-outlined"
                              style={{ fontSize: '16px', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }}>expand_more</span>
                          </span>
                        </div>
                      </div>

                      {/* Expanded thread */}
                      {isOpen && (
                        <div className="px-5 pb-5 space-y-3 animate-fade-in">
                          {/* Original message */}
                          <div className="rounded-xl p-3" style={{ background: 'var(--input-bg)', border: '1px solid var(--color-outline-variant)' }}>
                            <div className="flex justify-between items-center mb-1">
                              <p className="text-xs font-bold text-on-surface">{msg.name}</p>
                              <p className="text-xs text-on-surface-variant" dir="ltr">
                                {msg.created_at ? new Date(msg.created_at).toLocaleString('en-GB') : ''}
                              </p>
                            </div>
                            <p className="text-sm text-on-surface-variant whitespace-pre-wrap">{msg.message}</p>
                          </div>

                          {/* Thread items */}
                          {thread.map(item => {
                            const outbound = item.direction === 'outbound'
                            return (
                              <div key={item.id}
                                className={`rounded-xl p-3 ${outbound ? 'ms-6' : 'me-6'}`}
                                style={{
                                  background: outbound ? 'rgba(0,86,179,0.06)' : 'var(--input-bg)',
                                  border: `1px solid ${outbound ? 'rgba(0,86,179,0.2)' : 'var(--color-outline-variant)'}`
                                }}>
                                <div className="flex justify-between items-center mb-1 gap-2">
                                  <p className="text-xs font-bold flex items-center gap-1"
                                    style={{ color: outbound ? 'var(--color-secondary-fixed)' : 'var(--color-on-surface)' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>
                                      {outbound ? 'support_agent' : 'person'}
                                    </span>
                                    {outbound ? (item.author || t('Staff', 'الموظف')) : msg.name}
                                  </p>
                                  <p className="text-xs text-on-surface-variant shrink-0" dir="ltr">
                                    {item.created_at ? new Date(item.created_at).toLocaleString('en-GB') : ''}
                                  </p>
                                </div>
                                <p className="text-sm text-on-surface-variant whitespace-pre-wrap">{item.body}</p>
                              </div>
                            )
                          })}

                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setReplyTarget(msg)
                              setReplyBody('')
                              setReplyError('')
                            }}
                            className="hydro-gradient text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:opacity-90 flex items-center gap-1.5">
                            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>reply</span>
                            {thread.length ? t('Reply again', 'رد مرة أخرى') : t('Reply', 'رد')}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (<>
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            ['calendar_today', t('Total Customers','إجمالي العملاء'), stats?.totalCustomers],
            ['check_circle', t('Total Bookings','إجمالي الحجوزات'), stats?.totalBookings],
            ['stars', t('Total Washes','إجمالي الغسيلات'), stats?.totalStamps],
            ['redeem', t('Free Washes Given','غسيلات مجانية'), stats?.freeWashesUsed],
          ].map(([icon, label, value]) => (
            <div key={label} className="glass p-4 rounded-xl inner-glow">
              <span className="material-symbols-outlined text-secondary-fixed-dim text-2xl mb-3 block">{icon}</span>
              <p className="text-xs text-on-surface-variant uppercase font-semibold tracking-wider">{label}</p>
              <h2 className="text-3xl font-bold text-on-surface mt-1 font-display">{loading ? '—' : (value ?? '—')}</h2>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Scanner + Bookings */}
          <div className="lg:col-span-2 space-y-4">
            {/* QR Scanner / UID lookup */}
            <div className="glass rounded-2xl overflow-hidden">
              <div className="p-4  flex justify-between items-center">
                <h3 className="font-bold text-on-surface">{t('Scan Customer QR / Enter ID', 'مسح QR العميل / إدخال الرمز')}</h3>
                <button onClick={toggleScanner} className={`hydro-gradient px-4 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-2 hover:opacity-90 transition-opacity ${scannerOn ? 'bg-error' : ''}`}>
                  <span className="material-symbols-outlined text-sm">{scannerOn ? 'stop' : 'qr_code_scanner'}</span>
                  {scannerOn ? t('Stop', 'إيقاف') : t('Scan QR', 'مسح QR')}
                </button>
              </div>
              {scannerOn && (
                <div className="p-4 relative">
                  <video
                    ref={setVideoRef}
                    autoPlay muted playsInline
                    className="w-full rounded-xl max-h-64 object-cover bg-black"
                    style={{ minHeight: '200px' }}
                  />
                  {/* Scanning overlay */}
                  <div className="absolute inset-4 pointer-events-none flex items-center justify-center">
                    <div className="w-48 h-48 relative">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-secondary-fixed rounded-tl-lg" />
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-secondary-fixed rounded-tr-lg" />
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-secondary-fixed rounded-bl-lg" />
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-secondary-fixed rounded-br-lg" />
                    </div>
                  </div>
                  <p className="text-xs text-secondary-fixed text-center mt-2 font-semibold">
                    {t('Point camera at customer QR code', 'وجّه الكاميرا نحو رمز QR للعميل')}
                  </p>
                </div>
              )}
              {/* Hidden canvas for QR decoding — off-screen, created in useRef */}
              <div className="p-4 flex gap-3">
                <input value={uidInput} onChange={e => setUidInput(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && lookup()} placeholder="RW-00001" className="rasha-input flex-1 uppercase" />
                <button onClick={() => lookup()} className="btn-primary px-6 py-3 rounded-xl shrink-0">{t('Look Up', 'بحث')}</button>
              </div>
              {/* Customer result */}
              {customer && (
                <div className="p-5 staff-section-border animate-fade-in space-y-5">
                  {/* Customer info header */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-2xl hydro-gradient flex items-center justify-center text-white text-lg font-bold shrink-0">
                        {customer.first_name?.[0]}{customer.last_name?.[0]}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-on-surface font-display truncate">{customer.first_name} {customer.last_name}</h4>
                        <p className="text-xs text-on-surface-variant" dir="ltr" style={{unicodeBidi:'embed'}}>{customer.phone}</p>
                        <p className="text-xs text-secondary-fixed font-bold" dir="ltr" style={{unicodeBidi:'embed'}}>{customer.customer_uid}</p>
                        <span className={`mt-0.5 inline-block text-xs px-2 py-0.5 rounded-full font-bold ${customer.is_active ? 'bg-green-500/10 text-green-400' : 'bg-error/10 text-error'}`}>
                          {customer.is_active ? t('Active', 'نشط') : t('Suspended', 'موقوف')}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 items-center shrink-0">
                      <button onClick={() => openEditModal(customer)}
                        className="glass p-2 rounded-xl text-secondary-fixed hover:bg-secondary-fixed/5 transition-colors">
                        <span className="material-symbols-outlined text-base">edit</span>
                      </button>
                      <button onClick={deleteCustomer}
                        className="glass p-2 rounded-xl text-error hover:bg-error/5 transition-colors">
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                      <button onClick={() => { setCustomer(null); setUidInput(''); setCustomerBookings([]) }}
                        className="glass p-2 rounded-xl text-on-surface-variant hover:text-error transition-colors">
                        <span className="material-symbols-outlined text-base">close</span>
                      </button>
                    </div>
                  </div>

                  {/* Stamps visual */}
                  <div className="rounded-xl p-4" style={{ background: 'var(--input-bg)', border: '1px solid var(--color-outline-variant)' }}>
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{t('Loyalty Stamps', 'طوابع الولاء')}</p>
                      <span className="text-secondary-fixed font-extrabold text-lg font-display" dir="ltr" style={{unicodeBidi:'embed'}}>{customer.stamps}/5</span>
                    </div>
                    {/* 5 stamp dots */}
                    <div className="flex gap-2 mb-4">
                      {Array.from({ length: 5 }, (_, i) => (
                        <div key={i} className={`flex-1 h-3 rounded-full transition-all ${i < customer.stamps ? 'bg-secondary-fixed' : 'bg-surface-variant'}`}
                          style={i < customer.stamps ? { boxShadow: '0 0 6px rgba(116,245,255,0.5)' } : {}} />
                      ))}
                    </div>
                    {customer.stamps >= 5 && (
                      <div className="text-center text-xs text-secondary-fixed font-bold mb-3 p-2 rounded-lg"
                        style={{ background: 'rgba(116,245,255,0.08)', border: '1px solid rgba(116,245,255,0.2)' }}>
                        🎉 {t('Free Wash Ready! Customer has earned a complimentary wash.', 'غسيل مجاني! استحق العميل غسيلاً مجانياً.')}
                      </div>
                    )}
                    {/* Cooldown warning */}
                    {cooldownInfo && (
                      <div className="p-3 rounded-xl mb-2 text-center" style={{ background: 'rgba(229,57,53,0.1)', border: '1px solid rgba(229,57,53,0.3)' }}>
                        <p className="text-error text-xs font-semibold mb-1">
                          {t('QR already scanned today', 'تم مسح QR اليوم مسبقاً')}
                        </p>
                        <p className="text-on-surface-variant text-xs">
                          {t('Next scan available:', 'المسح التالي متاح:')} {cooldownInfo.nextScanAt ? new Date(cooldownInfo.nextScanAt).toLocaleTimeString(t('en-US','ar-EG'),{hour:'2-digit',minute:'2-digit'}) : '—'}
                        </p>
                        {cooldownInfo.canForce && isSuperAdmin && (
                          <button onClick={() => { setCooldownInfo(null); markWash(true) }}
                            className="mt-2 px-4 py-1.5 rounded-lg text-xs font-bold text-white hydro-gradient hover:opacity-90 transition-opacity">
                            {t('Force Rescan (Admin Override)', 'تجاوز القيد (صلاحية المشرف)')}
                          </button>
                        )}
                      </div>
                    )}
                    {/* Stamp action buttons */}
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={markWash}
                        className={`py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity ${customer.stamps >= 5 ? 'cyan-glow' : 'hydro-gradient cyan-glow'}`}
                        style={customer.stamps >= 5 ? { background: 'linear-gradient(135deg,#00a86b,#00c17a)' } : {}}>
                        <span className="material-symbols-outlined fill-icon text-base">{customer.stamps >= 5 ? 'redeem' : 'add_circle'}</span>
                        {customer.stamps >= 5 ? t('Redeem Free Wash', 'استخدام الغسيل المجاني') : t('Add Stamp', 'إضافة طابع')}
                      </button>
                      <button
                        onClick={async () => {
                          if (customer.stamps <= 0) { showToast(t('Already at 0 stamps', 'لا يوجد طوابع للإزالة'), 'error'); return }
                          try {
                            const newVal = customer.stamps - 1
                            const res = await fetch(`${API}/api/admin/customers/${customer.customer_uid}/stamps`, {
                              method: 'PATCH', headers: hdrs,
                              body: JSON.stringify({ newValue: newVal, reason: 'Manual stamp removal by staff' })
                            })
                            const data = await res.json()
                            if (!res.ok) { showToast(data.error || t('Error', 'خطأ'), 'error'); return }
                            setCustomer(c => ({ ...c, stamps: newVal }))
                            showToast(t('Stamp removed', 'تم إزالة الطابع'))
                          } catch { showToast(t('Error', 'خطأ'), 'error') }
                        }}
                        disabled={customer.stamps <= 0}
                        className="glass py-3 rounded-xl text-error font-bold text-sm flex items-center justify-center gap-2 hover:bg-error/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                        <span className="material-symbols-outlined text-base">remove_circle</span>
                        {t('Remove Stamp', 'إزالة طابع')}
                      </button>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {[
                      [t('Total Washes', 'إجمالي الغسيلات'), customer.total_washes ?? 0],
                      [t('Free Used', 'مجاني مستخدم'), customer.free_washes_used ?? 0],
                      [t('Bookings', 'الحجوزات'), customer.booking_count ?? 0],
                    ].map(([label, val]) => (
                      <div key={label} className="rounded-xl py-3 px-2" style={{ background: 'var(--input-bg)', border: '1px solid var(--color-outline-variant)' }}>
                        <p className="text-secondary-fixed font-bold text-xl font-display">{val}</p>
                        <p className="text-on-surface-variant text-xs mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Suspend / Restore */}
                  <button onClick={toggleAccess}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 self-start ${customer.is_active ? 'text-white' : 'glass text-secondary-fixed hover:bg-secondary-fixed/5'}`}
                    style={customer.is_active ? {background:'#b3261e'} : {}}>
                    <span className="material-symbols-outlined text-sm">{customer.is_active ? 'block' : 'check_circle'}</span>
                    {customer.is_active ? t('Suspend', 'إيقاف') : t('Restore', 'تفعيل')}
                  </button>

                  {/* Recent Bookings for this customer */}
                  {customerBookings.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">{t('Recent Bookings', 'الحجوزات الأخيرة')}</p>
                      {/* Search by booking ID */}
                      <div className="flex items-center gap-2 mb-2 px-2 py-1.5 rounded-xl" style={{background:'var(--input-bg)', border:'1px solid var(--color-outline-variant)'}}>
                        <span className="material-symbols-outlined text-on-surface-variant text-base">search</span>
                        <input className="flex-1 bg-transparent outline-none text-xs text-on-surface placeholder:text-on-surface-variant"
                          placeholder={t('Search by booking ID…', 'بحث برقم الحجز…')}
                          value={customerBookingSearch}
                          onChange={e => setCustomerBookingSearch(e.target.value)} />
                        {customerBookingSearch && <button onClick={() => setCustomerBookingSearch('')} className="text-on-surface-variant hover:text-error">
                          <span className="material-symbols-outlined text-base">close</span>
                        </button>}
                      </div>
                      {/* Filter: All / Confirmed / Cancelled */}
                      <div className="flex gap-1 mb-2">
                        {[['all', t('All','الكل')], ['confirmed', t('Confirmed','مؤكد')], ['cancelled', t('Cancelled','ملغى')]].map(([f, label]) => (
                          <button key={f} onClick={() => setCustomerBookingFilter(f)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${customerBookingFilter === f ? 'hydro-gradient text-white' : 'text-on-surface-variant hover:text-on-surface'}`}>
                            {label}
                          </button>
                        ))}
                      </div>
                      <div className="space-y-2 max-h-52 overflow-y-auto">
                        {customerBookings
                          .filter(b => {
                            const matchesFilter = customerBookingFilter === 'all' || b.status === customerBookingFilter
                            const matchesSearch = !customerBookingSearch || b.booking_uid?.toLowerCase().includes(customerBookingSearch.toLowerCase()) || `#RSH-${b.booking_uid?.replace('BK-','')}`.toLowerCase().includes(customerBookingSearch.toLowerCase())
                            return matchesFilter && matchesSearch
                          })
                          .slice(0, 10)
                          .map(b => (
                          <div key={b.id} className="flex items-center justify-between px-3 py-2 rounded-xl text-xs" style={{background:'var(--input-bg)', border:'1px solid var(--color-outline-variant)'}}>
                            <div dir="ltr">
                              <p className="font-bold text-secondary-fixed">#RSH-{b.booking_uid?.replace('BK-','')}</p>
                              <p className="text-on-surface-variant">{new Date(b.booking_date).toLocaleDateString('en-GB',{day:'2-digit',month:'short'})} | {formatTime(b.booking_time, lang)}</p>
                            </div>
                            <span className="font-bold" style={{color: b.status==='confirmed'?'var(--color-secondary-fixed)':b.status==='completed'?'#22c55e':'var(--color-error)'}}>
                              {b.status==='confirmed'?t('Confirmed','مؤكد'):b.status==='completed'?t('Completed','مكتمل'):t('Cancelled','ملغى')}
                            </span>
                          </div>
                        ))}
                        {customerBookings.filter(b => {
                          const matchesFilter = customerBookingFilter === 'all' || b.status === customerBookingFilter
                          const matchesSearch = !customerBookingSearch || b.booking_uid?.toLowerCase().includes(customerBookingSearch.toLowerCase()) || `#RSH-${b.booking_uid?.replace('BK-','')}`.toLowerCase().includes(customerBookingSearch.toLowerCase())
                          return matchesFilter && matchesSearch
                        }).length === 0 && (
                          <p className="text-xs text-on-surface-variant text-center py-3">{t('No bookings match.', 'لا توجد حجوزات مطابقة.')}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bookings table — hide when customer panel is open */}
            {!customer && <div className="glass rounded-2xl overflow-hidden">
              <div className="p-4 staff-section-header flex items-center justify-between gap-4 flex-wrap">
                <h3 className="font-bold text-on-surface">{t('Recent Bookings', 'الحجوزات الأخيرة')}</h3>
                <div className="flex gap-1">
                  {[['all', t('All','الكل')], ['confirmed', t('Confirmed','مؤكد')], ['cancelled', t('Cancelled','ملغى')]].map(([f, label]) => (
                    <button key={f} onClick={() => setBookingFilter(f)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${bookingFilter === f ? 'hydro-gradient text-white' : 'text-on-surface-variant hover:text-on-surface'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm staff-table" dir="ltr">
                  <thead style={{background:'var(--color-surface-container-high)'}}>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs text-on-surface-variant uppercase font-semibold whitespace-nowrap">{t('Ref','المرجع')}</th>
                      <th className="px-4 py-3 text-left text-xs text-on-surface-variant uppercase font-semibold whitespace-nowrap">{t('Customer','العميل')}</th>
                      <th className="px-4 py-3 text-left text-xs text-on-surface-variant uppercase font-semibold whitespace-nowrap">{t('Service','الخدمة')}</th>
                      <th className="px-4 py-3 text-left text-xs text-on-surface-variant uppercase font-semibold whitespace-nowrap">{t('Date/Time','التاريخ')}</th>
                      <th className="px-4 py-3 text-left text-xs text-on-surface-variant uppercase font-semibold whitespace-nowrap">{t('Status','الحالة')}</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-on-surface-variant"><div className="loader mx-auto" /></td></tr>
                    ) : bookings.filter(b => bookingFilter === 'all' || b.status === bookingFilter).length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-on-surface-variant text-sm">{t('No bookings', 'لا توجد حجوزات')}</td></tr>
                    ) : bookings.filter(b => bookingFilter === 'all' || b.status === bookingFilter).slice(0, 15).map(b => (
                      <tr key={b.id} className="hover:bg-surface-variant/10 transition-colors">
                        <td className="px-4 py-3 text-xs font-bold text-secondary-fixed whitespace-nowrap">#RSH-{b.booking_uid.replace('BK-','')}</td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-on-surface font-semibold whitespace-nowrap">{b.customer_name||'-'}</p>
                          <p className="text-xs text-on-surface-variant whitespace-nowrap">{b.customer_phone||''}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-on-surface-variant whitespace-nowrap">{b.service_type==='full'?t('Full','كامل'):t('Exterior','خارجي')}</td>
                        <td className="px-4 py-3 text-xs text-on-surface-variant whitespace-nowrap">
                          <p>{new Date(b.booking_date).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}</p>
                          <p>{formatTime(b.booking_time, lang)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap" style={{
                            background: b.status==='confirmed'?'rgba(0,122,133,0.1)':b.status==='completed'?'rgba(34,197,94,0.1)':'rgba(179,38,30,0.1)',
                            border: `1px solid ${b.status==='confirmed'?'rgba(0,122,133,0.3)':b.status==='completed'?'rgba(34,197,94,0.2)':'rgba(179,38,30,0.2)'}`,
                            color: b.status==='confirmed'?'var(--color-secondary-fixed)':b.status==='completed'?'#22c55e':'var(--color-error)'
                          }} dir="rtl">{b.status === 'confirmed' ? t('Confirmed','مؤكد') : b.status === 'completed' ? t('Completed','مكتمل') : t('Cancelled','ملغى')}</span>
                        </td>
                        <td className="px-4 py-3">
                          {b.status==='confirmed'&&<button onClick={()=>setCancelTarget(b)} className="text-error text-xs hover:underline" dir="rtl">{t('Cancel','إلغاء')}</button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>}
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Customer search */}
            <div className="glass rounded-2xl overflow-hidden">
              <div className="p-4 ">
                <h3 className="font-bold text-on-surface text-sm">{t('Customer Search', 'بحث عن عميل')}</h3>
              </div>
              <div className="p-4 space-y-3">
                <input value={searchQuery} onChange={e=>handleSearch(e.target.value)} className="rasha-input" placeholder={t('Name, phone, email...', 'الاسم، الهاتف...')} />
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {searchResults.map(c => (
                    <button key={c.id} onClick={()=>{ setUidInput(c.customer_uid); setSearchResults([]); setSearchQuery(''); lookup(c.customer_uid); }} className="w-full flex items-center justify-between p-3 rounded-xl bg-surface-container hover:bg-surface-container-high cursor-pointer transition-colors text-start">
                      <div>
                        <p className="text-sm font-semibold text-on-surface">{c.first_name} {c.last_name}</p>
                        <p className="text-xs text-on-surface-variant" dir="ltr" style={{unicodeBidi:'embed'}}>{c.customer_uid} | {c.stamps}/5 {t('stamps', 'طوابع')}</p>
                      </div>
                      <span className="material-symbols-outlined text-secondary-fixed text-base rtl-flip">chevron_right</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Inventory — sidebar widget (dashboard only) */}
            <div className="glass rounded-2xl p-4">
              <h4 className="text-xs font-bold text-secondary-fixed uppercase tracking-widest mb-3 flex items-center justify-between">
                {t('Inventory', 'المخزون')}
                <span className="material-symbols-outlined text-sm text-secondary-fixed">inventory_2</span>
              </h4>
              {inventory.length === 0 ? (
                <p className="text-on-surface-variant text-xs">{t('No items yet.', 'لا يوجد عناصر.')}</p>
              ) : (
                <div className="space-y-3">
                  {inventory.slice(0, 5).map(item => {
                    const pct = item.min_quantity > 0 ? Math.min(100, Math.round((item.quantity / (item.min_quantity * 3)) * 100)) : 50
                    const low = item.quantity <= item.min_quantity
                    return (
                      <div key={item.id}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-on-surface truncate max-w-[120px]">{item.name}</span>
                          <span className={`font-bold ${low ? 'text-error' : 'text-secondary-fixed'}`}>{item.quantity} {item.unit}</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{background:'rgba(0,0,0,0.15)'}}>
                          <div className="h-full rounded-full" style={{width:`${pct}%`, background: pct < 25 ? '#b3261e' : pct < 60 ? '#f59e0b' : '#22c55e'}} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              {/* Staff: Request Refill | Super Admin: go to tab */}
              {isSuperAdmin ? (
                <p className="text-on-surface-variant text-xs mt-3">{t('Manage in Inventory tab.', 'أدر من تبويب المخزون.')}</p>
              ) : (
                <div>
                  <button onClick={() => setShowRefillRequest(true)}
                    className="w-full mt-3 py-2 rounded-xl text-xs font-bold text-secondary-fixed flex items-center justify-center gap-1 transition-all"
                    style={{border:'1px solid var(--color-outline-variant)', background:'var(--input-bg)'}}>
                    <span className="material-symbols-outlined" style={{fontSize:'14px'}}>notification_add</span>
                    {t('Request Refill', 'طلب تعبئة')}
                  </button>
                  {refillRequests.length > 0 && (
                    <p className="text-xs text-on-surface-variant mt-2 text-center">
                      {refillRequests.length} {t('pending request(s)', 'طلب معلق')}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        </>)}


        {/* ── Inventory Tab ─────────────────────────────────── */}
        {activeTab === 'inventory' && isSuperAdmin && (
          <div className="animate-fade-in space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-on-surface font-display">{t('Inventory', 'المخزون')}</h2>
              <button onClick={() => setShowAddInventory(true)}
                className="hydro-gradient px-4 py-2.5 rounded-xl text-white text-xs font-bold flex items-center gap-2 hover:opacity-90 cyan-glow">
                <span className="material-symbols-outlined text-base">add</span>
                {t('Add Item', 'إضافة عنصر')}
              </button>
            </div>

            {/* Sub-tabs */}
            <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: 'var(--color-surface-container)', border: '1px solid var(--color-outline-variant)' }}>
              {[
                ['items', t('Items', 'العناصر')],
                ['requests', t('Refill Requests', 'طلبات التعبئة')],
              ].map(([sub, label]) => (
                <button key={sub} onClick={() => {
                  setInventorySubTab(sub)
                  if (sub === 'requests') {
                    const updated = refillRequests.map(r => ({...r, read: true}))
                    setRefillRequests(updated)
                    localStorage.setItem('rasha_refill_requests', JSON.stringify(updated))
                  }
                }}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${inventorySubTab === sub ? 'hydro-gradient text-white' : 'text-on-surface-variant hover:text-on-surface'}`}>
                  {label}
                  {sub === 'requests' && refillRequests.filter(r=>!r.read).length > 0 && (
                    <span className="text-xs font-bold text-white px-1.5 py-0.5 rounded-full" style={{background:'#b3261e', fontSize:'10px'}}>
                      {refillRequests.filter(r=>!r.read).length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Items sub-tab */}
            {inventorySubTab === 'items' && (
              inventoryLoading ? (
                <div className="flex justify-center py-10"><div className="loader" /></div>
              ) : inventory.length === 0 ? (
                <div className="glass rounded-xl p-6 text-center">
                  <span className="material-symbols-outlined text-on-surface-variant text-3xl mb-1 block">inventory_2</span>
                  <p className="text-on-surface-variant text-sm">{t('No inventory items yet.', 'لا يوجد عناصر في المخزون بعد.')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                  {inventory.map(item => {
                    const pct = item.min_quantity > 0 ? Math.min(100, Math.round((item.quantity / (item.min_quantity * 3)) * 100)) : 50
                    const low = item.quantity <= item.min_quantity
                    return (
                      <div key={item.id} className="glass rounded-xl p-4 space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <p className="font-bold text-on-surface text-sm truncate">{item.name}</p>
                            <p className="text-xs text-on-surface-variant">{item.unit}</p>
                          </div>
                          {low && <span className="text-error text-base">⚠</span>}
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-on-surface-variant">{t('Qty','كمية')}</span>
                            <span className={`font-bold ${low ? 'text-error' : 'text-secondary-fixed'}`}>{item.quantity}</span>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{background:'rgba(0,0,0,0.15)'}}>
                            <div className="h-full rounded-full" style={{width:`${pct}%`, background: pct < 25 ? '#b3261e' : pct < 60 ? '#f59e0b' : '#22c55e'}} />
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <button onClick={() => { setRefillTarget(item); setRefillQty(10) }}
                            className="flex-1 py-1.5 rounded-lg text-xs font-bold hydro-gradient text-white hover:opacity-90 flex items-center justify-center gap-1">
                            <span className="material-symbols-outlined" style={{fontSize:'14px'}}>add_circle</span>{t('Refill', 'تعبئة')}
                          </button>
                          <button onClick={() => setDeleteTarget(item)}
                            className="glass px-2 py-1.5 rounded-lg text-error text-xs font-bold hover:bg-error/5 flex items-center">
                            <span className="material-symbols-outlined" style={{fontSize:'14px'}}>delete</span>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            )}

            {/* Refill Requests sub-tab */}
            {inventorySubTab === 'requests' && (
              <div className="space-y-3">
                {refillRequests.length === 0 ? (
                  <div className="glass rounded-xl p-6 text-center">
                    <span className="material-symbols-outlined text-on-surface-variant text-3xl mb-1 block">notifications_none</span>
                    <p className="text-on-surface-variant text-sm">{t('No refill requests yet.', 'لا يوجد طلبات تعبئة بعد.')}</p>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-end">
                      <button onClick={() => {
                        const updated = refillRequests.map(r => ({...r, read: true}))
                        setRefillRequests(updated)
                        localStorage.setItem('rasha_refill_requests', JSON.stringify(updated))
                      }} className="text-xs text-on-surface-variant hover:text-secondary-fixed transition-colors underline">
                        {t('Clear Notifications', 'مسح الإشعارات')}
                      </button>
                    </div>
                    {refillRequests.map((req, i) => (
                      <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl transition-all"
                        style={{background: req.read ? 'var(--input-bg)' : 'rgba(179,38,30,0.07)', border:`1px solid ${req.read ? 'var(--color-outline-variant)' : 'rgba(179,38,30,0.3)'}`}}>
                        <div className="flex items-center gap-3">
                          {!req.read && <div className="w-2 h-2 rounded-full shrink-0" style={{background:'#b3261e'}} />}
                          {req.read && <div className="w-2 h-2 rounded-full shrink-0 opacity-0" />}
                          <div>
                            <p className="text-sm font-semibold text-on-surface">{req.itemName}</p>
                            <p className="text-xs text-on-surface-variant" dir="ltr">{req.requestedBy} — {req.time}</p>
                          </div>
                        </div>
                        {!req.read && (
                          <button onClick={() => {
                            const updated = refillRequests.map((r,j) => j===i ? {...r, read:true} : r)
                            setRefillRequests(updated)
                            localStorage.setItem('rasha_refill_requests', JSON.stringify(updated))
                          }} className="text-xs text-on-surface-variant hover:text-secondary-fixed transition-colors shrink-0"
                            title={t('Mark as read','تحديد كمقروء')}>
                            <span className="material-symbols-outlined text-base">check_circle</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>


      {/* Reply to Message Popup */}
      {replyTarget && (
        <div className="glass-popup-backdrop fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div className="glass-popup w-full max-w-lg rounded-2xl animate-fade-in overflow-hidden">

            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-outline-variant)' }}>
              <div>
                <h3 className="font-bold text-on-surface font-display">{t('Reply to Message', 'الرد على الرسالة')}</h3>
                <p className="text-xs text-on-surface-variant mt-0.5" dir="ltr" style={{ unicodeBidi: 'embed' }}>
                  {replyTarget.name} &lt;{replyTarget.email}&gt;
                </p>
              </div>
              <button onClick={() => setReplyTarget(null)}>
                <span className="material-symbols-outlined text-on-surface-variant">close</span>
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Original message for context */}
              <div className="rounded-xl p-3" style={{ background: 'var(--input-bg)', border: '1px solid var(--color-outline-variant)' }}>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  {replyTarget.subject || t('Message', 'الرسالة')}
                </p>
                <p className="text-xs text-on-surface-variant whitespace-pre-wrap max-h-28 overflow-y-auto">{replyTarget.message}</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">
                  {t('Your Reply', 'ردك')}
                </label>
                <textarea
                  rows={6}
                  className="w-full px-3 py-3 rounded-xl text-on-surface text-sm focus:outline-none resize-none"
                  style={{ background: 'var(--input-bg)', border: `1px solid ${replyError ? 'var(--color-error)' : 'var(--input-border)'}` }}
                  placeholder={t('Type your reply to the customer…', 'اكتب ردك على العميل…')}
                  value={replyBody}
                  onChange={e => { setReplyBody(e.target.value); setReplyError('') }}
                />
                {replyError && <p className="text-error text-xs mt-1">{replyError}</p>}
                <p className="text-xs text-on-surface-variant mt-1.5 opacity-70">
                  {t('This will be emailed to the customer from Rasha Car Wash.', 'سيتم إرسال هذا بالبريد الإلكتروني للعميل من رشة.')}
                </p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setReplyTarget(null)} disabled={replyLoading}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-on-surface-variant"
                  style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)' }}>
                  {t('Cancel', 'إلغاء')}
                </button>
                <button
                  disabled={replyLoading || !replyBody.trim()}
                  onClick={async () => {
                    const body = replyBody.trim()
                    if (body.length < 2) { setReplyError(t('Reply cannot be empty.', 'لا يمكن أن يكون الرد فارغاً.')); return }
                    setReplyLoading(true); setReplyError('')
                    try {
                      const res = await fetch(`${API}/api/messages/${replyTarget.id}/reply`, {
                        method: 'POST', headers: hdrs, body: JSON.stringify({ body })
                      })
                      const data = await res.json()
                      if (!res.ok) { setReplyError(data.error || t('Could not send reply.', 'تعذر إرسال الرد.')); return }
                      setMessages(msgs => msgs.map(m => m.id === replyTarget.id
                        ? { ...m, ...data.message, thread: data.message.thread || m.thread }
                        : m))
                      setUnreadCount(c => Math.max(0, c - (replyTarget.is_read ? 0 : 1)))
                      setExpandedThread(replyTarget.id)   // keep the thread open to show the sent reply
                      showToast(t('Reply sent!', 'تم إرسال الرد!'))
                      setReplyTarget(null)
                      setReplyBody('')
                    } catch {
                      setReplyError(t('Connection error.', 'خطأ في الاتصال.'))
                    } finally { setReplyLoading(false) }
                  }}
                  className="flex-1 py-3 rounded-xl text-sm font-bold hydro-gradient text-white hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                  {replyLoading ? <div className="loader" /> : (<>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>send</span>
                    {t('Send Reply', 'إرسال الرد')}
                  </>)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Customer Popup */}
      {showDeleteCustomerPopup && customer && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)'}}>
          <div className="w-full max-w-sm rounded-2xl p-6 animate-fade-in" style={{background:'var(--color-surface-container)', border:'1px solid var(--color-outline-variant)'}}>
            <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{background:'rgba(179,38,30,0.1)'}}>
              <span className="material-symbols-outlined text-error text-3xl">person_remove</span>
            </div>
            <h3 className="font-bold text-on-surface text-lg text-center mb-2">{t('Delete Account?', 'حذف الحساب؟')}</h3>
            <p className="text-on-surface-variant text-sm text-center mb-1">
              <span className="font-bold text-on-surface">{customer.first_name} {customer.last_name}</span>
            </p>
            <p className="text-on-surface-variant text-xs text-center mb-6">{t('This will permanently delete the customer account, all bookings and loyalty stamps. This cannot be undone.', 'سيؤدي هذا إلى حذف حساب العميل وجميع الحجوزات وطوابع الولاء نهائياً. لا يمكن التراجع.')}</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteCustomerPopup(false)}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-on-surface-variant"
                style={{background:'var(--input-bg)', border:'1px solid var(--input-border)'}}>
                {t('Cancel', 'إلغاء')}
              </button>
              <button onClick={confirmDeleteCustomer}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white"
                style={{background:'#b3261e'}}>
                {t('Delete', 'حذف')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Booking Popup */}
      {cancelTarget && (
        <div className="glass-popup-backdrop fixed inset-0 z-[400] flex items-center justify-center p-4">
          <div className="glass-popup w-full max-w-sm rounded-2xl p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{background:'rgba(179,38,30,0.1)'}}>
                <span className="material-symbols-outlined text-error">event_busy</span>
              </div>
              <h3 className="font-bold text-on-surface font-display">{t('Cancel Booking?', 'إلغاء الحجز؟')}</h3>
            </div>
            <div className="rounded-xl p-4 mb-5" style={{background:'var(--input-bg)', border:'1px solid var(--color-outline-variant)'}}>
              <div dir="ltr" style={{unicodeBidi:'embed'}} className="space-y-1">
                <p className="text-sm font-bold text-on-surface">{cancelTarget.customer_name || t('Customer', 'عميل')}</p>
                <p className="text-xs text-on-surface-variant">#{cancelTarget.booking_uid?.replace('BK-','')}</p>
                <p className="text-xs text-on-surface-variant">
                  {new Date(cancelTarget.booking_date).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})} — {formatTime(cancelTarget.booking_time, lang)}
                </p>
                <p className="text-xs text-on-surface-variant">
                  {cancelTarget.service_type === 'full' ? t('Full Wash','غسيل كامل') : t('Exterior Only','خارجي فقط')}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setCancelTarget(null)}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-on-surface-variant" style={{background:'var(--input-bg)',border:'1px solid var(--input-border)'}}>
                {t('Skip', 'تخطي')}
              </button>
              <button onClick={() => cancelBooking(cancelTarget.id)}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
                style={{background:'#b3261e'}}>
                <span className="material-symbols-outlined text-base">event_busy</span>
                {t('Cancel Booking', 'إلغاء الحجز')}
              </button>
            </div>
          </div>
        </div>
      )}
      {showModal && (
        <div className="glass-popup-backdrop fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="glass-popup w-full max-w-md rounded-2xl p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-on-surface text-lg font-display">
                {modalMode === 'add' ? t('Add Customer', 'إضافة عميل') : t('Edit Customer', 'تعديل العميل')}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-on-surface-variant hover:text-on-surface transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">{t('First Name', 'الاسم الأول')} *</label>
                  <input className="w-full px-3 py-2.5 rounded-lg text-on-surface text-sm focus:outline-none" style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)' }}
                    value={modalForm.firstName} onChange={e => setModalForm(f => ({...f, firstName: e.target.value}))}
                    onFocus={e => e.target.style.borderColor='#74f5ff'} onBlur={e => e.target.style.borderColor='var(--input-border)'} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">{t('Last Name', 'اسم العائلة')} *</label>
                  <input className="w-full px-3 py-2.5 rounded-lg text-on-surface text-sm focus:outline-none" style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)' }}
                    value={modalForm.lastName} onChange={e => setModalForm(f => ({...f, lastName: e.target.value}))}
                    onFocus={e => e.target.style.borderColor='#74f5ff'} onBlur={e => e.target.style.borderColor='var(--input-border)'} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">{t('Email', 'البريد الإلكتروني')} *</label>
                <input type="email" className="w-full px-3 py-2.5 rounded-lg text-on-surface text-sm focus:outline-none" style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)' }}
                  value={modalForm.email} onChange={e => setModalForm(f => ({...f, email: e.target.value}))}
                  onFocus={e => e.target.style.borderColor='#74f5ff'} onBlur={e => e.target.style.borderColor='var(--input-border)'} />
              </div>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">{t('Phone', 'الهاتف')} *</label>
                <div className="flex">
                  <span className="px-3 py-2.5 text-sm text-on-surface-variant flex items-center shrink-0 rounded-s-lg" style={{ background: 'var(--color-surface-variant)', border: '1px solid var(--input-border)', borderRight: 'none' }}>+249</span>
                  <input type="tel" className="flex-1 px-3 py-2.5 rounded-e-lg text-on-surface text-sm focus:outline-none" style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)' }}
                    value={modalForm.phone} onChange={e => setModalForm(f => ({...f, phone: e.target.value.replace(/\D/g,'')}))}
                    onFocus={e => e.target.style.borderColor='#74f5ff'} onBlur={e => e.target.style.borderColor='var(--input-border)'} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">
                  {t('Password', 'كلمة المرور')} {modalMode === 'edit' ? t('(leave blank to keep)', '(اتركه لعدم التغيير)') : '*'}
                </label>
                <input type="password" className="w-full px-3 py-2.5 rounded-lg text-on-surface text-sm focus:outline-none" style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)' }}
                  value={modalForm.password} onChange={e => setModalForm(f => ({...f, password: e.target.value}))}
                  onFocus={e => e.target.style.borderColor='#74f5ff'} onBlur={e => e.target.style.borderColor='var(--input-border)'} />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl text-on-surface-variant font-bold text-sm transition-colors hover:bg-surface-variant" style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)' }}>
                  {t('Cancel', 'إلغاء')}
                </button>
                <button onClick={submitModal} disabled={modalLoading} className="flex-1 py-3 rounded-xl font-bold text-sm hydro-gradient text-white flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                  {modalLoading ? <div className="loader" /> : (modalMode === 'add' ? t('Add Customer', 'إضافة') : t('Save Changes', 'حفظ'))}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Staff Management Tab — super_admin only */}
      {activeTab === 'staff' && isSuperAdmin && (
        <div className="space-y-4 animate-fade-in max-w-7xl mx-auto px-4 md:px-6 pb-10">
          <div className="flex justify-between items-center pt-2">
            <div>
              <h3 className="font-bold text-on-surface font-display text-lg">{t('Staff Management', 'إدارة الموظفين')}</h3>
              <p className="text-on-surface-variant text-xs mt-0.5">{t('Add staff members and control their permissions.', 'أضف موظفين وتحكم في صلاحياتهم.')}</p>
            </div>
            <button onClick={() => { setStaffModalMode('add'); setStaffModalData({id:null,username:'',password:'',displayName:'',permissions:{}}); setShowStaffModal(true) }}
              className="hydro-gradient px-5 py-2.5 rounded-xl text-white text-xs font-bold flex items-center gap-2 hover:opacity-90 transition-opacity cyan-glow">
              <span className="material-symbols-outlined text-base">person_add</span>
              {t('Add Staff', 'إضافة موظف')}
            </button>
          </div>
          {staffLoading ? <div className="flex justify-center py-12"><div className="loader"/></div> : (
            <div className="space-y-3">
              {staffList.map(s => {
                const canEdit = !s.is_original || isSuperAdmin
                const canDelete = !s.is_original && (s.role === 'staff' || isSuperAdmin)
                return (
                <div key={s.id} className="glass p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
                      style={{background: s.role==='super_admin'?'linear-gradient(135deg,#f59e0b,#d97706)':'linear-gradient(135deg,#0056b3,#004491)'}}>
                      {s.role==='super_admin'?'★':(s.display_name||s.username)[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-on-surface">{s.display_name||s.username}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${s.role==='super_admin'?'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20':'bg-secondary-fixed/10 text-secondary-fixed border border-secondary-fixed/20'}`}>
                          {s.role==='super_admin'?t('Super Admin','مشرف رئيسي'):t('Staff','موظف')}
                        </span>
                        {s.is_original && <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{background:'rgba(245,158,11,0.1)',color:'#f59e0b',border:'1px solid rgba(245,158,11,0.2)'}}>{t('Original','الأصلي')}</span>}
                        {!s.is_active && <span className="text-xs px-2 py-0.5 rounded-full bg-error/10 text-error border border-error/20 font-bold">{t('Inactive','معطّل')}</span>}
                      </div>
                      <p className="text-xs text-on-surface-variant mt-0.5">@{s.username}</p>
                      {s.role==='staff' && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {Object.entries(typeof s.permissions==='string'?JSON.parse(s.permissions||'{}'):(s.permissions||{})).filter(([,v])=>v).map(([k])=>(
                            <span key={k} className="text-xs px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant capitalize" style={{border:'1px solid var(--color-outline-variant)'}}>
                              {k.replace(/_/g,' ')}
                            </span>
                          ))}
                          {!Object.values(typeof s.permissions==='string'?JSON.parse(s.permissions||'{}'):(s.permissions||{})).some(Boolean)&&(
                            <span className="text-xs text-outline italic">{t('No permissions assigned','لا توجد صلاحيات')}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {canEdit && (
                      <button onClick={()=>{
                        setStaffModalMode('edit')
                        const perms = typeof s.permissions==='string'?JSON.parse(s.permissions||'{}'):(s.permissions||{})
                        setStaffModalData({id:s.id,username:s.username,password:'',displayName:s.display_name||'',role:s.role||'staff',permissions:perms})
                        setShowStaffModal(true)
                      }} className="glass px-4 py-2 rounded-xl text-secondary-fixed text-xs font-bold hover:bg-secondary-fixed/5 transition-colors flex items-center gap-1">
                        <span className="material-symbols-outlined text-base">edit</span>{t('Edit','تعديل')}
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={async()=>{
                        if(!confirm(t(`Remove ${s.display_name||s.username}?`,`إزالة ${s.display_name||s.username}؟`)))return
                        const res=await fetch(`${API}/api/admin/staff/${s.id}`,{method:'DELETE',headers:hdrs})
                        const data=await res.json()
                        if(res.ok){showToast(t('Removed','تم الحذف'));loadStaff()}
                        else showToast(data.error||t('Error','خطأ'),'error')
                      }} className="glass px-4 py-2 rounded-xl text-error text-xs font-bold hover:bg-error/5 transition-colors flex items-center gap-1">
                        <span className="material-symbols-outlined text-base">delete</span>{t('Remove','إزالة')}
                      </button>
                    )}
                  </div>
                </div>
                )
              })}
              {staffList.length===0&&!staffLoading&&(
                <div className="glass rounded-2xl p-12 text-center">
                  <span className="material-symbols-outlined text-on-surface-variant text-5xl mb-3 block">group_off</span>
                  <p className="text-on-surface-variant text-sm">{t('No staff members yet.','لا يوجد موظفون بعد.')}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Staff Modal */}
      {showStaffModal && (
        <div className="glass-popup-backdrop fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="glass-popup w-full max-w-lg rounded-2xl p-6 animate-fade-in overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-on-surface text-lg font-display">
                {staffModalMode === 'add' ? t('Add Staff Member', 'إضافة موظف') : t('Edit Staff Member', 'تعديل موظف')}
              </h3>
              <button onClick={() => setShowStaffModal(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">{t('Display Name', 'الاسم المعروض')}</label>
                <input className="w-full px-3 py-2.5 rounded-lg text-on-surface text-sm focus:outline-none" style={{ background:'var(--input-bg)', border:'1px solid var(--input-border)' }}
                  value={staffModalData.displayName} onChange={e=>setStaffModalData(d=>({...d,displayName:e.target.value}))}
                  onFocus={e=>e.target.style.borderColor='#74f5ff'} onBlur={e=>e.target.style.borderColor='var(--input-border)'} />
              </div>
              {staffModalMode === 'add' && (
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">{t('Username', 'اسم المستخدم')} *</label>
                  <input className="w-full px-3 py-2.5 rounded-lg text-on-surface text-sm focus:outline-none" style={{ background:'var(--input-bg)', border:'1px solid var(--input-border)' }}
                    value={staffModalData.username} onChange={e=>setStaffModalData(d=>({...d,username:e.target.value}))}
                    onFocus={e=>e.target.style.borderColor='#74f5ff'} onBlur={e=>e.target.style.borderColor='var(--input-border)'} />
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">
                  {t('Password', 'كلمة المرور')} {staffModalMode==='edit'?t('(leave blank to keep)','(اتركه للإبقاء)'):'*'}
                </label>
                <input type="password" className="w-full px-3 py-2.5 rounded-lg text-on-surface text-sm focus:outline-none" style={{ background:'var(--input-bg)', border:'1px solid var(--input-border)' }}
                  value={staffModalData.password} onChange={e=>setStaffModalData(d=>({...d,password:e.target.value}))}
                  onFocus={e=>e.target.style.borderColor='#74f5ff'} onBlur={e=>e.target.style.borderColor='var(--input-border)'} />
              </div>
              {/* Role selector */}
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">{t('Role', 'الدور')}</label>
                <div className="flex gap-2">
                  {[['staff', t('Staff', 'موظف')], ['super_admin', t('Super Admin', 'مدير')]].map(([role, label]) => (
                    <button key={role} onClick={() => setStaffModalData(d => ({...d, role}))}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${staffModalData.role === role ? 'hydro-gradient text-white' : 'text-on-surface-variant'}`}
                      style={staffModalData.role !== role ? {background:'var(--input-bg)', border:'1px solid var(--input-border)'} : {}}>
                      {label}
                    </button>
                  ))}
                </div>
                {staffModalData.role === 'super_admin' && (
                  <p className="text-xs text-on-surface-variant mt-2 opacity-70">{t('Super admins have all permissions.', 'المديرون يملكون جميع الصلاحيات.')}</p>
                )}
              </div>
              {/* Permissions — only for staff role */}
              {staffModalData.role !== 'super_admin' && (
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3 block">{t('Permissions', 'الصلاحيات')}</label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    ['mark_wash',        t('Mark Wash / Add Stamp',       'تسجيل الغسيل / إضافة طابع')],
                    ['view_customers',   t('View Customers',               'عرض العملاء')],
                    ['edit_customers',   t('Add / Edit Customers',         'إضافة / تعديل العملاء')],
                    ['delete_customers', t('Delete Customers',             'حذف العملاء')],
                    ['view_bookings',    t('View Bookings',                'عرض الحجوزات')],
                    ['cancel_bookings',  t('Cancel Bookings',              'إلغاء الحجوزات')],
                    ['view_messages',    t('View Support Messages',         'عرض رسائل الدعم')],
                  ].map(([key, label]) => (
                    <label key={key} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-surface-container transition-colors"
                      style={{ background: staffModalData.permissions[key] ? 'rgba(0,86,179,0.1)' : 'var(--input-bg)', border: `1px solid ${staffModalData.permissions[key] ? 'rgba(116,245,255,0.3)' : 'var(--input-border)'}` }}>
                      <input type="checkbox" checked={!!staffModalData.permissions[key]}
                        onChange={e=>setStaffModalData(d=>({...d,permissions:{...d.permissions,[key]:e.target.checked}}))}
                        style={{ accentColor:'#00f1fe', width:'16px', height:'16px' }} />
                      <span className={`text-sm font-semibold ${staffModalData.permissions[key]?'text-secondary-fixed':'text-on-surface-variant'}`}>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={()=>setShowStaffModal(false)} className="flex-1 py-3 rounded-xl text-on-surface-variant font-bold text-sm" style={{background:'var(--input-bg)',border:'1px solid var(--input-border)'}}>
                  {t('Cancel','إلغاء')}
                </button>
                <button
                  onClick={async () => {
                    const { id, username, password, displayName, permissions, role } = staffModalData
                    if (staffModalMode==='add' && (!username||!password)) { showToast(t('Username and password required','اسم المستخدم وكلمة المرور مطلوبان'),'error'); return }
                    try {
                      let res
                      if (staffModalMode==='add') {
                        res = await fetch(`${API}/api/admin/staff`,{method:'POST',headers:hdrs,body:JSON.stringify({username:username.trim().toLowerCase(),password,displayName,role,permissions:role==='super_admin'?{}:permissions})})
                      } else {
                        res = await fetch(`${API}/api/admin/staff/${id}`,{method:'PATCH',headers:hdrs,body:JSON.stringify({displayName,password:password||undefined,role,permissions:role==='super_admin'?{}:permissions})})
                      }
                      const data = await res.json()
                      if(!res.ok){showToast(data.error||t('Error','خطأ'),'error');return}
                      showToast(staffModalMode==='add'?t('Staff member added!','تم إضافة الموظف!'):t('Staff member updated!','تم تحديث الموظف!'))
                      setShowStaffModal(false)
                      loadStaff()
                    } catch { showToast(t('Error','خطأ'),'error') }
                  }}
                  className="flex-1 py-3 rounded-xl font-bold text-sm hydro-gradient text-white flex items-center justify-center gap-2 hover:opacity-90">
                  {staffModalMode==='add'?t('Add Staff Member','إضافة موظف'):t('Save Changes','حفظ التغييرات')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Delete Inventory Item Popup */}
      {deleteTarget && (
        <div className="glass-popup-backdrop fixed inset-0 z-[400] flex items-center justify-center p-4">
          <div className="glass-popup w-full max-w-xs rounded-2xl p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{background:'rgba(179,38,30,0.1)'}}>
                <span className="material-symbols-outlined text-error">delete</span>
              </div>
              <div>
                <h3 className="font-bold text-on-surface">{t('Remove Item?', 'إزالة العنصر؟')}</h3>
                <p className="text-xs text-on-surface-variant">{deleteTarget.name}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-on-surface-variant" style={{background:'var(--input-bg)',border:'1px solid var(--input-border)'}}>
                {t('Cancel', 'إلغاء')}
              </button>
              <button onClick={async () => {
                const res = await fetch(`${API}/api/admin/inventory/${deleteTarget.id}`, { method: 'DELETE', headers: hdrs })
                if (res.ok) { showToast(t('Item removed', 'تم الحذف')); setDeleteTarget(null); loadInventory() }
                else showToast(t('Error', 'خطأ'), 'error')
              }} className="flex-1 py-3 rounded-xl text-sm font-bold text-white" style={{background:'#b3261e'}}>
                {t('Remove', 'إزالة')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff: Request Refill Popup */}
      {showRefillRequest && (
        <div className="glass-popup-backdrop fixed inset-0 z-[400] flex items-center justify-center p-4">
          <div className="glass-popup w-full max-w-xs rounded-2xl p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{background:'rgba(0,86,179,0.1)'}}>
                <span className="material-symbols-outlined text-secondary-fixed">notification_add</span>
              </div>
              <h3 className="font-bold text-on-surface">{t('Request Refill', 'طلب تعبئة')}</h3>
            </div>
            <div className="mb-4">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">{t('Select Item', 'اختر العنصر')}</label>
              {inventory.length === 0 ? (
                <p className="text-on-surface-variant text-sm text-center py-3">{t('No items in inventory.', 'لا يوجد عناصر.')}</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {inventory.map(item => (
                    <button key={item.id} onClick={() => setRefillRequestItem(item.name)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${refillRequestItem === item.name ? 'hydro-gradient text-white' : 'text-on-surface'}`}
                      style={refillRequestItem !== item.name ? {background:'var(--input-bg)', border:'1px solid var(--color-outline-variant)'} : {}}>
                      <span>{item.name}</span>
                      <span className="text-xs opacity-70">{item.quantity} {item.unit}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowRefillRequest(false); setRefillRequestItem('') }}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-on-surface-variant" style={{background:'var(--input-bg)',border:'1px solid var(--input-border)'}}>
                {t('Cancel', 'إلغاء')}
              </button>
              <button onClick={() => {
                if (!refillRequestItem) { showToast(t('Select an item', 'اختر عنصراً'), 'error'); return }
                const req = { itemName: refillRequestItem, requestedBy: staffName || 'Staff', time: new Date().toLocaleString('en-GB') }
                const updated = [...refillRequests, req]
                setRefillRequests(updated)
                localStorage.setItem('rasha_refill_requests', JSON.stringify(updated))
                showToast(t('Refill request sent!', 'تم إرسال طلب التعبئة!'))
                setShowRefillRequest(false)
                setRefillRequestItem('')
              }} disabled={!refillRequestItem}
                className="flex-1 py-3 rounded-xl text-sm font-bold hydro-gradient text-white hover:opacity-90 disabled:opacity-40">
                {t('Send Request', 'إرسال الطلب')}
              </button>
            </div>
          </div>
        </div>
      )}
      {refillTarget && (
        <div className="glass-popup-backdrop fixed inset-0 z-[400] flex items-center justify-center p-4">
          <div className="glass-popup w-full max-w-xs rounded-2xl p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{background:'rgba(0,86,179,0.1)'}}>
                <span className="material-symbols-outlined text-secondary-fixed">add_circle</span>
              </div>
              <div>
                <h3 className="font-bold text-on-surface">{t('Refill', 'تعبئة')}</h3>
                <p className="text-xs text-on-surface-variant">{refillTarget.name}</p>
              </div>
            </div>
            <div className="mb-4">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">{t('Add Quantity', 'أضف كمية')}</label>
              <input type="number" min="1" className="w-full px-3 py-3 rounded-xl text-on-surface text-sm font-bold text-center focus:outline-none"
                style={{background:'var(--input-bg)', border:'1px solid var(--color-outline-variant)', fontSize:'1.25rem'}}
                value={refillQty} onChange={e => setRefillQty(parseInt(e.target.value)||0)} />
              <p className="text-xs text-on-surface-variant mt-2 text-center">
                {t('Current:', 'الحالي:')} {refillTarget.quantity} → {refillTarget.quantity + refillQty} {refillTarget.unit}
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setRefillTarget(null)}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-on-surface-variant" style={{background:'var(--input-bg)',border:'1px solid var(--input-border)'}}>
                {t('Cancel', 'إلغاء')}
              </button>
              <button onClick={async () => {
                if (!refillQty || refillQty <= 0) return
                const res = await fetch(`${API}/api/admin/inventory/${refillTarget.id}`, { method: 'PATCH', headers: hdrs, body: JSON.stringify({ quantity: refillTarget.quantity + refillQty }) })
                if (res.ok) { showToast(t('Refilled!', 'تم التعبئة!')); setRefillTarget(null); loadInventory() }
                else showToast(t('Error', 'خطأ'), 'error')
              }} className="flex-1 py-3 rounded-xl text-sm font-bold hydro-gradient text-white hover:opacity-90">
                {t('Confirm Refill', 'تأكيد التعبئة')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Inventory Item Modal */}
      {showAddInventory && (
        <div className="glass-popup-backdrop fixed inset-0 z-[400] flex items-center justify-center p-4">
          <div className="glass-popup w-full max-w-sm rounded-2xl p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-on-surface font-display">{t('Add Inventory Item', 'إضافة عنصر')}</h3>
              <button onClick={() => { setShowAddInventory(false); setNewItem({name:'',unit:'liters',quantity:0,min_quantity:10}) }}>
                <span className="material-symbols-outlined text-on-surface-variant">close</span>
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">{t('Item Name', 'اسم العنصر')} *</label>
                <input className="w-full px-3 py-2.5 rounded-lg text-on-surface text-sm focus:outline-none"
                  style={{background:'var(--input-bg)',border:'1px solid var(--input-border)'}}
                  value={newItem.name} onChange={e => setNewItem(n => ({...n, name: e.target.value}))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">{t('Unit', 'الوحدة')}</label>
                <select className="w-full px-3 py-2.5 rounded-lg text-on-surface text-sm focus:outline-none appearance-none"
                  style={{background:'var(--input-bg)',border:'1px solid var(--input-border)'}}
                  value={newItem.unit} onChange={e => setNewItem(n => ({...n, unit: e.target.value}))}>
                  <option value="liters">{t('Liters', 'لتر')}</option>
                  <option value="ml">{t('ml', 'مل')}</option>
                  <option value="kg">{t('Kg', 'كيلو')}</option>
                  <option value="bottles">{t('Bottles', 'زجاجات')}</option>
                  <option value="rolls">{t('Rolls', 'لفات')}</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[['quantity', t('Quantity', 'الكمية')], ['min_quantity', t('Min Required', 'الحد الأدنى')]].map(([field, label]) => (
                  <div key={field}>
                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">{label}</label>
                    <input type="number" min="0" className="w-full px-3 py-2.5 rounded-lg text-on-surface text-sm focus:outline-none"
                      style={{background:'var(--input-bg)',border:'1px solid var(--input-border)'}}
                      value={newItem[field]} onChange={e => setNewItem(n => ({...n, [field]: parseInt(e.target.value)||0}))} />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setShowAddInventory(false); setNewItem({name:'',unit:'liters',quantity:0,min_quantity:10}) }}
                  className="flex-1 py-3 rounded-xl text-xs font-bold text-on-surface-variant" style={{background:'var(--input-bg)',border:'1px solid var(--input-border)'}}>
                  {t('Cancel', 'إلغاء')}
                </button>
                <button onClick={async () => {
                  if (!newItem.name.trim()) { showToast(t('Enter item name', 'أدخل اسم العنصر'), 'error'); return }
                  try {
                    const res = await fetch(`${API}/api/admin/inventory`, { method: 'POST', headers: hdrs, body: JSON.stringify(newItem) })
                    const data = await res.json()
                    if (res.ok) { showToast(t('Item added!', 'تم الإضافة!')); setShowAddInventory(false); setNewItem({name:'',unit:'liters',quantity:0,min_quantity:10}); loadInventory() }
                    else showToast(data.error || t('Error', 'خطأ'), 'error')
                  } catch { showToast(t('Error', 'خطأ'), 'error') }
                }} className="flex-1 py-3 rounded-xl text-xs font-bold hydro-gradient text-white hover:opacity-90">{t('Add Item', 'إضافة')}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Activity / Reports Tab ── */}
      {activeTab === 'activity' && isSuperAdmin && (
        <div className="space-y-6 animate-fade-in">

          {/* Filters + Download */}
          <div className="glass rounded-2xl p-4">
            <div className="flex flex-col gap-3">
              {/* Row 1: search */}
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">{t('Staff Username', 'اسم المستخدم')}</label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{background:'var(--input-bg)',border:'1px solid var(--color-outline-variant)'}}>
                  <span className="material-symbols-outlined text-on-surface-variant text-base">search</span>
                  <input className="flex-1 bg-transparent outline-none text-xs text-on-surface placeholder:text-on-surface-variant"
                    placeholder={t('Search by username…', 'بحث باسم المستخدم…')}
                    value={activitySearch}
                    onChange={e => setActivitySearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && loadActivity()} />
                </div>
              </div>
              {/* Row 2: date range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">{t('From', 'من')}</label>
                  <input type="date" className="rasha-input text-xs w-full" value={activityFrom}
                    onChange={e => setActivityFrom(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">{t('To', 'إلى')}</label>
                  <input type="date" className="rasha-input text-xs w-full" value={activityTo}
                    onChange={e => setActivityTo(e.target.value)} />
                </div>
              </div>
              {/* Row 3: action buttons */}
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => loadActivity()}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold hydro-gradient text-white hover:opacity-90 flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-base">filter_list</span>
                  {t('Apply', 'تطبيق')}
                </button>
                <button onClick={() => { setActivitySearch(''); setActivityFrom(''); setActivityTo(''); loadActivity({username:'',from:'',to:''}) }}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-on-surface-variant hover:text-on-surface"
                  style={{background:'var(--input-bg)',border:'1px solid var(--color-outline-variant)'}}>
                  {t('Clear', 'مسح')}
                </button>
                <button onClick={exportActivityPDF} disabled={activityLogs.length === 0}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-40"
                  style={{background:'#7c3aed'}}>
                  <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                  {t('PDF', 'PDF')}
                </button>
              </div>
            </div>
          </div>

          {activityLoading ? (
            <div className="flex justify-center py-16"><div className="loader" /></div>
          ) : (<>

            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass rounded-2xl p-4">
                <p className="text-xs text-on-surface-variant mb-1">{t('Total Actions', 'إجمالي الإجراءات')}</p>
                <p className="text-2xl font-extrabold text-secondary-fixed">{activityLogs.length}</p>
              </div>
              <div className="glass rounded-2xl p-4">
                <p className="text-xs text-on-surface-variant mb-1">{t('Staff Members', 'أعضاء الفريق')}</p>
                <p className="text-2xl font-extrabold text-secondary-fixed">{activitySummary.length}</p>
              </div>
              <div className="glass rounded-2xl p-4">
                <p className="text-xs text-on-surface-variant mb-1">{t('Top Action', 'أكثر إجراء')}</p>
                <p className="text-sm font-extrabold text-secondary-fixed capitalize">{activityBreakdown[0]?.action.replace(/_/g,' ') || '—'}</p>
              </div>
              <div className="glass rounded-2xl p-4">
                <p className="text-xs text-on-surface-variant mb-1">{t('Most Active', 'الأكثر نشاطاً')}</p>
                <p className="text-sm font-extrabold text-secondary-fixed">{activitySummary[0]?.display_name || activitySummary[0]?.username || '—'}</p>
              </div>
            </div>

            {/* Per-staff summary table */}
            {activitySummary.length > 0 && (
              <div className="glass rounded-2xl overflow-hidden">
                <div className="px-5 py-4" style={{borderBottom:'1px solid var(--color-outline-variant)'}}>
                  <h3 className="font-bold text-on-surface">{t('Activity by Staff Member', 'النشاط لكل موظف')}</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs" dir="ltr">
                    <thead><tr style={{background:'var(--color-surface-container)'}}>
                      <th className="text-start px-4 py-3 font-bold text-on-surface-variant">{t('Name','الاسم')}</th>
                      <th className="text-start px-4 py-3 font-bold text-on-surface-variant">{t('Username','اسم المستخدم')}</th>
                      <th className="text-start px-4 py-3 font-bold text-on-surface-variant">{t('Total Actions','الإجراءات')}</th>
                      <th className="text-start px-4 py-3 font-bold text-on-surface-variant">{t('Last Active','آخر نشاط')}</th>
                    </tr></thead>
                    <tbody>
                      {activitySummary.map((s,i) => (
                        <tr key={i} style={{borderBottom:'1px solid var(--color-outline-variant)'}}>
                          <td className="px-4 py-3 font-semibold text-on-surface">{s.display_name || s.username}</td>
                          <td className="px-4 py-3 text-on-surface-variant">{s.username}</td>
                          <td className="px-4 py-3">
                            <span className="font-bold text-secondary-fixed">{s.total}</span>
                          </td>
                          <td className="px-4 py-3 text-on-surface-variant">{s.last_active ? new Date(s.last_active).toLocaleString('en-GB') : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Action breakdown */}
            {activityBreakdown.length > 0 && (
              <div className="glass rounded-2xl p-5">
                <h3 className="font-bold text-on-surface mb-4">{t('Action Breakdown', 'تفصيل الإجراءات')}</h3>
                <div className="space-y-2">
                  {activityBreakdown.map((b,i) => {
                    const max = activityBreakdown[0].count
                    const pct = Math.round((b.count / max) * 100)
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs text-on-surface-variant w-32 capitalize shrink-0">{b.action.replace(/_/g,' ')}</span>
                        <div className="flex-1 rounded-full overflow-hidden" style={{height:'6px',background:'var(--input-bg)'}}>
                          <div style={{width:`${pct}%`,height:'100%',background:'var(--color-secondary-fixed)',borderRadius:'9999px'}} />
                        </div>
                        <span className="text-xs font-bold text-on-surface w-8 text-end">{b.count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Full log table */}
            <div className="glass rounded-2xl overflow-hidden">
              <div className="px-5 py-4 flex items-center justify-between" style={{borderBottom:'1px solid var(--color-outline-variant)'}}>
                <h3 className="font-bold text-on-surface">{t('Activity Log', 'سجل النشاط')} <span className="text-on-surface-variant font-normal text-xs">({activityLogs.length})</span></h3>
              </div>
              {activityLogs.length === 0 ? (
                <div className="p-12 text-center">
                  <span className="material-symbols-outlined text-on-surface-variant text-5xl mb-3 block">history</span>
                  <p className="text-on-surface font-semibold mb-1">
                    {activitySearch || activityFrom || activityTo
                      ? t('No activity matches your filters.', 'لا يوجد نشاط يطابق الفلاتر.')
                      : t('No activity logged yet.', 'لم يتم تسجيل أي نشاط بعد.')}
                  </p>
                  <p className="text-on-surface-variant text-xs">
                    {activitySearch || activityFrom || activityTo
                      ? t('Try clearing your filters or searching a different name.', 'جرب مسح الفلاتر أو البحث باسم آخر.')
                      : t('Activity is recorded as staff perform actions — cancel bookings, reply to messages, manage inventory, etc.', 'يتم تسجيل النشاط عندما يقوم الموظفون بإجراءات — إلغاء الحجوزات، الرد على الرسائل، إدارة المخزون، إلخ.')}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs" dir="ltr">
                    <thead><tr style={{background:'var(--color-surface-container)'}}>
                      <th className="text-start px-4 py-3 font-bold text-on-surface-variant">{t('Staff','الموظف')}</th>
                      <th className="text-start px-4 py-3 font-bold text-on-surface-variant">{t('Action','الإجراء')}</th>
                      <th className="text-start px-4 py-3 font-bold text-on-surface-variant">{t('Detail','التفاصيل')}</th>
                      <th className="text-start px-4 py-3 font-bold text-on-surface-variant">{t('Time','الوقت')}</th>
                    </tr></thead>
                    <tbody>
                      {activityLogs.map(l => (
                        <tr key={l.id} style={{borderBottom:'1px solid var(--color-outline-variant)'}}>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-on-surface">{l.display_name || l.username}</p>
                            <p className="text-on-surface-variant text-xs">{l.username}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 rounded-full text-xs font-bold capitalize"
                              style={{background:'rgba(var(--color-secondary-fixed-rgb),0.1)',color:'var(--color-secondary-fixed)'}}>
                              {l.action.replace(/_/g,' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-on-surface-variant max-w-xs" style={{wordBreak:'break-word'}}>{l.detail || '—'}</td>
                          <td className="px-4 py-3 text-on-surface-variant whitespace-nowrap">{new Date(l.created_at).toLocaleString('en-GB')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>)}
        </div>
      )}
    </div>
  )
}
