import React from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import Home from './pages/Home';
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import { AuthProvider, useAuth } from './state/auth'
import Content from './pages/Content'
import LessonExercises from './pages/LessonExercises'

function Header() {
  const { user, accessToken, logout } = useAuth()
  const nav = useNavigate()
  return (
    <header className="duo-header">
      <div className="brand">
        <img src="/Imagen2.png" alt="logo" className="logo" />
        <h1>Mini Duolingo</h1>
      </div>
      <nav>
        <Link to="/">Home</Link>
        {!accessToken && <Link to="/login">Login</Link>}
        {!accessToken && <Link to="/register">Register</Link>}
        {accessToken && <Link to="/profile">Profile</Link>}
        {accessToken && <Link to="/content">Content</Link>}
        {accessToken && <button onClick={() => { logout(); nav('/login') }}>Logout</button>}
      </nav>
    </header>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <div className="container">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/content" element={<Content />} />
            <Route path="/lesson/:lessonId" element={<LessonExercises />} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  )
}