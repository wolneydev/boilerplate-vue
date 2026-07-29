<template>
  <dl v-if="fund" class="balance-grid" aria-label="Fund balances">
    <div>
      <dt>Total</dt>
      <dd>{{ formatMoney(fund.total_balance, currency) }}</dd>
    </div>
    <div>
      <dt>Allocated</dt>
      <dd>{{ formatMoney(fund.allocated_balance, currency) }}</dd>
    </div>
    <div>
      <dt>Available</dt>
      <dd>{{ formatMoney(fund.available_balance, currency) }}</dd>
    </div>
  </dl>
</template>

<script setup>
import { formatMoney } from '@/modules/planning/types/finances.types'

defineProps({
  fund: { type: Object, default: null },
  currency: { type: String, required: true },
})
</script>

<style scoped>
.balance-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
  margin: 0;
}

.balance-grid div {
  padding: 0.85rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

dt {
  color: var(--color-text-muted);
  font-size: 0.78rem;
}

dd {
  margin: 0.25rem 0 0;
  font-weight: 700;
}

@media (max-width: 540px) {
  .balance-grid {
    grid-template-columns: 1fr;
  }
}
</style>
