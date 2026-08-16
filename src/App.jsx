import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import Navbar from './components/Navbar'
import MobileNav from './components/MobileNav'
import Toast from './components/Toast'
import ScrollToTop from './components/ScrollToTop'
import Home from './pages/Home'
import Booking from './pages/Booking'
import Confirmation from './pages/Confirmation'
import Register from './pages/Register'
import Login from './pages/Login'
import Loyalty from './pages/Loyalty'
import Contact from './pages/Contact'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Settings from './pages/Settings'
import Wallet from './pages/Wallet'
import NotFound from './pages/NotFound'

function AppShell() {
  const { theme, customer } = useApp()
  return (
    <div style={{
      minHeight: '100vh',
      background: theme === 'light' ? 'transparent' : 'transparent',
      color: theme === 'light' ? '#1a1a18' : '#e0e3e5',
      transition: 'background 0.3s, color 0.3s',
    }}>
      <BrowserRouter>
        <ScrollToTop />
        <Navbar />
        <Toast />
        <Routes>
          <Route path="/" element={customer ? <Navigate to="/loyalty" replace /> : <Home />} />
          <Route path="/book" element={<Booking />} />
          <Route path="/confirmation" element={<Confirmation />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/loyalty" element={<Loyalty />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <MobileNav />
      </BrowserRouter>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  )
}
