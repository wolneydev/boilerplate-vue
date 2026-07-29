import { beforeEach, describe, expect, it, vi } from 'vitest'

const httpGet = vi.hoisted(() => vi.fn())

vi.mock('@/core/http/httpClient', () => ({
  default: { get: httpGet },
}))

import {
  normalizeList,
  tasksService,
} from '@/modules/planning/services/tasks.service'

describe('normalizeList (Laravel Resource pagination)', () => {
  it('keeps meta.last_page when data is the items array', () => {
    expect(
      normalizeList({
        data: [{ id: 1 }, { id: 2 }],
        links: {},
        meta: { current_page: 1, last_page: 3, per_page: 15, total: 41 },
      }),
    ).toEqual({
      items: [{ id: 1 }, { id: 2 }],
      currentPage: 1,
      lastPage: 3,
    })
  })

  it('reads top-level current_page/last_page', () => {
    expect(
      normalizeList({
        data: [{ id: 1 }],
        current_page: 2,
        last_page: 4,
      }),
    ).toEqual({
      items: [{ id: 1 }],
      currentPage: 2,
      lastPage: 4,
    })
  })

  it('treats a bare array as a single page', () => {
    expect(normalizeList([{ id: 1 }])).toEqual({
      items: [{ id: 1 }],
      currentPage: 1,
      lastPage: 1,
    })
  })
})

describe('tasksService.listAll', () => {
  beforeEach(() => {
    httpGet.mockReset()
  })

  it('fetches every page when Laravel reports last_page > 1', async () => {
    httpGet
      .mockResolvedValueOnce({
        data: {
          data: [{ id: 1 }, { id: 41 }],
          meta: { current_page: 1, last_page: 2 },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: [{ id: 99 }],
          meta: { current_page: 2, last_page: 2 },
        },
      })

    const tasks = await tasksService.listAll({
      start: '2026-06-28',
      end: '2026-08-02',
    })

    expect(httpGet).toHaveBeenCalledTimes(2)
    expect(httpGet.mock.calls[0][1].params.page).toBe(1)
    expect(httpGet.mock.calls[1][1].params.page).toBe(2)
    expect(tasks.map((task) => task.id)).toEqual([1, 41, 99])
  })
})
