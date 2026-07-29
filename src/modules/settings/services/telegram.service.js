import httpClient from '@/core/http/httpClient'

const unwrap = (data) => data?.data ?? data

// Thin transport layer for the authenticated user's Telegram settings.
// Telegram message delivery is owned entirely by the Laravel backend; the
// frontend only reads/persists the chat id and the enabled flag, and asks the
// backend to send a test message. The bot token is never handled here.
//   GET  /api/me/telegram        -> { telegram_chat_id, telegram_notifications_enabled }
//   PUT  /api/me/telegram        -> persists the settings
//   POST /api/me/telegram/test   -> backend sends a test notification
export const telegramService = {
  async getTelegramSettings() {
    const { data } = await httpClient.get('/me/telegram')
    return unwrap(data)
  },

  async updateTelegramSettings(payload) {
    const { data } = await httpClient.put('/me/telegram', {
      telegram_chat_id: payload.telegram_chat_id ?? null,
      telegram_notifications_enabled: !!payload.telegram_notifications_enabled,
    })
    return unwrap(data)
  },

  async testTelegramNotification(payload = {}) {
    const { data } = await httpClient.post('/me/telegram/test', {
      telegram_chat_id: payload.telegram_chat_id ?? null,
      telegram_notifications_enabled: !!payload.telegram_notifications_enabled,
    })
    return unwrap(data)
  },
}
