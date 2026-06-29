<template>
  <div class="container calendar-page">
    <header class="page-head">
      <div>
        <p class="page-kicker">Planning</p>
        <h1>Task schedule</h1>
      </div>
      <div class="head-actions">
        <router-link to="/projects">
          <button type="button" class="btn btn-ghost">Projects</button>
        </router-link>
        <button type="button" @click="openCreate()">New task</button>
      </div>
    </header>

    <TaskFilters v-model="filters" :projects="projects" @change="onFilterChange" />

    <div class="legend">
      <span v-for="status in statuses" :key="status.value" class="legend__item">
        <span class="legend__dot" :style="{ backgroundColor: status.color }"></span>
        {{ status.label }}
      </span>
    </div>

    <p v-if="taskError" class="alert alert-error">{{ taskError }}</p>

    <div class="calendar-shell">
      <div v-if="loading" class="calendar-loading muted">Updating tasks...</div>
      <TaskCalendar
        :events="events"
        @range-change="onRangeChange"
        @date-select="openCreate"
        @event-select="openEdit"
      />
    </div>

    <TaskFormModal
      :open="modalOpen"
      :task="selectedTask"
      :prefill="prefill"
      :projects="projects"
      @close="closeModal"
      @saved="closeModal"
      @deleted="closeModal"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useStore } from 'vuex'
import TaskCalendar from '@/modules/planning/components/TaskCalendar.vue'
import TaskFilters from '@/modules/planning/components/TaskFilters.vue'
import TaskFormModal from '@/modules/planning/components/TaskFormModal.vue'
import { TASK_STATUSES } from '@/modules/planning/types/planning.types'

const store = useStore()

const statuses = TASK_STATUSES
const projects = computed(() => store.getters['projects/allProjects'])
const events = computed(() => store.getters['tasks/calendarEvents'])
const loading = computed(() => store.getters['tasks/isLoading'])
const taskError = computed(() => store.getters['tasks/taskError'])

const filters = ref({ ...store.getters['tasks/filters'] })

const modalOpen = ref(false)
const selectedTask = ref(null)
const prefill = ref({})

onMounted(() => store.dispatch('projects/fetchProjects'))

const onRangeChange = (range) => {
  store.dispatch('tasks/setRange', range)
}

const onFilterChange = (value) => {
  store.dispatch('tasks/applyFilters', value)
}

const openCreate = (prefillData = {}) => {
  selectedTask.value = null
  prefill.value = prefillData || {}
  modalOpen.value = true
}

const openEdit = (taskId) => {
  const task = store.getters['tasks/allTasks'].find((t) => String(t.id) === String(taskId))
  if (!task) return
  selectedTask.value = task
  prefill.value = {}
  modalOpen.value = true
}

const closeModal = () => {
  modalOpen.value = false
  selectedTask.value = null
  prefill.value = {}
}
</script>

<style scoped>
.page-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
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

.head-actions {
  display: flex;
  gap: 0.6rem;
}

.head-actions a {
  display: inline-flex;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin: 1rem 0;
  font-size: 0.82rem;
  color: var(--color-text-muted);
}

.legend__item {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.legend__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.calendar-shell {
  position: relative;
}

.calendar-loading {
  position: absolute;
  top: 1.5rem;
  right: 1.75rem;
  z-index: 5;
  font-size: 0.82rem;
}

.alert {
  margin-bottom: 1rem;
}

@media (max-width: 600px) {
  .page-head {
    flex-direction: column;
    align-items: stretch;
  }
  .head-actions {
    flex-wrap: wrap;
  }
  .head-actions a,
  .head-actions button {
    flex: 1 1 100%;
    width: 100%;
  }

  .calendar-loading {
    position: static;
    margin-bottom: 0.75rem;
    text-align: right;
  }
}
</style>
