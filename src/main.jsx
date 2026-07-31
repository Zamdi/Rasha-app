import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Apply saved theme before render to avoid flash
// Respect the device's theme when the customer hasn't chosen one manually.
const savedTheme = localStorage.getItem('rasha_theme')
  || (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
const isDark = savedTheme === 'dark'
if (isDark) document.documentElement.classList.add('dark')
document.documentElement.style.backgroundColor = isDark ? '#0a1628' : '#a8d8ea'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
