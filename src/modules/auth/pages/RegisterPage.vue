<template>
  <div class="auth-page">
    <div class="card auth-card">
      <p class="auth-kicker">Welcome</p>
      <h1>Create account</h1>
      <p class="muted auth-sub">It takes less than a minute.</p>

      <form @submit.prevent="doRegister" class="auth-form">
        <div class="field">
          <label for="name">Name</label>
          <input id="name" v-model="name" type="text" placeholder="Your name" />
        </div>
        <div class="field">
          <label for="email">Email</label>
          <input id="email" v-model="email" type="email" placeholder="you@example.com" />
        </div>
        <div class="field">
          <label for="password">Password</label>
          <input id="password" v-model="password" type="password" placeholder="••••••••" />
        </div>
        <div class="field">
          <label for="password_confirmation">Confirm password</label>
          <input
            id="password_confirmation"
            v-model="passwordConfirmation"
            type="password"
            placeholder="••••••••"
          />
        </div>
        <button type="submit" :disabled="submitting">
          {{ submitting ? 'Registering...' : 'Register' }}
        </button>
      </form>

      <p v-if="errorMessage" class="alert alert-error">{{ errorMessage }}</p>

      <p class="auth-foot muted">
        Already have an account?
        <router-link to="/login">Sign in</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'

const name = ref('')
const email = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const errorMessage = ref('')
const submitting = ref(false)

const router = useRouter()
const store = useStore()

const doRegister = async () => {
  errorMessage.value = ''

  if (password.value !== passwordConfirmation.value) {
    errorMessage.value = 'Passwords do not match.'
    return
  }

  submitting.value = true
  try {
    await store.dispatch('auth/register', {
      name: name.value,
      email: email.value,
      password: password.value,
      password_confirmation: passwordConfirmation.value,
    })
    router.push('/')
  } catch (error) {
    errorMessage.value =
      error.message || 'Could not register the user. Please check your details and try again.'
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
