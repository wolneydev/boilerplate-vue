<template>
  <div class="container settings-page">
    <header class="page-head">
      <p class="page-kicker">Settings</p>
      <h1>Telegram Notifications</h1>
      <p class="page-lead muted">
        Configure Telegram to receive reminders for your scheduled tasks.
      </p>
    </header>

    <div class="layout">
      <section class="card guide" aria-labelledby="telegram-guide-title">
        <h2 id="telegram-guide-title" class="guide__title">How to connect Telegram</h2>
        <ol class="guide__steps">
          <li v-for="(step, index) in setupSteps" :key="index">{{ step }}</li>
        </ol>
        <ul class="guide__notes">
          <li v-for="(text, index) in helperTexts" :key="index" class="muted">{{ text }}</li>
        </ul>
      </section>

      <section class="card form-card" aria-labelledby="telegram-form-title">
        <h2 id="telegram-form-title" class="form-card__title">Your settings</h2>

        <div v-if="loading" class="state muted">Loading your settings…</div>

        <template v-else>
          <p v-if="loadError" class="alert alert-error">{{ loadError }}</p>
          <p v-if="successMessage" class="alert alert-success" role="status">
            {{ successMessage }}
          </p>
          <p v-if="errorMessage" class="alert alert-error" role="alert">{{ errorMessage }}</p>

          <form class="form" @submit.prevent="save">
            <div class="field">
              <label for="telegram-chat-id">Telegram Chat ID</label>
              <input
                id="telegram-chat-id"
                v-model.trim="form.telegram_chat_id"
                type="password"
                inputmode="numeric"
                placeholder="e.g. 123456789"
                autocomplete="off"
                aria-describedby="telegram-chat-id-help"
              />
              <p id="telegram-chat-id-help" class="field__help muted">
                The Chat ID identifies the conversation where reminders will be delivered.
                It is not your bot token.
              </p>
              <p v-if="fieldErrors.telegram_chat_id" class="field__error">
                {{ fieldErrors.telegram_chat_id }}
              </p>
            </div>

            <div class="field switch-field">
              <label class="switch">
                <input
                  type="checkbox"
                  role="switch"
                  v-model="form.telegram_notifications_enabled"
                />
                <span>Receive Telegram notifications</span>
              </label>
            </div>

            <div class="actions">
              <button type="submit" :disabled="saving || testing">
                {{ saving ? 'Saving…' : 'Save Settings' }}
              </button>
              <button
                type="button"
                class="btn btn-secondary"
                :disabled="saving || testing"
                @click="testNotification"
              >
                {{ testing ? 'Sending…' : 'Test Notification' }}
              </button>
            </div>
          </form>
        </template>
      </section>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { useStore } from 'vuex'
import {
  TELEGRAM_SETUP_STEPS,
  TELEGRAM_HELPER_TEXTS,
  validateTelegramSettings,
  toTelegramPayload,
} from '@/modules/settings/types/settings.types'

const store = useStore()

const setupSteps = TELEGRAM_SETUP_STEPS
const helperTexts = TELEGRAM_HELPER_TEXTS

const loading = ref(false)
const saving = ref(false)
const testing = ref(false)
const loadError = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const fieldErrors = reactive({})

const form = reactive({
  telegram_chat_id: '',
  telegram_notifications_enabled: false,
})

// Clearing the chat id should never leave notifications "enabled" with nothing
// to send to — mirrors the backend's own invariant.
watch(
  () => form.telegram_chat_id,
  (chatId) => {
    if (!chatId) form.telegram_notifications_enabled = false
  },
)

const clearFeedback = () => {
  errorMessage.value = ''
  successMessage.value = ''
  Object.keys(fieldErrors).forEach((key) => delete fieldErrors[key])
}

const applyServerValidation = (err) => {
  const errors = err?.data?.errors
  if (errors && typeof errors === 'object') {
    Object.entries(errors).forEach(([field, messages]) => {
      fieldErrors[field] = Array.isArray(messages) ? messages[0] : String(messages)
    })
    return true
  }
  return false
}

onMounted(async () => {
  loading.value = true
  loadError.value = ''
  await store.dispatch('telegram/fetchSettings')
  const error = store.getters['telegram/telegramError']
  if (error) {
    loadError.value = error
  } else {
    const settings = store.getters['telegram/telegramSettings']
    form.telegram_chat_id = settings.telegram_chat_id ?? ''
    form.telegram_notifications_enabled = !!settings.telegram_notifications_enabled
  }
  loading.value = false
})

const save = async () => {
  clearFeedback()

  const errors = validateTelegramSettings(form)
  if (Object.keys(errors).length) {
    Object.assign(fieldErrors, errors)
    errorMessage.value = 'Please check the highlighted fields.'
    return
  }

  saving.value = true
  try {
    await store.dispatch('telegram/saveSettings', toTelegramPayload(form))
    const settings = store.getters['telegram/telegramSettings']
    form.telegram_chat_id = settings.telegram_chat_id ?? ''
    form.telegram_notifications_enabled = !!settings.telegram_notifications_enabled
    successMessage.value = 'Settings saved successfully.'
  } catch (err) {
    if (applyServerValidation(err)) {
      errorMessage.value = 'Please check the highlighted fields.'
    } else {
      errorMessage.value = err.message || 'Unable to save your Telegram settings.'
    }
  } finally {
    saving.value = false
  }
}

const testNotification = async () => {
  clearFeedback()

  const chatId = (form.telegram_chat_id ?? '').trim()
  if (!chatId) {
    fieldErrors.telegram_chat_id = 'Enter a Telegram Chat ID before sending a test.'
    errorMessage.value = 'Please check the highlighted fields.'
    return
  }

  testing.value = true
  try {
    const result = await store.dispatch('telegram/sendTestNotification', toTelegramPayload(form))
    successMessage.value = result?.message || 'Test notification sent successfully.'
  } catch (err) {
    if (applyServerValidation(err)) {
      errorMessage.value = 'Please check the highlighted fields.'
    } else {
      errorMessage.value = err.message || 'Unable to send the test notification.'
    }
  } finally {
    testing.value = false
  }
}
</script>

<style scoped>
.settings-page {
  max-width: 880px;
}

.page-head {
  margin-bottom: 1.5rem;
}

.page-head h1 {
  margin: 0;
}

.page-kicker {
  margin: 0 0 0.25rem;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-primary);
}

.page-lead {
  margin: 0.5rem 0 0;
  max-width: 56ch;
}

.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
  gap: 1.25rem;
  align-items: start;
}

.guide__title,
.form-card__title {
  margin: 0 0 1rem;
  font-size: 1.2rem;
}

.guide__steps {
  margin: 0 0 1.25rem;
  padding-left: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.guide__notes {
  margin: 0;
  padding-left: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.85rem;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.field__help {
  margin: 0.3rem 0 0;
  font-size: 0.8rem;
}

.field__error {
  margin: 0.3rem 0 0;
  font-size: 0.8rem;
  color: var(--color-danger-hover);
}

.switch {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  margin: 0;
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--color-text);
}

.switch input {
  width: auto;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 0.25rem;
}

.state {
  padding: 1rem 0;
  text-align: center;
}

.alert {
  margin: 0 0 1rem;
}

.alert-success {
  color: var(--color-success);
  background: var(--color-secondary-soft);
  border: 1px solid #cfe0d6;
}

@media (max-width: 720px) {
  .layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 540px) {
  .actions button {
    width: 100%;
  }

  .switch {
    align-items: flex-start;
  }
}
</style>
