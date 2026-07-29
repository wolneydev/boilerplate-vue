import { projectsService } from '@/modules/planning/services/projects.service'

const state = () => ({
  projects: [],
  current: null,
  loading: false,
  saving: false,
  error: null,
})

const getters = {
  allProjects: (state) => state.projects,
  currentProject: (state) => state.current,
  isLoading: (state) => state.loading,
  isSaving: (state) => state.saving,
  projectError: (state) => state.error,
  // Quick id -> name lookup used to label calendar events / task rows.
  projectNames: (state) =>
    state.projects.reduce((acc, project) => {
      acc[project.id] = project.name
      return acc
    }, {}),
  projectById: (state) => (id) =>
    state.projects.find((project) => project.id === Number(id)) ?? null,
}

const mutations = {
  SET_PROJECTS(state, projects) {
    state.projects = projects
  },
  SET_CURRENT(state, project) {
    state.current = project
  },
  UPSERT_PROJECT(state, project) {
    const index = state.projects.findIndex((p) => p.id === project.id)
    if (index === -1) state.projects.push(project)
    else state.projects.splice(index, 1, project)
  },
  REMOVE_PROJECT(state, id) {
    state.projects = state.projects.filter((p) => p.id !== id)
  },
  SET_LOADING(state, loading) {
    state.loading = loading
  },
  SET_SAVING(state, saving) {
    state.saving = saving
  },
  SET_ERROR(state, error) {
    state.error = error
  },
}

const actions = {
  async fetchProjects({ commit }) {
    commit('SET_LOADING', true)
    commit('SET_ERROR', null)
    try {
      // listAll walks every API page — list() alone drops projects beyond page 1.
      const projects = await projectsService.listAll()
      commit('SET_PROJECTS', projects)
    } catch (err) {
      commit('SET_ERROR', err.message || 'Error loading projects.')
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async fetchProject({ commit }, id) {
    commit('SET_LOADING', true)
    commit('SET_ERROR', null)
    try {
      const project = await projectsService.get(id)
      commit('SET_CURRENT', project)
      commit('UPSERT_PROJECT', project)
      return project
    } catch (err) {
      commit('SET_ERROR', err.message || 'Error loading the project.')
      throw err
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async createProject({ commit }, payload) {
    commit('SET_SAVING', true)
    try {
      const project = await projectsService.create(payload)
      commit('UPSERT_PROJECT', project)
      return project
    } finally {
      commit('SET_SAVING', false)
    }
  },

  async updateProject({ commit }, { id, payload }) {
    commit('SET_SAVING', true)
    try {
      const project = await projectsService.update(id, payload)
      commit('UPSERT_PROJECT', project)
      commit('SET_CURRENT', project)
      return project
    } finally {
      commit('SET_SAVING', false)
    }
  },

  async deleteProject({ commit }, id) {
    await projectsService.remove(id)
    commit('REMOVE_PROJECT', id)
  },
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
}
