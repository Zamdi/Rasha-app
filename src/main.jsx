import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { hideSplash } from './utils/splash'

// Pre-paint ground, before React or the theme effect runs. These literals must
// stay equal to --color-background in index.css for each theme — a mismatch
// shows as a band of the wrong colour under short pages.
const savedTheme = localStorage.getItem('rasha_theme') || 'light'
const isLight = savedTheme === 'light'
const PAGE_BG = isLight ? '#f8fffe' : '#070d1a'
document.documentElement.classList.add(isLight ? 'light' : 'dark')
document.documentElement.style.backgroundColor = PAGE_BG
document.body.style.backgroundColor = PAGE_BG

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// Safety net only. The splash is normally taken down by App's mount effect
// (see hideSplash in utils/splash.js), which fires on React's commit. This
// timer covers the case where the bundle loads but React never mounts at all —
// without it a hard failure would leave the splash covering a dead page.
setTimeout(hideSplash, 8000)
