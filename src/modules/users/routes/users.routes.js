const UserListPage = () => import('@/modules/users/pages/UserListPage.vue')
const UserFormPage = () => import('@/modules/users/pages/UserFormPage.vue')

export default [
  {
    path: '/users',
    name: 'UserList',
    component: UserListPage,
    meta: { requiresAuth: true },
  },
  {
    path: '/users/new',
    name: 'UserCreate',
    component: UserFormPage,
    meta: { requiresAuth: true },
  },
  {
    path: '/users/:id/edit',
    name: 'UserEdit',
    component: UserFormPage,
    meta: { requiresAuth: true },
  },
]
