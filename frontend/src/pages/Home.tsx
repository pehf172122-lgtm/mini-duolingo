import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../state/auth'

export default function Home() {
  const navigate = useNavigate()
  const { accessToken } = useAuth()

  const handleGetStarted = () => {
    navigate(accessToken ? '/content' : '/register')
  }

  return (
    <div className="welcome-screen">
      <div className="welcome-owl">🦉</div>
      <h1>¡Aprende un idioma gratis!</h1>
      <p>Lecciones cortas, divertidas y efectivas. Empieza en menos de un minuto.</p>
      <button className="primary" onClick={handleGetStarted}>Comenzar ahora</button>
      {!accessToken && (
        <p className="welcome-login-hint">
          ¿Ya tienes cuenta?{' '}
          <span className="welcome-login-link" onClick={() => navigate('/login')}>
            Inicia sesión
          </span>
        </p>
      )}
    </div>
  )
}