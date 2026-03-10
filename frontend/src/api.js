const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

const buildUrl = (path) => `${API_BASE_URL}${path}`

export async function apiRequest(path, options = {}) {
  const response = await fetch(buildUrl(path), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  })

  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    const errorMessage =
      typeof data === 'object' && data?.message
        ? data.message
        : `Request failed with status ${response.status}`
    throw new Error(errorMessage)
  }

  return data
}
