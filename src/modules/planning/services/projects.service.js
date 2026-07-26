import httpClient from '@/core/http/httpClient'

// Laravel resource controllers commonly wrap payloads in `{ data: ... }`.
// Unwrap defensively so callers always receive the bare model/collection.
const unwrap = (data) => data?.data ?? data

// Transport layer for the projects domain.
//   GET    /api/projects
//   POST   /api/projects
//   GET    /api/projects/{id}
//   PUT    /api/projects/{id}
//   DELETE /api/projects/{id}
export const projectsService = {
  async list() {
    const { data } = await httpClient.get('/projects')
    return unwrap(data)
  },

  async get(id) {
    const { data } = await httpClient.get(`/projects/${id}`)
    return unwrap(data)
  },

  async create(payload) {
    const { data } = await httpClient.post('/projects', {
      name: payload.name,
      starts_on: payload.starts_on,
      expected_ends_on: payload.expected_ends_on,
      currency: payload.currency,
      notes: payload.notes || null,
    })
    return unwrap(data)
  },

  async update(id, payload) {
    const { data } = await httpClient.put(`/projects/${id}`, {
      name: payload.name,
      starts_on: payload.starts_on,
      expected_ends_on: payload.expected_ends_on,
      currency: payload.currency,
      notes: payload.notes || null,
    })
    return unwrap(data)
  },

  async remove(id) {
    await httpClient.delete(`/projects/${id}`)
  },
}
