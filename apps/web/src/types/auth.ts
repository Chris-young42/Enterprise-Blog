export type LoginInput = {
  username: string
  password: string
  captchaToken: string
  captchaAnswer: string
}

export type RegisterInput = {
  username: string
  email: string
  password: string
  nickname?: string
}
