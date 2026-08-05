<template>
  <div class="container dashboard">
    <section class="hero card">
      <p class="hero__kicker">Dashboard</p>
      <h1 class="hero__title">
        Hello<span v-if="currentUser">, {{ currentUser.name }}</span>. Great to have you here.
      </h1>
      <p class="hero__text muted">
        Manage your system resources with ease. Everything you need, all in one place.
      </p>
    </section>

    <div class="grid">
      <router-link to="/projects" class="tile">
        <span class="tile__icon" aria-hidden="true">▦</span>
        <span class="tile__body">
          <strong class="tile__title">Projects</strong>
          <span class="muted">Plan projects and their timelines</span>
        </span>
        <span class="tile__arrow" aria-hidden="true">→</span>
      </router-link>

      <router-link to="/calendar" class="tile">
        <span class="tile__icon" aria-hidden="true">▤</span>
        <span class="tile__body">
          <strong class="tile__title">Schedule</strong>
          <span class="muted">Task calendar by project</span>
        </span>
        <span class="tile__arrow" aria-hidden="true">→</span>
      </router-link>

      <router-link to="/reports" class="tile">
        <span class="tile__icon" aria-hidden="true">◌</span>
        <span class="tile__body">
          <strong class="tile__title">Reports</strong>
          <span class="muted">Analyze projects, tasks or both</span>
        </span>
        <span class="tile__arrow" aria-hidden="true">→</span>
      </router-link>

      <router-link to="/chat" class="tile">
        <span class="tile__icon" aria-hidden="true">◈</span>
        <span class="tile__body">
          <strong class="tile__title">Assistant</strong>
          <span class="muted">Ask MCP tools to create projects and tasks</span>
        </span>
        <span class="tile__arrow" aria-hidden="true">→</span>
      </router-link>

      <router-link to="/users" class="tile">
        <span class="tile__icon" aria-hidden="true">◆</span>
        <span class="tile__body">
          <strong class="tile__title">Users</strong>
          <span class="muted">Create, edit and manage accounts</span>
        </span>
        <span class="tile__arrow" aria-hidden="true">→</span>
      </router-link>

      <router-link to="/settings/telegram" class="tile">
        <span class="tile__icon" aria-hidden="true">🔔</span>
        <span class="tile__body">
          <strong class="tile__title">Notifications</strong>
          <span class="muted">Configure Telegram reminders</span>
        </span>
        <span class="tile__arrow" aria-hidden="true">→</span>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'

const store = useStore()
const currentUser = computed(() => store.getters['auth/currentUser'])
</script>

<style scoped>
.hero {
  background:
    radial-gradient(120% 140% at 100% 0%, var(--color-primary-soft) 0%, transparent 60%),
    var(--color-bg);
}

.hero__kicker {
  margin: 0 0 0.5rem;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-primary);
}

.hero__title {
  max-width: 18ch;
  margin-bottom: 0.5rem;
}

.hero__text {
  max-width: 52ch;
  margin: 0;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
}

.tile {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  color: var(--color-text);
  transition: transform var(--transition), box-shadow var(--transition), border-color var(--transition);
}

.tile:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-border-strong);
  color: var(--color-text);
}

.tile__icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  flex: none;
  border-radius: var(--radius-md);
  color: var(--color-primary);
  background: var(--color-primary-soft);
  font-size: 1rem;
}

.tile__body {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.tile__title {
  font-family: var(--font-heading);
  font-size: 1.1rem;
}

.tile__arrow {
  margin-left: auto;
  color: var(--color-text-muted);
  transition: transform var(--transition), color var(--transition);
}

.tile:hover .tile__arrow {
  color: var(--color-primary);
  transform: translateX(3px);
}

@media (max-width: 540px) {
  .grid {
    grid-template-columns: 1fr;
  }

  .tile {
    align-items: flex-start;
    padding: 1rem;
  }
}
</style>
