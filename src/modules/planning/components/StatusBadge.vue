<template>
  <span class="badge" :style="badgeStyle">{{ meta.label }}</span>
</template>

<script setup>
import { computed } from 'vue'
import { getStatusMeta } from '@/modules/planning/types/planning.types'

const props = defineProps({
  status: { type: String, default: null },
})

const meta = computed(() => getStatusMeta(props.status))
const badgeStyle = computed(() => ({
  color: meta.value.color,
  backgroundColor: meta.value.soft,
  borderColor: meta.value.color,
}))
</script>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.18rem 0.6rem;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  border-radius: 999px;
  border: 1px solid transparent;
  white-space: nowrap;
}
</style>
