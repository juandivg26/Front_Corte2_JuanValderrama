const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'

// Llama al back. Si hay token lo manda como Bearer; si el back responde error, lanza su "message" con el status.
export async function api(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  let res
  try {
    res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined })
  } catch {
    throw Object.assign(new Error('No hay conexión con el servidor. Revisa que la API esté encendida.'), { status: 0 })
  }
  const text = await res.text()
  let data = null
  try { data = text ? JSON.parse(text) : null } catch { data = null }
  if (!res.ok) {
    const porDefecto = res.status === 403 ? 'Tu rol no tiene permiso para esta acción.' : 'Algo salió mal. Intenta de nuevo.'
    throw Object.assign(new Error(data?.message || porDefecto), { status: res.status })
  }
  return data
}
