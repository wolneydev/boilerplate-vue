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

    <section class="chat card" aria-label="Chat with planning assistant">
      <div ref="threadEl" class="chat__thread" role="log" aria-live="polite">
        <div v-if="messages.length === 0" class="chat__empty">
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
          :disabled="sending"
          @keydown.enter.exact.prevent="submit"
        />
        <div class="chat__actions">
          <button type="button" class="btn btn-ghost btn-sm" :disabled="sending" @click="reset">
            New chat
          </button>
          <button type="submit" :disabled="sending || !draft.trim()">
            {{ sending ? 'Sending…' : 'Send' }}
          </button>
        </div>
      </form>
    </section>
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

const suggestions = [
  'Create a project named ERP with currency BRL starting today and ending in 30 days.',
  'Show me a report of my projects and tasks.',
  'Create a task called Kickoff for my latest project tomorrow at 10:00.',
]

const formatToolName = (name = '') =>
  String(name)
    .replace(/^mcp_tools_/, '')
    .replace(/-/g, ' ')

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
  if (!text || sending.value) return
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

watch(messages, () => scrollToBottom(), { deep: true })
watch(sending, () => scrollToBottom())

onMounted(() => {
  inputEl.value?.focus()
})
</script>

<style scoped>
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

@media (max-width: 600px) {
  .chat {
    min-height: 65vh;
  }

  .chat__thread,
  .chat__composer {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}
</style>
