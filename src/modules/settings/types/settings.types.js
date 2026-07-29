// Domain types and validation helpers for the account settings module.
// Plain JS project, so "types" are JSDoc typedefs plus runtime helpers — the
// same convention used across the planning module.

/**
 * @typedef {Object} TelegramSettings
 * @property {string|null} telegram_chat_id
 * @property {boolean} telegram_notifications_enabled
 */

// A Telegram Chat ID is a numeric identifier. Positive for private chats,
// optionally negative for groups/channels. It is NOT the bot token.
const CHAT_ID_PATTERN = /^-?\d+$/

/**
 * Validate a Telegram settings form. Returns a map of field -> message; an
 * empty object means the form is valid.
 * @param {{ telegram_chat_id: string, telegram_notifications_enabled: boolean }} form
 * @returns {Record<string, string>}
 */
export const validateTelegramSettings = (form) => {
  const errors = {}
  const chatId = (form.telegram_chat_id ?? '').trim()

  if (form.telegram_notifications_enabled && !chatId) {
    errors.telegram_chat_id =
      'A Telegram Chat ID is required to enable notifications.'
  } else if (chatId && !CHAT_ID_PATTERN.test(chatId)) {
    errors.telegram_chat_id =
      'The Chat ID must be a numeric value (negative is allowed for groups).'
  }

  return errors
}

/**
 * Build a normalized payload for PUT /api/me/telegram.
 * @param {{ telegram_chat_id: string, telegram_notifications_enabled: boolean }} form
 * @returns {TelegramSettings}
 */
export const toTelegramPayload = (form) => {
  const chatId = (form.telegram_chat_id ?? '').trim()
  return {
    telegram_chat_id: chatId || null,
    telegram_notifications_enabled: !!form.telegram_notifications_enabled,
  }
}

// Static, user-facing copy for the Telegram settings page. Centralized here so
// the page component stays focused on behavior.
export const TELEGRAM_SETUP_STEPS = [
  'Open Telegram.',
  'Search for the system bot.',
  'Send the /start command to the bot.',
  'Obtain your Telegram Chat ID.',
  'Paste your Chat ID below.',
  'Enable Telegram notifications.',
]

export const TELEGRAM_HELPER_TEXTS = [
  'The Chat ID identifies the conversation where reminders will be delivered.',
  'The Chat ID is NOT your bot token.',
  'Never paste your Telegram bot token here.',
]
