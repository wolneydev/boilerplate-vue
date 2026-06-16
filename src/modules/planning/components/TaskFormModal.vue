<template>
  <div v-if="open" class="modal" @mousedown.self="close">
    <div class="modal__dialog card" role="dialog" aria-modal="true">
      <header class="modal__head">
        <div>
          <p class="modal__kicker">
            {{ isEditing ? 'Edit' : 'New' }}
            <span v-if="loadingTask" class="modal__loading">· loading…</span>
          </p>
          <h2 class="modal__title">{{ isEditing ? 'Edit task' : 'New task' }}</h2>
        </div>
        <button type="button" class="modal__close" aria-label="Close" @click="close">×</button>
      </header>

      <p v-if="successMessage" class="alert alert-success">{{ successMessage }}</p>
      <p v-if="errorMessage" class="alert alert-error">{{ errorMessage }}</p>

      <form class="form" @submit.prevent="save">
        <div class="field">
          <label for="task-project">Project *</label>
          <select
            id="task-project"
            v-model.number="form.project_id"
            :disabled="!!lockedProjectId"
            required
          >
            <option :value="null" disabled>Select a project</option>
            <option v-for="project in projects" :key="project.id" :value="project.id">
              {{ project.name }}
            </option>
          </select>
          <p v-if="fieldErrors.project_id" class="field__error">{{ fieldErrors.project_id }}</p>
        </div>

        <div class="field">
          <label for="task-title">Task name *</label>
          <input id="task-title" v-model="form.title" placeholder="e.g. Kickoff meeting" required />
          <p v-if="fieldErrors.title" class="field__error">{{ fieldErrors.title }}</p>
        </div>

        <div class="grid-3">
          <div class="field">
            <label for="task-date">Date *</label>
            <input id="task-date" v-model="form.task_date" type="date" required />
            <p v-if="fieldErrors.task_date" class="field__error">{{ fieldErrors.task_date }}</p>
          </div>
          <div class="field">
            <label for="task-start">Start time *</label>
            <input id="task-start" v-model="form.starts_at" type="time" required />
            <p v-if="fieldErrors.starts_at" class="field__error">{{ fieldErrors.starts_at }}</p>
          </div>
          <div class="field">
            <label for="task-end">End time</label>
            <input id="task-end" v-model="form.ends_at" type="time" />
            <p v-if="fieldErrors.ends_at" class="field__error">{{ fieldErrors.ends_at }}</p>
          </div>
        </div>

        <div class="grid-2">
          <div class="field">
            <label for="task-priority">Priority</label>
            <select id="task-priority" v-model="form.priority">
              <option value="">No priority</option>
              <option v-for="p in priorities" :key="p.value" :value="p.value">{{ p.label }}</option>
            </select>
          </div>
          <div class="field">
            <label for="task-status">Status</label>
            <select id="task-status" v-model="form.status">
              <option v-for="s in statuses" :key="s.value" :value="s.value">{{ s.label }}</option>
            </select>
          </div>
        </div>

        <div class="field">
          <label for="task-location">Location</label>
          <input id="task-location" v-model="form.location" placeholder="e.g. Room 2 / Online" />
        </div>

        <div class="field">
          <label for="task-notes">Notes</label>
          <textarea id="task-notes" v-model="form.notes" rows="3" placeholder="Optional details..."></textarea>
        </div>

        <div class="notify">
          <label class="notify__check">
            <input type="checkbox" v-model="form.notify" />
            <span>Notify</span>
          </label>
          <div v-if="form.notify" class="field notify__field">
            <label for="task-notify-min">Reminder</label>
            <select id="task-notify-min" v-model.number="form.notify_minutes_before">
              <option :value="null" disabled>Select</option>
              <option v-for="opt in notifyOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>
        </div>

        <div class="modal__actions">
          <button
            v-if="isEditing"
            type="button"
            class="btn btn-danger"
            :disabled="saving || deleting"
            @click="remove"
          >
            {{ deleting ? 'Deleting...' : 'Delete' }}
          </button>
          <span class="spacer"></span>
          <button type="button" class="btn btn-ghost" :disabled="saving || deleting" @click="close">
            Cancel
          </button>
          <button type="submit" :disabled="saving || deleting">
            {{ saving ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useStore } from 'vuex'
import {
  TASK_STATUSES,
  TASK_PRIORITIES,
  NOTIFY_OPTIONS,
  toDateInput,
  toTimeInput,
} from '@/modules/planning/types/planning.types'
import { tasksService } from '@/modules/planning/services/tasks.service'

const props = defineProps({
  open: { type: Boolean, default: false },
  // Existing task to edit (with id). Null/empty when creating.
  task: { type: Object, default: null },
  // Prefill for new tasks (e.g. from a calendar date/time selection).
  prefill: { type: Object, default: () => ({}) },
  projects: { type: Array, default: () => [] },
  // When set, the project select is pre-filled and locked (inside a project).
  lockedProjectId: { type: Number, default: null },
})

const emit = defineEmits(['close', 'saved', 'deleted'])

const store = useStore()

const statuses = TASK_STATUSES
const priorities = TASK_PRIORITIES
const notifyOptions = NOTIFY_OPTIONS

const saving = ref(false)
const deleting = ref(false)
const loadingTask = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const fieldErrors = reactive({})

const isEditing = computed(() => !!props.task?.id)

const emptyForm = () => ({
  project_id: props.lockedProjectId ?? null,
  title: '',
  task_date: '',
  starts_at: '',
  ends_at: '',
  notes: '',
  location: '',
  priority: '',
  status: 'pending',
  notify: false,
  notify_minutes_before: null,
})

const form = reactive(emptyForm())

const clearFeedback = () => {
  errorMessage.value = ''
  successMessage.value = ''
  Object.keys(fieldErrors).forEach((key) => delete fieldErrors[key])
}

// Copy an API task into the editable form, normalizing dates/times and
// coercing nullable optional fields (priority, ends_at, ...) to the values the
// inputs expect.
const fillFromTask = (task) => {
  Object.assign(form, emptyForm(), {
    project_id: task.project_id ?? props.lockedProjectId ?? null,
    title: task.title ?? '',
    task_date: toDateInput(task.task_date),
    starts_at: toTimeInput(task.starts_at),
    ends_at: toTimeInput(task.ends_at),
    notes: task.notes ?? '',
    location: task.location ?? '',
    priority: task.priority ?? '',
    status: task.status ?? 'pending',
    notify: !!task.notify,
    notify_minutes_before: task.notify_minutes_before ?? null,
  })
}

const hydrate = async () => {
  clearFeedback()

  if (props.task?.id) {
    // Fill instantly from the row/list data so the form is never blank...
    fillFromTask(props.task)
    // ...then refresh from the detail endpoint so optional fields that the list
    // payload may omit (e.g. priority, end time) are reliably populated.
    loadingTask.value = true
    const editingId = props.task.id
    try {
      const full = await tasksService.get(editingId)
      if (full && props.open && props.task?.id === editingId) {
        fillFromTask({ ...props.task, ...full })
      }
    } catch {
      // Keep whatever we already have from the list data.
    } finally {
      loadingTask.value = false
    }
    return
  }

  Object.assign(form, emptyForm(), {
    project_id: props.prefill.project_id ?? props.lockedProjectId ?? null,
    task_date: props.prefill.task_date ?? '',
    starts_at: props.prefill.starts_at ?? '',
    ends_at: props.prefill.ends_at ?? '',
  })
}

watch(
  () => props.open,
  (open) => {
    if (open) hydrate()
  },
)

const close = () => {
  if (saving.value || deleting.value) return
  emit('close')
}

const applyServerValidation = (err) => {
  const errors = err?.data?.errors
  if (errors && typeof errors === 'object') {
    Object.entries(errors).forEach(([field, messages]) => {
      fieldErrors[field] = Array.isArray(messages) ? messages[0] : String(messages)
    })
    return true
  }
  return false
}

const save = async () => {
  clearFeedback()
  saving.value = true
  try {
    const payload = { ...form }
    if (isEditing.value) {
      await store.dispatch('tasks/updateTask', { id: props.task.id, payload })
    } else {
      await store.dispatch('tasks/createTask', payload)
    }
    successMessage.value = 'Task saved successfully.'
    emit('saved')
  } catch (err) {
    if (!applyServerValidation(err)) {
      errorMessage.value = err.message || 'Error saving the task.'
    } else {
      errorMessage.value = 'Please check the highlighted fields.'
    }
  } finally {
    saving.value = false
  }
}

const remove = async () => {
  if (!props.task?.id) return
  if (!confirm(`Delete the task "${props.task.title}"?`)) return
  clearFeedback()
  deleting.value = true
  try {
    await store.dispatch('tasks/deleteTask', props.task.id)
    emit('deleted')
  } catch (err) {
    errorMessage.value = err.message || 'Error deleting the task.'
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped>
.modal {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 2rem 1rem;
  overflow-y: auto;
  background: rgba(50, 46, 41, 0.45);
  backdrop-filter: blur(2px);
}

.modal__dialog {
  width: 100%;
  max-width: 560px;
  margin: auto;
  padding: 1.75rem;
}

.modal__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.modal__kicker {
  margin: 0 0 0.15rem;
  font-size: 0.74rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-primary);
}

.modal__title {
  margin: 0;
  font-size: 1.5rem;
}

.modal__loading {
  color: var(--color-text-muted);
  letter-spacing: 0;
  text-transform: none;
  font-weight: 500;
}

.modal__close {
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  font-size: 1.6rem;
  line-height: 1;
  padding: 0.1rem 0.4rem;
}

.modal__close:hover {
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow: none;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.grid-2,
.grid-3 {
  display: grid;
  gap: 1rem;
}

.grid-2 {
  grid-template-columns: repeat(2, 1fr);
}

.grid-3 {
  grid-template-columns: repeat(3, 1fr);
}

.field__error {
  margin: 0.3rem 0 0;
  font-size: 0.8rem;
  color: var(--color-danger-hover);
}

.notify {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 1rem;
}

.notify__check {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.6rem;
  font-size: 0.95rem;
  color: var(--color-text);
}

.notify__check input {
  width: auto;
}

.notify__field {
  flex: 1 1 200px;
}

.modal__actions {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-top: 0.5rem;
}

.spacer {
  flex: 1;
}

.alert-success {
  color: var(--color-success);
  background: var(--color-secondary-soft);
  border: 1px solid #cfe0d6;
  margin-bottom: 1rem;
}

@media (max-width: 540px) {
  .grid-2,
  .grid-3 {
    grid-template-columns: 1fr;
  }
}
</style>
