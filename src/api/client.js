const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

export async function api(path, options = {}) {
  const token = localStorage.getItem('tvb_token')

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  })

  const contentType = response.headers.get('content-type')
  const isJson = contentType?.includes('application/json')

  const data = isJson
    ? await response.json()
    : null

  if (!response.ok) {
    throw new Error(
      data?.message || 'Something went wrong'
    )
  }

  return data
}