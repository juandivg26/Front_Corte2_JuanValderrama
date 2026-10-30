const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'

// Llama al back. Si hay token lo manda como Bearer; si el back responde error, lanza su "message".
export async function api(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined })
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) throw new Error(`${res.status} · ${data?.message || data?.error || 'Error'}`)
  return data
}
