import { createRouter, createWebHistory } from 'vue-router'
import store from '@/core/store'

import authRoutes from '@/modules/auth/routes/auth.routes'
import dashboardRoutes from '@/modules/dashboard/routes/dashboard.routes'
import usersRoutes from '@/modules/users/routes/users.routes'
import planningRoutes from '@/modules/planning/routes/planning.routes'

// Routes are contributed by each feature module and merged here.
const routes = [...authRoutes, ...dashboardRoutes, ...usersRoutes, ...planningRoutes]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  // Wait for the silent-refresh bootstrap so guards see the resolved auth state.
  if (store.getters['auth/isInitializing']) {
    await store.dispatch('auth/initialize')
  }

  const isLoggedIn = store.getters['auth/isLoggedIn']

  if (to.meta.requiresAuth && !isLoggedIn) {
    return { name: 'Login', query: { redirect: to.fullPath } }
  }

  if (to.meta.guestOnly && isLoggedIn) {
    return { name: 'Dashboard' }
  }

  return true
})

export default router
