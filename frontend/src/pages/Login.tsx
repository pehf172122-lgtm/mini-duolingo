import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../state/auth'

export default function Login() {
  const { login } = useAuth()
  const [emailOrUsername, setEmailOrUsername] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const nav = useNavigate()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg('')
    try {
      await login(emailOrUsername, password)
      nav('/profile')
    } catch (err: any) {
      setMsg(err?.message || 'Error')
    }
  }

  return (
    <form onSubmit={submit} className="card auth-card">
      <h2>Login</h2>
      <input placeholder="email or username" value={emailOrUsername} onChange={e => setEmailOrUsername(e.target.value)} />
      <input placeholder="password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <button type="submit" className="primary">Login</button>
      <div className="msg">{msg}</div>
    </form>
  )
}
