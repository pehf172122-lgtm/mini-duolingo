import React, { useState } from 'react'
import { register } from '../services/auth'

export default function Register() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg('')
    try {
      await register({ username, email, password })
      setMsg('Registered — you can now login')
    } catch (err: any) {
      setMsg(err?.message || 'Error')
    }
  }

  return (
    <form onSubmit={submit} className="card">
      <h2>Register</h2>
      <input placeholder="username" value={username} onChange={e => setUsername(e.target.value)} />
      <input placeholder="email" value={email} onChange={e => setEmail(e.target.value)} />
      <input placeholder="password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <button type="submit">Register</button>
      <div className="msg">{msg}</div>
    </form>
  )
}
