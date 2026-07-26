<template>
  <div class="container costs-page">
    <div v-if="projectLoading && !project" class="state muted" role="status">
      Loading project costs...
    </div>
    <div v-else-if="projectError" class="alert alert-error" role="alert">
      {{ projectError }}
    </div>

    <template v-else-if="project">
      <header class="page-head">
        <div>
          <p class="page-kicker">Project finances</p>
          <h1>{{ project.name }} costs</h1>
          <p class="muted">
            Register independent expenses in {{ project.currency }} and review their history.
          </p>
        </div>
        <router-link :to="`/projects/${project.id}`">
          <button type="button" class="btn btn-ghost">Back to project</button>
        </router-link>
      </header>

      <p v-if="successMessage" class="alert alert-success" role="status">
        {{ successMessage }}
      </p>
      <p v-if="registrationError" class="alert alert-error" role="alert">
        {{ registrationError }}
      </p>

      <div class="costs-layout">
        <CostRegistrationForm
          :project-id="projectId"
          :currency="project.currency"
          @registered="onRegistered"
          @registration-error="onRegistrationError"
        />
        <CostHistoryList
          :costs="costs"
          :currency="project.currency"
          :loading="costsLoading"
          :error="historyError"
        />
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'
import CostRegistrationForm from '@/modules/planning/components/CostRegistrationForm.vue'
import CostHistoryList from '@/modules/planning/components/CostHistoryList.vue'

const route = useRoute()
const store = useStore()
const projectId = Number(route.params.projectId ?? route.params.id)

const project = computed(
  () => store.getters['projects/projectById']?.(projectId) ?? null,
)
const projectLoading = computed(() => Boolean(store.getters['projects/isLoading']))
const costs = computed(
  () => store.getters['costs/costsByProject']?.(projectId) ?? [],
)
const costsLoading = computed(
  () => store.getters['costs/isLoading']?.(projectId) ?? false,
)
const storeHistoryError = computed(
  () => store.getters['costs/costError']?.(projectId) ?? null,
)

const projectError = ref('')
const historyDispatchError = ref('')
const successMessage = ref('')
const registrationError = ref('')
const historyError = computed(
  () => storeHistoryError.value || historyDispatchError.value || null,
)

const loadProject = async () => {
  try {
    await store.dispatch('projects/fetchProject', projectId)
  } catch (error) {
    projectError.value = error?.message || 'Unable to load the project.'
  }
}

const loadCosts = async () => {
  try {
    await store.dispatch('costs/fetchCosts', projectId)
  } catch (error) {
    historyDispatchError.value = error?.message || 'Unable to load cost history.'
  }
}

onMounted(() => {
  loadProject()
  loadCosts()
})

const onRegistered = () => {
  registrationError.value = ''
  successMessage.value = 'Cost registered successfully.'
}

const onRegistrationError = (message) => {
  successMessage.value = ''
  registrationError.value = message || 'Unable to register the cost.'
}
</script>

<style scoped>
.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.page-head h1,
.page-kicker {
  margin: 0;
}

.page-head .muted {
  margin: 0.4rem 0 0;
}

.page-kicker {
  margin-bottom: 0.25rem;
  color: var(--color-primary);
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.costs-layout {
  display: grid;
  gap: 2rem;
}

.state {
  padding: 1.5rem;
  text-align: center;
}

@media (max-width: 640px) {
  .page-head {
    flex-direction: column;
    align-items: stretch;
  }

  .page-head a,
  .page-head button {
    width: 100%;
  }
}
</style>
