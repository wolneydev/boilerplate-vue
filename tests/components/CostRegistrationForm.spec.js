import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

let store

vi.mock('vuex', () => ({
  useStore: () => store,
}))

const { default: CostRegistrationForm } = await import(
  '@/modules/planning/components/CostRegistrationForm.vue'
)

const mountForm = (overrides = {}) =>
  mount(CostRegistrationForm, {
    props: {
      projectId: 7,
      currency: 'USD',
      ...overrides,
    },
  })

const fillValidForm = async (wrapper) => {
  await wrapper.get('#cost-amount').setValue('12.50')
  await wrapper.get('#cost-description').setValue('Project materials')
  await wrapper.get('#cost-incurred-on').setValue('2026-07-25')
}

describe('CostRegistrationForm', () => {
  beforeEach(() => {
    store = {
      getters: { 'costs/isRegistering': false },
      dispatch: vi.fn(),
    }
  })

  it.each([
    ['', 'Amount is required.'],
    ['abc', 'Enter a valid numeric amount.'],
    ['0', 'Amount must be greater than zero.'],
    ['-5', 'Enter a valid numeric amount.'],
    ['1.234', 'Amount supports at most 2 decimal places.'],
  ])('rejects invalid amount %j before dispatch', async (amount, message) => {
    const wrapper = mountForm()
    await wrapper.get('#cost-amount').setValue(amount)
    await wrapper.get('#cost-description').setValue('Project materials')
    await wrapper.get('#cost-incurred-on').setValue('2026-07-25')

    await wrapper.get('form').trigger('submit')

    expect(wrapper.text()).toContain(message)
    expect(store.dispatch).not.toHaveBeenCalled()
  })

  it('requires a trimmed description and a date', async () => {
    const wrapper = mountForm()
    await wrapper.get('#cost-amount').setValue('12.50')
    await wrapper.get('#cost-description').setValue('   ')

    await wrapper.get('form').trigger('submit')

    expect(wrapper.text()).toContain('Description is required.')
    expect(wrapper.text()).toContain('Incurred date is required.')
    expect(store.dispatch).not.toHaveBeenCalled()
  })

  it('submits canonical data once and preserves the date-only value', async () => {
    store.dispatch.mockResolvedValue({ id: 11 })
    const wrapper = mountForm()
    await wrapper.get('#cost-amount').setValue('0012.50')
    await wrapper.get('#cost-description').setValue('  Project materials  ')
    await wrapper.get('#cost-incurred-on').setValue('2026-07-25')

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(store.dispatch).toHaveBeenCalledOnce()
    expect(store.dispatch).toHaveBeenCalledWith('costs/registerCost', {
      projectId: 7,
      cost: {
        amount: '12.50',
        description: 'Project materials',
        incurred_on: '2026-07-25',
      },
    })
    expect(wrapper.emitted('registered')).toEqual([[{ id: 11 }]])
  })

  it('disables controls and prevents repeated submission while pending', async () => {
    let resolve
    store.dispatch.mockReturnValue(new Promise((done) => { resolve = done }))
    const wrapper = mountForm()
    await fillValidForm(wrapper)

    const first = wrapper.get('form').trigger('submit')
    await wrapper.get('form').trigger('submit')

    expect(store.dispatch).toHaveBeenCalledOnce()
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('button[type="submit"]').text()).toContain('Registering')

    resolve({ id: 11 })
    await first
    await flushPromises()
  })

  it('maps server field errors and preserves input for retry', async () => {
    store.dispatch.mockRejectedValue(
      Object.assign(new Error('The given data was invalid.'), {
        data: {
          errors: {
            amount: ['The amount precision is invalid.'],
            incurred_on: ['The incurred date is invalid.'],
          },
        },
      }),
    )
    const wrapper = mountForm()
    await fillValidForm(wrapper)

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('The amount precision is invalid.')
    expect(wrapper.text()).toContain('The incurred date is invalid.')
    expect(wrapper.text()).toContain('The given data was invalid.')
    expect(wrapper.get('#cost-amount').element.value).toBe('12.50')
    expect(wrapper.get('#cost-description').element.value).toBe('Project materials')
    expect(wrapper.get('#cost-incurred-on').element.value).toBe('2026-07-25')
  })
})
