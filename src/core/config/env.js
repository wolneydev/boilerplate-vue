// Centralized runtime configuration.
// Values come from Vite env vars (prefixed with VITE_) with safe defaults.
export const env = {
  apiBaseUrl:
    import.meta.env.VITE_API_BASE_URL || 'https://imitative-verline-quintuply.ngrok-free.dev/api',
  // Default timeout for HTTP requests, in milliseconds.
  apiTimeout: Number(import.meta.env.VITE_API_TIMEOUT || 15000),
}
