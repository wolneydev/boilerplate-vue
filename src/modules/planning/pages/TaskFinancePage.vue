<template>
  <div class="container finance-page">
    <div v-if="loading" class="state muted">Loading task finances...</div>
    <p v-else-if="loadError" class="alert alert-error" role="alert">{{ loadError }}</p>

    <template v-else-if="project && task">
      <header class="page-head">
        <div>
          <p class="page-kicker">Task finances</p>
          <h1>{{ task.title }}</h1>
          <p class="muted">{{ project.name }} · {{ project.currency }}</p>
        </div>
        <router-link :to="`/projects/${projectId}`" class="btn btn-ghost">
          Back to project
        </router-link>
      </header>

      <p v-if="successMessage" class="alert alert-success" role="status">
        {{ successMessage }}
      </p>
      <p v-if="refreshWarning" class="alert alert-error" role="alert">
        {{ refreshWarning }}
      </p>
      <p v-if="fundError" class="alert alert-error" role="alert">{{ fundError }}</p>

      <div v-if="funds.length === 0" class="card state">
        <h2>No project funds</h2>
        <p class="muted">Create a project fund before allocating money to this task.</p>
        <router-link :to="`/projects/${projectId}/funds`">Manage funds</router-link>
      </div>

      <TaskAllocationForm
        v-else
        :project-id="projectId"
        :task-id="taskId"
        :funds="funds"
        :currency="project.currency"
        @allocated="handleAllocated"
      />

      <AllocationHistoryList
        :items="allocations"
        :loading="historyLoading"
        :error="historyError"
        :currency="project.currency"
      />
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'
import AllocationHistoryList from '@/modules/planning/components/AllocationHistoryList.vue'
import TaskAllocationForm from '@/modules/planning/components/TaskAllocationForm.vue'

const route = useRoute()
const store = useStore()
const projectId = computed(() => Number(route.params.projectId))
const taskId = computed(() => Number(route.params.taskId))

const project = computed(() => store.getters['projects/projectById'](projectId.value))
const task = computed(() => store.getters['tasks/taskById'](taskId.value))
const funds = computed(() => store.getters['funds/forProject'](projectId.value))
const fundError = computed(() => store.getters['funds/error'](projectId.value))
const allocations = computed(() => store.getters['allocations/forTask'](taskId.value))
const historyLoading = computed(() =>
  store.getters['allocations/isLoading'](taskId.value),
)
const historyError = computed(() => store.getters['allocations/error'](taskId.value))
const loading = ref(true)
const loadError = ref('')
const successMessage = ref('')
const refreshWarning = ref('')

onMounted(async () => {
  try {
    await Promise.all([
      store.dispatch('projects/fetchProject', projectId.value),
      store.dispatch('tasks/fetchTask', taskId.value),
      store.dispatch('funds/fetchFunds', projectId.value),
    ])
    if (String(task.value?.project_id) !== String(projectId.value)) {
      throw new Error('The task does not belong to this project.')
    }
    const initialAllocations =
      task.value?.financial_allocations ?? task.value?.allocations
    if (Array.isArray(initialAllocations)) {
      store.commit('allocations/SET_ITEMS', {
        taskId: taskId.value,
        items: initialAllocations,
      })
    }
  } catch (error) {
    loadError.value = error.message || 'Unable to load task finances.'
  } finally {
    loading.value = false
  }
})

const handleAllocated = (result) => {
  successMessage.value = 'Funds allocated successfully.'
  refreshWarning.value = result?.refreshWarning ?? ''
}
</script>

<style scoped>
.finance-page {
  max-width: 760px;
}

.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.page-head h1,
.page-head p {
  margin-top: 0;
}

.page-kicker {
  margin-bottom: 0.25rem;
  color: var(--color-primary);
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.state {
  padding: 1.5rem;
  text-align: center;
}

@media (max-width: 640px) {
  .page-head {
    flex-direction: column;
  }
}
</style>
