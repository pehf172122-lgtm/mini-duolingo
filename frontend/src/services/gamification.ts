const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'

async function handleResp(res: Response) {
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body?.message || 'Request failed')
  return body.data
}

export async function getXp(token: string, userId: string) {
  const res = await fetch(`${API}/gamification/xp/${userId}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return handleResp(res)
}

export async function getStreak(token: string, userId: string) {
  const res = await fetch(`${API}/gamification/streak/${userId}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return handleResp(res)
}

export async function getAchievements(token: string, userId: string) {
  const res = await fetch(`${API}/gamification/achievement/${userId}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return handleResp(res)
}