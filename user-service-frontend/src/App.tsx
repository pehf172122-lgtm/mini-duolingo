import React, { useState } from 'react'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'

export default function App() {
  const [view, setView] = useState<'login'|'register'|'profile'>('login')
  const [token, setToken] = useState<string | null>(null)

  return (
    <div className="container">
      <header>
        <img src="/Imagen2.png" alt="logo" className="logo" />
        <h1>User Service</h1>
      </header>

      <nav>
        <button onClick={() => setView('login')}>Login</button>
        <button onClick={() => setView('register')}>Register</button>
        <button onClick={() => setView('profile')}>Profile</button>
      </nav>

      <main>
        {view === 'login' && <Login onLogin={(t) => setToken(t)} />}
        {view === 'register' && <Register />}
        {view === 'profile' && <Profile token={token} onLogout={() => setToken(null)} />}
      </main>
    </div>
  )
}
