import { beforeEach, describe, expect, it, vi } from 'vitest'
import { httpError, response } from '../helpers/httpClient.mock'

const httpClient = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('@/core/http/httpClient', () => ({ default: httpClient }))

import { allocationsService } from '@/modules/planning/services/allocations.service'

describe('allocationsService', () => {
  beforeEach(() => {
    httpClient.get.mockReset()
    httpClient.post.mockReset()
  })

  it('creates one allocation with snake_case identifiers and an exact decimal string', async () => {
    const allocation = {
      id: 31,
      task_id: 44,
      fund_id: 10,
      fund_name: 'General Fund',
      amount: '9007199254740993.25',
      recorded_at: '2026-07-26T15:30:00Z',
    }
    httpClient.post.mockReturnValue(response({ data: allocation }))

    await expect(
      allocationsService.create(44, {
        fund_id: 10,
        amount: '9007199254740993.25',
      }),
    ).resolves.toEqual(allocation)

    expect(httpClient.post).toHaveBeenCalledOnce()
    expect(httpClient.post).toHaveBeenCalledWith('/tasks/44/financial-allocations', {
      task_id: 44,
      fund_id: 10,
      amount: '9007199254740993.25',
    })
  })

  it('propagates the raw normalized insufficient-funds error for store discrimination', async () => {
    const error = httpError({
      message: 'The selected fund has insufficient available balance.',
      status: 409,
      data: {
        code: 'INSUFFICIENT_FUNDS',
        available_balance: '25.00',
      },
    })
    httpClient.post.mockRejectedValue(error)

    await expect(
      allocationsService.create(44, { fund_id: 10, amount: '30.00' }),
    ).rejects.toBe(error)
  })
})
