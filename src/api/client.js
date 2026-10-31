const API_URL = (
  import.meta.env.VITE_API_URL ||
  'https://thulirkumver-backend.onrender.com/api'
).replace(/\/+$/, '')

let redirectingToAdminLogin = false

const AUTH_ENDPOINTS = new Set([
  '/auth/login',
  '/auth/register',
  '/auth/admin/login',
  '/auth/otp/config',
  '/auth/otp/send',
  '/auth/otp/verify',
])

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
  sessionStorage.removeItem('tvb_token')
  sessionStorage.removeItem('tvb_user')

  const reason =
    status === 401
      ? 'session-expired'
      : 'admin-access'

  window.location.assign(
    `/admin/login?reason=${reason}`
  )
}

function handleCustomerAuthorizationFailure(path, status) {
  if (
    AUTH_ENDPOINTS.has(path) ||
    isAdminApiPath(path) ||
    status !== 401
  ) {
    return
  }

  localStorage.removeItem('tvb_token')
  localStorage.removeItem('tvb_user')
  sessionStorage.removeItem('tvb_token')
  sessionStorage.removeItem('tvb_user')

  window.dispatchEvent(
    new Event('tvb:session-expired')
  )
}

export async function api(path, options = {}) {
  const token =
    localStorage.getItem('tvb_token') ||
    sessionStorage.getItem('tvb_token')

  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  if (token) {
    headers.Authorization =
      `Bearer ${token}`
  }

  const url = `${API_URL}${path}`

  let response

  try {
    response = await fetch(url, {
      ...options,
      headers,
    })
  } catch (error) {
    throw new ApiError(
      `Unable to connect to the bookstore backend.\n\nRequest: ${url}`,
      0,
      {
        cause: error?.message || 'Network error',
        url,
      }
    )
  }

  const contentType =
    response.headers.get('content-type') || ''

  const isJson =
    contentType.includes('application/json')

  let data = null

  if (isJson) {
    try {
      data = await response.json()
    } catch {
      data = null
    }
  } else {
    const text = await response.text()

    data = text
      ? { message: text }
      : null
  }

  if (!response.ok) {
    const message =
      data?.message ||
      (
        response.status === 401
          ? 'Your session is invalid or expired. Please sign in again.'
          : response.status === 403
            ? 'You do not have permission to perform this action.'
            : `Request failed with status ${response.status}`
      )

    if (
      response.status === 401 ||
      response.status === 403
    ) {
      handleAdminAuthorizationFailure(
        path,
        response.status
      )

      handleCustomerAuthorizationFailure(
        path,
        response.status
      )
    }

    throw new ApiError(
      message,
      response.status,
      data
    )
  }

  return data
}