import { reactive } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { httpError } from '../helpers/httpClient.mock'
import TaskAllocationForm from '@/modules/planning/components/TaskAllocationForm.vue'

const funds = [
  {
    id: 10,
    project_id: 7,
    name: 'General Fund',
    total_balance: '250.00',
    allocated_balance: '124.50',
    available_balance: '125.50',
  },
  {
    id: 11,
    project_id: 7,
    name: 'Contingency',
    total_balance: '50.00',
    allocated_balance: '0.00',
    available_balance: '50.00',
  },
]

const makeStore = () =>
  reactive({
    getters: {
      'allocations/isAllocating': false,
      'allocations/allocationErrorCode': null,
    },
    dispatch: vi.fn().mockResolvedValue({ id: 31 }),
  })

const mountForm = (store = makeStore()) => ({
  store,
  wrapper: mount(TaskAllocationForm, {
    props: {
      projectId: 7,
      taskId: 44,
      funds,
      currency: 'BRL',
    },
    global: {
      provide: { store },
    },
  }),
})

const controlLabelled = (wrapper, text) => {
  const label = wrapper
    .findAll('label')
    .find((candidate) => text.test(candidate.text()))
  expect(label, `control labelled ${text}`).toBeTruthy()
  return wrapper.get(`#${label.attributes('for')}`)
}

const submitButton = (wrapper) => {
  const button = wrapper
    .findAll('button')
    .find((candidate) => candidate.attributes('type') === 'submit')
  expect(button, 'submit button').toBeTruthy()
  return button
}

const fill = async (wrapper, { fundId = '10', amount = '125.50' } = {}) => {
  await controlLabelled(wrapper, /fund/i).setValue(fundId)
  await controlLabelled(wrapper, /amount/i).setValue(amount)
}

describe('TaskAllocationForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('offers project funds and displays the selected fund available balance', async () => {
    const { wrapper } = mountForm()

    const fundSelect = controlLabelled(wrapper, /fund/i)
    expect(fundSelect.findAll('option').map((option) => option.text())).toEqual(
      expect.arrayContaining(['General Fund', 'Contingency']),
    )

    await fundSelect.setValue('10')

    expect(wrapper.text()).toMatch(/available(?: balance)?/i)
    expect(wrapper.text()).toMatch(/125[.,]50/)
  })

  it('allows an exact-balance allocation and dispatches one canonical request', async () => {
    const { wrapper, store } = mountForm()
    await fill(wrapper)

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(store.dispatch).toHaveBeenCalledOnce()
    expect(store.dispatch).toHaveBeenCalledWith('allocations/allocate', {
      projectId: 7,
      taskId: 44,
      payload: {
        fund_id: 10,
        amount: '125.50',
      },
    })
    expect(wrapper.emitted('allocated')).toHaveLength(1)
  })

  it.each([
    ['', /required/i],
    ['not-a-number', /numeric|number/i],
    ['0', /greater than zero|positive/i],
    ['-1.00', /numeric|greater than zero|positive/i],
    ['125.51', /available balance/i],
    ['1.234', /decimal|precision/i],
  ])('rejects invalid amount %j before dispatch', async (amount, feedback) => {
    const { wrapper, store } = mountForm()
    await fill(wrapper, { amount })

    await wrapper.get('form').trigger('submit')

    expect(store.dispatch).not.toHaveBeenCalled()
    expect(wrapper.text()).toMatch(feedback)
  })

  it('disables submission and ignores repeated submits while allocation is pending', async () => {
    const store = makeStore()
    let resolveAllocation
    store.dispatch.mockImplementation(() => {
      store.getters['allocations/isAllocating'] = true
      return new Promise((resolve) => {
        resolveAllocation = resolve
      })
    })
    const { wrapper } = mountForm(store)
    await fill(wrapper, { amount: '10.00' })

    const first = wrapper.get('form').trigger('submit')
    await wrapper.vm.$nextTick()
    await wrapper.get('form').trigger('submit')

    expect(submitButton(wrapper).attributes('disabled')).toBeDefined()
    expect(store.dispatch).toHaveBeenCalledOnce()

    store.getters['allocations/isAllocating'] = false
    resolveAllocation({ id: 31 })
    await first
  })

  it('does not clear input or report success when the store ignores a duplicate', async () => {
    const store = makeStore()
    store.dispatch.mockResolvedValue(null)
    const { wrapper } = mountForm(store)
    await fill(wrapper, { amount: '10.00' })

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(controlLabelled(wrapper, /amount/i).element.value).toBe('10.00')
    expect(wrapper.emitted('allocated')).toBeUndefined()
  })

  it('preserves retry input and shows specific insufficient-funds feedback', async () => {
    const store = makeStore()
    store.dispatch.mockRejectedValue(
      httpError({
        message: 'Allocation rejected.',
        status: 409,
        data: {
          code: 'INSUFFICIENT_FUNDS',
          available_balance: '100.00',
        },
      }),
    )
    const { wrapper } = mountForm(store)
    await fill(wrapper)

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(controlLabelled(wrapper, /fund/i).element.value).toBe('10')
    expect(controlLabelled(wrapper, /amount/i).element.value).toBe('125.50')
    expect(wrapper.text()).toMatch(/insufficient|not (?:have )?enough/i)
    expect(wrapper.text()).not.toMatch(/success/i)
  })
})
