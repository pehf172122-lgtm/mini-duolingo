import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../state/auth'

/**
 * Wraps a route so only authenticated users can access it.
 * - While the session is being restored (loading), shows a full-screen spinner.
 * - If there is no token after loading, redirects to /login and remembers
 *   where the user was trying to go (via `state.from`) so we can send
 *   them back after a successful login.
 */
export default function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { accessToken, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-owl">🦉</div>
        <div className="auth-loading-dots">
          <span /><span /><span />
        </div>
      </div>
    )
  }

  if (!accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
