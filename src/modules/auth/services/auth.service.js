import httpClient from '@/core/http/httpClient'

// Thin transport layer for the auth domain, mapped to the Laravel API:
//   POST /api/login   -> { token_type, access_token, user }
//   POST /api/users   -> creates a user (registration)
//   GET  /api/user    -> the currently authenticated user (via cookie/Bearer)
//   POST /api/logout  -> invalidates the session / clears the auth cookie
export const authService = {
  async login(credentials) {
    const { data } = await httpClient.post('/login', {
      email: credentials.email,
      password: credentials.password,
    })
    return data
  },

  async register(payload) {
    const { data } = await httpClient.post('/users', {
      name: payload.name,
      email: payload.email,
      password: payload.password,
      password_confirmation: payload.password_confirmation,
    })
    // Laravel resource controllers may wrap the model in `{ data: ... }`.
    return data?.data ?? data
  },

  // Restores the session on boot using the HTTP-only auth cookie (sent
  // automatically via `withCredentials`). No token is read from JS storage.
  async me() {
    const { data } = await httpClient.get('/user')
    return data?.user ?? data?.data ?? data
  },

  // Invalidates the session server-side and clears the HTTP-only cookie.
  async logout() {
    await httpClient.post('/logout')
  },
}
