import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../state/auth'
import * as api from '../services/auth'
import * as gamificationApi from '../services/gamification'

export default function Profile() {
  const { accessToken, logout, user: authUser } = useAuth()
  const nav = useNavigate()
  const [profile, setProfile]           = useState<any>(null)
  const [xp, setXp]                     = useState<number>(0)
  const [streak, setStreak]             = useState<number>(0)
  const [achievements, setAchievements] = useState<any[]>([])
  const [loading, setLoading]           = useState(true)
  const [msg, setMsg]                   = useState('')

  useEffect(() => {
    if (!accessToken) return
    api.getProfile(accessToken)
      .then(setProfile)
      .catch(() => setMsg('Error al cargar el perfil'))
      .finally(() => setLoading(false))
  }, [accessToken])

  useEffect(() => {
    if (!accessToken || !profile?.user?.user_id) return
    const uid = profile.user.user_id
    Promise.all([
      gamificationApi.getXp(accessToken, uid),
      gamificationApi.getStreak(accessToken, uid),
      gamificationApi.getAchievements(accessToken, uid)
    ]).then(([xpRes, streakRes, achRes]) => {
      setXp(xpRes?.totalPoints || 0)
      setStreak(streakRes?.currentStreak || 0)
      setAchievements(achRes || [])
    }).catch(() => setMsg('Error al cargar estadísticas'))
  }, [accessToken, profile?.user?.user_id])

  const handleLogout = async () => {
    await logout()
    nav('/login')
  }

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="auth-loading-owl">🦉</div>
        <p>Cargando perfil...</p>
      </div>
    )
  }

  const username = profile?.user?.username ?? authUser?.username ?? 'Aprendiz'
  const email    = profile?.user?.email    ?? authUser?.email    ?? '—'
  const initials = username.slice(0, 2).toUpperCase()

  return (
    <div className="profile-page">

      {/* Header card */}
      <div className="profile-header-card">
        <div className="profile-avatar">{initials}</div>
        <div className="profile-header-info">
          <h2 className="profile-username">{username}</h2>
          <p className="profile-email">{email}</p>
        </div>
        <button className="profile-logout-btn" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </div>

      {/* Stats grid */}
      <div className="profile-stats-grid">
        <div className="profile-stat-card">
          <span className="profile-stat-icon">⚡</span>
          <span className="profile-stat-value">{xp}</span>
          <span className="profile-stat-label">XP Total</span>
        </div>
        <div className="profile-stat-card">
          <span className="profile-stat-icon">🔥</span>
          <span className="profile-stat-value">{streak}</span>
          <span className="profile-stat-label">Racha (días)</span>
        </div>
        <div className="profile-stat-card">
          <span className="profile-stat-icon">🏆</span>
          <span className="profile-stat-value">{achievements.length}</span>
          <span className="profile-stat-label">Logros</span>
        </div>
      </div>

      {/* Achievements */}
      <div className="profile-section">
        <h3 className="profile-section-title">Logros</h3>
        {achievements.length === 0 ? (
          <div className="profile-empty">
            <span style={{ fontSize: '2rem' }}>🎯</span>
            <p>Completa lecciones para desbloquear logros.</p>
          </div>
        ) : (
          <div className="profile-achievements-grid">
            {achievements.map(a => (
              <div key={a.id} className="profile-achievement-chip">
                <span className="achievement-emoji">🏅</span>
                <span className="achievement-name">{a.name ?? a.type}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {msg && <p className="lesson-msg">{msg}</p>}
    </div>
  )
}