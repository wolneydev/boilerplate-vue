<template>
  <div class="container form-page">
    <header class="page-head">
      <p class="page-kicker">{{ isEditing ? 'Edit' : 'New' }}</p>
      <h1>{{ isEditing ? 'Edit project' : 'New project' }}</h1>
    </header>

    <div class="card form-card">
      <div v-if="loading" class="state muted">Loading...</div>

      <form v-else class="form" @submit.prevent="save">
        <div class="field">
          <label for="name">Project name *</label>
          <input id="name" v-model="form.name" placeholder="e.g. Hall renovation" required />
          <p v-if="fieldErrors.name" class="field__error">{{ fieldErrors.name }}</p>
        </div>

        <div class="grid-2">
          <div class="field">
            <label for="starts_on">Start date *</label>
            <input id="starts_on" v-model="form.starts_on" type="date" required />
            <p v-if="fieldErrors.starts_on" class="field__error">{{ fieldErrors.starts_on }}</p>
          </div>
          <div class="field">
            <label for="expected_ends_on">Expected end *</label>
            <input id="expected_ends_on" v-model="form.expected_ends_on" type="date" required />
            <p v-if="fieldErrors.expected_ends_on" class="field__error">
              {{ fieldErrors.expected_ends_on }}
            </p>
          </div>
        </div>

        <div class="field">
          <label for="notes">Description / notes</label>
          <textarea
            id="notes"
            v-model="form.notes"
            rows="4"
            placeholder="Details, scope or notes (optional)..."
          ></textarea>
        </div>

        <div class="actions">
          <button type="submit" :disabled="saving">{{ saving ? 'Saving...' : 'Save' }}</button>
          <router-link to="/projects">
            <button type="button" class="btn btn-ghost">Cancel</button>
          </router-link>
        </div>

        <p v-if="errorMessage" class="alert alert-error">{{ errorMessage }}</p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'

const route = useRoute()
const router = useRouter()
const store = useStore()

const isEditing = computed(() => !!route.params.id)
const loading = ref(false)
const saving = computed(() => store.getters['projects/isSaving'])
const errorMessage = ref('')
const fieldErrors = reactive({})

const form = reactive({
  name: '',
  starts_on: '',
  expected_ends_on: '',
  notes: '',
})

const clearFieldErrors = () => Object.keys(fieldErrors).forEach((key) => delete fieldErrors[key])

onMounted(async () => {
  if (!isEditing.value) return
  loading.value = true
  try {
    const project = await store.dispatch('projects/fetchProject', route.params.id)
    Object.assign(form, {
      name: project.name ?? '',
      starts_on: project.starts_on?.split('T')[0] ?? '',
      expected_ends_on: project.expected_ends_on?.split('T')[0] ?? '',
      notes: project.notes ?? '',
    })
  } catch (err) {
    errorMessage.value = err.message || 'Error loading the project.'
  } finally {
    loading.value = false
  }
})

const save = async () => {
  errorMessage.value = ''
  clearFieldErrors()
  try {
    if (isEditing.value) {
      await store.dispatch('projects/updateProject', { id: route.params.id, payload: { ...form } })
    } else {
      await store.dispatch('projects/createProject', { ...form })
    }
    router.push('/projects')
  } catch (err) {
    const errors = err?.data?.errors
    if (errors && typeof errors === 'object') {
      Object.entries(errors).forEach(([field, messages]) => {
        fieldErrors[field] = Array.isArray(messages) ? messages[0] : String(messages)
      })
      errorMessage.value = 'Please check the highlighted fields.'
    } else {
      errorMessage.value = err.message || 'Error saving the project.'
    }
  }
}
</script>

<style scoped>
.form-page {
  max-width: 620px;
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

.grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.field__error {
  margin: 0.3rem 0 0;
  font-size: 0.8rem;
  color: var(--color-danger-hover);
}

.actions {
  display: flex;
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
  .grid-2 {
    grid-template-columns: 1fr;
  }
}
</style>
