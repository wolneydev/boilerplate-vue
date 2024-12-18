<template>
    <div>
      <h1>Lista de Usuários</h1>
      <router-link to="/users/new">
        <button type="button" class="create-button">Cadastrar Novo Usuário</button>
      </router-link>
      <table>
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
              <button @click="deleteUser(u)">Excluir</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  
  const router = useRouter()
  
  // Exemplo de dados mock. Em um cenário real, você buscaria da API.
  const users = ref([
    { id: 1, name: 'Usuário 1', email: 'user1@example.com' },
    { id: 2, name: 'Usuário 2', email: 'user2@example.com' }
  ])
  
  const editUser = (user) => {
    router.push(`/users/${user.id}/edit`)
  }
  
  const viewUser = (user) => {
    // Aqui você poderia exibir um modal ou redirecionar para uma página de detalhes
    alert(`Visualizar detalhes do usuário: ${user.name}`)
  }
  
  const deleteUser = (user) => {
    // Chamada à API para deletar o usuário
    // Exemplo:
    users.value = users.value.filter(u => u.id !== user.id)
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
  </style>
  