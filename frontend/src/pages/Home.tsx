import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../state/auth'

export default function Home() {
  const navigate = useNavigate()
  const { accessToken } = useAuth()

  const handleGetStarted = () => {
    if (accessToken) {
      navigate('/content') // Redirige a la página de contenido si el usuario está autenticado
    } else {
      navigate('/register') // Redirige a la página de registro si no está autenticado
    }
  }

  return (
    <div className="welcome-screen">
      <h1>Welcome to Your Language Journey!</h1>
      <p>Start learning and have fun while improving your skills.</p>
      <button className="primary" onClick={handleGetStarted}>Get Started</button>
    </div>
  )
}