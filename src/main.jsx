import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

const savedTheme = localStorage.getItem('rasha_theme') || 'light'
const isLight = savedTheme === 'light'
document.documentElement.classList.add(isLight ? 'light' : 'dark')
document.documentElement.style.backgroundColor = isLight ? '#eef2ff' : '#080c14'
document.body.style.backgroundColor = isLight ? '#eef2ff' : '#080c14'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
