import httpClient from '@/core/http/httpClient'
import { toApiDateTime, combineDateTime } from '@/modules/planning/types/planning.types'

const unwrap = (data) => data?.data ?? data

// Drop empty filter params so we never send `?status=&priority=` to the API.
const cleanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== '' && value != null),
  )

// Build the request body from the form model, coercing optional fields to the
// shapes the Laravel API expects (null instead of empty string, etc.).
// The API casts `starts_at`/`ends_at` as full datetimes, so the date and the
// time-only form inputs are merged into "YYYY-MM-DDTHH:mm:ss" values.
const toPayload = (task) => {
  const starts_at = toApiDateTime(combineDateTime(task.task_date, task.starts_at))
  const ends_at = task.ends_at
    ? toApiDateTime(combineDateTime(task.task_date, task.ends_at))
    : null
  const notifyAtDatetime = task.notify ? toApiDateTime(task.notify_at_datetime) : null

  return {
    project_id: task.project_id,
    title: task.title,
    task_date: task.task_date,
    starts_at,
    ends_at,
    notes: task.notes || null,
    location: task.location || null,
    priority: task.priority || null,
    status: task.status || 'pending',
    // Reminder intent only — the Laravel backend owns Telegram delivery. The API
    // stores the absolute datetime (`notify_at_datetime`) when the reminder
    // should fire. When the reminder is off we send `null` to clear any prior value.
    notify: !!task.notify,
    notify_at_datetime: notifyAtDatetime,
  }
}

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
