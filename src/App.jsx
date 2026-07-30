import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { StaffProvider, useStaff } from './context/StaffContext'
import Toast from './components/Toast'
import ScrollToTop from './components/ScrollToTop'
import StaffLogin from './pages/StaffLogin'
import StaffDashboard from './pages/StaffDashboard'

function ProtectedRoute({ children }) {
  const { staffToken } = useStaff()
  return staffToken ? children : <Navigate to="/" replace />
}

function AppShell() {
  const { theme } = useStaff()
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: theme === 'light' ? '#eef2ff' : '#080c14',
      color: theme === 'light' ? '#1a1a18' : '#e0e3e5',
      transition: 'background-color 0.3s, color 0.3s',
    }}>
      <ScrollToTop />
      <Toast />
      <Routes>
        <Route path="/" element={<StaffLogin />} />
        <Route path="/dashboard" element={
          <ProtectedRoute><StaffDashboard /></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <StaffProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </StaffProvider>
  )
}
