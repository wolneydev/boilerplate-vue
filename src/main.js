import { createApp } from 'vue'
import App from '@/App.vue'
import router from '@/core/router'
import store from '@/core/store'
import { registerStore } from '@/core/http/httpClient'
import '@/assets/main.css'

// Inject the store into the HTTP layer so interceptors can read the in-memory
// access token and trigger token refresh without creating a circular import.
registerStore(store)

const bootstrap = async () => {
  // Attempt a silent login using the HTTP-only refresh cookie before mounting,
  // so the first render already reflects the resolved authentication state.
  await store.dispatch('auth/initialize')

  const app = createApp(App)
  app.use(store)
  app.use(router)
  app.mount('#app')
}

bootstrap()
