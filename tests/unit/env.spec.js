import { afterEach, describe, expect, it, vi } from 'vitest'

const loadEnv = async () => {
  vi.resetModules()
  return import('@/core/config/env')
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('centralized environment configuration', () => {
  it('requires an explicit API base URL', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '')

    await expect(loadEnv()).rejects.toThrow('VITE_API_BASE_URL is required')
  })

  it('uses explicit configured values', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test/api')
    vi.stubEnv('VITE_API_TIMEOUT', '4500')

    const { env } = await loadEnv()

    expect(env).toEqual({
      apiBaseUrl: 'https://api.example.test/api',
      apiTimeout: 4500,
    })
  })

  it.each(['', 'invalid', '0', '-10'])(
    'falls back to 15000 for invalid timeout %j',
    async (timeout) => {
      vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test/api')
      vi.stubEnv('VITE_API_TIMEOUT', timeout)

      const { env } = await loadEnv()

      expect(env.apiTimeout).toBe(15000)
    },
  )
})
