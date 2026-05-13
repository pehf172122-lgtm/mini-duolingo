import React, { createContext, useContext, useEffect, useState } from 'react'
import * as authService from '../services/auth'

type User = { username: string; email: string; user_id?: string } | null

type AuthContextType = {
  user: User
  accessToken: string | null
  loading: boolean          // ← NEW: true while the initial refresh is in-flight
  login: (emailOrUsername: string, password: string) => Promise<any>
  register: (payload: { username: string; email: string; password: string }) => Promise<any>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]               = useState<User>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [loading, setLoading]         = useState(true)  // start true until first refresh resolves

  /* ── Restore session on mount ─────────────────── */
  useEffect(() => {
    authService.refresh()
      .then(data => {
        setAccessToken(data.accessToken)
        if (data.user) setUser(data.user)
      })
      .catch(() => {
        // No valid refresh token — that's fine, user is just logged out
      })
      .finally(() => {
        setLoading(false)   // ← session restore done, no more flash
      })
  }, [])

  /* ── Periodic silent refresh (every 9 min) ────── */
  useEffect(() => {
    if (!accessToken) return
    const id = setInterval(() => {
      authService.refresh()
        .then(d => setAccessToken(d.accessToken))
        .catch(() => {
          setAccessToken(null)
          setUser(null)
        })
    }, 1000 * 60 * 9)
    return () => clearInterval(id)
  }, [accessToken])

  /* ── Auth actions ─────────────────────────────── */
  const login = async (emailOrUsername: string, password: string) => {
    const data = await authService.login(emailOrUsername, password)
    setAccessToken(data.accessToken)
    if (data.user) setUser(data.user)
    return data
  }

  const register = async (payload: { username: string; email: string; password: string }) => {
    return authService.register(payload)
  }

  const logout = async () => {
    try { await authService.logout() } catch {}
    setAccessToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

