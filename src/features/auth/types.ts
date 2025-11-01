export type AuthData = {
  id: string
  role: 'admin' | undefined
  email?: string
}

export type JWTPayload = {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image: string
  createdAt: string
  updatedAt: string
  role: string
  banned: boolean
  banReason: string | null
  banExpires: string | null
  iat: string
  iss: string
  aud: string
  exp: string
  sub: string
}
