import { costsService } from '@/modules/planning/services/costs.service'

const state = () => ({
  itemsByProject: {},
  loadingByProject: {},
  errorByProject: {},
  registering: false,
})

const getters = {
  costsByProject: (state) => (projectId) => state.itemsByProject[projectId] ?? [],
  isLoading: (state) => (projectId) => Boolean(state.loadingByProject[projectId]),
  costError: (state) => (projectId) => state.errorByProject[projectId] ?? null,
  isEmpty: (state) => (projectId) =>
    !state.loadingByProject[projectId] &&
    !state.errorByProject[projectId] &&
    (state.itemsByProject[projectId]?.length ?? 0) === 0,
  isRegistering: (state) => state.registering,
}

const mutations = {
  SET_COSTS(state, { projectId, costs }) {
    state.itemsByProject[projectId] = Array.isArray(costs) ? costs : []
  },
  SET_LOADING(state, { projectId, loading }) {
    state.loadingByProject[projectId] = loading
  },
  SET_ERROR(state, { projectId, error }) {
    state.errorByProject[projectId] = error
  },
  SET_REGISTERING(state, registering) {
    state.registering = registering
  },
}

const actions = {
  async fetchCosts({ commit }, projectId) {
    commit('SET_LOADING', { projectId, loading: true })
    commit('SET_ERROR', { projectId, error: null })
    try {
      const costs = await costsService.list(projectId)
      commit('SET_COSTS', { projectId, costs })
      return costs
    } catch (error) {
      commit('SET_ERROR', {
        projectId,
        error: error.message || 'Unable to load cost history.',
      })
      return undefined
    } finally {
      commit('SET_LOADING', { projectId, loading: false })
    }
  },

  async registerCost({ state, commit, dispatch }, { projectId, cost }) {
    if (state.registering) return null

    commit('SET_REGISTERING', true)
    try {
      const registeredCost = await costsService.register(projectId, cost)
      // Cost history is server-authoritative. This intentionally has no funds dispatch:
      // project costs are independent records and never mutate fund balances.
      await dispatch('fetchCosts', projectId)
      return registeredCost
    } finally {
      commit('SET_REGISTERING', false)
    }
  },
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
}
