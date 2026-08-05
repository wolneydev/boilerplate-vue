import httpClient from '@/core/http/httpClient'

const unwrap = (data) => data?.data ?? data

// Chat transport against the Laravel agent that drives Hospitable MCP tools.
//   POST /api/chat  -> { conversation_id, message, tool_calls[] }
export const chatService = {
  async sendMessage({ message, conversationId = null }) {
    const { data } = await httpClient.post(
      '/chat',
      {
        message,
        conversation_id: conversationId || null,
      },
      { timeout: 130000 },
    )
    return unwrap(data)
  },
}
