import { allocationsService } from '@/modules/planning/services/allocations.service'
import {
  INSUFFICIENT_FUNDS,
  isInsufficientFundsError,
} from '@/modules/planning/types/finances.types'

const setKey = (target, key, value) => ({ ...target, [String(key)]: value })

const state = () => ({
  itemsByTask: {},
  loadingByTask: {},
  errorByTask: {},
  allocating: false,
  allocationErrorCode: null,
})

const getters = {
  forTask: (state) => (taskId) => state.itemsByTask[String(taskId)] ?? [],
  isLoading: (state) => (taskId) => !!state.loadingByTask[String(taskId)],
  error: (state) => (taskId) => state.errorByTask[String(taskId)] ?? null,
  isEmpty: (_state, getters) => (taskId) =>
    !getters.isLoading(taskId) && getters.forTask(taskId).length === 0,
  isAllocating: (state) => state.allocating,
  allocationErrorCode: (state) => state.allocationErrorCode,
}

const mutations = {
  SET_ITEMS(state, { taskId, items }) {
    state.itemsByTask = setKey(state.itemsByTask, taskId, items)
  },
  ADD_ITEM(state, { taskId, item }) {
    const current = state.itemsByTask[String(taskId)] ?? []
    const withoutDuplicate = current.filter(
      (allocation) => String(allocation.id) !== String(item.id),
    )
    state.itemsByTask = setKey(
      state.itemsByTask,
      taskId,
      [item, ...withoutDuplicate].sort(
        (left, right) =>
          (Date.parse(right.recorded_at) || 0) - (Date.parse(left.recorded_at) || 0),
      ),
    )
  },
  SET_LOADING(state, { taskId, loading }) {
    state.loadingByTask = setKey(state.loadingByTask, taskId, loading)
  },
  SET_ERROR(state, { taskId, error }) {
    state.errorByTask = setKey(state.errorByTask, taskId, error)
  },
  SET_ALLOCATING(state, allocating) {
    state.allocating = allocating
  },
  SET_ALLOCATION_ERROR_CODE(state, code) {
    state.allocationErrorCode = code
  },
}

const actions = {
  async allocate({ commit, dispatch, state }, { projectId, taskId, payload }) {
    if (state.allocating) return null

    commit('SET_ALLOCATING', true)
    commit('SET_ALLOCATION_ERROR_CODE', null)
    try {
      const allocation = await allocationsService.create(taskId, payload)
      if (allocation) commit('ADD_ITEM', { taskId, item: allocation })
      const [fundRefresh] = await Promise.allSettled([
        dispatch('funds/fetchFunds', projectId, { root: true }),
      ])
      return {
        allocation,
        refreshWarning: fundRefresh.status === 'rejected'
          ? 'Allocation succeeded, but current fund balances could not be reloaded.'
          : null,
      }
    } catch (error) {
      if (isInsufficientFundsError(error)) {
        commit('SET_ALLOCATION_ERROR_CODE', INSUFFICIENT_FUNDS)
        const [fundRefresh] = await Promise.allSettled([
          dispatch('funds/fetchFunds', projectId, { root: true }),
        ])
        if (fundRefresh.status === 'rejected') {
          error.balanceRefreshFailed = true
        }
      }
      throw error
    } finally {
      commit('SET_ALLOCATING', false)
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
