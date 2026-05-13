import React, { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../state/auth'

export default function Login() {
  const { login } = useAuth()
  const [emailOrUsername, setEmailOrUsername] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const nav = useNavigate()
  const location = useLocation()

  // If the user was redirected here from a protected route, send them back after login
  const from = (location.state as any)?.from?.pathname || '/content'

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setMsg('')
    setSubmitting(true)
    try {
      await login(emailOrUsername, password)
      nav(from, { replace: true })
    } catch (err: any) {
      setMsg(err?.message || 'Correo/usuario o contraseña incorrectos')
    } finally {
      setSubmitting(false)
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
          <button className="auth-tab active">Iniciar sesión</button>
          <button className="auth-tab" onClick={() => nav('/register')}>Registrarse</button>
        </div>

        <form onSubmit={submit} className="auth-form-body">
          <div className="input-group">
            <span className="input-icon"></span>
            <input
              placeholder="Correo o nombre de usuario"
              value={emailOrUsername}
              onChange={e => setEmailOrUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div className="input-group">
            <span className="input-icon"></span>
            <input
              placeholder="Contraseña"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" className="primary btn-auth" disabled={submitting}>
            {submitting ? 'Entrando...' : 'Iniciar sesión'}
          </button>

          {msg && <div className="msg">{msg}</div>}

          <p className="auth-footer">
            ¿No tienes una cuenta? <Link to="/register">Regístrate</Link>
          </p>
        </form>
      </div>
    </div>
  )
}


