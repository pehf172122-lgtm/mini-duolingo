import React, { useState } from 'react'
import { login } from '../services/auth'

export default function Login({ onLogin }: { onLogin: (token: string) => void }) {
  const [emailOrUsername, setEmailOrUsername] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg('')
    try {
      const data = await login(emailOrUsername, password)
      onLogin(data.accessToken)
      setMsg('Logged in')
    } catch (err: any) {
      setMsg(err?.message || 'Error')
    }
  }

  return (
    <form onSubmit={submit} className="card">
      <h2>Login</h2>
      <input placeholder="email or username" value={emailOrUsername} onChange={e => setEmailOrUsername(e.target.value)} />
      <input placeholder="password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <button type="submit">Login</button>
      <div className="msg">{msg}</div>
    </form>
  )
}
