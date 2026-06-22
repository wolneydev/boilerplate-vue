import { createStore } from 'vuex'
import auth from '@/modules/auth/store/auth.store'
import users from '@/modules/users/store/users.store'
import projects from '@/modules/planning/store/projects.store'
import tasks from '@/modules/planning/store/tasks.store'
import telegram from '@/modules/settings/store/telegram.store'

// Each feature module owns its own namespaced Vuex module. New modules are
// registered here as the app grows.
const store = createStore({
  modules: {
    auth,
    users,
    projects,
    tasks,
    telegram,
  },
})

export default store
