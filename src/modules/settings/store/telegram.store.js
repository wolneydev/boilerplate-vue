import { telegramService } from '@/modules/settings/services/telegram.service'

const state = () => ({
  settings: {
    telegram_chat_id: null,
    telegram_notifications_enabled: false,
  },
  loading: false,
  saving: false,
  testing: false,
  error: null,
})

const getters = {
  telegramSettings: (state) => state.settings,
  isLoading: (state) => state.loading,
  isSaving: (state) => state.saving,
  isTesting: (state) => state.testing,
  telegramError: (state) => state.error,
}

const mutations = {
  SET_SETTINGS(state, settings) {
    state.settings = {
      telegram_chat_id: settings?.telegram_chat_id ?? null,
      telegram_notifications_enabled: !!settings?.telegram_notifications_enabled,
    }
  },
  SET_LOADING(state, loading) {
    state.loading = loading
  },
  SET_SAVING(state, saving) {
    state.saving = saving
  },
  SET_TESTING(state, testing) {
    state.testing = testing
  },
  SET_ERROR(state, error) {
    state.error = error
  },
}

const actions = {
  async fetchSettings({ commit }) {
    commit('SET_LOADING', true)
    commit('SET_ERROR', null)
    try {
      const settings = await telegramService.getTelegramSettings()
      commit('SET_SETTINGS', settings)
    } catch (err) {
      commit('SET_ERROR', err.message || 'Error loading Telegram settings.')
    } finally {
      commit('SET_LOADING', false)
    }
  },

  // Persists the settings and re-commits the server's response so the store
  // always mirrors the backend. Errors (incl. validation) bubble up so the
  // page can surface field-level messages.
  async saveSettings({ commit }, payload) {
    commit('SET_SAVING', true)
    try {
      const settings = await telegramService.updateTelegramSettings(payload)
      commit('SET_SETTINGS', settings ?? payload)
    } finally {
      commit('SET_SAVING', false)
    }
  },

  async sendTestNotification({ commit }, payload = {}) {
    commit('SET_TESTING', true)
    try {
      return await telegramService.testTelegramNotification(payload)
    } finally {
      commit('SET_TESTING', false)
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
