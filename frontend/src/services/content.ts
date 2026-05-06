const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'

async function handleResp(res: Response) {
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body?.message || 'Request failed')
  return body.data
}

export async function getUnits(token: string) {
  const res = await fetch(`${API}/content/units`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  })
  return handleResp(res)
}

export async function getUnitsWithProgress(token: string) {
  const res = await fetch(`${API}/content/units-with-progress`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  })
  return handleResp(res)
}

export async function getLessonsByUnitWithLock(token: string, unitId: string) {
  const res = await fetch(`${API}/content/units/${unitId}/lessons/locked`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  })
  return handleResp(res)
}

export async function getExercisesByLesson(token: string, lessonId: string) {
  const res = await fetch(`${API}/content/lessons/${lessonId}/exercises`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  })
  return handleResp(res)
}

export async function validateExercise(token: string, exerciseId: string, answer: string) {
  const res = await fetch(`${API}/content/exercises/${exerciseId}/validate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ answer })
  })
  return handleResp(res)
}

export async function getLessonLives(token: string, lessonId: string) {
  const res = await fetch(`${API}/content/lessons/${lessonId}/lives`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  });
  return handleResp(res);
}