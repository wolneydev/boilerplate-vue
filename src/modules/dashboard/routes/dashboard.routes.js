const DashboardPage = () => import('@/modules/dashboard/pages/DashboardPage.vue')

export default [
  {
    path: '/',
    name: 'Dashboard',
    component: DashboardPage,
    meta: { requiresAuth: true },
  },
]
