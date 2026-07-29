import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createStore } from 'vuex'

const taskService = vi.hoisted(() => ({
  list: vi.fn(),
  listAll: vi.fn(),
  get: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}))

vi.mock('@/modules/planning/services/tasks.service', () => ({
  tasksService: taskService,
}))

import tasks from '@/modules/planning/store/tasks.store'

const task = {
  id: 44,
  project_id: 7,
  title: 'Prepare permits',
  status: 'pending',
}

const makeStore = () =>
  createStore({
    modules: { tasks },
  })

describe('tasks store finance-page retrieval', () => {
  beforeEach(() => {
    Object.values(taskService).forEach((mock) => mock.mockReset())
  })

  it('exposes current-task state and finds a loaded task with a route-string id', () => {
    const store = makeStore()

    expect(store.getters['tasks/currentTask']).toBeNull()

    store.commit('tasks/SET_TASKS', [task])

    expect(store.getters['tasks/taskById']('44')).toEqual(task)
  })

  it('retrieves one task through the existing service and makes it current', async () => {
    const store = makeStore()
    let resolveTask
    taskService.get.mockReturnValue(
      new Promise((resolve) => {
        resolveTask = resolve
      }),
    )

    const request = store.dispatch('tasks/fetchTask', '44')

    expect(store.getters['tasks/isCurrentLoading']).toBe(true)
    resolveTask(task)

    await expect(request).resolves.toEqual(task)
    expect(taskService.get).toHaveBeenCalledOnce()
    expect(taskService.get).toHaveBeenCalledWith('44')
    expect(store.getters['tasks/currentTask']).toEqual(task)
    expect(store.getters['tasks/taskById'](44)).toEqual(task)
    expect(store.getters['tasks/isCurrentLoading']).toBe(false)
    expect(store.getters['tasks/currentTaskError']).toBeNull()
  })

  it('exposes and rethrows a detail retrieval failure without resolving the wrong task', async () => {
    const store = makeStore()
    taskService.get.mockResolvedValueOnce(task)
    await store.dispatch('tasks/fetchTask', 44)

    taskService.get.mockRejectedValueOnce(new Error('Task is unavailable.'))

    await expect(store.dispatch('tasks/fetchTask', 45)).rejects.toThrow(
      'Task is unavailable.',
    )

    expect(store.getters['tasks/taskById'](45)).toBeNull()
    expect(store.getters['tasks/isCurrentLoading']).toBe(false)
    expect(store.getters['tasks/currentTaskError']).toBe('Task is unavailable.')
  })
})
