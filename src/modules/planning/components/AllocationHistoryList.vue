<template>
  <section class="history">
    <div class="history__head">
      <h2>Allocation history</h2>
      <span v-if="!loading" class="muted">{{ items.length }} records</span>
    </div>

    <div v-if="loading" class="card state muted">Loading allocation history...</div>
    <p v-else-if="error" class="alert alert-error" role="alert">{{ error }}</p>
    <div v-else-if="items.length === 0" class="card state muted">
      No allocations recorded for this task.
    </div>
    <div v-else class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Fund</th>
            <th>Amount</th>
            <th>Recorded</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="allocation in items" :key="allocation.id">
            <td>{{ allocation.fund_name }}</td>
            <td>{{ formatMoney(allocation.amount, currency) }}</td>
            <td>{{ formatRecordedAt(allocation.recorded_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import {
  formatMoney,
  formatRecordedAt,
} from '@/modules/planning/types/finances.types'

defineProps({
  items: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  currency: { type: String, required: true },
})
</script>

<style scoped>
.history {
  margin-top: 2rem;
}

.history__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.history__head h2 {
  margin: 0;
}

.state {
  padding: 1.5rem;
  text-align: center;
}

.table-wrap {
  overflow-x: auto;
}
</style>
