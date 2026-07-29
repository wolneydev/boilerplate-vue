import { beforeEach, describe, expect, it, vi } from 'vitest'

const costsService = {
  list: vi.fn(),
  register: vi.fn(),
}

vi.mock('@/modules/planning/services/costs.service', () => ({ costsService }))

const { default: costsModule } = await import('@/modules/planning/store/costs.store')

const createState = () => costsModule.state()

const createContext = (state) => {
  const commit = vi.fn((type, payload) => costsModule.mutations[type](state, payload))
  const dispatch = vi.fn((type, payload) => {
    if (type === 'fetchCosts') {
      return costsModule.actions.fetchCosts({ state, commit }, payload)
    }
    return Promise.resolve()
  })
  return { state, commit, dispatch }
}

describe('costs store', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exposes project-keyed loading, populated, empty, and error state', () => {
    const state = createState()
    const costs = [{ id: 2 }, { id: 1 }]

    costsModule.mutations.SET_LOADING(state, { projectId: 7, loading: true })
    expect(costsModule.getters.isLoading(state)(7)).toBe(true)

    costsModule.mutations.SET_COSTS(state, { projectId: 7, costs })
    expect(costsModule.getters.costsByProject(state)(7)).toEqual(costs)
    expect(costsModule.getters.isEmpty(state)(7)).toBe(false)

    costsModule.mutations.SET_COSTS(state, { projectId: 8, costs: [] })
    expect(costsModule.getters.isEmpty(state)(8)).toBe(true)

    costsModule.mutations.SET_ERROR(state, { projectId: 7, error: 'History unavailable.' })
    expect(costsModule.getters.costError(state)(7)).toBe('History unavailable.')
  })

  it('loads costs while preserving the authoritative backend order', async () => {
    const state = createState()
    const context = createContext(state)
    const costs = [{ id: 3 }, { id: 2 }]
    costsService.list.mockResolvedValue(costs)

    await costsModule.actions.fetchCosts(context, 7)

    expect(costsService.list).toHaveBeenCalledWith(7)
    expect(state.itemsByProject[7]).toEqual(costs)
    expect(state.loadingByProject[7]).toBe(false)
    expect(state.errorByProject[7]).toBeNull()
  })

  it('normalizes retrieval failures into project-scoped error state', async () => {
    const state = createState()
    const context = createContext(state)
    costsService.list.mockRejectedValue(new Error('Network unavailable.'))

    await expect(costsModule.actions.fetchCosts(context, 7)).resolves.toBeUndefined()

    expect(state.loadingByProject[7]).toBe(false)
    expect(state.errorByProject[7]).toBe('Network unavailable.')
  })

  it('guards duplicate registration, registers once, and refetches only cost history', async () => {
    const state = createState()
    const context = createContext(state)
    let resolveRegistration
    costsService.register.mockReturnValue(
      new Promise((resolve) => {
        resolveRegistration = resolve
      }),
    )
    costsService.list.mockResolvedValue([{ id: 12 }])
    const payload = {
      projectId: 7,
      cost: { amount: '25.00', description: 'Catering', incurred_on: '2026-07-25' },
    }

    const first = costsModule.actions.registerCost(context, payload)
    const second = await costsModule.actions.registerCost(context, payload)

    expect(second).toBeNull()
    expect(costsService.register).toHaveBeenCalledOnce()
    expect(state.registering).toBe(true)

    resolveRegistration({ id: 12 })
    await expect(first).resolves.toEqual({ id: 12 })

    expect(context.dispatch).toHaveBeenCalledWith('fetchCosts', 7)
    expect(context.dispatch).not.toHaveBeenCalledWith(
      expect.stringContaining('fund'),
      expect.anything(),
      expect.anything(),
    )
    expect(state.itemsByProject[7]).toEqual([{ id: 12 }])
    expect(state.registering).toBe(false)
  })

  it('resets pending state, preserves history, and rethrows registration failures', async () => {
    const state = createState()
    state.itemsByProject[7] = [{ id: 3 }]
    const context = createContext(state)
    const error = Object.assign(new Error('Cost was rejected.'), {
      data: { errors: { description: ['Description is required.'] } },
    })
    costsService.register.mockRejectedValue(error)

    await expect(
      costsModule.actions.registerCost(context, {
        projectId: 7,
        cost: { amount: '5.00', description: '', incurred_on: '2026-07-25' },
      }),
    ).rejects.toBe(error)

    expect(state.registering).toBe(false)
    expect(state.itemsByProject[7]).toEqual([{ id: 3 }])
    expect(context.dispatch).not.toHaveBeenCalled()
  })
})
