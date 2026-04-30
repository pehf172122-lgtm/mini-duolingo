import React, { useEffect, useState } from 'react'
import { getProfile, logout } from '../services/auth'

export default function Profile({ token, onLogout }: { token: string | null, onLogout: () => void }) {
  const [profile, setProfile] = useState<any>(null)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (!token) return
    getProfile(token).then(setProfile).catch(() => setMsg('Failed to load profile'))
  }, [token])

  if (!token) return <div className="card">Please login to view profile.</div>

  return (
    <div className="card">
      <h2>Profile</h2>
      {profile ? (
        <div>
          <div><strong>Username:</strong> {profile.username}</div>
          <div><strong>Email:</strong> {profile.email}</div>
        </div>
      ) : <div>Loading...</div>}
      <button onClick={async () => { await logout(); onLogout(); }}>Logout</button>
      <div className="msg">{msg}</div>
    </div>
  )
}
