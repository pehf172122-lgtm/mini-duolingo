const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'

/* ── 401 redirect handler ────────────────────────── */
let _onUnauthorized: (() => void) | null = null

export function setUnauthorizedHandler(fn: () => void) {
  _onUnauthorized = fn
}

/* ── Base fetch wrapper ──────────────────────────── */
async function handleResp(res: Response) {
  if (res.status === 401) {
    // Token expired or invalid — trigger global logout + redirect
    _onUnauthorized?.()
    throw new Error('Sesión expirada. Por favor inicia sesión de nuevo.')
  }
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body?.message || 'Error en la solicitud')
  return body.data
}

/* ── Auth endpoints ──────────────────────────────── */
export async function register(payload: { username: string; email: string; password: string }) {
  const res = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include',
  })
  return handleResp(res)
}

export async function login(emailOrUsername: string, password: string) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ emailOrUsername, password }),
  })
  return handleResp(res)
}

export async function refresh() {
  const res = await fetch(`${API}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
  // Don't use handleResp here — a 401 on refresh just means logged out, not an error
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body?.message || 'Session expired')
  return body.data
}

export async function logout() {
  const res = await fetch(`${API}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  })
  return res.json().catch(() => ({}))
}

export async function getProfile(token: string) {
  const res = await fetch(`${API}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'include',
  })
  return handleResp(res)
}