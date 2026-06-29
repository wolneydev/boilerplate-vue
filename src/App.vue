<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="app-header__inner">
        <router-link :to="isLoggedIn ? '/' : '/login'" class="brand" @click="closeMenu">
          <span class="brand__mark" aria-hidden="true"></span>
          <span class="brand__name">Northloom</span>
        </router-link>

        <button
          type="button"
          class="menu-toggle"
          :aria-expanded="menuOpen"
          aria-controls="main-navigation"
          aria-label="Open navigation menu"
          @click="toggleMenu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <nav id="main-navigation" class="nav" :class="{ 'nav--open': menuOpen }">
          <template v-if="!isLoggedIn">
            <router-link to="/login" class="nav__link" @click="closeMenu">Sign in</router-link>
            <router-link to="/register" class="nav__link nav__link--cta" @click="closeMenu">
              Create account
            </router-link>
          </template>

          <template v-else>
            <router-link to="/" class="nav__link" @click="closeMenu">Dashboard</router-link>
            <router-link to="/projects" class="nav__link" @click="closeMenu">Projects</router-link>
            <router-link to="/calendar" class="nav__link" @click="closeMenu">Schedule</router-link>
            <router-link to="/reports" class="nav__link" @click="closeMenu">Reports</router-link>
            <router-link to="/settings/telegram" class="nav__link" @click="closeMenu">
              Notifications
            </router-link>
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
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'

const store = useStore()
const router = useRouter()
const route = useRoute()
const menuOpen = ref(false)

const isLoggedIn = computed(() => store.getters['auth/isLoggedIn'])

const closeMenu = () => {
  menuOpen.value = false
}

const toggleMenu = () => {
  menuOpen.value = !menuOpen.value
}

const logout = async () => {
  closeMenu()
  await store.dispatch('auth/logout')
  router.push('/login')
}

watch(
  () => route.fullPath,
  () => closeMenu(),
)
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
  background: linear-gradient(135deg, var(--color-nav-from) 0%, var(--color-nav-to) 55%, var(--color-accent) 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 4px 20px -4px rgba(12, 35, 64, 0.35);
}

.app-header__inner {
  max-width: 960px;
  margin: 0 auto;
  padding: 0.85rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-width: 0;
}

/* --- Brand --- */
.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  color: var(--color-text-inverse);
  font-weight: 700;
  flex: 0 0 auto;
}

.brand:hover {
  color: var(--color-text-inverse);
}

.brand__mark {
  width: 28px;
  height: 28px;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.22);
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
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: thin;
}

.nav__link {
  flex: 0 0 auto;
  padding: 0.45rem 0.8rem;
  border-radius: var(--radius-sm);
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--color-text-inverse);
  transition: color var(--transition), background-color var(--transition);
}

.nav__link:hover {
  color: var(--color-text-inverse);
  background: rgba(255, 255, 255, 0.16);
}

.nav__link.router-link-exact-active {
  color: var(--color-text-inverse);
  background: rgba(255, 255, 255, 0.24);
}

.nav__link--cta {
  color: var(--color-text-inverse);
  background: rgba(255, 255, 255, 0.18);
}

.nav__link--cta:hover {
  color: var(--color-text-inverse);
  background: rgba(255, 255, 255, 0.28);
}

.nav .btn-ghost {
  color: var(--color-text-inverse);
  font-weight: 700;
  border-color: rgba(255, 255, 255, 0.35);
}

.nav .btn-ghost:hover {
  color: var(--color-text-inverse);
  background: rgba(255, 255, 255, 0.16);
}

.menu-toggle {
  display: none;
  width: 2.5rem;
  height: 2.5rem;
  padding: 0.55rem;
  flex: 0 0 auto;
  flex-direction: column;
  justify-content: center;
  gap: 0.25rem;
  background: rgba(255, 255, 255, 0.14);
  border-color: rgba(255, 255, 255, 0.32);
}

.menu-toggle:hover {
  background: rgba(255, 255, 255, 0.22);
}

.menu-toggle span {
  display: block;
  width: 100%;
  height: 2px;
  border-radius: 999px;
  background: var(--color-text-inverse);
}

.app-main {
  flex: 1;
}

@media (max-width: 600px) {
  .app-header__inner {
    flex-wrap: wrap;
    align-items: center;
    padding: 0.75rem 1rem;
  }

  .brand__name {
    font-size: 1.1rem;
  }

  .menu-toggle {
    display: inline-flex;
    margin-left: auto;
  }

  .nav {
    display: none;
    width: 100%;
    flex-direction: column;
    align-items: stretch;
    gap: 0.35rem;
    padding-top: 0.75rem;
    overflow: visible;
  }

  .nav--open {
    display: flex;
  }

  .nav__link {
    width: 100%;
    padding: 0.7rem 0.85rem;
  }

  .nav .btn-ghost {
    width: 100%;
    justify-content: flex-start;
    padding: 0.7rem 0.85rem;
  }
}
</style>
