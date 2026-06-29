<template>
  <div class="container dependency-map-page">
    <header class="page-head">
      <div>
        <p class="page-kicker">Planning</p>
        <h1>Dependency map</h1>
        <p class="muted">Interactive flow based on task priority, status and dependencies.</p>
      </div>
      <div class="head-actions">
        <router-link to="/reports">
          <button type="button" class="btn btn-ghost">Reports</button>
        </router-link>
        <router-link to="/calendar">
          <button type="button" class="btn btn-secondary">Schedule</button>
        </router-link>
      </div>
    </header>

    <form class="filters card" @submit.prevent="loadReport">
      <div class="field">
        <label for="dependency-project">Project</label>
        <select id="dependency-project" v-model="form.projectId">
          <option value="">All projects</option>
          <option v-for="project in projects" :key="project.id" :value="project.id">
            {{ project.name }}
          </option>
        </select>
      </div>

      <div class="field">
        <label for="dependency-status">Status</label>
        <select id="dependency-status" v-model="form.status">
          <option value="">All statuses</option>
          <option v-for="status in statuses" :key="status.value" :value="status.value">
            {{ status.label }}
          </option>
        </select>
      </div>

      <div class="field">
        <label for="dependency-start">Start date</label>
        <input id="dependency-start" v-model="form.start" type="date" required />
      </div>

      <div class="field">
        <label for="dependency-end">End date</label>
        <input id="dependency-end" v-model="form.end" type="date" required />
      </div>

      <div class="filters__actions">
        <button type="submit" :disabled="loading">
          {{ loading ? 'Generating...' : 'Generate map' }}
        </button>
      </div>
    </form>

    <p v-if="error" class="alert alert-error">{{ error }}</p>

    <section v-if="dependencyTasks.length" class="section dependency-section">
      <div class="section__head">
        <div>
          <h2>Kanban by project</h2>
          <p class="muted">Tasks grouped by project and current status.</p>
        </div>
        <span class="muted">{{ dependencyTasks.length }} task(s)</span>
      </div>

      <div class="kanban-projects">
        <article v-for="project in dependencyKanbanProjects" :key="project.id" class="kanban-project card">
          <div class="kanban-project__head">
            <div>
              <p class="page-kicker">Project</p>
              <h3>{{ project.name }}</h3>
            </div>
            <span class="muted">{{ project.totalTasks }} task(s)</span>
          </div>

          <div class="kanban-board">
            <section v-for="column in project.columns" :key="column.key" class="kanban-column">
              <div class="kanban-column__head">
                <h4>{{ column.label }}</h4>
                <span>{{ column.tasks.length }}</span>
              </div>

              <ul v-if="column.tasks.length" class="kanban-task-list">
                <li v-for="task in column.tasks" :key="task.id" class="kanban-task">
                  <button type="button" class="kanban-task__button" @click="openEdit(task)">
                    <div>
                      <strong>{{ task.title }}</strong>
                      <span class="muted">{{ formatDate(taskDate(task)) }}</span>
                    </div>
                    <div class="kanban-task__meta">
                      <PriorityBadge :priority="task.priority" />
                      <StatusBadge :status="task.status" />
                    </div>
                  </button>
                </li>
              </ul>

              <p v-else class="muted empty-text">No tasks.</p>
            </section>
          </div>
        </article>
      </div>

      <div class="section__head flow-head">
        <div>
          <h2>Dependency flow</h2>
          <p class="muted">Zoom, pan and inspect dependencies between tasks.</p>
        </div>
      </div>

      <div class="dependency-card card">
        <VueFlow
          v-model:nodes="flowNodes"
          v-model:edges="flowEdges"
          class="dependency-flow"
          :fit-view-on-init="true"
          :max-zoom="1.8"
          :min-zoom="0.25"
          :nodes-connectable="false"
          :nodes-draggable="true"
          :pan-on-scroll="true"
        >
          <Background pattern-color="#d8cdbd" :gap="18" />
          <Controls position="bottom-right" />

          <template #node-task="{ data, selected }">
            <article
              class="task-node"
              :class="[`task-node--${data.status}`, `task-node-priority--${data.priority}`, { 'is-selected': selected }]"
              role="button"
              tabindex="0"
              @click="openEditById(data.taskId)"
              @keydown.enter.prevent="openEditById(data.taskId)"
              @keydown.space.prevent="openEditById(data.taskId)"
            >
              <Handle type="target" :position="Position.Left" />
              <Handle type="source" :position="Position.Right" />
              <div class="task-node__head">
                <span class="task-node__project">{{ data.projectName }}</span>
                <span class="task-node__date">{{ formatDate(data.date) }}</span>
              </div>
              <h3>{{ data.title }}</h3>
              <div class="task-node__meta">
                <PriorityBadge :priority="data.priority" />
                <StatusBadge :status="data.status" />
              </div>
              <p class="task-node__next">
                {{ data.nextCount ? `${data.nextCount} dependency link(s)` : 'No outgoing dependencies' }}
              </p>
            </article>
          </template>
        </VueFlow>
      </div>
    </section>

    <p v-else-if="!loading" class="state muted card">No tasks found for this dependency map.</p>

    <TaskFormModal
      :open="modalOpen"
      :task="selectedTask"
      :prefill="prefill"
      :projects="projects"
      @close="closeModal"
      @saved="handleTaskChanged"
      @deleted="handleTaskChanged"
    />
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useStore } from 'vuex'
import { Handle, MarkerType, Position, useVueFlow, VueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import PriorityBadge from '@/modules/planning/components/PriorityBadge.vue'
import StatusBadge from '@/modules/planning/components/StatusBadge.vue'
import TaskFormModal from '@/modules/planning/components/TaskFormModal.vue'
import { reportsService } from '@/modules/planning/services/reports.service'
import { TASK_STATUSES, formatDate } from '@/modules/planning/types/planning.types'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'

const store = useStore()
const { fitView } = useVueFlow()
let elkInstance = null
let layoutRun = 0

const today = new Date()
const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10)
const defaultEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10)
const FLOW_NODE_WIDTH = 240
const FLOW_NODE_HEIGHT = 142
const KANBAN_COLUMNS = [
  { key: 'todo', label: 'To do', statuses: ['pending'] },
  { key: 'doing', label: 'Doing', statuses: ['in_progress'] },
  { key: 'done', label: 'Done', statuses: ['completed'] },
  { key: 'cancelled', label: 'Cancelled', statuses: ['cancelled'] },
]
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
  projectId: '',
  status: '',
  start: defaultStart,
  end: defaultEnd,
})

const tasks = ref([])
const flowNodes = ref([])
const flowEdges = ref([])
const loading = ref(false)
const error = ref('')
const modalOpen = ref(false)
const selectedTask = ref(null)
const prefill = ref({})

const projects = computed(() => store.getters['projects/allProjects'])
const statuses = TASK_STATUSES

const filteredTasks = computed(() => {
  if (!form.projectId) return tasks.value
  return tasks.value.filter((task) => String(taskProjectId(task)) === String(form.projectId))
})

const dependencyTasks = computed(() =>
  [...filteredTasks.value].sort((a, b) => {
    const dateA = `${taskDate(a) ?? ''} ${a.starts_at ?? ''}`
    const dateB = `${taskDate(b) ?? ''} ${b.starts_at ?? ''}`
    return dateA.localeCompare(dateB)
  }),
)

const dependencyKanbanProjects = computed(() => {
  const projectsById = new Map()

  dependencyTasks.value.forEach((task) => {
    const id = taskProjectId(task) ?? 'unassigned'

    if (!projectsById.has(String(id))) {
      projectsById.set(String(id), {
        id,
        name: task.project?.name ?? projectName(id),
        tasks: [],
      })
    }

    projectsById.get(String(id)).tasks.push(task)
  })

  return [...projectsById.values()].map((project) => ({
    ...project,
    totalTasks: project.tasks.length,
    columns: KANBAN_COLUMNS.map((column) => ({
      ...column,
      tasks: project.tasks.filter((task) => column.statuses.includes(task.status)),
    })),
  }))
})

onMounted(async () => {
  await store.dispatch('projects/fetchProjects')
  await loadReport()
})

watch(dependencyTasks, () => {
  updateFlowLayout()
}, { deep: true })

const loadReport = async () => {
  if (!form.start || !form.end) return false
  loading.value = true
  error.value = ''
  try {
    const result = await reportsService.show({
      reportType: 'both',
      projectId: form.projectId,
      status: form.status,
      startDate: form.start,
      endDate: form.end,
    })
    const resultProject = result?.project ?? null
    tasks.value = Array.isArray(result?.tasks)
      ? result.tasks.map((task) => normalizeReportTask(task, resultProject))
      : []
    return true
  } catch (err) {
    error.value = err.message || 'Error generating the dependency map.'
    return false
  } finally {
    loading.value = false
  }
}

const projectName = (projectId) =>
  projects.value.find((project) => Number(project.id) === Number(projectId))?.name ?? '—'

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

const openEdit = (task) => {
  selectedTask.value = task
  prefill.value = {}
  modalOpen.value = true
}

const openEditById = (taskId) => {
  const task = tasks.value.find((item) => String(item.id) === String(taskId))
  if (task) openEdit(task)
}

const closeModal = () => {
  modalOpen.value = false
  selectedTask.value = null
  prefill.value = {}
}

const handleTaskChanged = async () => {
  closeModal()
  await loadReport()
}

const taskNodeData = (task) => ({
  taskId: task.id,
  title: task.title,
  date: taskDate(task),
  priority: task.priority,
  status: task.status,
  projectName: task.project?.name ?? projectName(taskProjectId(task)),
  nextCount: task.next?.length ?? 0,
})

const getElk = async () => {
  if (!elkInstance) {
    const { default: ELK } = await import('elkjs/lib/elk.bundled.js')
    elkInstance = new ELK()
  }

  return elkInstance
}

const updateFlowLayout = async () => {
  const currentRun = ++layoutRun
  const graphTasks = dependencyTasks.value
  const taskIds = new Set(graphTasks.map((task) => String(task.id)))

  if (!graphTasks.length) {
    flowNodes.value = []
    flowEdges.value = []
    return
  }

  const elkEdges = graphTasks.flatMap((task) =>
    (task.next ?? [])
      .filter((nextId) => taskIds.has(String(nextId)))
      .map((nextId) => ({
        id: `edge-${task.id}-${nextId}`,
        sources: [String(task.id)],
        targets: [String(nextId)],
      })),
  )

  const elk = await getElk()
  const layout = await elk.layout({
    id: 'report-dependencies',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.layered.spacing.nodeNodeBetweenLayers': '90',
      'elk.spacing.nodeNode': '60',
    },
    children: graphTasks.map((task) => ({
      id: String(task.id),
      width: FLOW_NODE_WIDTH,
      height: FLOW_NODE_HEIGHT,
    })),
    edges: elkEdges,
  })

  if (currentRun !== layoutRun) return

  const layoutById = new Map((layout.children ?? []).map((node) => [node.id, node]))

  flowNodes.value = graphTasks.map((task) => {
    const layoutNode = layoutById.get(String(task.id))

    return {
      id: String(task.id),
      type: 'task',
      position: {
        x: layoutNode?.x ?? 0,
        y: layoutNode?.y ?? 0,
      },
      data: taskNodeData(task),
    }
  })

  flowEdges.value = elkEdges.map((edge) => ({
    id: edge.id,
    source: edge.sources[0],
    target: edge.targets[0],
    type: 'smoothstep',
    animated: true,
    markerEnd: MarkerType.ArrowClosed,
  }))

  await nextTick()
  window.requestAnimationFrame(() => {
    fitView({ padding: 0.18, duration: 300 })
  })
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

.head-actions,
.filters__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.head-actions a {
  display: inline-flex;
}

.filters {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr)) auto;
  gap: 1rem;
  align-items: end;
  margin-bottom: 1rem;
  padding: 1.25rem;
}

.section {
  margin-top: 2rem;
}

.section__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.9rem;
}

.section__head h2,
.kanban-project__head h3 {
  margin: 0;
}

.section__head p {
  margin: 0.25rem 0 0;
}

.flow-head {
  margin-top: 1.5rem;
}

.kanban-projects {
  display: grid;
  gap: 1rem;
  margin-bottom: 1rem;
}

.kanban-project {
  padding: 1.25rem;
}

.kanban-project__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.kanban-board {
  display: grid;
  grid-template-columns: repeat(4, minmax(210px, 1fr));
  gap: 0.85rem;
  overflow-x: auto;
  padding-bottom: 0.2rem;
  -webkit-overflow-scrolling: touch;
}

.kanban-column {
  min-width: 210px;
  padding: 0.8rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: rgba(255, 253, 249, 0.72);
}

.kanban-column__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.kanban-column__head h4 {
  margin: 0;
  color: var(--color-text);
  font-size: 0.9rem;
}

.kanban-column__head span {
  display: grid;
  place-items: center;
  min-width: 28px;
  height: 28px;
  padding: 0 0.45rem;
  border-radius: 999px;
  color: var(--color-primary);
  background: var(--color-primary-soft);
  font-size: 0.78rem;
  font-weight: 700;
}

.kanban-task-list {
  display: grid;
  gap: 0.65rem;
  padding: 0;
  margin: 0;
  list-style: none;
}

.kanban-task {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.kanban-task__button {
  display: grid;
  width: 100%;
  gap: 0.65rem;
  padding: 0.75rem;
  color: inherit;
  text-align: left;
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

.kanban-task__button:hover,
.kanban-task__button:focus-visible {
  background: var(--color-primary-soft);
  box-shadow: none;
}

.kanban-task__button strong,
.kanban-task__button span {
  display: block;
}

.kanban-task__button strong {
  margin-bottom: 0.25rem;
  color: var(--color-text);
}

.kanban-task__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.dependency-card {
  height: min(68vh, 620px);
  min-height: 420px;
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.dependency-flow {
  width: 100%;
  height: 100%;
  background:
    radial-gradient(circle at top left, rgba(201, 168, 106, 0.12), transparent 34%),
    var(--color-surface);
}

:deep(.vue-flow__edge-path) {
  stroke: var(--color-primary);
  stroke-width: 2;
}

:deep(.vue-flow__edge.animated .vue-flow__edge-path) {
  stroke-dasharray: 7;
  animation-duration: 1.4s;
}

:deep(.vue-flow__handle) {
  width: 9px;
  height: 9px;
  border: 2px solid var(--color-surface);
  background: var(--color-primary);
}

:deep(.vue-flow__controls) {
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-sm);
}

:deep(.vue-flow__controls-button) {
  border-bottom-color: var(--color-border);
  background: var(--color-surface);
}

.task-node {
  width: 240px;
  min-height: 142px;
  padding: 0.9rem;
  border: 1px solid var(--color-border);
  border-left: 5px solid var(--color-primary);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.task-node:hover,
.task-node:focus-visible,
.task-node.is-selected {
  border-color: var(--color-primary);
  box-shadow: 0 14px 32px rgba(58, 48, 37, 0.18);
  transform: translateY(-1px);
}

.task-node:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 3px;
}

.task-node h3 {
  margin: 0.5rem 0 0.7rem;
  color: var(--color-text);
  font-size: 1rem;
  line-height: 1.25;
}

.task-node__head,
.task-node__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.task-node__project,
.task-node__date,
.task-node__next {
  color: var(--color-text-muted);
  font-size: 0.75rem;
}

.task-node__project {
  max-width: 130px;
  overflow: hidden;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.task-node__meta {
  justify-content: flex-start;
  flex-wrap: wrap;
}

.task-node__next {
  margin: 0.7rem 0 0;
}

.task-node--pending {
  border-left-color: #c9a86a;
}

.task-node--in_progress {
  border-left-color: #2f80ed;
}

.task-node--completed {
  border-left-color: #6e8b7b;
}

.task-node--cancelled {
  border-left-color: #b25a52;
}

.task-node-priority--high {
  box-shadow: 0 12px 28px rgba(178, 90, 82, 0.16);
}

.task-node-priority--medium {
  box-shadow: 0 12px 28px rgba(201, 168, 106, 0.14);
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

  .dependency-card {
    height: 520px;
  }

  .kanban-board {
    grid-template-columns: repeat(4, minmax(220px, 1fr));
  }
}

@media (max-width: 600px) {
  .page-head,
  .section__head,
  .kanban-project__head {
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

  .dependency-card {
    min-height: 360px;
  }
}
</style>
