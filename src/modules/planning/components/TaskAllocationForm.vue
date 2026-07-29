<template>
  <form class="card allocation-form" @submit.prevent="submit">
    <h2>Allocate funds</h2>

    <p v-if="errorMessage" class="alert alert-error" role="alert">{{ errorMessage }}</p>

    <div class="field">
      <label for="allocation-fund">Project fund *</label>
      <select id="allocation-fund" v-model="form.fund_id" :disabled="pending" required>
        <option value="" disabled>Select a fund</option>
        <option v-for="fund in funds" :key="fund.id" :value="String(fund.id)">
          {{ fund.name }}
        </option>
      </select>
      <p v-if="fieldErrors.fund_id" class="field__error">{{ fieldErrors.fund_id }}</p>
    </div>

    <FundBalanceSummary
      v-if="selectedFund"
      :fund="selectedFund"
      :currency="currency"
    />

    <div class="field">
      <label for="allocation-amount">Amount *</label>
      <input
        id="allocation-amount"
        v-model="form.amount"
        inputmode="decimal"
        autocomplete="off"
        :disabled="pending"
        placeholder="0.00"
        required
      />
      <p v-if="fieldErrors.amount" class="field__error">{{ fieldErrors.amount }}</p>
    </div>

    <button type="submit" :disabled="pending || funds.length === 0">
      {{ pending ? 'Allocating...' : 'Allocate' }}
    </button>
  </form>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useStore } from 'vuex'
import FundBalanceSummary from '@/modules/planning/components/FundBalanceSummary.vue'
import {
  isInsufficientFundsError,
  normalizeDecimalString,
  validateMoneyAmount,
} from '@/modules/planning/types/finances.types'

const props = defineProps({
  projectId: { type: [Number, String], required: true },
  taskId: { type: [Number, String], required: true },
  funds: { type: Array, default: () => [] },
  currency: { type: String, required: true },
})

const emit = defineEmits(['allocated'])
const store = useStore()
const localSubmitting = ref(false)
const errorMessage = ref('')
const fieldErrors = reactive({})
const form = reactive({ fund_id: '', amount: '' })

const storeAllocating = computed(
  () => store.getters['allocations/isAllocating'] ?? false,
)
const pending = computed(() => localSubmitting.value || storeAllocating.value)
const selectedFund = computed(
  () => props.funds.find((fund) => String(fund.id) === String(form.fund_id)) ?? null,
)

const clearErrors = () => {
  errorMessage.value = ''
  Object.keys(fieldErrors).forEach((key) => delete fieldErrors[key])
}

const applyServerValidation = (error) => {
  const errors = error?.data?.errors
  if (!errors || typeof errors !== 'object') return false
  Object.entries(errors).forEach(([field, messages]) => {
    fieldErrors[field] = Array.isArray(messages) ? messages[0] : String(messages)
  })
  return true
}

const submit = async () => {
  if (pending.value) return
  clearErrors()

  if (!selectedFund.value) {
    fieldErrors.fund_id = 'Select a project fund.'
  }
  const amountError = validateMoneyAmount(form.amount, {
    currency: props.currency,
    availableBalance: selectedFund.value?.available_balance,
  })
  if (amountError) fieldErrors.amount = amountError
  if (Object.keys(fieldErrors).length) {
    errorMessage.value = 'Please check the highlighted fields.'
    return
  }

  localSubmitting.value = true
  try {
    const result = await store.dispatch('allocations/allocate', {
      projectId: props.projectId,
      taskId: props.taskId,
      payload: {
        fund_id: Number(form.fund_id),
        amount: normalizeDecimalString(form.amount),
      },
    })
    if (!result) return
    form.amount = ''
    emit('allocated', result)
  } catch (error) {
    if (isInsufficientFundsError(error)) {
      errorMessage.value =
        'The selected fund does not have enough available balance.' +
        (error.balanceRefreshFailed
          ? ' The current balance could not be refreshed; reload before trying again.'
          : '')
    } else if (applyServerValidation(error)) {
      errorMessage.value = 'Please check the highlighted fields.'
    } else {
      errorMessage.value = error.message || 'Unable to allocate funds.'
    }
  } finally {
    localSubmitting.value = false
  }
}
</script>

<style scoped>
.allocation-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.allocation-form h2 {
  margin: 0;
}

.field__error {
  margin: 0.3rem 0 0;
  color: var(--color-danger-hover);
  font-size: 0.8rem;
}
</style>
