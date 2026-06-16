// Domain types, option catalogs and mappers for the planning module.
// The project is plain JS, so "types" are expressed as JSDoc typedefs plus the
// runtime constants/helpers the UI relies on. Keeping them here gives a single
// source of truth shared by services, stores and components.

/**
 * @typedef {Object} Project
 * @property {number} id
 * @property {string} name
 * @property {string} starts_on            ISO date (YYYY-MM-DD)
 * @property {string} expected_ends_on     ISO date (YYYY-MM-DD)
 * @property {string|null} notes
 */

/**
 * @typedef {Object} Task
 * @property {number} id
 * @property {number} project_id
 * @property {string} title
 * @property {string} task_date            ISO date (YYYY-MM-DD)
 * @property {string} starts_at            Time (HH:mm[:ss]) or ISO datetime
 * @property {string|null} ends_at         Time (HH:mm[:ss]) or ISO datetime
 * @property {string|null} notes
 * @property {string|null} location
 * @property {TaskPriority|null} priority
 * @property {TaskStatus} status
 * @property {boolean} notify
 * @property {number|null} notify_minutes_before
 */

/**
 * @typedef {('low'|'medium'|'high')} TaskPriority
 * @typedef {('pending'|'in_progress'|'completed'|'cancelled')} TaskStatus
 */

/**
 * @typedef {Object} CalendarEvent
 * @property {string} id
 * @property {string} title
 * @property {string} start
 * @property {string|null} end
 * @property {string} backgroundColor
 * @property {string} borderColor
 * @property {string} textColor
 * @property {string[]} classNames
 * @property {Object} extendedProps
 */

// --- Status catalog ----------------------------------------------------------
// Colors are pulled from the Northloom palette (see assets/main.css) so the
// calendar stays visually consistent with the rest of the system.
export const TASK_STATUSES = [
  { value: 'pending', label: 'Pending', color: '#c9a86a', soft: '#f6eed9' },
  { value: 'in_progress', label: 'In progress', color: '#b86b4b', soft: '#f7eae1' },
  { value: 'completed', label: 'Completed', color: '#6e8b7b', soft: '#e9efea' },
  { value: 'cancelled', label: 'Cancelled', color: '#b25a52', soft: '#f7e7e4' },
]

export const TASK_PRIORITIES = [
  { value: 'low', label: 'Low', color: '#6e8b7b' },
  { value: 'medium', label: 'Medium', color: '#c9a86a' },
  { value: 'high', label: 'High', color: '#b25a52' },
]

export const NOTIFY_OPTIONS = [
  { value: 10, label: '10 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
  { value: 120, label: '2 hours before' },
  { value: 1440, label: '1 day before' },
]

const STATUS_MAP = Object.fromEntries(TASK_STATUSES.map((s) => [s.value, s]))
const PRIORITY_MAP = Object.fromEntries(TASK_PRIORITIES.map((p) => [p.value, p]))

export const getStatusMeta = (value) =>
  STATUS_MAP[value] ?? { value, label: value ?? '—', color: '#8c8377', soft: '#f3ece2' }

export const getPriorityMeta = (value) =>
  value ? PRIORITY_MAP[value] ?? { value, label: value, color: '#8c8377' } : null

// --- Date / time helpers -----------------------------------------------------

/**
 * Combine a date (YYYY-MM-DD) and a time (HH:mm[:ss]) into a local datetime
 * string FullCalendar understands. Tolerates values that are already full
 * datetimes (containing a "T") so we never double-prefix the date.
 * @param {string} date
 * @param {string|null} time
 * @returns {string|null}
 */
export const combineDateTime = (date, time) => {
  if (!date) return null
  if (!time) return date
  if (time.includes('T')) return time
  const normalized = time.length === 5 ? `${time}:00` : time
  return `${date}T${normalized}`
}

/**
 * Extract the HH:mm part from a time or datetime string, for form inputs.
 * @param {string|null} value
 * @returns {string}
 */
export const toTimeInput = (value) => {
  if (!value) return ''
  const timePart = value.includes('T') ? value.split('T')[1] : value
  return timePart.slice(0, 5)
}

/**
 * Extract the YYYY-MM-DD part from a date or datetime string.
 * @param {string|null} value
 * @returns {string}
 */
export const toDateInput = (value) => {
  if (!value) return ''
  return value.split('T')[0]
}

/**
 * Map a Task (API shape) into a FullCalendar event. Status drives the event
 * color; priority is surfaced as a className so the UI can add a marker.
 * @param {Task} task
 * @param {Map<number, string>|Object} projectNames  lookup of project id -> name
 * @returns {CalendarEvent}
 */
export const taskToCalendarEvent = (task, projectNames = {}) => {
  const status = getStatusMeta(task.status)
  const projectName =
    projectNames instanceof Map
      ? projectNames.get(task.project_id)
      : projectNames[task.project_id]

  return {
    id: String(task.id),
    title: task.title,
    start: combineDateTime(task.task_date, task.starts_at),
    end: task.ends_at ? combineDateTime(task.task_date, task.ends_at) : null,
    backgroundColor: status.color,
    borderColor: status.color,
    textColor: '#fffdf9',
    classNames: [
      `task-status--${task.status}`,
      task.priority ? `task-priority--${task.priority}` : 'task-priority--none',
    ],
    extendedProps: {
      project_id: task.project_id,
      project_name: projectName ?? null,
      notes: task.notes ?? null,
      location: task.location ?? null,
      priority: task.priority ?? null,
      status: task.status,
      notify: !!task.notify,
      notify_minutes_before: task.notify_minutes_before ?? null,
    },
  }
}
