const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

let redirectingToAdminLogin = false

export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

function isAdminApiPath(path) {
  return typeof path === 'string' && path.startsWith('/admin/')
}

function handleAdminAuthorizationFailure(path, status) {
  if (!isAdminApiPath(path) || redirectingToAdminLogin) {
    return
  }

  redirectingToAdminLogin = true

  localStorage.removeItem('tvb_token')
  localStorage.removeItem('tvb_user')

  const reason = status === 401
    ? 'session-expired'
    : 'admin-access'

  window.location.assign(`/admin/login?reason=${reason}`)
}

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

  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')

  let data = null

  if (isJson) {
    try {
      data = await response.json()
    } catch {
      data = null
    }
  } else {
    const text = await response.text()
    data = text ? { message: text } : null
  }

  if (!response.ok) {
    const message = data?.message || (
      response.status === 401
        ? 'Your session is invalid or expired. Please sign in again.'
        : response.status === 403
          ? 'Admin access is required for this action. Please sign in again with an administrator account.'
          : 'Something went wrong'
    )

    if (response.status === 401 || response.status === 403) {
      handleAdminAuthorizationFailure(path, response.status)
    }

    throw new ApiError(message, response.status, data)
  }

  return data
}
