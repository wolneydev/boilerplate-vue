import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, shallowMount } from '@vue/test-utils'

let route
let store

vi.mock('vue-router', () => ({
  useRoute: () => route,
}))

vi.mock('vuex', () => ({
  useStore: () => store,
}))

const { default: ProjectCostsPage } = await import(
  '@/modules/planning/pages/ProjectCostsPage.vue'
)

const cost = {
  id: 3,
  amount: '12.50',
  description: 'Materials',
  incurred_on: '2026-07-26',
  recorded_at: '2026-07-26T17:00:00Z',
}

const mountPage = ({
  project = { id: 7, name: 'Website launch', currency: 'USD' },
  projectLoading = false,
  costs = [],
  costsLoading = false,
  costsError = null,
  routeParams = { projectId: '7' },
  dispatch = vi.fn().mockResolvedValue(undefined),
} = {}) => {
  route = { params: routeParams }
  store = {
    getters: {
      'projects/projectById': () => project,
      'projects/isLoading': projectLoading,
      'costs/costsByProject': () => costs,
      'costs/isLoading': () => costsLoading,
      'costs/costError': () => costsError,
    },
    dispatch,
  }

  return shallowMount(ProjectCostsPage, {
    global: {
      stubs: {
        RouterLink: { template: '<a><slot /></a>' },
      },
    },
  })
}

describe('ProjectCostsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads the route project and its cost history', async () => {
    const dispatch = vi.fn().mockResolvedValue(undefined)
    mountPage({ dispatch })
    await flushPromises()

    expect(dispatch).toHaveBeenCalledWith('projects/fetchProject', 7)
    expect(dispatch).toHaveBeenCalledWith('costs/fetchCosts', 7)
  })

  it('supports the existing generic id route parameter during integration', async () => {
    const dispatch = vi.fn().mockResolvedValue(undefined)
    mountPage({ dispatch, routeParams: { id: '9' } })
    await flushPromises()

    expect(dispatch).toHaveBeenCalledWith('projects/fetchProject', 9)
    expect(dispatch).toHaveBeenCalledWith('costs/fetchCosts', 9)
  })

  it('renders project loading before project content is available', () => {
    const wrapper = mountPage({ project: null, projectLoading: true })

    expect(wrapper.text()).toContain('Loading project costs...')
  })

  it('composes registration and empty history with project currency', () => {
    const wrapper = mountPage()

    const form = wrapper.findComponent({ name: 'CostRegistrationForm' })
    const history = wrapper.findComponent({ name: 'CostHistoryList' })
    expect(wrapper.text()).toContain('Website launch costs')
    expect(form.props()).toMatchObject({ projectId: 7, currency: 'USD' })
    expect(history.props()).toMatchObject({ costs: [], currency: 'USD' })
  })

  it('passes populated, loading, and unavailable history states independently', () => {
    const populated = mountPage({ costs: [cost] })
    expect(populated.findComponent({ name: 'CostHistoryList' }).props('costs')).toEqual([cost])

    const loading = mountPage({ costsLoading: true })
    expect(loading.findComponent({ name: 'CostHistoryList' }).props('loading')).toBe(true)

    const unavailable = mountPage({ costsError: 'Cost history is unavailable.' })
    expect(unavailable.findComponent({ name: 'CostHistoryList' }).props('error')).toBe(
      'Cost history is unavailable.',
    )
  })

  it('shows registration success and failure feedback emitted by the form', async () => {
    const wrapper = mountPage()
    const form = wrapper.findComponent({ name: 'CostRegistrationForm' })

    form.vm.$emit('registered', cost)
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Cost registered successfully.')

    form.vm.$emit('registration-error', 'Unable to register the cost.')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Unable to register the cost.')
  })

  it('shows project retrieval failures separately from history failures', async () => {
    const dispatch = vi.fn((type) =>
      type === 'projects/fetchProject'
        ? Promise.reject(new Error('Project is unavailable.'))
        : Promise.resolve(),
    )
    const wrapper = mountPage({ project: null, dispatch })
    await flushPromises()

    expect(wrapper.text()).toContain('Project is unavailable.')
  })
})
