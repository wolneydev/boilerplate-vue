// Centralized runtime configuration.
// Production endpoints must always be supplied by the environment.
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
if (!apiBaseUrl) {
  throw new Error('VITE_API_BASE_URL is required.')
}

const configuredTimeout = Number(import.meta.env.VITE_API_TIMEOUT)
const apiTimeout =
  Number.isFinite(configuredTimeout) && configuredTimeout > 0 ? configuredTimeout : 15000

export const env = {
  apiBaseUrl,
  apiTimeout,
}
