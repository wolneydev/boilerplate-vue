import { tasksService } from '@/modules/planning/services/tasks.service'
import { taskToCalendarEvent } from '@/modules/planning/types/planning.types'

const state = () => ({
  tasks: [],
  current: null,
  loading: false,
  currentLoading: false,
  saving: false,
  error: null,
  currentError: null,
  // The currently visible calendar window; refetched whenever it changes.
  range: { start: '', end: '' },
  filters: { projectId: '', status: '', priority: '' },
})

const getters = {
  allTasks: (state) => state.tasks,
  currentTask: (state) => state.current,
  taskById: (state) => (id) =>
    (String(state.current?.id) === String(id) ? state.current : null) ??
    state.tasks.find((task) => String(task.id) === String(id)) ??
    null,
  isLoading: (state) => state.loading,
  isCurrentLoading: (state) => state.currentLoading,
  isSaving: (state) => state.saving,
  taskError: (state) => state.error,
  currentTaskError: (state) => state.currentError,
  filters: (state) => state.filters,
  range: (state) => state.range,
  // Map API tasks into FullCalendar events, labelling them with project names
  // resolved from the projects module (single source of truth).
  calendarEvents: (state, _getters, _rootState, rootGetters) => {
    const projectNames = rootGetters['projects/projectNames'] ?? {}
    return state.tasks.map((task) => taskToCalendarEvent(task, projectNames))
  },
}

const mutations = {
  SET_TASKS(state, tasks) {
    state.tasks = tasks
  },
  SET_CURRENT(state, task) {
    state.current = task
  },
  UPSERT_TASK(state, task) {
    const index = state.tasks.findIndex((t) => t.id === task.id)
    if (index === -1) state.tasks.push(task)
    else state.tasks.splice(index, 1, task)
  },
  REMOVE_TASK(state, id) {
    state.tasks = state.tasks.filter((t) => t.id !== id)
  },
  SET_LOADING(state, loading) {
    state.loading = loading
  },
  SET_CURRENT_LOADING(state, loading) {
    state.currentLoading = loading
  },
  SET_SAVING(state, saving) {
    state.saving = saving
  },
  SET_ERROR(state, error) {
    state.error = error
  },
  SET_CURRENT_ERROR(state, error) {
    state.currentError = error
  },
  SET_RANGE(state, range) {
    state.range = range
  },
  SET_FILTERS(state, filters) {
    state.filters = { ...state.filters, ...filters }
  },
}

const actions = {
  async fetchTask({ commit }, id) {
    commit('SET_CURRENT_LOADING', true)
    commit('SET_CURRENT_ERROR', null)
    try {
      const task = await tasksService.get(id)
      commit('SET_CURRENT', task)
      commit('UPSERT_TASK', task)
      return task
    } catch (error) {
      commit('SET_CURRENT_ERROR', error.message || 'Error loading the task.')
      throw error
    } finally {
      commit('SET_CURRENT_LOADING', false)
    }
  },

  // Re-reads tasks for the active range + filters. Called after every mutation
  // so the calendar / lists stay in sync automatically.
  async fetchTasks({ commit, state }) {
    if (!state.range.start || !state.range.end) return
    commit('SET_LOADING', true)
    commit('SET_ERROR', null)
    try {
      // listAll walks every API page — list() alone drops tasks beyond page 1.
      const items = await tasksService.listAll({
        start: state.range.start,
        end: state.range.end,
        projectId: state.filters.projectId,
        status: state.filters.status,
        priority: state.filters.priority,
      })
      commit('SET_TASKS', items)
    } catch (err) {
      commit('SET_ERROR', err.message || 'Error loading tasks.')
    } finally {
      commit('SET_LOADING', false)
    }
  },

  setRange({ commit, dispatch }, range) {
    commit('SET_RANGE', range)
    return dispatch('fetchTasks')
  },

  applyFilters({ commit, dispatch }, filters) {
    commit('SET_FILTERS', filters)
    return dispatch('fetchTasks')
  },

  async createTask({ commit, dispatch }, payload) {
    commit('SET_SAVING', true)
    try {
      await tasksService.create(payload)
      await dispatch('fetchTasks')
    } finally {
      commit('SET_SAVING', false)
    }
  },

  async updateTask({ commit, dispatch }, { id, payload }) {
    commit('SET_SAVING', true)
    try {
      await tasksService.update(id, payload)
      await dispatch('fetchTasks')
    } finally {
      commit('SET_SAVING', false)
    }
  },

  async deleteTask({ commit }, id) {
    await tasksService.remove(id)
    commit('REMOVE_TASK', id)
  },
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
}
