<template>
  <section class="card cost-form">
    <div class="cost-form__head">
      <div>
        <p class="page-kicker">New expense</p>
        <h2>Register a project cost</h2>
      </div>
      <span class="muted">{{ currency }}</span>
    </div>

    <p v-if="errorMessage" class="alert alert-error" role="alert">{{ errorMessage }}</p>

    <form class="form" @submit.prevent="submit">
      <div class="field">
        <label for="cost-amount">Amount *</label>
        <input
          id="cost-amount"
          v-model="form.amount"
          type="text"
          inputmode="decimal"
          autocomplete="off"
          placeholder="0.00"
          :disabled="pending"
          aria-describedby="cost-amount-error"
        />
        <p v-if="fieldErrors.amount" id="cost-amount-error" class="field__error">
          {{ fieldErrors.amount }}
        </p>
      </div>

      <div class="field">
        <label for="cost-description">Description *</label>
        <input
          id="cost-description"
          v-model="form.description"
          type="text"
          placeholder="What was this cost for?"
          :disabled="pending"
          aria-describedby="cost-description-error"
        />
        <p v-if="fieldErrors.description" id="cost-description-error" class="field__error">
          {{ fieldErrors.description }}
        </p>
      </div>

      <div class="field">
        <label for="cost-incurred-on">Incurred date *</label>
        <input
          id="cost-incurred-on"
          v-model="form.incurred_on"
          type="date"
          :disabled="pending"
          aria-describedby="cost-incurred-on-error"
        />
        <p v-if="fieldErrors.incurred_on" id="cost-incurred-on-error" class="field__error">
          {{ fieldErrors.incurred_on }}
        </p>
      </div>

      <div class="cost-form__actions">
        <button type="submit" :disabled="pending">
          {{ pending ? 'Registering...' : 'Register cost' }}
        </button>
      </div>
    </form>
  </section>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useStore } from 'vuex'
import {
  normalizeDecimalString,
  validateMoneyAmount,
} from '@/modules/planning/types/finances.types'

const props = defineProps({
  projectId: { type: Number, required: true },
  currency: { type: String, required: true },
})

const emit = defineEmits(['registered', 'registration-error'])
const store = useStore()

const form = reactive({
  amount: '',
  description: '',
  incurred_on: '',
})
const fieldErrors = reactive({})
const errorMessage = ref('')
const submitting = ref(false)
const pending = computed(
  () => submitting.value || Boolean(store.getters['costs/isRegistering']),
)

const clearErrors = () => {
  errorMessage.value = ''
  Object.keys(fieldErrors).forEach((field) => delete fieldErrors[field])
}

const validate = () => {
  const amountError = validateMoneyAmount(form.amount, { currency: props.currency })
  if (amountError) fieldErrors.amount = amountError
  if (!form.description.trim()) fieldErrors.description = 'Description is required.'
  if (!form.incurred_on) {
    fieldErrors.incurred_on = 'Incurred date is required.'
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(form.incurred_on)) {
    fieldErrors.incurred_on = 'Enter a valid incurred date.'
  }
  return Object.keys(fieldErrors).length === 0
}

const applyServerErrors = (errors = {}) => {
  Object.entries(errors).forEach(([field, messages]) => {
    fieldErrors[field] = Array.isArray(messages) ? messages[0] : String(messages)
  })
}

const reset = () => {
  form.amount = ''
  form.description = ''
  form.incurred_on = ''
}

const submit = async () => {
  if (pending.value) return
  clearErrors()
  if (!validate()) return

  submitting.value = true
  try {
    const registeredCost = await store.dispatch('costs/registerCost', {
      projectId: props.projectId,
      cost: {
        amount: normalizeDecimalString(form.amount),
        description: form.description.trim(),
        // Date inputs already produce YYYY-MM-DD. Keep the string unchanged.
        incurred_on: form.incurred_on,
      },
    })
    if (!registeredCost) return
    reset()
    emit('registered', registeredCost)
  } catch (error) {
    applyServerErrors(error?.data?.errors)
    errorMessage.value = error?.message || 'Unable to register the cost.'
    emit('registration-error', errorMessage.value)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.cost-form {
  padding: 1.25rem;
}

.cost-form__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.cost-form__head h2,
.page-kicker {
  margin: 0;
}

.page-kicker {
  margin-bottom: 0.25rem;
  color: var(--color-primary);
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.cost-form__actions {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 640px) {
  .cost-form__actions button {
    width: 100%;
  }
}
</style>
