import { beforeEach, describe, expect, it, vi } from 'vitest'
import { httpError } from '../helpers/httpClient.mock'

const createAllocation = vi.hoisted(() => vi.fn())

vi.mock('@/modules/planning/services/allocations.service', () => ({
  allocationsService: {
    create: createAllocation,
  },
}))

import allocations from '@/modules/planning/store/allocations.store'

const payload = {
  projectId: 7,
  taskId: 44,
  payload: {
    fund_id: 10,
    amount: '125.50',
  },
}

const allocation = {
  id: 31,
  task_id: 44,
  fund_id: 10,
  fund_name: 'General Fund',
  amount: '125.50',
  recorded_at: '2026-07-26T15:30:00Z',
}

const makeContext = ({ dispatch = vi.fn().mockResolvedValue(undefined) } = {}) => {
  const state = allocations.state()
  const commit = vi.fn((type, value) => allocations.mutations[type](state, value))
  return { state, commit, dispatch }
}

describe('allocations store allocate action', () => {
  beforeEach(() => {
    createAllocation.mockReset()
  })

  it('guards a pending allocation so repeated submissions make one service call', async () => {
    let resolveAllocation
    createAllocation.mockReturnValue(
      new Promise((resolve) => {
        resolveAllocation = resolve
      }),
    )
    const context = makeContext()

    const first = allocations.actions.allocate(context, payload)
    const repeated = allocations.actions.allocate(context, payload)

    expect(context.state.allocating).toBe(true)
    expect(createAllocation).toHaveBeenCalledOnce()
    await expect(repeated).resolves.toBeNull()

    resolveAllocation(allocation)
    await first
    expect(context.state.allocating).toBe(false)
  })

  it('creates once and refetches authoritative project funds and task history', async () => {
    createAllocation.mockResolvedValue(allocation)
    const context = makeContext()

    await expect(allocations.actions.allocate(context, payload)).resolves.toEqual({
      allocation,
      refreshWarning: null,
    })

    expect(createAllocation).toHaveBeenCalledOnce()
    expect(createAllocation).toHaveBeenCalledWith(44, {
      fund_id: 10,
      amount: '125.50',
    })
    expect(context.dispatch).toHaveBeenCalledWith(
      'funds/fetchFunds',
      7,
      { root: true },
    )
    expect(context.state.itemsByTask['44']).toEqual([allocation])
    expect(context.state.allocationErrorCode).toBeNull()
  })

  it('refetches funds and preserves the machine-readable insufficient-funds failure', async () => {
    const error = httpError({
      message: 'The selected fund has insufficient available balance.',
      status: 409,
      data: {
        code: 'INSUFFICIENT_FUNDS',
        available_balance: '100.00',
      },
    })
    createAllocation.mockRejectedValue(error)
    const context = makeContext()

    await expect(allocations.actions.allocate(context, payload)).rejects.toBe(error)

    expect(context.dispatch).toHaveBeenCalledWith(
      'funds/fetchFunds',
      7,
      { root: true },
    )
    expect(context.state.allocationErrorCode).toBe('INSUFFICIENT_FUNDS')
    expect(context.state.allocating).toBe(false)
  })

  it('marks an insufficient-funds error when its balance refresh fails', async () => {
    const error = httpError({
      message: 'Insufficient funds.',
      status: 409,
      data: { code: 'INSUFFICIENT_FUNDS' },
    })
    createAllocation.mockRejectedValue(error)
    const context = makeContext({
      dispatch: vi.fn().mockRejectedValue(new Error('Funds unavailable.')),
    })

    await expect(allocations.actions.allocate(context, payload)).rejects.toBe(error)

    expect(error.balanceRefreshFailed).toBe(true)
  })

  it('reports generic allocation errors without implying insufficient funds or refreshing', async () => {
    const error = new Error('Allocation service is unavailable.')
    createAllocation.mockRejectedValue(error)
    const context = makeContext()

    await expect(allocations.actions.allocate(context, payload)).rejects.toBe(error)

    expect(context.dispatch).not.toHaveBeenCalled()
    expect(context.state.allocationErrorCode).toBeNull()
    expect(context.state.allocating).toBe(false)
  })

  it('keeps an accepted allocation separate from a subsequent refresh warning', async () => {
    createAllocation.mockResolvedValue(allocation)
    const refreshError = new Error('Current balances could not be reloaded.')
    const dispatch = vi
      .fn()
      .mockRejectedValueOnce(refreshError)
      .mockResolvedValueOnce(undefined)
    const context = makeContext({ dispatch })

    await expect(allocations.actions.allocate(context, payload)).resolves.toEqual({
      allocation,
      refreshWarning:
        'Allocation succeeded, but current fund balances could not be reloaded.',
    })

    expect(context.state.allocationErrorCode).toBeNull()
    expect(context.state.allocating).toBe(false)
  })
})
