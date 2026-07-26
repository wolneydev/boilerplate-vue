const ProjectListPage = () => import('@/modules/planning/pages/ProjectListPage.vue')
const ProjectFormPage = () => import('@/modules/planning/pages/ProjectFormPage.vue')
const ProjectDetailPage = () => import('@/modules/planning/pages/ProjectDetailPage.vue')
const ProjectFundsPage = () => import('@/modules/planning/pages/ProjectFundsPage.vue')
const ProjectCostsPage = () => import('@/modules/planning/pages/ProjectCostsPage.vue')
const TaskFinancePage = () => import('@/modules/planning/pages/TaskFinancePage.vue')
const CalendarPage = () => import('@/modules/planning/pages/CalendarPage.vue')
const ReportPage = () => import('@/modules/planning/pages/ReportPage.vue')
const DependencyMapReportPage = () => import('@/modules/planning/pages/DependencyMapReportPage.vue')

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
    path: '/projects/:projectId/funds',
    name: 'ProjectFunds',
    component: ProjectFundsPage,
    meta: { requiresAuth: true },
  },
  {
    path: '/projects/:projectId/costs',
    name: 'ProjectCosts',
    component: ProjectCostsPage,
    meta: { requiresAuth: true },
  },
  {
    path: '/projects/:projectId/tasks/:taskId/finance',
    name: 'TaskFinance',
    component: TaskFinancePage,
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
  {
    path: '/reports',
    name: 'Reports',
    component: ReportPage,
    meta: { requiresAuth: true },
  },
  {
    path: '/reports/dependencies',
    name: 'DependencyMapReport',
    component: DependencyMapReportPage,
    meta: { requiresAuth: true },
  },
]
