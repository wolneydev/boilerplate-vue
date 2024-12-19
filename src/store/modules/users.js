// src/store/modules/users.js

const state = () => ({
    users: [],
    loading: false,
    error: null,
    totalCount: 0,
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    search: '' // Novo estado para o termo de busca
  })
  
  const getters = {
    allUsers: (state) => state.users,
    isLoading: (state) => state.loading,
    userError: (state) => state.error,
    totalUsers: (state) => state.totalCount,
    currentPage: (state) => state.currentPage,
    lastPage: (state) => state.lastPage,
    perPage: (state) => state.perPage,
    searchTerm: (state) => state.search // Getter para o termo de busca
  }
  
  const mutations = {
    SET_USERS(state, users) {
      state.users = users
    },
    SET_LOADING(state, loading) {
      state.loading = loading
    },
    SET_ERROR(state, error) {
      state.error = error
    },
    SET_PAGINATION(state, { totalCount, currentPage, lastPage }) {
      state.totalCount = totalCount
      state.currentPage = currentPage
      state.lastPage = lastPage
    },
    REMOVE_USER(state, userId) {
      state.users = state.users.filter(user => user.id !== userId)
      state.totalCount -= 1
    },
    SET_PER_PAGE(state, perPage) {
      state.perPage = perPage
    },
    SET_SEARCH(state, search) { // Mutation para atualizar o termo de busca
      state.search = search
    }
  }
  
  const actions = {
    async fetchUsers({ commit, state, rootGetters }, page = 1) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      try {
        const token = rootGetters['user/getToken']
        const response = await fetch(`https://api.match.local/v1/users?page=${page}&per_page=${state.perPage}&search=${encodeURIComponent(state.search)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })
  
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Erro ao buscar usuários.')
        }
  
        const data = await response.json()
        commit('SET_USERS', data.data.items)
        commit('SET_PAGINATION', {
          totalCount: data.data.totalCount,
          currentPage: data.data.currentPage,
          lastPage: data.data.lastPage
        })
  
      } catch (err) {
        console.error(err)
        commit('SET_ERROR', err.message || 'Erro desconhecido.')
      } finally {
        commit('SET_LOADING', false)
      }
    },
  
    async deleteUser({ commit, rootGetters }, userId) {
      try {
        const token = rootGetters['user/getToken']
        const response = await fetch(`https://api.match.local/v1/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })
  
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Erro ao deletar usuário.')
        }
  
        commit('REMOVE_USER', userId)
  
      } catch (err) {
        console.error(err)
        throw err
      }
    },
  
    updateSearch({ commit, dispatch }, searchTerm) { // Action para atualizar o termo de busca
      commit('SET_SEARCH', searchTerm)
      dispatch('fetchUsers', 1) // Recarrega os usuários a partir da primeira página com o novo termo de busca
    }
  }
  
  export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions
  }
  