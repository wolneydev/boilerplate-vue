<template>
  <div>
    <header>
      <nav>
        <ul>
          <!-- Se o usuário não está logado, mostrar Login e Register -->
          <li v-if="!isLoggedIn">
            <router-link to="/login">Login</router-link>
          </li>
          <li v-if="!isLoggedIn">
            <router-link to="/register">Registrar</router-link>
          </li>

          <!-- Se o usuário está logado, mostrar Dashboard, Users e botão de Logout -->
          <li v-if="isLoggedIn">
            <router-link to="/">Dashboard</router-link>
          </li>
          <li v-if="isLoggedIn">
            <router-link to="/users">Usuários</router-link>
          </li>
          <li v-if="isLoggedIn">
            <button @click="logout">Logout</button>
          </li>
        </ul>
      </nav>
    </header>

    <main>
      <!-- Aqui as rotas serão renderizadas -->
      <router-view></router-view>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'

const store = useStore()

// Computed para verificar se o usuário está logado
const isLoggedIn = computed(() => store.getters['user/isLoggedIn'])

const logout = () => {
  store.dispatch('user/logout')
}
</script>

<style scoped>
header {
  background: #f5f5f5;
  padding: 10px;
}

nav ul {
  list-style-type: none;
  padding: 0;
  display: flex;
  gap: 10px;
}

nav li {
  display: inline-block;
}

nav a {
  text-decoration: none;
  color: #333;
}

nav a:hover {
  text-decoration: underline;
}

button {
  border: none;
  background: #ff5c5c;
  color: #fff;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 4px;
}

button:hover {
  background: #ff2c2c;
}
</style>
