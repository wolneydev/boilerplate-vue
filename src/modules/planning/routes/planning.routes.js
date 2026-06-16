const ProjectListPage = () => import('@/modules/planning/pages/ProjectListPage.vue')
const ProjectFormPage = () => import('@/modules/planning/pages/ProjectFormPage.vue')
const ProjectDetailPage = () => import('@/modules/planning/pages/ProjectDetailPage.vue')
const CalendarPage = () => import('@/modules/planning/pages/CalendarPage.vue')

export default [
  {
    path: '/projects',
    name: 'ProjectList',
    component: ProjectListPage,
    meta: { requiresAuth: true },
  },
  {
    path: '/projects/new',
    name: 'ProjectCreate',
    component: ProjectFormPage,
    meta: { requiresAuth: true },
  },
  {
    path: '/projects/:id',
    name: 'ProjectDetail',
    component: ProjectDetailPage,
    meta: { requiresAuth: true },
  },
  {
    path: '/projects/:id/edit',
    name: 'ProjectEdit',
    component: ProjectFormPage,
    meta: { requiresAuth: true },
  },
  {
    path: '/calendar',
    name: 'Calendar',
    component: CalendarPage,
    meta: { requiresAuth: true },
  },
]
