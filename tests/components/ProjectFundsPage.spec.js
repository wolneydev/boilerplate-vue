import { reactive } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const route = vi.hoisted(() => ({ params: { projectId: '7' } }))
vi.mock('vue-router', () => ({ useRoute: () => route }))

import ProjectFundsPage from '@/modules/planning/pages/ProjectFundsPage.vue'

const project = { id: 7, name: 'Community Center', currency: 'BRL' }
const fund = {
  id: 10,
  name: 'General Fund',
  total_balance: '100.00',
  allocated_balance: '25.00',
  available_balance: '75.00',
}

const makeStore = ({
  funds = [fund],
  loading = false,
  error = null,
  project: projectValue = project,
} = {}) => {
  const getters = reactive({
    'projects/projectById': () => projectValue,
    'projects/isLoading': false,
    'funds/forProject': () => funds,
    'funds/isLoading': () => loading,
    'funds/error': () => error,
  })
  const dispatch = vi.fn((action) => {
    if (action === 'projects/fetchProject') return Promise.resolve(projectValue)
    return Promise.resolve(funds)
  })
  return reactive({ getters, dispatch })
}

const mountPage = (store = makeStore()) => ({
  store,
  wrapper: mount(ProjectFundsPage, {
    global: {
      provide: { store },
      stubs: {
        RouterLink: true,
        FundBalanceSummary: {
          props: ['fund'],
          template: '<div data-test="balance">{{ fund.available_balance }}</div>',
        },
        FundFormModal: {
          props: ['open'],
          emits: ['close', 'saved'],
          template:
            '<button v-if="open" data-test="save-modal" @click="$emit(\'saved\')">Save</button>',
        },
      },
    },
  }),
})

describe('ProjectFundsPage', () => {
  beforeEach(() => {
    route.params = { projectId: '7' }
    vi.clearAllMocks()
  })

  it('loads project and authoritative funds and renders balances', async () => {
    const { wrapper, store } = mountPage()
    await flushPromises()

    expect(store.dispatch).toHaveBeenCalledWith('projects/fetchProject', 7)
    expect(store.dispatch).toHaveBeenCalledWith('funds/fetchFunds', 7)
    expect(wrapper.text()).toContain('General Fund')
    expect(wrapper.get('[data-test="balance"]').text()).toBe('75.00')
  })

  it('distinguishes loading, empty, and retrieval error states', async () => {
    const loading = mountPage(makeStore({ loading: true })).wrapper
    expect(loading.text()).toMatch(/loading/i)

    const empty = mountPage(makeStore({ funds: [] })).wrapper
    await flushPromises()
    expect(empty.text()).toMatch(/no project funds/i)

    const failed = mountPage(makeStore({ error: 'Funds unavailable.' })).wrapper
    await flushPromises()
    expect(failed.text()).toContain('Funds unavailable.')
  })

  it('opens the create workflow and reports a successful save', async () => {
    const { wrapper } = mountPage()
    await flushPromises()
    const newFund = wrapper
      .findAll('button')
      .find((button) => /new fund/i.test(button.text()))
    await newFund.trigger('click')
    await wrapper.get('[data-test="save-modal"]').trigger('click')

    expect(wrapper.text()).toMatch(/saved successfully/i)
  })

  it('directs projects without currency to project configuration', async () => {
    const { wrapper } = mountPage(
      makeStore({ project: { id: 7, name: 'Legacy project' } }),
    )
    await flushPromises()

    expect(wrapper.text()).toMatch(/needs a currency/i)
    expect(wrapper.find('router-link-stub[to="/projects/7/edit"]').exists()).toBe(true)
    const newFund = wrapper
      .findAll('button')
      .find((button) => /new fund/i.test(button.text()))
    expect(newFund.attributes('disabled')).toBeDefined()
  })
})
