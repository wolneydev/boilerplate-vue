import { createStore } from 'vuex'
import user from './modules/user'
import users from './modules/users'

const store = createStore({
  modules: {
    user,
    users
  }
})

export default store
