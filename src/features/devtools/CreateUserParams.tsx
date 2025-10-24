export type CreateUserParams = {
  name: string
  email: string
  password: string
  role: 'user' | 'admin'
}
