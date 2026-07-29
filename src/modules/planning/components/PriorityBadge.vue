<template>
  <span v-if="meta" class="badge">
    <span class="dot" :style="{ backgroundColor: meta.color }" aria-hidden="true"></span>
    {{ meta.label }}
  </span>
  <span v-else class="muted">—</span>
</template>

<script setup>
import { computed } from 'vue'
import { getPriorityMeta } from '@/modules/planning/types/planning.types'

const props = defineProps({
  priority: { type: String, default: null },
})

const meta = computed(() => getPriorityMeta(props.priority))
</script>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--color-text);
  white-space: nowrap;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex: none;
}
</style>
