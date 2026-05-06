const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'

async function handleResp(res: Response) {
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body?.message || 'Request failed')
  return body.data
}

export async function evaluateAudio(token: string, payload: { word: string; expectedText: string; audio: File }) {
  const form = new FormData()
  form.append('word', payload.word)
  form.append('expectedText', payload.expectedText)
  form.append('audio', payload.audio)

  const res = await fetch(`${API}/pronunciation/evaluate-audio`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: form
  })

  return handleResp(res)
}
