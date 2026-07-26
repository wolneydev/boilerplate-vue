import { describe, expect, it } from 'vitest'
import routes from '@/modules/planning/routes/planning.routes'

describe('financial route security and loading', () => {
  const expected = [
    '/projects/:projectId/funds',
    '/projects/:projectId/costs',
    '/projects/:projectId/tasks/:taskId/finance',
  ]

  it.each(expected)('%s is protected and lazy-loaded', (path) => {
    const route = routes.find((candidate) => candidate.path === path)

    expect(route).toBeDefined()
    expect(route.meta).toMatchObject({ requiresAuth: true })
    expect(route.component).toBeTypeOf('function')
  })
})
