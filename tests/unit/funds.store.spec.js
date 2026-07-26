import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createStore } from 'vuex'

const listFunds = vi.hoisted(() => vi.fn())
const createFund = vi.hoisted(() => vi.fn())
const updateFund = vi.hoisted(() => vi.fn())

vi.mock('@/modules/planning/services/funds.service', () => ({
  fundsService: { list: listFunds, create: createFund, update: updateFund },
}))

import funds from '@/modules/planning/store/funds.store'

const fund = {
  id: 10,
  project_id: 7,
  name: 'General Fund',
  total_balance: '1000.00',
  allocated_balance: '125.50',
  available_balance: '874.50',
}

const makeStore = () =>
  createStore({
    modules: { funds },
  })

describe('funds store read state', () => {
  beforeEach(() => {
    listFunds.mockReset()
    createFund.mockReset()
    updateFund.mockReset()
  })

  it('loads and exposes funds independently for each project', async () => {
    const store = makeStore()
    let resolveRequest
    listFunds.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve
      }),
    )

    const request = store.dispatch('funds/fetchFunds', 7)

    expect(store.getters['funds/isLoading'](7)).toBe(true)
    expect(store.getters['funds/forProject'](7)).toEqual([])
    expect(store.getters['funds/forProject'](8)).toEqual([])

    resolveRequest([fund])
    await request

    expect(listFunds).toHaveBeenCalledOnce()
    expect(listFunds).toHaveBeenCalledWith(7)
    expect(store.getters['funds/isLoading'](7)).toBe(false)
    expect(store.getters['funds/forProject'](7)).toEqual([fund])
    expect(store.getters['funds/forProject'](8)).toEqual([])
    expect(store.getters['funds/isEmpty'](7)).toBe(false)
  })

  it('represents a successful empty response distinctly from loading and failure', async () => {
    listFunds.mockResolvedValue([])
    const store = makeStore()

    await store.dispatch('funds/fetchFunds', 7)

    expect(store.getters['funds/forProject'](7)).toEqual([])
    expect(store.getters['funds/isLoading'](7)).toBe(false)
    expect(store.getters['funds/error'](7)).toBeNull()
    expect(store.getters['funds/isEmpty'](7)).toBe(true)
  })

  it('clears stale project data and exposes a normalized retrieval error', async () => {
    const store = makeStore()
    listFunds.mockResolvedValueOnce([fund])
    await store.dispatch('funds/fetchFunds', 7)

    listFunds.mockRejectedValueOnce(new Error('Funds are unavailable.'))
    await expect(store.dispatch('funds/fetchFunds', 7)).rejects.toThrow(
      'Funds are unavailable.',
    )

    expect(store.getters['funds/forProject'](7)).toEqual([])
    expect(store.getters['funds/isLoading'](7)).toBe(false)
    expect(store.getters['funds/isEmpty'](7)).toBe(false)
    expect(store.getters['funds/error'](7)).toBe('Funds are unavailable.')
  })

  it('guards fund creation and refreshes authoritative project funds', async () => {
    const store = makeStore()
    const created = { ...fund, id: 11 }
    let resolveCreate
    createFund.mockReturnValue(
      new Promise((resolve) => {
        resolveCreate = resolve
      }),
    )
    listFunds.mockResolvedValue([created])

    const first = store.dispatch('funds/createFund', {
      projectId: 7,
      payload: { name: 'General Fund', total_balance: '1000.00' },
    })
    const duplicate = await store.dispatch('funds/createFund', {
      projectId: 7,
      payload: { name: 'Duplicate', total_balance: '5.00' },
    })

    expect(store.getters['funds/isSaving']).toBe(true)
    expect(duplicate).toBeNull()
    expect(createFund).toHaveBeenCalledOnce()

    resolveCreate(created)
    await first

    expect(listFunds).toHaveBeenCalledWith(7)
    expect(store.getters['funds/forProject'](7)).toEqual([created])
    expect(store.getters['funds/isSaving']).toBe(false)
  })

  it('resets pending state after an update failure', async () => {
    const store = makeStore()
    const error = new Error('Update rejected.')
    updateFund.mockRejectedValue(error)

    await expect(
      store.dispatch('funds/updateFund', {
        projectId: 7,
        fundId: 10,
        payload: { name: 'General', total_balance: '100.00' },
      }),
    ).rejects.toBe(error)

    expect(store.getters['funds/isSaving']).toBe(false)
    expect(store.getters['funds/savingFundId']).toBeNull()
    expect(listFunds).not.toHaveBeenCalled()
  })
})
