import { fundsService } from '@/modules/planning/services/funds.service'

const setKey = (target, key, value) => ({ ...target, [String(key)]: value })

const state = () => ({
  itemsByProject: {},
  loadingByProject: {},
  errorByProject: {},
  saving: null,
})

const getters = {
  forProject: (state) => (projectId) => state.itemsByProject[String(projectId)] ?? [],
  isLoading: (state) => (projectId) => !!state.loadingByProject[String(projectId)],
  error: (state) => (projectId) => state.errorByProject[String(projectId)] ?? null,
  isEmpty: (_state, getters) => (projectId) =>
    !getters.isLoading(projectId) &&
    !getters.error(projectId) &&
    getters.forProject(projectId).length === 0,
  isSaving: (state) => !!state.saving,
  savingFundId: (state) => state.saving?.fundId ?? null,
  byId: (_state, getters) => (projectId, fundId) =>
    getters
      .forProject(projectId)
      .find((fund) => String(fund.id) === String(fundId)) ?? null,
}

const mutations = {
  SET_ITEMS(state, { projectId, items }) {
    state.itemsByProject = setKey(state.itemsByProject, projectId, items)
  },
  SET_LOADING(state, { projectId, loading }) {
    state.loadingByProject = setKey(state.loadingByProject, projectId, loading)
  },
  SET_ERROR(state, { projectId, error }) {
    state.errorByProject = setKey(state.errorByProject, projectId, error)
  },
  SET_SAVING(state, saving) {
    state.saving = saving
  },
}

const actions = {
  async fetchFunds({ commit }, projectId) {
    commit('SET_LOADING', { projectId, loading: true })
    commit('SET_ERROR', { projectId, error: null })
    try {
      const items = await fundsService.list(projectId)
      commit('SET_ITEMS', { projectId, items })
      return items
    } catch (error) {
      commit('SET_ITEMS', { projectId, items: [] })
      commit('SET_ERROR', {
        projectId,
        error: error.message || 'Error loading project funds.',
      })
      throw error
    } finally {
      commit('SET_LOADING', { projectId, loading: false })
    }
  },

  async createFund({ commit, dispatch, state }, { projectId, payload }) {
    if (state.saving) return null
    commit('SET_SAVING', { projectId, fundId: null })
    try {
      const fund = await fundsService.create(projectId, payload)
      await dispatch('fetchFunds', projectId)
      return fund
    } finally {
      commit('SET_SAVING', null)
    }
  },

  async updateFund({ commit, dispatch, state }, { projectId, fundId, payload }) {
    if (state.saving) return null
    commit('SET_SAVING', { projectId, fundId })
    try {
      const fund = await fundsService.update(projectId, fundId, payload)
      await dispatch('fetchFunds', projectId)
      return fund
    } finally {
      commit('SET_SAVING', null)
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
