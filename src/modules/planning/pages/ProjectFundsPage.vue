<template>
  <div class="container funds-page">
    <div v-if="loading && !project" class="state muted">Loading project funds...</div>
    <p v-else-if="loadError" class="alert alert-error" role="alert">{{ loadError }}</p>

    <template v-else-if="project">
      <header class="page-head">
        <div>
          <p class="page-kicker">Project finances</p>
          <h1>{{ project.name }} funds</h1>
          <p class="muted">Currency: {{ project.currency || 'Not configured' }}</p>
        </div>
        <div class="actions">
          <router-link :to="`/projects/${projectId}`" class="btn btn-ghost">
            Back to project
          </router-link>
          <button type="button" :disabled="!hasCurrency" @click="openCreate">New fund</button>
        </div>
      </header>

      <div v-if="!hasCurrency" class="alert alert-error" role="alert">
        This project needs a currency before funds can be created.
        <router-link :to="`/projects/${projectId}/edit`">Configure currency</router-link>
      </div>
      <p v-if="successMessage" class="alert alert-success" role="status">
        {{ successMessage }}
      </p>
      <p v-if="fundError" class="alert alert-error" role="alert">{{ fundError }}</p>

      <div v-if="loading" class="state muted">Loading current balances...</div>
      <div v-else-if="funds.length === 0" class="card state">
        No project funds yet. Create the first fund to enable task allocations.
      </div>
      <div v-else class="fund-list">
        <article v-for="fund in funds" :key="fund.id" class="card fund-card">
          <div class="fund-card__head">
            <h2>{{ fund.name }}</h2>
            <button type="button" class="btn btn-secondary btn-sm" @click="openEdit(fund)">
              Edit
            </button>
          </div>
          <FundBalanceSummary :fund="fund" :currency="project.currency" />
        </article>
      </div>

      <FundFormModal
        :open="modalOpen"
        :project-id="projectId"
        :fund="selectedFund"
        :funds="funds"
        :currency="project.currency"
        @close="closeModal"
        @saved="handleSaved"
      />
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'
import FundBalanceSummary from '@/modules/planning/components/FundBalanceSummary.vue'
import FundFormModal from '@/modules/planning/components/FundFormModal.vue'

const route = useRoute()
const store = useStore()
const projectId = computed(() => Number(route.params.projectId))
const project = computed(() => store.getters['projects/projectById'](projectId.value))
const hasCurrency = computed(() => /^[A-Z]{3}$/.test(project.value?.currency?.trim().toUpperCase() ?? ''))
const funds = computed(() => store.getters['funds/forProject'](projectId.value))
const loading = computed(
  () =>
    store.getters['projects/isLoading'] ||
    store.getters['funds/isLoading'](projectId.value),
)
const fundError = computed(() => store.getters['funds/error'](projectId.value))
const loadError = ref('')
const successMessage = ref('')
const modalOpen = ref(false)
const selectedFund = ref(null)

onMounted(async () => {
  try {
    await Promise.all([
      store.dispatch('projects/fetchProject', projectId.value),
      store.dispatch('funds/fetchFunds', projectId.value),
    ])
  } catch (error) {
    loadError.value = error.message || 'Unable to load project funds.'
  }
})

const openCreate = () => {
  if (!hasCurrency.value) return
  selectedFund.value = null
  modalOpen.value = true
}

const openEdit = (fund) => {
  selectedFund.value = fund
  modalOpen.value = true
}

const closeModal = () => {
  modalOpen.value = false
  selectedFund.value = null
}

const handleSaved = () => {
  successMessage.value = 'Fund saved successfully.'
  closeModal()
}
</script>

<style scoped>
.page-head,
.fund-card__head,
.actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.page-head {
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.page-head h1,
.page-head p,
.fund-card h2 {
  margin-top: 0;
}

.page-kicker {
  margin-bottom: 0.25rem;
  color: var(--color-primary);
  font-size: 0.78rem;
  text-transform: uppercase;
}

.actions {
  flex-wrap: wrap;
  justify-content: flex-end;
}

.fund-list {
  display: grid;
  gap: 1rem;
}

.fund-card {
  padding: 1.25rem;
}

.state {
  padding: 1.5rem;
  text-align: center;
}

@media (max-width: 640px) {
  .page-head,
  .fund-card__head {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
