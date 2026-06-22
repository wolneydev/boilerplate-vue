<template>
  <div class="container report-page">
    <header class="page-head">
      <div>
        <p class="page-kicker">Planning</p>
        <h1>Reports</h1>
        <p class="muted">Review work by project, by task, or both in one report.</p>
      </div>
      <div class="head-actions">
        <router-link to="/projects">
          <button type="button" class="btn btn-ghost">Projects</button>
        </router-link>
        <router-link to="/calendar">
          <button type="button" class="btn btn-secondary">Schedule</button>
        </router-link>
      </div>
    </header>

    <form class="filters card" @submit.prevent="loadReport">
      <div class="field">
        <label for="report-type">Report type</label>
        <select id="report-type" v-model="form.type">
          <option value="projects">By project</option>
          <option value="tasks">By task</option>
          <option value="both">Projects and tasks</option>
        </select>
      </div>

      <div class="field">
        <label for="report-project">Project</label>
        <select id="report-project" v-model="form.projectId">
          <option value="">All projects</option>
          <option v-for="project in projects" :key="project.id" :value="project.id">
            {{ project.name }}
          </option>
        </select>
      </div>

      <div class="field">
        <label for="report-status">Status</label>
        <select id="report-status" v-model="form.status">
          <option value="">All statuses</option>
          <option v-for="status in statuses" :key="status.value" :value="status.value">
            {{ status.label }}
          </option>
        </select>
      </div>

      <div class="field">
        <label for="report-start">Start date</label>
        <input id="report-start" v-model="form.start" type="date" required />
      </div>

      <div class="field">
        <label for="report-end">End date</label>
        <input id="report-end" v-model="form.end" type="date" required />
      </div>

      <button type="submit" :disabled="loading">
        {{ loading ? 'Generating...' : 'Generate report' }}
      </button>
    </form>

    <p v-if="error" class="alert alert-error">{{ error }}</p>

    <section v-if="showProjectReport" class="section">
      <div class="section__head">
        <h2>Project report</h2>
        <span class="muted">{{ projectReport.length }} project(s)</span>
      </div>

      <div class="summary-grid">
        <article v-for="project in projectReport" :key="project.id" class="summary-card card">
          <div class="summary-card__head">
            <div>
              <h3>{{ project.name }}</h3>
              <p class="muted">{{ formatDate(project.starts_on) }} → {{ formatDate(project.expected_ends_on) }}</p>
            </div>
            <strong class="summary-card__total">{{ project.totalTasks }}</strong>
          </div>
          <div class="status-row">
            <span v-for="status in project.statuses" :key="status.value" class="status-pill">
              <span class="status-dot" :style="{ backgroundColor: status.color }" aria-hidden="true"></span>
              {{ status.label }}: {{ status.count }}
            </span>
          </div>
        </article>
      </div>
    </section>

    <section v-if="showTaskReport" class="section">
      <div class="section__head">
        <h2>Task report</h2>
        <span class="muted">{{ filteredTasks.length }} task(s)</span>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Task</th>
              <th>Project</th>
              <th>Date</th>
              <th>Time</th>
              <th>Priority</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="task in sortedTasks" :key="task.id">
              <td>
                <strong>{{ task.title }}</strong>
                <span v-if="task.location" class="muted task-detail">{{ task.location }}</span>
              </td>
              <td>{{ projectName(task.project_id) }}</td>
              <td>{{ formatDate(task.task_date) }}</td>
              <td>{{ formatTimeRange(task) }}</td>
              <td><PriorityBadge :priority="task.priority" /></td>
              <td><StatusBadge :status="task.status" /></td>
            </tr>
            <tr v-if="filteredTasks.length === 0">
              <td colspan="6" class="state muted">No tasks found for this report.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section v-if="showCombinedReport" class="section">
      <div class="section__head">
        <h2>Projects with tasks</h2>
        <span class="muted">Combined view</span>
      </div>

      <article v-for="project in combinedReport" :key="project.id" class="combined card">
        <div class="combined__head">
          <h3>{{ project.name }}</h3>
          <span class="muted">{{ project.tasks.length }} task(s)</span>
        </div>
        <ul v-if="project.tasks.length" class="task-list">
          <li v-for="task in project.tasks" :key="task.id">
            <span>
              <strong>{{ task.title }}</strong>
              <span class="muted"> · {{ formatDate(task.task_date) }} · {{ formatTimeRange(task) }}</span>
            </span>
            <StatusBadge :status="task.status" />
          </li>
        </ul>
        <p v-else class="muted empty-text">No tasks in this period.</p>
      </article>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useStore } from 'vuex'
import PriorityBadge from '@/modules/planning/components/PriorityBadge.vue'
import StatusBadge from '@/modules/planning/components/StatusBadge.vue'
import { reportsService } from '@/modules/planning/services/reports.service'
import { TASK_STATUSES, formatDate, toTimeInput } from '@/modules/planning/types/planning.types'

const store = useStore()

const today = new Date()
const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10)
const defaultEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10)

const form = reactive({
  type: 'both',
  projectId: '',
  status: '',
  start: defaultStart,
  end: defaultEnd,
})

const tasks = ref([])
const reportProjects = ref([])
const loading = ref(false)
const error = ref('')

const projects = computed(() => store.getters['projects/allProjects'])
const statuses = TASK_STATUSES
const selectedProjects = computed(() => {
  if (!form.projectId) return projects.value
  return projects.value.filter((project) => String(project.id) === String(form.projectId))
})

const showProjectReport = computed(() => form.type === 'projects' || form.type === 'both')
const showTaskReport = computed(() => form.type === 'tasks')
const showCombinedReport = computed(() => form.type === 'both')

const filteredTasks = computed(() => {
  if (!form.projectId) return tasks.value
  return tasks.value.filter((task) => String(taskProjectId(task)) === String(form.projectId))
})

const sortedTasks = computed(() =>
  [...filteredTasks.value].sort((a, b) => {
    const dateA = `${a.task_date ?? ''} ${a.starts_at ?? ''}`
    const dateB = `${b.task_date ?? ''} ${b.starts_at ?? ''}`
    return dateA.localeCompare(dateB)
  }),
)

const projectReport = computed(() =>
  reportProjects.value
    .filter((project) => !form.projectId || String(projectId(project)) === String(form.projectId))
    .map((project) => normalizeProjectReport(project)),
)

const combinedReport = computed(() =>
  projectReport.value.map((project) => ({
    ...project,
    tasks: sortedTasks.value.filter((task) => Number(task.project_id) === Number(project.id)),
  })),
)

onMounted(async () => {
  await store.dispatch('projects/fetchProjects')
  await loadReport()
})

const loadReport = async () => {
  if (!form.start || !form.end) return
  loading.value = true
  error.value = ''
  try {
    const result = await reportsService.show({
      reportType: form.type,
      status: form.status,
      startDate: form.start,
      endDate: form.end,
    })
    tasks.value = Array.isArray(result?.tasks) ? result.tasks : []
    reportProjects.value = Array.isArray(result?.projects) ? result.projects : selectedProjects.value
  } catch (err) {
    error.value = err.message || 'Error generating the report.'
  } finally {
    loading.value = false
  }
}

const projectName = (projectId) =>
  projects.value.find((project) => Number(project.id) === Number(projectId))?.name ?? '—'

const projectId = (project) => project?.id ?? project?.project_id

const taskProjectId = (task) => task?.project_id ?? task?.project?.id

const statusCount = (project, status, projectTasks) => {
  const statusRows = Array.isArray(project.statuses) ? project.statuses : []
  const statusRow = statusRows.find((item) => (item.value ?? item.status) === status.value)
  if (statusRow) return Number(statusRow.count ?? statusRow.total ?? statusRow.tasks_count ?? 0)

  const statusCounts = project.status_counts ?? project.statusCounts ?? project.tasks_by_status
  if (statusCounts && typeof statusCounts === 'object') {
    return Number(statusCounts[status.value] ?? 0)
  }

  return projectTasks.filter((task) => task.status === status.value).length
}

const normalizeProjectReport = (project) => {
  const id = projectId(project)
  const baseProject = projects.value.find((item) => String(item.id) === String(id)) ?? {}
  const projectTasks = filteredTasks.value.filter((task) => String(taskProjectId(task)) === String(id))

  return {
    ...baseProject,
    ...project,
    id,
    name: project.name ?? baseProject.name ?? '—',
    starts_on: project.starts_on ?? baseProject.starts_on,
    expected_ends_on: project.expected_ends_on ?? baseProject.expected_ends_on,
    totalTasks: Number(
      project.totalTasks ??
        project.total_tasks ??
        project.tasks_count ??
        project.count ??
        projectTasks.length,
    ),
    statuses: TASK_STATUSES.map((status) => ({
      ...status,
      count: statusCount(project, status, projectTasks),
    })),
  }
}

const formatTimeRange = (task) => {
  const start = toTimeInput(task.starts_at)
  const end = toTimeInput(task.ends_at)
  return end ? `${start} – ${end}` : start || '—'
}
</script>

<style scoped>
.page-head {
  display: flex;
  align-items: flex-start;
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
  flex-wrap: wrap;
  gap: 0.6rem;
}

.filters {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr)) auto;
  gap: 1rem;
  align-items: end;
  margin-bottom: 1rem;
  padding: 1.25rem;
}

.section {
  margin-top: 2rem;
}

.section__head,
.summary-card__head,
.combined__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}

.section__head {
  margin-bottom: 0.9rem;
}

.section__head h2,
.summary-card h3,
.combined h3 {
  margin: 0;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
}

.summary-card {
  padding: 1.25rem;
}

.summary-card__total {
  display: grid;
  place-items: center;
  min-width: 44px;
  height: 44px;
  padding: 0 0.7rem;
  border-radius: var(--radius-md);
  color: var(--color-primary);
  background: var(--color-primary-soft);
  font-size: 1.25rem;
}

.status-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-top: 1rem;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.82rem;
  color: var(--color-text-muted);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.table-wrap {
  overflow-x: auto;
}

.task-detail {
  display: block;
  font-size: 0.8rem;
}

.combined {
  padding: 1.25rem;
}

.combined + .combined {
  margin-top: 1rem;
}

.task-list {
  display: grid;
  gap: 0.6rem;
  padding: 0;
  margin: 1rem 0 0;
  list-style: none;
}

.task-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 0.6rem;
  border-bottom: 1px solid var(--color-border);
}

.task-list li:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

.empty-text {
  margin: 0.75rem 0 0;
}

.state {
  padding: 1.5rem;
  text-align: center;
}

.alert {
  margin-bottom: 1rem;
}

@media (max-width: 860px) {
  .filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .page-head,
  .section__head,
  .summary-card__head,
  .combined__head,
  .task-list li {
    flex-direction: column;
    align-items: stretch;
  }

  .filters {
    grid-template-columns: 1fr;
  }
}
</style>
