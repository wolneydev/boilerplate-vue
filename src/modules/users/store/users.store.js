import { usersService } from '@/modules/users/services/users.service'

const state = () => ({
  users: [],
  loading: false,
  error: null,
  totalCount: 0,
  currentPage: 1,
  lastPage: 1,
  perPage: 10,
  search: '',
})

const getters = {
  allUsers: (state) => state.users,
  isLoading: (state) => state.loading,
  userError: (state) => state.error,
  totalUsers: (state) => state.totalCount,
  currentPage: (state) => state.currentPage,
  lastPage: (state) => state.lastPage,
  perPage: (state) => state.perPage,
  searchTerm: (state) => state.search,
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
    state.users = state.users.filter((user) => user.id !== userId)
    state.totalCount -= 1
  },
  SET_PER_PAGE(state, perPage) {
    state.perPage = perPage
  },
  SET_SEARCH(state, search) {
    state.search = search
  },
}

const actions = {
  async fetchUsers({ commit, state }, page = 1) {
    commit('SET_LOADING', true)
    commit('SET_ERROR', null)
    try {
      const data = await usersService.list({
        page,
        perPage: state.perPage,
        search: state.search,
      })
      commit('SET_USERS', data.items)
      commit('SET_PAGINATION', {
        totalCount: data.totalCount,
        currentPage: data.currentPage,
        lastPage: data.lastPage,
      })
    } catch (err) {
      commit('SET_ERROR', err.message || 'Error fetching users.')
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async deleteUser({ commit }, userId) {
    await usersService.remove(userId)
    commit('REMOVE_USER', userId)
  },

  updateSearch({ commit, dispatch }, searchTerm) {
    commit('SET_SEARCH', searchTerm)
    dispatch('fetchUsers', 1)
  },
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
}
