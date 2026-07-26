import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createHttpClientMock, httpError, response } from '../helpers/httpClient.mock'

const httpClient = createHttpClientMock()

vi.mock('@/core/http/httpClient', () => ({ default: httpClient }))

const { costsService } = await import('@/modules/planning/services/costs.service')

describe('costsService contract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lists project costs and unwraps the Laravel data envelope without changing decimals', async () => {
    const costs = [
      {
        id: 8,
        project_id: 4,
        amount: '1250.50',
        description: 'Venue',
        incurred_on: '2026-07-25',
        recorded_at: '2026-07-25T18:00:00Z',
      },
    ]
    httpClient.get.mockReturnValue(response({ data: costs }))

    await expect(costsService.list(4)).resolves.toEqual(costs)
    expect(httpClient.get).toHaveBeenCalledOnce()
    expect(httpClient.get).toHaveBeenCalledWith('/projects/4/costs')
    expect(costs[0].amount).toBe('1250.50')
  })

  it('normalizes supported list envelopes and missing collections', async () => {
    httpClient.get.mockReturnValueOnce(response({ data: { items: [{ id: 1 }] } }))
    await expect(costsService.list(4)).resolves.toEqual([{ id: 1 }])

    httpClient.get.mockReturnValueOnce(response({ data: null }))
    await expect(costsService.list(4)).resolves.toEqual([])
  })

  it('registers a cost with canonical decimal, trimmed description, and unchanged date-only value', async () => {
    const created = {
      id: 9,
      project_id: 4,
      amount: '12.50',
      description: 'Materials',
      incurred_on: '2026-07-26',
      recorded_at: '2026-07-26T17:00:00Z',
    }
    httpClient.post.mockReturnValue(response({ data: created }))

    await expect(
      costsService.register(4, {
        amount: '0012.50',
        description: '  Materials  ',
        incurred_on: '2026-07-26',
        ignored: true,
      }),
    ).resolves.toEqual(created)

    expect(httpClient.post).toHaveBeenCalledOnce()
    expect(httpClient.post).toHaveBeenCalledWith('/projects/4/costs', {
      project_id: 4,
      amount: '12.50',
      description: 'Materials',
      incurred_on: '2026-07-26',
    })
  })

  it('propagates normalized validation errors for field-level handling', async () => {
    const error = httpError({
      message: 'The given data was invalid.',
      status: 422,
      data: { errors: { amount: ['Amount is invalid.'] } },
    })
    httpClient.post.mockRejectedValue(error)

    await expect(
      costsService.register(4, {
        amount: '12.345',
        description: 'Materials',
        incurred_on: '2026-07-26',
      }),
    ).rejects.toBe(error)
  })
})
