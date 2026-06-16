import { authService } from '@/modules/auth/services/auth.service'

// Security model:
// - The access token (JWT) is held ONLY in memory (Vuex state) for the current
//   session. It is never written to localStorage/sessionStorage, so it cannot be
//   exfiltrated from persistent storage via XSS and disappears when the tab closes.
// - For persistence across reloads, the Laravel backend sets the token in an
//   HTTP-only, Secure cookie that JavaScript cannot read. Requests are sent with
//   `withCredentials: true`, so the cookie authenticates them automatically.
// - Because of that, `isLoggedIn` is derived from the loaded user (which is
//   available both right after login and after a cookie-based session restore),
//   not from the in-memory token.
const state = () => ({
  accessToken: null,
  user: null,
  // True until the initial cookie-based session restore completes on app boot.
  initializing: true,
})

const getters = {
  isLoggedIn: (state) => !!state.user,
  accessToken: (state) => state.accessToken,
  currentUser: (state) => state.user,
  isInitializing: (state) => state.initializing,
}

const mutations = {
  SET_ACCESS_TOKEN(state, token) {
    state.accessToken = token
  },
  SET_USER(state, user) {
    state.user = user
  },
  SET_INITIALIZING(state, value) {
    state.initializing = value
  },
  CLEAR_AUTH(state) {
    state.accessToken = null
    state.user = null
  },
}

const actions = {
  async login({ commit }, credentials) {
    const data = await authService.login(credentials)
    commit('SET_ACCESS_TOKEN', data.access_token ?? null)
    commit('SET_USER', data.user ?? null)
    return data
  },

  // Registers the user, then logs in to obtain the token / HTTP-only cookie,
  // so the user lands authenticated regardless of what the register endpoint
  // returns.
  async register({ dispatch }, payload) {
    await authService.register(payload)
    return dispatch('login', {
      email: payload.email,
      password: payload.password,
    })
  },

  // Attempt a silent session restore on app boot using the HTTP-only cookie.
  async initialize({ commit }) {
    commit('SET_INITIALIZING', true)
    try {
      const user = await authService.me()
      commit('SET_USER', user)
    } catch {
      // No valid session — stay logged out. This is expected for guests.
      commit('CLEAR_AUTH')
    } finally {
      commit('SET_INITIALIZING', false)
    }
  },

  // User-initiated logout: tell the server to invalidate the cookie, then clear.
  async logout({ commit }) {
    try {
      await authService.logout()
    } finally {
      commit('CLEAR_AUTH')
    }
  },

  // Forced logout triggered when a request returns 401 (session expired).
  forceLogout({ commit }) {
    commit('CLEAR_AUTH')
  },
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
}
