import httpClient from '@/core/http/httpClient'

// All requests automatically carry the Bearer token and benefit from the
// transparent refresh flow via the centralized HTTP client interceptors.
export const usersService = {
  async list({ page = 1, perPage = 10, search = '' } = {}) {
    const { data } = await httpClient.get('/users', {
      params: { page, per_page: perPage, search },
    })
    return data.data
  },

  async get(id) {
    const { data } = await httpClient.get(`/users/${id}`)
    return data.data
  },

  async create(payload) {
    const { data } = await httpClient.post('/users', payload)
    return data.data
  },

  async update(id, payload) {
    const { data } = await httpClient.put(`/users/${id}`, payload)
    return data.data
  },

  async remove(id) {
    await httpClient.delete(`/users/${id}`)
  },
}
