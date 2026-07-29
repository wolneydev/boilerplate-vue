<template>
  <div class="container form-page">
    <header class="page-head">
      <p class="page-kicker">{{ isEditing ? 'Edit' : 'New' }}</p>
      <h1>{{ isEditing ? 'Edit user' : 'New user' }}</h1>
    </header>

    <div class="card form-card">
      <div v-if="loading" class="state muted">Loading...</div>

      <form v-else @submit.prevent="saveUser" class="form">
        <div class="field">
          <label for="name">Name</label>
          <input id="name" v-model="user.name" placeholder="Full name" />
        </div>

        <div class="field">
          <label for="email">Email</label>
          <input id="email" v-model="user.email" placeholder="you@example.com" />
        </div>

        <div class="actions">
          <button type="submit" :disabled="saving">
            {{ saving ? 'Saving...' : 'Save' }}
          </button>
          <router-link to="/users">
            <button type="button" class="btn btn-ghost">Cancel</button>
          </router-link>
        </div>

        <p v-if="errorMessage" class="alert alert-error">{{ errorMessage }}</p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usersService } from '@/modules/users/services/users.service'

const route = useRoute()
const router = useRouter()

const isEditing = !!route.params.id
const user = ref({ name: '', email: '' })
const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')

onMounted(async () => {
  if (!isEditing) return
  loading.value = true
  try {
    user.value = await usersService.get(route.params.id)
  } catch (err) {
    errorMessage.value = err.message || 'Error loading user.'
  } finally {
    loading.value = false
  }
})

const saveUser = async () => {
  errorMessage.value = ''
  saving.value = true
  try {
    if (isEditing) {
      await usersService.update(route.params.id, user.value)
    } else {
      await usersService.create(user.value)
    }
    router.push('/users')
  } catch (err) {
    errorMessage.value = err.message || 'Error saving user.'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.form-page {
  max-width: 560px;
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

.form {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 0.5rem;
}

.alert {
  margin: 0;
}

.state {
  padding: 1rem;
  text-align: center;
}

@media (max-width: 540px) {
  .actions a,
  .actions button {
    flex: 1 1 100%;
    width: 100%;
  }
}
</style>
