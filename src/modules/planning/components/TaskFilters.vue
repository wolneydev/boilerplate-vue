<template>
  <div class="filters card">
    <div class="filters__field" v-if="!hideProject">
      <label for="filter-project">Project</label>
      <select id="filter-project" v-model="local.projectId" @change="emitChange">
        <option value="">All projects</option>
        <option v-for="project in projects" :key="project.id" :value="project.id">
          {{ project.name }}
        </option>
      </select>
    </div>

    <div class="filters__field">
      <label for="filter-status">Status</label>
      <select id="filter-status" v-model="local.status" @change="emitChange">
        <option value="">All statuses</option>
        <option v-for="status in statuses" :key="status.value" :value="status.value">
          {{ status.label }}
        </option>
      </select>
    </div>

    <div class="filters__field">
      <label for="filter-priority">Priority</label>
      <select id="filter-priority" v-model="local.priority" @change="emitChange">
        <option value="">All priorities</option>
        <option v-for="priority in priorities" :key="priority.value" :value="priority.value">
          {{ priority.label }}
        </option>
      </select>
    </div>

    <button type="button" class="btn btn-ghost btn-sm filters__reset" @click="reset">
      Clear filters
    </button>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue'
import { TASK_STATUSES, TASK_PRIORITIES } from '@/modules/planning/types/planning.types'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ projectId: '', status: '', priority: '' }),
  },
  projects: { type: Array, default: () => [] },
  hideProject: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'change'])

const statuses = TASK_STATUSES
const priorities = TASK_PRIORITIES

const local = reactive({ ...props.modelValue })

watch(
  () => props.modelValue,
  (value) => Object.assign(local, value),
  { deep: true },
)

const emitChange = () => {
  const payload = { ...local }
  emit('update:modelValue', payload)
  emit('change', payload)
}

const reset = () => {
  local.projectId = ''
  local.status = ''
  local.priority = ''
  emitChange()
}
</script>

<style scoped>
.filters {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 1rem;
  padding: 1.1rem 1.25rem;
}

.filters__field {
  flex: 1 1 180px;
  min-width: 160px;
}

.filters__field label {
  margin-bottom: 0.3rem;
}

.filters__reset {
  flex: none;
}

@media (max-width: 540px) {
  .filters {
    gap: 0.85rem;
  }

  .filters__field,
  .filters__reset {
    flex: 1 1 100%;
  }

  .filters__reset {
    width: 100%;
  }
}
</style>
