import React, { useEffect, useState } from 'react'
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import Content from './pages/Content'
import LessonExercises from './pages/LessonExercises'
import PrivateRoute from './components/PrivateRoute'
import { ToastProvider, useToast } from './components/Toast'
import { AuthProvider, useAuth } from './state/auth'
import { setUnauthorizedHandler } from './services/auth'
import * as gamificationApi from './services/gamification'
import * as apiAuth from './services/auth'

/* ─── Sidebar nav item ───────────────────────────── */
function NavItem({ to, icon, label, active }: {
  to: string; icon: string; label: string; active: boolean
}) {
  return (
    <Link to={to} className={`sidebar-nav-item ${active ? 'active' : ''}`}>
      <span className="sidebar-nav-icon">{icon}</span>
      <span className="sidebar-nav-label">{label}</span>
    </Link>
  )
}

/* ─── Left Sidebar ───────────────────────────────── */
function Sidebar() {
  const { user } = useAuth()
  const nav = useNavigate()
  const { pathname: p } = useLocation()

  return (
    <aside className="sidebar">
      <Link to="/content" className="sidebar-logo">
        <img src="/Imagen2.png" alt="logo" />
        <span>duolingo</span>
      </Link>
      <nav className="sidebar-nav">
        <NavItem to="/content" icon="🏠" label="APRENDER" active={p === '/content' || p === '/'} />
        <NavItem to="/profile" icon="👤" label="PERFIL"   active={p === '/profile'} />
      </nav>
      <div className="sidebar-user">
        <div className="sidebar-avatar-initials">
          {(user?.username ?? 'A').slice(0, 2).toUpperCase()}
        </div>
        <div className="sidebar-user-info">
          <span className="sidebar-user-name">Hola, {user?.username ?? 'Aprendiz'}</span>
          <button className="sidebar-profile-link" onClick={() => nav('/profile')}>
            Ver perfil
          </button>
        </div>
      </div>
    </aside>
  )
}

/* ─── Mobile bottom nav ──────────────────────────── */
function BottomNav() {
  const { pathname: p } = useLocation()
  return (
    <nav className="bottom-nav">
      <Link to="/content" className={`bottom-nav-item ${p === '/content' || p === '/' ? 'active' : ''}`}>
        <span>🏠</span><span>Aprender</span>
      </Link>
      <Link to="/profile" className={`bottom-nav-item ${p === '/profile' ? 'active' : ''}`}>
        <span>👤</span><span>Perfil</span>
      </Link>
    </nav>
  )
}

/* ─── Top bar (logged-out) ───────────────────────── */
function TopBar() {
  const { pathname: p } = useLocation()
  return (
    <header className="duo-header">
      <Link to="/" className="brand">
        <img src="/Imagen2.png" alt="logo" className="logo" />
        <h1>Mini Duolingo</h1>
      </Link>
      <nav>
        <Link to="/">🏠 Home</Link>
        {p !== '/login'    && <Link to="/login">🔑 Login</Link>}
        {p !== '/register' && <Link to="/register" className="nav-register">➕ Register</Link>}
      </nav>
    </header>
  )
}

/* ─── Right Panel with real data ─────────────────── */
function RightPanel() {
  const { accessToken } = useAuth()
  const [xp, setXp]       = useState(0)
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    if (!accessToken) return
    apiAuth.getProfile(accessToken)
      .then(data => {
        const uid = data?.user?.user_id
        if (!uid) return
        Promise.all([
          gamificationApi.getXp(accessToken, uid),
          gamificationApi.getStreak(accessToken, uid),
        ]).then(([xpRes, streakRes]) => {
          setXp(xpRes?.totalPoints || 0)
          setStreak(streakRes?.currentStreak || 0)
        }).catch(() => {})
      }).catch(() => {})
  }, [accessToken])

  return (
    <aside className="right-panel">
      <div className="rp-stats">
        <div className="rp-stat"><span>🇺🇸</span></div>
        <div className="rp-stat"><span>🔥</span><b>{streak}</b></div>
        <div className="rp-stat"><span>⚡</span><b>{xp}</b></div>
        <div className="rp-stat"><span>❤️</span><b>5</b></div>
      </div>

      <div className="rp-card">
        <h4>¡Compite en las Ligas!</h4>
        <div className="rp-liga">
          <span className="rp-liga-icon">🛡️</span>
          <p>Completa 1 lección más para empezar a competir</p>
        </div>
      </div>

      <div className="rp-card">
        <div className="rp-card-header">
          <h4>Desafíos del día</h4>
          <span className="rp-link">VER TODOS</span>
        </div>
        <div className="rp-challenge">
          <span className="rp-challenge-icon">⚡</span>
          <div className="rp-challenge-info">
            <p>Gana 10 EXP</p>
            <div className="rp-bar">
              <div className="rp-bar-fill" style={{ width: `${Math.min((xp / 10) * 100, 100)}%` }} />
            </div>
            <small>{Math.min(xp, 10)} / 10</small>
          </div>
          <span className="rp-challenge-reward">🎒</span>
        </div>
      </div>

      <div className="rp-card rp-cta">
        <p>¡Invita a tus amigos a aprender!</p>
        <Link to="/profile" className="btn-cta-green">VER PERFIL</Link>
      </div>
    </aside>
  )
}

/* ─── Loading screen ─────────────────────────────── */
function LoadingScreen() {
  return (
    <div className="auth-loading">
      <div className="auth-loading-owl">🦉</div>
      <div className="auth-loading-dots">
        <span /><span /><span />
      </div>
    </div>
  )
}

/* ─── 401 interceptor wiring ─────────────────────── */
function UnauthorizedWatcher() {
  const { logout } = useAuth()
  const nav = useNavigate()
  const toast = useToast()

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout()
      toast.error('Tu sesión expiró. Por favor inicia sesión de nuevo.')
      nav('/login', { replace: true })
    })
  }, [])

  return null
}

/* ─── Main shell ─────────────────────────────────── */
function Shell() {
  const { accessToken, loading } = useAuth()
  const { pathname } = useLocation()

  if (loading) return <LoadingScreen />

  const isLesson  = pathname.startsWith('/lesson/')
  const isProfile = pathname === '/profile'

  if (accessToken) {
    return (
      <div className="app-shell">
        <UnauthorizedWatcher />
        {!isLesson && <Sidebar />}
        <main className={`app-main ${isLesson ? 'app-main--lesson' : ''}`}>
          <Routes>
            <Route path="/"         element={<Navigate to="/content" replace />} />
            <Route path="/login"    element={<Navigate to="/content" replace />} />
            <Route path="/register" element={<Navigate to="/content" replace />} />
            <Route path="/content"  element={<PrivateRoute><Content /></PrivateRoute>} />
            <Route path="/profile"  element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/lesson/:lessonId" element={<PrivateRoute><LessonExercises /></PrivateRoute>} />
            <Route path="*"         element={<Navigate to="/content" replace />} />
          </Routes>
        </main>
        {!isLesson && !isProfile && <RightPanel />}
        {!isLesson && <BottomNav />}
      </div>
    )
  }

  return (
    <div className="app-topbar-layout">
      <TopBar />
      <main>
        <Routes>
          <Route path="/"         element={<Home />} />
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*"         element={<Navigate to="/login" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Shell />
      </ToastProvider>
    </AuthProvider>
  )
}