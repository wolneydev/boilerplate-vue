import { beforeEach, describe, expect, it, vi } from 'vitest'
import { response } from '../helpers/httpClient.mock'

const httpClient = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('@/core/http/httpClient', () => ({ default: httpClient }))

import { fundsService } from '@/modules/planning/services/funds.service'

describe('fundsService.list', () => {
  beforeEach(() => {
    httpClient.get.mockReset()
    httpClient.post.mockReset()
    httpClient.put.mockReset()
  })

  it('requests the project-scoped funds endpoint and unwraps its data envelope', async () => {
    const funds = [
      {
        id: 10,
        project_id: 7,
        name: 'General Fund',
        total_balance: '1000.00',
        allocated_balance: '125.50',
        available_balance: '874.50',
      },
    ]
    httpClient.get.mockReturnValue(response({ data: funds }))

    await expect(fundsService.list(7)).resolves.toEqual(funds)
    expect(httpClient.get).toHaveBeenCalledOnce()
    expect(httpClient.get).toHaveBeenCalledWith('/projects/7/funds')
  })

  it('preserves decimal strings exactly instead of coercing them to numbers', async () => {
    const funds = [
      {
        id: 10,
        project_id: 7,
        name: 'Large Fund',
        total_balance: '9007199254740993.25',
        allocated_balance: '0.10',
        available_balance: '9007199254740993.15',
      },
    ]
    httpClient.get.mockReturnValue(response({ data: funds }))

    const [fund] = await fundsService.list(7)

    expect(fund).toMatchObject({
      total_balance: '9007199254740993.25',
      allocated_balance: '0.10',
      available_balance: '9007199254740993.15',
    })
    expect(typeof fund.total_balance).toBe('string')
  })

  it('creates a project fund with a trimmed name and canonical decimal string', async () => {
    const created = {
      id: 12,
      project_id: 7,
      name: 'General Fund',
      total_balance: '1250.50',
      allocated_balance: '0.00',
      available_balance: '1250.50',
    }
    httpClient.post.mockReturnValue(response({ data: created }))

    await expect(
      fundsService.create(7, {
        name: '  General Fund ',
        opening_balance: '001250,50',
      }),
    ).resolves.toEqual(created)
    expect(httpClient.post).toHaveBeenCalledWith('/projects/7/funds', {
      project_id: 7,
      name: 'General Fund',
      opening_balance: '1250.50',
    })
  })

  it('updates the scoped fund and propagates validation errors unchanged', async () => {
    const error = Object.assign(new Error('Invalid fund.'), {
      status: 422,
      data: { errors: { total_balance: ['Below allocated balance.'] } },
    })
    httpClient.put.mockRejectedValue(error)

    await expect(
      fundsService.update(7, 12, {
        name: 'General',
        opening_balance: '100.00',
      }),
    ).rejects.toBe(error)
    expect(httpClient.put).toHaveBeenCalledWith('/projects/7/funds/12', {
      project_id: 7,
      name: 'General',
      opening_balance: '100.00',
    })
  })
})
