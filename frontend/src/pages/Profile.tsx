import React, { useEffect, useState } from 'react'
import { useAuth } from '../state/auth'
import * as api from '../services/auth'
import * as gamificationApi from '../services/gamification'

export default function Profile() {
  const { accessToken, logout } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [msg, setMsg] = useState('')
  const [xp, setXp] = useState<number>(0)
  const [streak, setStreak] = useState<number>(0)
  const [achievements, setAchievements] = useState<any[]>([])

  useEffect(() => {
    if (!accessToken) return
    api.getProfile(accessToken).then(setProfile).catch(() => setMsg('Failed to load profile'))
  }, [accessToken])

  useEffect(() => {
    if (!accessToken || !profile?.user?.user_id) return

    const load = async () => {
      try {
        const xpRes = await gamificationApi.getXp(accessToken, profile.user.user_id)
        const streakRes = await gamificationApi.getStreak(accessToken, profile.user.user_id)
        const achRes = await gamificationApi.getAchievements(accessToken, profile.user.user_id)

        setXp(xpRes.totalPoints || 0)
        setStreak(streakRes.currentStreak || 0)
        setAchievements(achRes || [])
      } catch {
        setMsg('Failed to load gamification data')
      }
    }

    load()
  }, [accessToken, profile?.user?.user_id])

  if (!accessToken) return <div className="card">Please login to view profile.</div>

  return (
    <div className="card profile-card">
      <h2>Your Profile</h2>
      {profile ? (
        <div>
          <div><strong>Username:</strong> {profile.user?.username}</div>
          <div><strong>Email:</strong> {profile.user?.email}</div>

          <div className="profile-stats">
            <div><strong>XP:</strong> {xp}</div>
            <div><strong>Streak:</strong> {streak} days</div>
          </div>

          <div className="profile-achievements">
            <strong>Achievements:</strong>
            {achievements.length === 0 ? (
              <div>No achievements yet.</div>
            ) : (
              <div className="profile-achievements-list">
                {achievements.map(a => (
                  <div key={a.id} className="profile-achievement-item">
                    {a.achievementType}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : <div>Loading...</div>}
      <button onClick={async () => { await logout() }} className="secondary">Logout</button>
      <div className="msg">{msg}</div>
    </div>
  )
}