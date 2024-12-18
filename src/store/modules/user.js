const state = () => ({
  token: null,
  user: null
})

const getters = {
  isLoggedIn: (state) => !!state.token
}

const mutations = {
  SET_USER(state, payload) {
    state.user = payload
  },
  SET_TOKEN(state, token) {
    state.token = token
  },
  LOGOUT(state) {
    state.user = null
    state.token = null
  }
}

const actions = {
  async login({ commit }, credentials) {
    try {
      const response = await fetch('https://api.match.local/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password
        })
      })
      
      if (!response.ok) {
        throw new Error('Falha no login. Verifique suas credenciais.')
      }

      const data = await response.json()
      const userData = data.data
      commit('SET_TOKEN', userData.access_token)
      commit('SET_USER', userData)
      return userData

    } catch (error) {
      console.error(error)
      throw error
    }
  },

  async register({ commit }, payload) {
    try {
      const response = await fetch('https://api.match.local/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: payload.name,
          email: payload.email,
          password: payload.password
        })
      })

      if (!response.ok) {
        // Caso a API retorne código de erro
        const errorData = await response.json()
        const errorMessage = errorData.message || 'Falha no registro.'
        throw new Error(errorMessage)
      }

      const data = await response.json()
      const userData = data.data
      commit('SET_TOKEN', userData.access_token)
      commit('SET_USER', userData)
      return userData

    } catch (error) {
      console.error(error)
      throw error
    }
  },

  logout({ commit }) {
    commit('LOGOUT')
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
