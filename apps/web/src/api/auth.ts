import { httpRequest } from './http'
import type { AuthLoginResponse, UserProfile } from '@/types/api'
import type { AuthCaptchaResponse } from '@/types/api'
import type { LoginInput, RegisterInput } from '@/types/auth'

export function register(payload: RegisterInput) {
  return httpRequest<AuthLoginResponse>('/auth/register', {
    method: 'POST',
    body: payload,
  })
}

export function login(payload: LoginInput) {
  return httpRequest<AuthLoginResponse>('/auth/login', {
    method: 'POST',
    body: payload,
  })
}

export function fetchLoginCaptcha() {
  return httpRequest<AuthCaptchaResponse>('/auth/captcha')
}

export function fetchAuthMe() {
  return httpRequest<UserProfile>('/auth/me')
}
