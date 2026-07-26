import httpClient from '@/core/http/httpClient'
import { normalizeDecimalString } from '@/modules/planning/types/finances.types'

const unwrap = (data) => data?.data ?? data

// Project fund contract:
//   GET /api/projects/{projectId}/funds -> { data: ProjectFund[] }
//   POST /api/projects/{projectId}/funds
//        { project_id, name, opening_balance } -> { data: ProjectFund }
//   PUT /api/projects/{projectId}/funds/{fundId} -> { data: ProjectFund }
// Amounts remain base-10 decimal strings at this boundary.
export const fundsService = {
  async list(projectId) {
    const { data } = await httpClient.get(`/projects/${projectId}/funds`)
    const payload = unwrap(data)
    return Array.isArray(payload) ? payload : payload?.items ?? []
  },

  async create(projectId, payload) {
    const { data } = await httpClient.post(`/projects/${projectId}/funds`, {
      project_id: Number(projectId),
      name: payload.name.trim(),
      opening_balance: normalizeDecimalString(
        payload.opening_balance ?? payload.total_balance,
      ),
    })
    return unwrap(data)
  },

  async update(projectId, fundId, payload) {
    const { data } = await httpClient.put(
      `/projects/${projectId}/funds/${fundId}`,
      {
        project_id: Number(projectId),
        name: payload.name.trim(),
        opening_balance: normalizeDecimalString(
          payload.opening_balance ?? payload.total_balance,
        ),
      },
    )
    return unwrap(data)
  },
}
