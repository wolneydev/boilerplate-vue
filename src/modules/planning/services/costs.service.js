import httpClient from '@/core/http/httpClient'
import { normalizeDecimalString } from '@/modules/planning/types/finances.types'

const unwrap = (data) => data?.data ?? data

// Project cost contract:
//   GET  /api/projects/{projectId}/costs -> { data: ProjectCost[] }
//   POST /api/projects/{projectId}/costs
//        { project_id, amount: decimal string, description, incurred_on: YYYY-MM-DD }
//        -> { data: ProjectCost }
// Validation and authorization failures are normalized by the shared HTTP client and
// intentionally propagate to the costs store.
export const costsService = {
  async list(projectId) {
    const { data } = await httpClient.get(`/projects/${projectId}/costs`)
    const payload = unwrap(data)
    return Array.isArray(payload) ? payload : payload?.items ?? []
  },

  async register(projectId, payload) {
    const amount =
      normalizeDecimalString(payload.amount) ?? String(payload.amount ?? '').trim()
    const { data } = await httpClient.post(`/projects/${projectId}/costs`, {
      project_id: Number(projectId),
      amount,
      description: String(payload.description ?? '').trim(),
      incurred_on: String(payload.incurred_on ?? ''),
    })
    return unwrap(data)
  },
}
