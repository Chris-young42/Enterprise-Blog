import { apiBaseUrl } from '@/lib/env'
import { tokenStorage } from '@/lib/storage'
import type { ApiResponse } from '@/types/api'

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  formData?: FormData
  headers?: Record<string, string>
}

export class HttpError extends Error {
  readonly code: number
  readonly status: number

  constructor(message: string, code: number, status: number) {
    super(message)
    this.name = 'HttpError'
    this.code = code
    this.status = status
  }
}

export async function httpRequest<T>(path: string, options: RequestOptions = {}) {
  const token = tokenStorage.get()
  const isFormData = options.formData instanceof FormData

  const requestInit: RequestInit = {
    method: options.method ?? 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers ?? {}),
    },
  }
  if (isFormData) {
    requestInit.body = options.formData ?? null
  } else if (options.body !== undefined) {
    requestInit.body = JSON.stringify(options.body)
  }

  const response = await fetch(`${apiBaseUrl}${path}`, requestInit)

  let json: ApiResponse<T>
  try {
    json = (await response.json()) as ApiResponse<T>
  } catch {
    throw new HttpError('Invalid JSON response', response.status, response.status)
  }

  if (!response.ok || !json.success) {
    const message = json.success ? 'Request failed' : json.message
    const code = json.success ? response.status : json.code
    throw new HttpError(message, code, response.status)
  }

  return json.data
}
