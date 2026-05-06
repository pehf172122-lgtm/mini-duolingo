const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'

async function handleResp(res: Response) {
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body?.message || 'Request failed')
  return body.data
}

export async function register(payload: { username: string, email: string, password: string }) {
  const res = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include'
  })
  return handleResp(res)
}

export async function login(emailOrUsername: string, password: string) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ emailOrUsername, password })
  })
  return handleResp(res)
}

export async function refresh() {
  const res = await fetch(`${API}/auth/refresh`, {
    method: 'POST',
    credentials: 'include'
  })
  return handleResp(res)
}

export async function logout() {
  const res = await fetch(`${API}/auth/logout`, {
    method: 'POST',
    credentials: 'include'
  })
  return handleResp(res)
}

export async function getProfile(token: string) {
  const res = await fetch(`${API}/users/me`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
    credentials: 'include'
  })
  return handleResp(res)
}
