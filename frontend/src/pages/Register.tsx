import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../state/auth'

export default function Register() {
  const { register } = useAuth()
  const [username, setUsername] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg]           = useState('')
  const nav = useNavigate()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg('')
    try {
      await register({ username, email, password })
      nav('/login')
    } catch (err: any) {
      setMsg(err?.message || 'Error al registrarse')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-page-heading">
        <h2>Mini <span>Duolingo</span></h2>
        <p>Aprende idiomas de forma divertida y efectiva</p>
      </div>

      <div className="auth-card">
        <div className="auth-tabs">
          <button className="auth-tab" onClick={() => nav('/login')}>Iniciar sesión</button>
          <button className="auth-tab active">Registrarse</button>
        </div>

        <form onSubmit={submit} className="auth-form-body">
          <div className="input-group">
            <span className="input-icon"></span>
            <input
              placeholder="Nombre de usuario"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="input-row">
            <div className="input-group">
              <span className="input-icon"></span>
              <input
                placeholder="Correo electrónico"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="input-group">
              <span className="input-icon"></span>
              <input
                placeholder="Contraseña"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
          </div>

          <button type="submit" className="primary btn-auth">Registrarse</button>
          {msg && <div className="msg">{msg}</div>}

          <p className="auth-footer">
            ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión</Link>
          </p>
        </form>
      </div>
    </div>
  )
}