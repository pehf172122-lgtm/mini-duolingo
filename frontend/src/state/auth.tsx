import React, { createContext, useContext, useEffect, useState } from 'react'
import * as authService from '../services/auth'

type User = { username: string; email: string } | null

const AuthContext = createContext<any>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)

  useEffect(() => {
    // try to refresh on load
    let mounted = true
    authService.refresh().then(data => {
      if (!mounted) return
      setAccessToken(data.accessToken)
      if (data.user) setUser(data.user)
    }).catch(() => {})
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (!accessToken) return
    // set up automatic refresh before expiry if you have exp in token
    const id = setInterval(() => {
      authService.refresh().then(d => setAccessToken(d.accessToken)).catch(() => { setAccessToken(null); setUser(null) })
    }, 1000 * 60 * 9) // every 9 minutes
    return () => clearInterval(id)
  }, [accessToken])

  const login = async (emailOrUsername: string, password: string) => {
    const data = await authService.login(emailOrUsername, password)
    setAccessToken(data.accessToken)
    if (data.user) setUser(data.user)
    return data
  }

  const register = async (payload: { username: string, email: string, password: string }) => {
    return authService.register(payload)
  }

  const logout = async () => {
    try { await authService.logout() } catch (e) {}
    setAccessToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, accessToken, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
