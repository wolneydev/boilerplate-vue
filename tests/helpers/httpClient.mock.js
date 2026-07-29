import { vi } from 'vitest'

export const createHttpClientMock = () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
})

export const response = (data) => Promise.resolve({ data })

export const httpError = ({
  message = 'Request failed.',
  status = 500,
  data = {},
} = {}) => Object.assign(new Error(message), { status, data })
