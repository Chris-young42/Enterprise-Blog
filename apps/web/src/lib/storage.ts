const tokenKey = 'enterprise_blog_access_token'

export const tokenStorage = {
  get() {
    return window.localStorage.getItem(tokenKey)
  },
  set(token: string) {
    window.localStorage.setItem(tokenKey, token)
  },
  clear() {
    window.localStorage.removeItem(tokenKey)
  },
}
