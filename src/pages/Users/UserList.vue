<template>
  <div>
    <h1>Lista de Usuários</h1>
    <router-link to="/users/new">
      <button type="button" class="create-button">Cadastrar Novo Usuário</button>
    </router-link>

    <!-- Campo de Busca -->
    <div class="search-container">
      <input
        type="text"
        v-model="searchInput"
        @input="onSearchInput"
        placeholder="Buscar por ID, Nome ou Email..."
      />
    </div>
    
    <!-- Estado de carregamento -->
    <div v-if="loading">Carregando usuários...</div>
    
    <!-- Mensagem de erro -->
    <div v-if="error" class="error">{{ error }}</div>
    
    <!-- Tabela de usuários -->
    <table v-if="!loading && !error">
      <thead>
        <tr>
          <th>ID</th>
          <th>Nome</th>
          <th>Email</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="u in users" :key="u.id">
          <td>{{ u.id }}</td>
          <td>{{ u.name }}</td>
          <td>{{ u.email }}</td>
          <td>
            <button @click="viewUser(u)">Ver</button>
            <button @click="editUser(u)">Editar</button>
            <button @click="handleDelete(u)">Excluir</button>
          </td>
        </tr>
      </tbody>
    </table>
    
    <!-- Controles de Paginação -->
    <div v-if="!loading && !error" class="pagination">
      <button @click="goToPage(currentPage - 1)" :disabled="currentPage === 1">Anterior</button>
      
      <span>Página {{ currentPage }} de {{ lastPage }}</span>
      
      <button @click="goToPage(currentPage + 1)" :disabled="currentPage === lastPage">Próxima</button>
    </div>
  </div>
</template>



<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { debounce } from 'lodash' // Utilizando lodash para debounce

const router = useRouter()
const store = useStore()

const users = computed(() => store.getters['users/allUsers'])
const loading = computed(() => store.getters['users/isLoading'])
const error = computed(() => store.getters['users/userError'])
const currentPage = computed(() => store.getters['users/currentPage'])
const lastPage = computed(() => store.getters['users/lastPage'])
const searchTerm = computed(() => store.getters['users/searchTerm'])

const searchInput = ref(searchTerm.value) // Input controlado para o campo de busca

// Função de debounce para buscar após 500ms de inatividade
const debouncedSearch = debounce((value) => {
  store.dispatch('users/updateSearch', value)
}, 500)

// Handler para o evento de input no campo de busca
const onSearchInput = () => {
  debouncedSearch(searchInput.value)
}

const fetchUsers = (page) => {
  store.dispatch('users/fetchUsers', page)
}

fetchUsers(currentPage.value) // Busca inicial com o termo de busca atual

const editUser = (user) => {
  router.push(`/users/${user.id}/edit`)
}

const viewUser = (user) => {
  alert(`Visualizar detalhes do usuário: ${user.name}`)
}

const handleDelete = async (user) => {
  if (!confirm(`Tem certeza que deseja excluir o usuário ${user.name}?`)) {
    return
  }
  
  try {
    await store.dispatch('users/deleteUser', user.id)
    alert('Usuário deletado com sucesso.')
    
    // Após deletar, verificar se a página atual ainda tem usuários
    if (users.value.length === 0 && currentPage.value > 1) {
      fetchUsers(currentPage.value - 1)
    } else {
      fetchUsers(currentPage.value)
    }
  } catch (err) {
    alert(err.message || 'Erro ao deletar usuário.')
  }
}

const goToPage = (page) => {
  if (page < 1 || page > lastPage.value) return
  fetchUsers(page)
}
</script>



<style scoped>
.create-button {
  background: #4CAF50;
  color: #fff;
  padding: 8px 12px;
  border: none;
  cursor: pointer;
  margin-bottom: 15px;
}

.search-container {
  margin-bottom: 15px;
}

.search-container input {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
  border: 1px solid #ddd;
  border-radius: 4px;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

th, td {
  border: 1px solid #ddd;
  padding: 8px;
}

button {
  margin-right: 5px;
}

.error {
  color: red;
  margin-top: 10px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.pagination button {
  padding: 6px 12px;
  margin: 0 10px;
  cursor: pointer;
}

.pagination span {
  font-weight: bold;
}
</style>


