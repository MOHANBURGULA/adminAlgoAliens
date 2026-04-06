export type CreateUserInput = {
  email: string
  name: string
  password: string
  role: string
}

export type GoogleLoginPayload = {
  email?: string
  name?: string
}

export type UpdateUserPayload = {
  name?: string
  password?: string
}

export type UserProfilePayload = {
  skillLevel: string
  interests: string[]
  goal: string
}
