<template>
  <div class="calendar-wrap card">
    <FullCalendar ref="calendarRef" :options="calendarOptions" />
  </div>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import multiMonthPlugin from '@fullcalendar/multimonth'
import listPlugin from '@fullcalendar/list'
import { formatReminder } from '@/modules/planning/types/planning.types'

const props = defineProps({
  events: { type: Array, default: () => [] },
  initialView: { type: String, default: 'dayGridMonth' },
})

const emit = defineEmits(['date-select', 'event-select', 'range-change'])

const calendarRef = ref(null)

// Format a Date into local YYYY-MM-DD / HH:mm parts (avoids UTC shifting that
// `toISOString` introduces).
const pad = (n) => String(n).padStart(2, '0')
const toLocalDate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
const toLocalTime = (date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`

const onDateClick = (arg) => {
  emit('date-select', {
    task_date: toLocalDate(arg.date),
    starts_at: arg.allDay ? '' : toLocalTime(arg.date),
    ends_at: '',
  })
}

const onSelect = (arg) => {
  const prefill = {
    task_date: toLocalDate(arg.start),
    starts_at: arg.allDay ? '' : toLocalTime(arg.start),
    ends_at: arg.allDay ? '' : toLocalTime(arg.end),
  }
  emit('date-select', prefill)
}

const onEventClick = (arg) => {
  emit('event-select', arg.event.id)
}

const onDatesSet = (arg) => {
  emit('range-change', {
    start: toLocalDate(arg.start),
    end: toLocalDate(arg.end),
  })
}

// Flag tasks that have a reminder with a small bell marker and a tooltip
// describing when the reminder is scheduled for.
const onEventDidMount = (arg) => {
  const { notify, notify_at: notifyAt } = arg.event.extendedProps || {}
  if (!notify) return

  const titleEl = arg.el.querySelector('.fc-event-title, .fc-list-event-title')
  if (titleEl && !titleEl.querySelector('.fc-reminder-bell')) {
    const bell = document.createElement('span')
    bell.className = 'fc-reminder-bell'
    bell.textContent = '🔔'
    bell.setAttribute('aria-hidden', 'true')
    titleEl.prepend(bell)
  }

  const reminder = formatReminder(notifyAt)
  arg.el.setAttribute(
    'title',
    reminder ? `Reminder scheduled for ${reminder}` : 'Reminder scheduled',
  )
}

const calendarOptions = reactive({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, multiMonthPlugin, listPlugin],
  initialView: props.initialView,
  locale: 'en',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'multiMonthYear,dayGridMonth,timeGridWeek,timeGridDay,listWeek',
  },
  buttonText: {
    today: 'Today',
    year: 'Year',
    month: 'Month',
    week: 'Week',
    day: 'Day',
    list: 'List',
  },
  height: 'auto',
  nowIndicator: true,
  selectable: true,
  selectMirror: true,
  dayMaxEvents: true,
  events: props.events,
  dateClick: onDateClick,
  select: onSelect,
  eventClick: onEventClick,
  datesSet: onDatesSet,
  eventDidMount: onEventDidMount,
})

// Keep the calendar in sync when the parent refreshes the event list.
watch(
  () => props.events,
  (events) => {
    calendarOptions.events = events
  },
  { deep: true },
)
</script>

<style scoped>
.calendar-wrap {
  padding: 1.25rem;
}

/* Tie FullCalendar's theme variables to the Northloom palette. */
.calendar-wrap :deep(.fc) {
  --fc-border-color: var(--color-border);
  --fc-button-bg-color: var(--color-primary);
  --fc-button-border-color: var(--color-primary);
  --fc-button-hover-bg-color: var(--color-primary-hover);
  --fc-button-hover-border-color: var(--color-primary-hover);
  --fc-button-active-bg-color: var(--color-primary-hover);
  --fc-button-active-border-color: var(--color-primary-hover);
  --fc-today-bg-color: var(--color-primary-soft);
  --fc-page-bg-color: var(--color-bg);
  font-family: var(--font-body);
}

.calendar-wrap :deep(.fc .fc-toolbar-title) {
  font-family: var(--font-heading);
  font-size: 1.35rem;
}

.calendar-wrap :deep(.fc .fc-button) {
  font-size: 0.82rem;
  text-transform: capitalize;
  box-shadow: none;
}

.calendar-wrap :deep(.fc-event) {
  cursor: pointer;
  border-radius: 6px;
  padding: 1px 3px;
  font-size: 0.78rem;
}

/* Reminder marker: a small bell prepended to the event title. */
.calendar-wrap :deep(.fc-reminder-bell) {
  margin-right: 0.2rem;
  font-size: 0.72rem;
}

/* Priority marker: a subtle left accent on timed/list events. */
.calendar-wrap :deep(.task-priority--high) {
  box-shadow: inset 3px 0 0 0 #b25a52;
}
.calendar-wrap :deep(.task-priority--medium) {
  box-shadow: inset 3px 0 0 0 #c9a86a;
}
.calendar-wrap :deep(.task-priority--low) {
  box-shadow: inset 3px 0 0 0 #6e8b7b;
}

@media (max-width: 640px) {
  .calendar-wrap {
    padding: 0.75rem;
  }
  .calendar-wrap :deep(.fc .fc-toolbar) {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
