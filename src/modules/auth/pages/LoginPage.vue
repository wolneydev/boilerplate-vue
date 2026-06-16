<template>
  <div class="auth-page">
    <div class="card auth-card">
      <p class="auth-kicker">Welcome back</p>
      <h1>Sign in</h1>
      <p class="muted auth-sub">Access your account to continue.</p>

      <form @submit.prevent="doLogin" class="auth-form">
        <div class="field">
          <label for="email">Email</label>
          <input id="email" v-model="email" type="email" placeholder="you@example.com" />
        </div>
        <div class="field">
          <label for="password">Password</label>
          <input id="password" v-model="password" type="password" placeholder="••••••••" />
        </div>
        <button type="submit" :disabled="submitting">
          {{ submitting ? 'Signing in...' : 'Sign in' }}
        </button>
      </form>

      <p v-if="errorMessage" class="alert alert-error">{{ errorMessage }}</p>

      <p class="auth-foot muted">
        Don't have an account?
        <router-link to="/register">Create account</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useStore } from 'vuex'

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const submitting = ref(false)

const router = useRouter()
const route = useRoute()
const store = useStore()

const doLogin = async () => {
  errorMessage.value = ''
  submitting.value = true
  try {
    await store.dispatch('auth/login', { email: email.value, password: password.value })
    const redirect = route.query.redirect || '/'
    router.push(redirect)
  } catch (err) {
    errorMessage.value = err.message || 'Sign-in failed.'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.auth-page {
  display: flex;
  justify-content: center;
  padding: 4rem 1.5rem;
}

.auth-card {
  width: 100%;
  max-width: 420px;
}

.auth-kicker {
  margin: 0 0 0.25rem;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-primary);
}

.auth-sub {
  margin-top: -0.25rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  margin-top: 1.5rem;
}

.auth-form button {
  width: 100%;
  margin-top: 0.25rem;
}

.field label {
  margin-bottom: 0.35rem;
}

.alert {
  margin-top: 1.25rem;
}

.auth-foot {
  margin: 1.5rem 0 0;
  text-align: center;
  font-size: 0.9rem;
}
</style>
