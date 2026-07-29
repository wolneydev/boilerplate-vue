<template>
  <div class="container report-page">
    <header class="page-head">
      <div>
        <p class="page-kicker">Planning</p>
        <h1>Reports</h1>
        <p class="muted">Review work by project, by task, or both in one report.</p>
      </div>
      <div class="head-actions">
        <router-link to="/reports/dependencies">
          <button type="button" class="btn btn-ghost">Dependency map</button>
        </router-link>
        <router-link to="/projects">
          <button type="button" class="btn btn-ghost">Projects</button>
        </router-link>
        <router-link to="/calendar">
          <button type="button" class="btn btn-secondary">Schedule</button>
        </router-link>
      </div>
    </header>

    <form class="filters card no-print" @submit.prevent="loadReport">
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

      <div class="filters__actions">
        <button type="submit" :disabled="loading">
          {{ loading ? 'Generating...' : 'Generate report' }}
        </button>
        <button type="button" class="btn btn-secondary" :disabled="loading" @click="generatePdf">
           PDF
        </button>
      </div>
    </form>

    <p v-if="error" class="alert alert-error">{{ error }}</p>

    <div class="report-print-area">
      <section class="print-cover">
        <p class="page-kicker">Northloom</p>
        <h1>{{ reportTitle }}</h1>
        <dl class="print-meta">
          <div>
            <dt>Period</dt>
            <dd>{{ reportPeriod }}</dd>
          </div>
          <div>
            <dt>Project</dt>
            <dd>{{ selectedProjectName }}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{{ selectedStatusLabel }}</dd>
          </div>
          <div>
            <dt>Generated at</dt>
            <dd>{{ generatedAt }}</dd>
          </div>
        </dl>
      </section>

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
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { useStore } from 'vuex'
import PriorityBadge from '@/modules/planning/components/PriorityBadge.vue'
import StatusBadge from '@/modules/planning/components/StatusBadge.vue'
import { reportsService } from '@/modules/planning/services/reports.service'
import { TASK_STATUSES, formatDate, toTimeInput } from '@/modules/planning/types/planning.types'

const store = useStore()

const today = new Date()
const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10)
const defaultEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10)
const reportTypeLabels = {
  projects: 'Project report',
  tasks: 'Task report',
  both: 'Projects and tasks report',
}
const STATUS_ALIASES = {
  'to do': 'pending',
  todo: 'pending',
  doing: 'in_progress',
  'in progress': 'in_progress',
  inprogress: 'in_progress',
  complete: 'completed',
  done: 'completed',
  canceled: 'cancelled',
}

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
const selectedProjectName = computed(() => {
  if (!form.projectId) return 'All projects'
  return projectName(form.projectId)
})
const selectedStatusLabel = computed(
  () => statuses.find((status) => status.value === form.status)?.label ?? 'All statuses',
)
const reportTitle = computed(() => reportTypeLabels[form.type] ?? 'Report')
const reportPeriod = computed(() => `${formatDate(form.start)} to ${formatDate(form.end)}`)
const generatedAt = computed(() => {
  const now = new Date()
  return `${formatDate(now.toISOString())} ${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes(),
  ).padStart(2, '0')}`
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
  if (!form.start || !form.end) return false
  loading.value = true
  error.value = ''
  try {
    const result = await reportsService.show({
      reportType: form.type,
      projectId: form.projectId,
      status: form.status,
      startDate: form.start,
      endDate: form.end,
    })
    const resultProject = result?.project ?? null
    tasks.value = Array.isArray(result?.tasks)
      ? result.tasks.map((task) => normalizeReportTask(task, resultProject))
      : []
    reportProjects.value = normalizeReportProjects(result, resultProject)
    return true
  } catch (err) {
    error.value = err.message || 'Error generating the report.'
    return false
  } finally {
    loading.value = false
  }
}

const generatePdf = async () => {
  const loaded = await loadReport()
  if (!loaded) return

  await nextTick()
  window.print()
}

const projectName = (projectId) =>
  projects.value.find((project) => Number(project.id) === Number(projectId))?.name ?? '—'

const projectId = (project) => project?.id ?? project?.project_id

const taskProjectId = (task) => task?.project_id ?? task?.project?.id

const taskDate = (task) => task?.task_date ?? task?.date

const normalizeReportTask = (task, fallbackProject = null) => ({
  ...task,
  project: task.project ?? fallbackProject,
  project_id: taskProjectId(task) ?? fallbackProject?.id ?? form.projectId ?? null,
  task_date: taskDate(task),
  status: normalizeTaskStatus(task.status),
  next: Array.isArray(task.next) ? task.next : [],
})

const normalizeTaskStatus = (status) => {
  if (!status) return status
  const normalized = String(status).trim().toLowerCase().replaceAll('-', '_')
  return STATUS_ALIASES[normalized] ?? normalized
}

const normalizeReportProjects = (result, resultProject) => {
  if (Array.isArray(result?.projects)) return result.projects
  if (resultProject) return [resultProject]
  return selectedProjects.value
}

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

.head-actions a {
  display: inline-flex;
}

.filters {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr)) auto;
  gap: 1rem;
  align-items: end;
  margin-bottom: 1rem;
  padding: 1.25rem;
}

.filters__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.print-cover {
  display: none;
}

.print-meta {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.8rem;
  margin: 1rem 0 0;
}

.print-meta div {
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

.print-meta dt {
  margin-bottom: 0.2rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.print-meta dd {
  margin: 0;
  font-weight: 600;
  color: var(--color-text);
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
  border-radius: var(--radius-md);
  -webkit-overflow-scrolling: touch;
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

  .filters__actions {
    grid-column: 1 / -1;
  }

  .print-meta {
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

  .head-actions a,
  .head-actions button,
  .filters button {
    width: 100%;
  }

  .filters__actions {
    flex-direction: column;
  }

  .print-meta {
    grid-template-columns: 1fr;
  }
}

@media print {
  @page {
    size: A4;
    margin: 14mm;
  }

  :global(body) {
    color: #1f1f1f;
    background: #fff !important;
    background-image: none !important;
  }

  :global(.app-header),
  .no-print,
  .head-actions,
  .alert {
    display: none !important;
  }

  .report-page {
    max-width: none;
    padding: 0;
  }

  .page-head {
    display: none;
  }

  .print-cover {
    display: block;
    padding-bottom: 1rem;
    margin-bottom: 1.2rem;
    border-bottom: 1px solid #d8d8d8;
  }

  .print-cover .page-kicker {
    color: #666;
  }

  .print-cover h1 {
    margin: 0;
    color: #1f1f1f;
    font-size: 24pt;
  }

  .print-meta {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.45rem;
    break-inside: avoid;
  }

  .print-meta div {
    padding: 0.45rem 0;
    border: 0;
    border-bottom: 1px solid #e3e3e3;
    border-radius: 0;
  }

  .print-meta dt {
    color: #666;
    font-size: 8pt;
  }

  .print-meta dd {
    color: #1f1f1f;
    font-size: 10pt;
  }

  .section {
    margin-top: 1.1rem;
    break-inside: avoid;
  }

  .section__head {
    margin-bottom: 0.45rem;
    border-bottom: 1px solid #d8d8d8;
  }

  .section__head h2,
  .summary-card h3,
  .combined h3 {
    color: #1f1f1f;
  }

  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.65rem;
  }

  .card,
  .summary-card,
  .combined {
    padding: 0.75rem;
    border: 1px solid #d8d8d8;
    border-radius: 8px;
    box-shadow: none;
    break-inside: avoid;
  }

  .summary-card__total {
    color: #1f1f1f;
    background: #f2f2f2;
  }

  .status-row {
    gap: 0.45rem;
  }

  .status-pill,
  .muted,
  .task-detail {
    color: #555;
  }

  .table-wrap {
    overflow: visible;
    border-radius: 0;
  }

  table {
    min-width: 0;
    border: 1px solid #d8d8d8;
    border-radius: 0;
    font-size: 9pt;
  }

  thead {
    display: table-header-group;
  }

  thead th {
    color: #333;
    background: #f2f2f2;
    border-bottom: 1px solid #d8d8d8;
  }

  thead th,
  tbody td {
    padding: 0.35rem 0.45rem;
    border-color: #e3e3e3;
  }

  tbody tr {
    break-inside: avoid;
  }

  tbody tr:hover {
    background: transparent;
  }

  .task-list {
    gap: 0.35rem;
  }

  .task-list li {
    padding-bottom: 0.35rem;
    border-color: #e3e3e3;
    break-inside: avoid;
  }

  :deep(.badge) {
    color: #1f1f1f !important;
    background: #f2f2f2 !important;
    border-color: #d8d8d8 !important;
  }
}
</style>
