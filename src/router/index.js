import { createRouter, createWebHistory } from 'vue-router'
import Login from '../pages/Login.vue'
import Register from '../pages/Register.vue'
import Dashboard from '../pages/Dashboard.vue'
import UserList from '../pages/Users/UserList.vue'
import UserForm from '../pages/Users/UserForm.vue'
import store from '../store'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/login', name: 'Login', component: Login },
        { path: '/register', name: 'Register', component: Register },
        {
            path: '/',
            name: 'Dashboard',
            component: Dashboard,
            meta: { requiresAuth: true }
        },
        {
            path: '/users',
            name: 'UserList',
            component: UserList,
            meta: { requiresAuth: true }
        },
        {
            path: '/users/new',
            name: 'UserCreate',
            component: UserForm,
            meta: { requiresAuth: true }
        },
        {
            path: '/users/:id/edit',
            name: 'UserEdit',
            component: UserForm,
            meta: { requiresAuth: true }
        },
    ]
})

router.beforeEach((to, from, next) => {
    const isLoggedIn = store.getters['user/isLoggedIn']
    if (to.meta.requiresAuth && !isLoggedIn) {
        next('/login')
    } else {
        next()
    }
})

export default router
