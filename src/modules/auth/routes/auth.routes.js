const LoginPage = () => import('@/modules/auth/pages/LoginPage.vue')
const RegisterPage = () => import('@/modules/auth/pages/RegisterPage.vue')

export default [
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
    meta: { guestOnly: true },
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterPage,
    meta: { guestOnly: true },
  },
]
