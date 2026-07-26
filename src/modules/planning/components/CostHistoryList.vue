<template>
  <section class="cost-history">
    <div class="cost-history__head">
      <h2>Cost history</h2>
      <span v-if="costs.length" class="muted">{{ costs.length }} recorded</span>
    </div>

    <div v-if="loading" class="card state muted" role="status">
      Loading cost history...
    </div>
    <div v-else-if="error" class="alert alert-error" role="alert">{{ error }}</div>
    <div v-else-if="costs.length === 0" class="card state muted">
      No costs have been registered for this project.
    </div>
    <div v-else class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Incurred date</th>
            <th class="amount">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cost in costs" :key="cost.id" data-testid="cost-row">
            <td>{{ cost.description }}</td>
            <td>{{ formatDateOnly(cost.incurred_on) }}</td>
            <td class="amount"><strong>{{ formatMoney(cost.amount, currency) }}</strong></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import {
  formatDateOnly,
  formatMoney,
} from '@/modules/planning/types/finances.types'

defineProps({
  costs: { type: Array, default: () => [] },
  currency: { type: String, required: true },
  loading: { type: Boolean, default: false },
  error: { type: String, default: null },
})
</script>

<style scoped>
.cost-history__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.9rem;
}

.cost-history__head h2 {
  margin: 0;
}

.table-wrap {
  overflow-x: auto;
  border-radius: var(--radius-md);
  -webkit-overflow-scrolling: touch;
}

.amount {
  text-align: right;
  white-space: nowrap;
}

.state {
  padding: 1.5rem;
  text-align: center;
}
</style>
