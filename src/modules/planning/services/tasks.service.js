import httpClient from '@/core/http/httpClient'

const unwrap = (data) => data?.data ?? data

// Drop empty filter params so we never send `?status=&priority=` to the API.
const cleanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== '' && value != null),
  )

// Build the request body from the form model, coercing optional fields to the
// shapes the Laravel API expects (null instead of empty string, etc.).
const toPayload = (task) => ({
  project_id: task.project_id,
  title: task.title,
  task_date: task.task_date,
  starts_at: task.starts_at,
  ends_at: task.ends_at || null,
  notes: task.notes || null,
  location: task.location || null,
  priority: task.priority || null,
  status: task.status || 'pending',
  notify: !!task.notify,
  notify_minutes_before: task.notify ? task.notify_minutes_before ?? null : null,
})

// Transport layer for the tasks domain.
//   GET    /api/tasks?start=&end=&project_id=&status=&priority=
//   POST   /api/tasks
//   GET    /api/tasks/{id}
//   PUT    /api/tasks/{id}
//   DELETE /api/tasks/{id}
export const tasksService = {
  async list({ start, end, projectId = '', status = '', priority = '' } = {}) {
    const { data } = await httpClient.get('/tasks', {
      params: cleanParams({
        start,
        end,
        project_id: projectId,
        status,
        priority,
      }),
    })
    return unwrap(data)
  },

  async get(id) {
    const { data } = await httpClient.get(`/tasks/${id}`)
    return unwrap(data)
  },

  async create(task) {
    const { data } = await httpClient.post('/tasks', toPayload(task))
    return unwrap(data)
  },

  async update(id, task) {
    const { data } = await httpClient.put(`/tasks/${id}`, toPayload(task))
    return unwrap(data)
  },

  async remove(id) {
    await httpClient.delete(`/tasks/${id}`)
  },
}
