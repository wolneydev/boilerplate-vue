import { chatService } from '@/modules/chat/services/chat.service'

const createId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const state = () => ({
  conversationId: null,
  messages: [],
  sending: false,
  error: null,
})

const getters = {
  conversationId: (state) => state.conversationId,
  messages: (state) => state.messages,
  isSending: (state) => state.sending,
  chatError: (state) => state.error,
}

const mutations = {
  SET_CONVERSATION_ID(state, conversationId) {
    state.conversationId = conversationId || null
  },
  ADD_MESSAGE(state, message) {
    state.messages.push(message)
  },
  SET_SENDING(state, sending) {
    state.sending = sending
  },
  SET_ERROR(state, error) {
    state.error = error
  },
  CLEAR_CHAT(state) {
    state.conversationId = null
    state.messages = []
    state.error = null
    state.sending = false
  },
}

const actions = {
  resetChat({ commit }) {
    commit('CLEAR_CHAT')
  },

  async sendMessage({ commit, state }, text) {
    const content = String(text || '').trim()
    if (!content || state.sending) return null

    commit('SET_ERROR', null)
    commit('ADD_MESSAGE', {
      id: createId(),
      role: 'user',
      content,
      toolCalls: [],
      createdAt: new Date().toISOString(),
    })
    commit('SET_SENDING', true)

    try {
      const reply = await chatService.sendMessage({
        message: content,
        conversationId: state.conversationId,
      })

      if (reply?.conversation_id) {
        commit('SET_CONVERSATION_ID', reply.conversation_id)
      }

      commit('ADD_MESSAGE', {
        id: createId(),
        role: 'assistant',
        content: reply?.message || 'No response from the assistant.',
        toolCalls: Array.isArray(reply?.tool_calls) ? reply.tool_calls : [],
        createdAt: new Date().toISOString(),
      })

      return reply
    } catch (err) {
      const message = err?.message || 'Could not reach the assistant.'
      commit('SET_ERROR', message)
      commit('ADD_MESSAGE', {
        id: createId(),
        role: 'assistant',
        content: `Sorry — ${message}`,
        toolCalls: [],
        createdAt: new Date().toISOString(),
        isError: true,
      })
      throw err
    } finally {
      commit('SET_SENDING', false)
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
