import { reactive } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const route = vi.hoisted(() => ({
  params: { projectId: '7', taskId: '44' },
}))

vi.mock('vue-router', () => ({
  useRoute: () => route,
}))

import TaskFinancePage from '@/modules/planning/pages/TaskFinancePage.vue'

const project = { id: 7, name: 'Community Center', currency: 'BRL' }
const task = { id: 44, project_id: 7, title: 'Prepare permits' }
const fund = {
  id: 10,
  project_id: 7,
  name: 'General Fund',
  total_balance: '250.00',
  allocated_balance: '124.50',
  available_balance: '125.50',
}

const makeStore = ({ funds = [fund], loading = false } = {}) => {
  const getters = reactive({
    'projects/projectById': (id) => (Number(id) === project.id ? project : null),
    'tasks/taskById': (id) => (Number(id) === task.id ? task : null),
    'funds/forProject': () => funds,
    'funds/isLoading': () => loading,
    'funds/isEmpty': () => !loading && funds.length === 0,
    'funds/error': () => null,
    'allocations/forTask': () => [],
    'allocations/isLoading': () => false,
    'allocations/error': () => null,
  })
  const dispatch = vi.fn((action) => {
    if (action === 'projects/fetchProject') return Promise.resolve(project)
    if (action === 'tasks/fetchTask') return Promise.resolve(task)
    return Promise.resolve(funds)
  })
  return reactive({ getters, dispatch })
}

const AllocationFormStub = {
  name: 'TaskAllocationForm',
  props: ['projectId', 'taskId', 'funds', 'currency'],
  emits: ['allocated'],
  template:
    '<button data-test="complete-allocation" @click="$emit(\'allocated\', { id: 31 })">Allocate</button>',
}

const AllocationHistoryStub = {
  name: 'AllocationHistoryList',
  props: ['items', 'loading', 'error', 'currency'],
  template: '<div data-test="allocation-history">{{ items.length }} history records</div>',
}

const mountPage = (store = makeStore()) => ({
  store,
  wrapper: mount(TaskFinancePage, {
    global: {
      provide: { store },
      stubs: {
        TaskAllocationForm: AllocationFormStub,
        AllocationHistoryList: AllocationHistoryStub,
        RouterLink: true,
      },
    },
  }),
})

describe('TaskFinancePage', () => {
  beforeEach(() => {
    route.params = { projectId: '7', taskId: '44' }
    vi.clearAllMocks()
  })

  it('normalizes finance-route params and loads the owning project, task, and funds', async () => {
    const { wrapper, store } = mountPage()
    await flushPromises()

    expect(store.dispatch).toHaveBeenCalledWith('projects/fetchProject', 7)
    expect(store.dispatch).toHaveBeenCalledWith('tasks/fetchTask', 44)
    expect(store.dispatch).toHaveBeenCalledWith('funds/fetchFunds', 7)

    const form = wrapper.findComponent(AllocationFormStub)
    expect(form.exists()).toBe(true)
    expect(form.props()).toMatchObject({
      projectId: 7,
      taskId: 44,
      funds: [fund],
      currency: 'BRL',
    })
    expect(wrapper.text()).toContain(project.name)
    expect(wrapper.text()).toContain(task.title)
  })

  it('passes authoritative history state to the history component', async () => {
    const store = makeStore()
    const history = [
      {
        id: 31,
        fund_name: 'General Fund',
        amount: '10.00',
        recorded_at: '2026-07-26T15:30:00Z',
      },
    ]
    store.getters['allocations/forTask'] = () => history
    const { wrapper } = mountPage(store)
    await flushPromises()

    expect(wrapper.findComponent(AllocationHistoryStub).props()).toMatchObject({
      items: history,
      loading: false,
      currency: 'BRL',
    })
  })

  it('keeps allocation success distinct from a refresh warning', async () => {
    const { wrapper } = mountPage()
    await flushPromises()

    wrapper.findComponent(AllocationFormStub).vm.$emit('allocated', {
      refreshWarning: 'Allocation succeeded, but history could not be reloaded.',
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toMatch(/allocated successfully/i)
    expect(wrapper.text()).toMatch(/history could not be reloaded/i)
  })

  it('shows a visible loading state while project or task finance data is pending', () => {
    const { wrapper } = mountPage(makeStore({ loading: true }))

    expect(wrapper.text()).toMatch(/loading/i)
    expect(wrapper.findComponent(AllocationFormStub).exists()).toBe(false)
  })

  it('explains that a project fund is required when none are available', async () => {
    const { wrapper } = mountPage(makeStore({ funds: [] }))
    await flushPromises()

    expect(wrapper.text()).toMatch(/no funds|create.*fund|fund.*required/i)
    expect(wrapper.findComponent(AllocationFormStub).exists()).toBe(false)
  })

  it('shows success feedback when the allocation form reports acceptance', async () => {
    const { wrapper } = mountPage()
    await flushPromises()

    await wrapper.get('[data-test="complete-allocation"]').trigger('click')

    expect(wrapper.text()).toMatch(/allocated|allocation.*success/i)
  })

  it('shows a generic retrieval failure without presenting allocation controls', async () => {
    const store = makeStore()
    store.dispatch.mockImplementation((action) => {
      if (action === 'funds/fetchFunds') {
        return Promise.reject(new Error('Financial data is unavailable.'))
      }
      if (action === 'projects/fetchProject') return Promise.resolve(project)
      if (action === 'tasks/fetchTask') return Promise.resolve(task)
      return Promise.resolve()
    })

    const { wrapper } = mountPage(store)
    await flushPromises()

    expect(wrapper.text()).toMatch(/financial data is unavailable|could not.*load/i)
    expect(wrapper.findComponent(AllocationFormStub).exists()).toBe(false)
    expect(wrapper.text()).not.toMatch(/success/i)
  })
})
