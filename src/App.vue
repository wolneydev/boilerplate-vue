<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="app-header__inner">
        <router-link :to="isLoggedIn ? '/' : '/login'" class="brand">
          <span class="brand__mark" aria-hidden="true"></span>
          <span class="brand__name">Northloom</span>
        </router-link>

        <nav class="nav">
          <template v-if="!isLoggedIn">
            <router-link to="/login" class="nav__link">Sign in</router-link>
            <router-link to="/register" class="nav__link nav__link--cta">Create account</router-link>
          </template>

          <template v-else>
            <router-link to="/" class="nav__link">Dashboard</router-link>
            <router-link to="/projects" class="nav__link">Projects</router-link>
            <router-link to="/calendar" class="nav__link">Schedule</router-link>
            <router-link to="/users" class="nav__link">Users</router-link>
            <button class="btn btn-ghost btn-sm" @click="logout">Sign out</button>
          </template>
        </nav>
      </div>
    </header>

    <main class="app-main">
      <router-view></router-view>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'

const store = useStore()
const router = useRouter()

const isLoggedIn = computed(() => store.getters['auth/isLoggedIn'])

const logout = async () => {
  await store.dispatch('auth/logout')
  router.push('/login')
}
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: saturate(1.4) blur(10px);
  border-bottom: 1px solid var(--color-border);
}

.app-header__inner {
  max-width: 960px;
  margin: 0 auto;
  padding: 0.85rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

/* --- Brand --- */
.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  color: var(--color-text);
}

.brand:hover {
  color: var(--color-text);
}

.brand__mark {
  width: 28px;
  height: 28px;
  border-radius: 9px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.35);
}

.brand__name {
  font-family: var(--font-heading);
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

/* --- Nav --- */
.nav {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.nav__link {
  padding: 0.45rem 0.8rem;
  border-radius: var(--radius-sm);
  font-size: 0.92rem;
  font-weight: 500;
  color: var(--color-text-muted);
  transition: color var(--transition), background-color var(--transition);
}

.nav__link:hover {
  color: var(--color-primary);
  background: var(--color-surface);
}

.nav__link.router-link-exact-active {
  color: var(--color-primary);
  background: var(--color-primary-soft);
}

.nav__link--cta {
  color: var(--color-text-inverse);
  background: var(--color-primary);
}

.nav__link--cta:hover {
  color: var(--color-text-inverse);
  background: var(--color-primary-hover);
}

.app-main {
  flex: 1;
}

@media (max-width: 600px) {
  .app-header__inner {
    padding: 0.75rem 1rem;
  }
  .nav__link {
    padding: 0.4rem 0.6rem;
  }
}
</style>
