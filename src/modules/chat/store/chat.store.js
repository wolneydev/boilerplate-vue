import { chatService } from '@/modules/chat/services/chat.service'

const createId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const mapApiMessage = (message) => {
  const role = message?.role === 'user' ? 'user' : 'assistant'
  const toolCalls = Array.isArray(message?.tool_calls) ? message.tool_calls : []

  return {
    id: message?.id || createId(),
    role,
    content: String(message?.content || '').trim() || (role === 'assistant' ? '…' : ''),
    toolCalls,
    createdAt: message?.created_at || new Date().toISOString(),
  }
}

const state = () => ({
  conversationId: null,
  messages: [],
  sending: false,
  error: null,
  conversations: [],
  conversationsLoading: false,
  conversationLoading: false,
  conversationsError: null,
})

const getters = {
  conversationId: (state) => state.conversationId,
  messages: (state) => state.messages,
  isSending: (state) => state.sending,
  chatError: (state) => state.error,
  conversations: (state) => state.conversations,
  isConversationsLoading: (state) => state.conversationsLoading,
  isConversationLoading: (state) => state.conversationLoading,
  conversationsError: (state) => state.conversationsError,
}

const mutations = {
  SET_CONVERSATION_ID(state, conversationId) {
    state.conversationId = conversationId || null
  },
  SET_MESSAGES(state, messages) {
    state.messages = Array.isArray(messages) ? messages : []
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
  SET_CONVERSATIONS(state, conversations) {
    state.conversations = Array.isArray(conversations) ? conversations : []
  },
  SET_CONVERSATIONS_LOADING(state, loading) {
    state.conversationsLoading = Boolean(loading)
  },
  SET_CONVERSATION_LOADING(state, loading) {
    state.conversationLoading = Boolean(loading)
  },
  SET_CONVERSATIONS_ERROR(state, error) {
    state.conversationsError = error
  },
  CLEAR_CHAT(state) {
    state.conversationId = null
    state.messages = []
    state.error = null
    state.sending = false
    state.conversationLoading = false
  },
}

const actions = {
  resetChat({ commit }) {
    commit('CLEAR_CHAT')
  },

  async fetchConversations({ commit }) {
    commit('SET_CONVERSATIONS_LOADING', true)
    commit('SET_CONVERSATIONS_ERROR', null)

    try {
      const { items } = await chatService.listConversations()
      commit('SET_CONVERSATIONS', items)
      return items
    } catch (err) {
      const message = err?.message || 'Could not load conversation history.'
      commit('SET_CONVERSATIONS_ERROR', message)
      throw err
    } finally {
      commit('SET_CONVERSATIONS_LOADING', false)
    }
  },

  async selectConversation({ commit, state }, conversationId) {
    const id = String(conversationId || '').trim()
    if (!id || state.sending || state.conversationLoading) return null
    if (state.conversationId === id && state.messages.length > 0) return null

    commit('SET_CONVERSATION_LOADING', true)
    commit('SET_ERROR', null)

    try {
      const conversation = await chatService.getConversation(id)
      const messages = Array.isArray(conversation?.messages)
        ? conversation.messages
            .filter((message) => message?.role === 'user' || message?.role === 'assistant')
            .map(mapApiMessage)
            .filter((message) => message.content || message.toolCalls.length)
        : []

      commit('SET_CONVERSATION_ID', conversation?.id || id)
      commit('SET_MESSAGES', messages)
      return conversation
    } catch (err) {
      const message = err?.message || 'Could not open this conversation.'
      commit('SET_ERROR', message)
      throw err
    } finally {
      commit('SET_CONVERSATION_LOADING', false)
    }
  },

  async sendMessage({ commit, state, dispatch }, text) {
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

      // Keep the history sidebar in sync with the latest conversation title/order.
      dispatch('fetchConversations').catch(() => {})

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
