<template>
  <div v-if="open" class="modal" @mousedown.self="close">
    <section class="modal__dialog card" role="dialog" aria-modal="true">
      <header class="modal__head">
        <div>
          <p class="page-kicker">{{ isEditing ? 'Edit' : 'New' }}</p>
          <h2>{{ isEditing ? 'Edit fund' : 'Create fund' }}</h2>
        </div>
        <button type="button" class="modal__close" aria-label="Close" @click="close">×</button>
      </header>

      <p v-if="errorMessage" class="alert alert-error" role="alert">{{ errorMessage }}</p>

      <form class="form" @submit.prevent="save">
        <div class="field">
          <label for="fund-name">Fund name *</label>
          <input id="fund-name" v-model="form.name" :disabled="saving" required />
          <p v-if="fieldErrors.name" class="field__error">{{ fieldErrors.name }}</p>
        </div>

        <div class="field">
          <label for="fund-total">Opening balance *</label>
          <input
            id="fund-total"
            v-model="form.opening_balance"
            inputmode="decimal"
            :disabled="saving"
            placeholder="0.00"
            required
          />
          <p v-if="fieldErrors.opening_balance" class="field__error">
            {{ fieldErrors.opening_balance }}
          </p>
        </div>

        <FundBalanceSummary v-if="isEditing" :fund="previewFund" :currency="currency" />

        <div class="actions">
          <button type="button" class="btn btn-ghost" :disabled="saving" @click="close">
            Cancel
          </button>
          <button type="submit" :disabled="saving">
            {{ saving ? 'Saving...' : 'Save fund' }}
          </button>
        </div>
      </form>
    </section>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useStore } from 'vuex'
import FundBalanceSummary from '@/modules/planning/components/FundBalanceSummary.vue'
import {
  decimalToMinorUnits,
  getCurrencyFractionDigits,
  normalizeDecimalString,
  validateMoneyAmount,
} from '@/modules/planning/types/finances.types'

const props = defineProps({
  open: { type: Boolean, default: false },
  projectId: { type: [Number, String], required: true },
  fund: { type: Object, default: null },
  funds: { type: Array, default: () => [] },
  currency: { type: String, required: true },
})

const emit = defineEmits(['close', 'saved'])
const store = useStore()
const localSaving = ref(false)
const errorMessage = ref('')
const fieldErrors = reactive({})
const form = reactive({ name: '', opening_balance: '' })

const isEditing = computed(() => !!props.fund?.id)
const saving = computed(
  () => localSaving.value || !!store.getters['funds/isSaving'],
)
const previewFund = computed(() => ({
  ...props.fund,
  total_balance:
    normalizeDecimalString(form.opening_balance) ?? props.fund?.total_balance ?? '0',
}))

const reset = () => {
  form.name = props.fund?.name ?? ''
  form.opening_balance = props.fund?.total_balance ?? ''
  errorMessage.value = ''
  Object.keys(fieldErrors).forEach((key) => delete fieldErrors[key])
}

watch(() => [props.open, props.fund], ([open]) => open && reset(), {
  immediate: true,
})

const close = () => {
  if (!saving.value) emit('close')
}

const applyServerValidation = (error) => {
  const errors = error?.data?.errors
  if (!errors || typeof errors !== 'object') return false
  Object.entries(errors).forEach(([field, messages]) => {
    const formField = field === 'total_balance' ? 'opening_balance' : field
    fieldErrors[formField] = Array.isArray(messages) ? messages[0] : String(messages)
  })
  return true
}

const validate = () => {
  errorMessage.value = ''
  Object.keys(fieldErrors).forEach((key) => delete fieldErrors[key])

  const name = form.name.trim()
  if (!name) fieldErrors.name = 'Fund name is required.'
  const duplicate = props.funds.some(
    (fund) =>
      String(fund.id) !== String(props.fund?.id) &&
      fund.name?.trim().toLocaleLowerCase() === name.toLocaleLowerCase(),
  )
  if (duplicate) fieldErrors.name = 'Fund names must be unique within the project.'

  const amountError = validateMoneyAmount(form.opening_balance, {
    currency: props.currency,
  })
  if (amountError) fieldErrors.opening_balance = amountError

  if (!amountError && props.fund?.allocated_balance != null) {
    const precision = getCurrencyFractionDigits(props.currency)
    if (
      decimalToMinorUnits(form.opening_balance, precision) <
      decimalToMinorUnits(props.fund.allocated_balance, precision)
    ) {
      fieldErrors.opening_balance =
        'Total balance cannot be lower than the allocated balance.'
    }
  }

  return Object.keys(fieldErrors).length === 0
}

const save = async () => {
  if (saving.value || !validate()) {
    if (Object.keys(fieldErrors).length) {
      errorMessage.value = 'Please check the highlighted fields.'
    }
    return
  }

  localSaving.value = true
  const payload = {
    name: form.name.trim(),
    opening_balance: normalizeDecimalString(form.opening_balance),
  }
  try {
    if (isEditing.value) {
      await store.dispatch('funds/updateFund', {
        projectId: props.projectId,
        fundId: props.fund.id,
        payload,
      })
    } else {
      await store.dispatch('funds/createFund', {
        projectId: props.projectId,
        payload,
      })
    }
    emit('saved')
  } catch (error) {
    errorMessage.value = applyServerValidation(error)
      ? 'Please check the highlighted fields.'
      : error.message || 'Unable to save the fund.'
  } finally {
    localSaving.value = false
  }
}
</script>

<style scoped>
.modal {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgba(50, 46, 41, 0.45);
}

.modal__dialog {
  width: min(560px, 100%);
  padding: 1.5rem;
}

.modal__head,
.actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.modal__head h2,
.page-kicker {
  margin: 0;
}

.page-kicker {
  color: var(--color-primary);
  font-size: 0.78rem;
  text-transform: uppercase;
}

.modal__close {
  border: 0;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 1.5rem;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field__error {
  margin: 0.3rem 0 0;
  color: var(--color-danger-hover);
  font-size: 0.8rem;
}

.actions {
  justify-content: flex-end;
}
</style>
