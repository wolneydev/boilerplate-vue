<template>
  <div class="container chat-page">
    <header class="page-head">
      <p class="page-kicker">Assistant</p>
      <h1>Planning chat</h1>
      <p class="page-lead muted">
        Ask to create projects, tasks, funds, costs, allocations, reports, or Telegram
        settings. Replies are powered by the Hospitable MCP tools on the API.
        Actions run as the MCP service account configured with
        <code>USER_LOGIN</code> / <code>PASSWORD_USER</code>.
      </p>
    </header>

    <div class="chat-layout">
      <aside class="history card" aria-label="Conversation history">
        <div class="history__head">
          <h2 class="history__title">History</h2>
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            :disabled="conversationsLoading"
            @click="refreshHistory"
          >
            Refresh
          </button>
        </div>

        <p v-if="conversationsError" class="history__error">{{ conversationsError }}</p>
        <p v-else-if="conversationsLoading && conversations.length === 0" class="muted history__empty">
          Loading conversations…
        </p>
        <p v-else-if="conversations.length === 0" class="muted history__empty">
          No conversations yet. Send a message to start.
        </p>

        <ul v-else class="history__list" role="list">
          <li v-for="item in conversations" :key="item.id">
            <button
              type="button"
              class="history__item"
              :class="{ 'history__item--active': item.id === conversationId }"
              :disabled="sending || conversationLoading"
              :aria-current="item.id === conversationId ? 'true' : undefined"
              @click="openConversation(item.id)"
            >
              <span class="history__item-title">{{ item.title || 'Untitled chat' }}</span>
              <span class="history__item-meta muted">{{ formatWhen(item.updated_at || item.created_at) }}</span>
            </button>
          </li>
        </ul>
      </aside>

      <section class="chat card" aria-label="Chat with planning assistant">
        <div ref="threadEl" class="chat__thread" role="log" aria-live="polite">
          <div v-if="conversationLoading" class="chat__empty">
            <p class="chat__empty-title">Opening conversation…</p>
          </div>

          <div v-else-if="messages.length === 0" class="chat__empty">
            <p class="chat__empty-title">Start a conversation</p>
            <p class="muted">Try one of these:</p>
            <ul class="chat__suggestions">
              <li v-for="suggestion in suggestions" :key="suggestion">
                <button type="button" class="chat__suggestion" @click="useSuggestion(suggestion)">
                  {{ suggestion }}
                </button>
              </li>
            </ul>
          </div>

          <template v-else>
            <article
              v-for="message in messages"
              :key="message.id"
              class="bubble"
              :class="[
                `bubble--${message.role}`,
                { 'bubble--error': message.isError },
              ]"
            >
              <p class="bubble__role">{{ message.role === 'user' ? 'You' : 'Assistant' }}</p>
              <div class="bubble__body">{{ message.content }}</div>
              <ul v-if="message.toolCalls?.length" class="bubble__tools">
                <li v-for="tool in message.toolCalls" :key="tool.id || tool.name">
                  Used tool: {{ formatToolName(tool.name) }}
                </li>
              </ul>
            </article>
          </template>

          <div v-if="sending" class="bubble bubble--assistant bubble--pending">
            <p class="bubble__role">Assistant</p>
            <div class="bubble__body muted">Thinking…</div>
          </div>
        </div>

        <form class="chat__composer" @submit.prevent="submit">
          <label class="sr-only" for="chat-input">Message</label>
          <textarea
            id="chat-input"
            ref="inputEl"
            v-model="draft"
            rows="2"
            maxlength="4000"
            placeholder="e.g. Create a project named ERP with currency BRL…"
            :disabled="sending || conversationLoading"
            @keydown.enter.exact.prevent="submit"
          />
          <div class="chat__actions">
            <button
              type="button"
              class="btn btn-ghost btn-sm"
              :disabled="sending || conversationLoading"
              @click="reset"
            >
              New chat
            </button>
            <button type="submit" :disabled="sending || conversationLoading || !draft.trim()">
              {{ sending ? 'Sending…' : 'Send' }}
            </button>
          </div>
        </form>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useStore } from 'vuex'

const store = useStore()
const draft = ref('')
const threadEl = ref(null)
const inputEl = ref(null)

const messages = computed(() => store.getters['chat/messages'])
const sending = computed(() => store.getters['chat/isSending'])
const conversationId = computed(() => store.getters['chat/conversationId'])
const conversations = computed(() => store.getters['chat/conversations'])
const conversationsLoading = computed(() => store.getters['chat/isConversationsLoading'])
const conversationLoading = computed(() => store.getters['chat/isConversationLoading'])
const conversationsError = computed(() => store.getters['chat/conversationsError'])

const suggestions = [
  'Create a project named ERP with currency BRL starting today and ending in 30 days.',
  'Show me a report of my projects and tasks.',
  'Create a task called Kickoff for my latest project tomorrow at 10:00.',
]

const formatToolName = (name = '') =>
  String(name)
    .replace(/^mcp_tools_/, '')
    .replace(/-/g, ' ')

const formatWhen = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

const scrollToBottom = async () => {
  await nextTick()
  const el = threadEl.value
  if (el) el.scrollTop = el.scrollHeight
}

const useSuggestion = (text) => {
  draft.value = text
  inputEl.value?.focus()
}

const submit = async () => {
  const text = draft.value.trim()
  if (!text || sending.value || conversationLoading.value) return
  draft.value = ''
  try {
    await store.dispatch('chat/sendMessage', text)
  } catch {
    // Error is already mirrored into the thread by the store.
  }
  await scrollToBottom()
  inputEl.value?.focus()
}

const reset = () => {
  store.dispatch('chat/resetChat')
  draft.value = ''
  inputEl.value?.focus()
}

const refreshHistory = async () => {
  try {
    await store.dispatch('chat/fetchConversations')
  } catch {
    // Error is shown in the history panel.
  }
}

const openConversation = async (id) => {
  if (!id || id === conversationId.value) return
  try {
    await store.dispatch('chat/selectConversation', id)
    await scrollToBottom()
    inputEl.value?.focus()
  } catch {
    // Error is stored; keep the previous thread visible.
  }
}

watch(messages, () => scrollToBottom(), { deep: true })
watch(sending, () => scrollToBottom())

onMounted(async () => {
  inputEl.value?.focus()
  await refreshHistory()
})
</script>

<style scoped>
.chat-page {
  max-width: 1120px;
}

.page-head {
  margin-bottom: 1.25rem;
}

.page-kicker {
  margin: 0 0 0.4rem;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-primary);
}

.page-lead {
  max-width: 58ch;
  margin: 0.35rem 0 0;
}

.chat-layout {
  display: grid;
  grid-template-columns: minmax(220px, 280px) minmax(0, 1fr);
  gap: 1rem;
  align-items: stretch;
}

.history {
  display: flex;
  flex-direction: column;
  min-height: min(70vh, 720px);
  padding: 0;
  overflow: hidden;
}

.history__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.9rem 1rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg);
}

.history__title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 1.05rem;
  font-weight: 600;
}

.history__list {
  list-style: none;
  margin: 0;
  padding: 0.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.history__item {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.2rem;
  text-align: left;
  padding: 0.7rem 0.75rem;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  background: transparent;
  color: var(--color-text);
  font: inherit;
  cursor: pointer;
  transition: border-color var(--transition), background-color var(--transition);
}

.history__item:hover:not(:disabled) {
  background: var(--color-secondary-soft);
  border-color: var(--color-border);
}

.history__item--active {
  background: var(--color-primary-soft);
  border-color: color-mix(in srgb, var(--color-primary) 28%, var(--color-border));
}

.history__item:disabled {
  opacity: 0.65;
  cursor: wait;
}

.history__item-title {
  font-size: 0.92rem;
  font-weight: 600;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.history__item-meta {
  font-size: 0.75rem;
}

.history__empty,
.history__error {
  margin: 0;
  padding: 1rem;
  font-size: 0.9rem;
}

.history__error {
  color: var(--color-danger);
}

.chat {
  display: flex;
  flex-direction: column;
  min-height: min(70vh, 720px);
  padding: 0;
  overflow: hidden;
}

.chat__thread {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem 1.25rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  background:
    radial-gradient(90% 80% at 0% 0%, var(--color-secondary-soft) 0%, transparent 55%),
    var(--color-surface);
}

.chat__empty {
  margin: auto 0;
  text-align: center;
  padding: 1.5rem 0.5rem 2rem;
}

.chat__empty-title {
  margin: 0 0 0.35rem;
  font-family: var(--font-heading);
  font-size: 1.35rem;
}

.chat__suggestions {
  list-style: none;
  margin: 1rem auto 0;
  padding: 0;
  display: grid;
  gap: 0.55rem;
  max-width: 42rem;
}

.chat__suggestion {
  width: 100%;
  text-align: left;
  padding: 0.75rem 0.9rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  color: var(--color-text);
  font: inherit;
  cursor: pointer;
  transition: border-color var(--transition), background-color var(--transition);
}

.chat__suggestion:hover {
  border-color: var(--color-secondary);
  background: var(--color-secondary-soft);
}

.bubble {
  max-width: min(42rem, 92%);
  padding: 0.75rem 0.95rem;
  border-radius: var(--radius-md);
}

.bubble--user {
  align-self: flex-end;
  background: linear-gradient(135deg, var(--color-nav-from), var(--color-nav-to));
  color: var(--color-text-inverse);
}

.bubble--assistant {
  align-self: flex-start;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}

.bubble--error {
  border-color: #fecaca;
  background: var(--color-danger-soft);
}

.bubble--pending {
  opacity: 0.85;
}

.bubble__role {
  margin: 0 0 0.3rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  opacity: 0.75;
}

.bubble__body {
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
}

.bubble__tools {
  list-style: none;
  margin: 0.65rem 0 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.bubble__tools li {
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  border-radius: var(--radius-sm);
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.bubble--user .bubble__tools li {
  background: rgba(255, 255, 255, 0.18);
  color: var(--color-text-inverse);
}

.chat__composer {
  display: grid;
  gap: 0.75rem;
  padding: 1rem 1.25rem 1.25rem;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg);
}

.chat__composer textarea {
  width: 100%;
  resize: vertical;
  min-height: 3.2rem;
  max-height: 10rem;
}

.chat__actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 860px) {
  .chat-layout {
    grid-template-columns: 1fr;
  }

  .history {
    min-height: 0;
    max-height: 240px;
  }

  .chat {
    min-height: 65vh;
  }
}

@media (max-width: 600px) {
  .chat__thread,
  .chat__composer,
  .history__head {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}
</style>
