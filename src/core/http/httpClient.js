import axios from 'axios'
import { env } from '@/core/config/env'
import { normalizeHttpError } from '@/core/http/httpError'

// The Vuex store is injected at app bootstrap (see main.js) to keep this
// module decoupled and avoid circular imports between the store and services.
let store = null

export const registerStore = (injectedStore) => {
  store = injectedStore
}

const getAccessToken = () => store?.getters?.['auth/accessToken'] ?? null

// Endpoints where a 401 is an expected outcome (e.g. wrong credentials) and
// must NOT trigger a forced logout, which would be meaningless there.
const AUTH_BYPASS_PATHS = ['/login', '/logout']

const isAuthBypass = (url = '') => AUTH_BYPASS_PATHS.some((path) => url.includes(path))

const httpClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: env.apiTimeout,
  // Required so the browser sends/receives the HTTP-only auth cookie set by
  // the Laravel backend (see the backend snippet shared in the chat).
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    // Skips the ngrok-free.dev HTML interstitial so API calls return JSON.
    'ngrok-skip-browser-warning': 'true',
  },
})

// --- Request interceptor ---
// Attach the in-memory access token as a Bearer header when available (it is
// captured from the login response during the current session). When the page
// is reloaded the token is gone from memory, but the HTTP-only cookie sent via
// `withCredentials` keeps the request authenticated.
httpClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// --- Response interceptor: normalize errors + clear a dead session. ---
httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const status = error.response?.status

    // A 401 on a protected endpoint means the session is no longer valid:
    // drop the in-memory auth state so the UI reflects a logged-out user.
    if (status === 401 && originalRequest && !isAuthBypass(originalRequest.url) && store) {
      await store.dispatch('auth/forceLogout')
    }

    return Promise.reject(normalizeHttpError(error))
  },
)

export default httpClient
