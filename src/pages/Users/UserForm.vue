<template>
    <div>
      <h1>{{ isEditing ? 'Editar Usuário' : 'Novo Usuário' }}</h1>
      <form @submit.prevent="saveUser">
        <div>
          <label>Nome</label>
          <input v-model="user.name" placeholder="Nome" />
        </div>
        
        <div>
          <label>Email</label>
          <input v-model="user.email" placeholder="Email" />
        </div>
        
        <div>
          <button type="submit">Salvar</button>
          <router-link to="/users">
            <button type="button">Cancelar</button>
          </router-link>
        </div>
      </form>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  
  // Nesse exemplo, assume-se que a sua lógica de API estará em outro lugar.
  // Aqui vamos usar dados mock. Em um cenário real, você faria requisições HTTP.
  const route = useRoute()
  const router = useRouter()
  
  const isEditing = !!route.params.id
  const user = ref({ name: '', email: '' })
  
  onMounted(() => {
    if (isEditing) {
      // Lógica para buscar usuário específico (ex: via API)
      // Exemplo fake:
      user.value = { name: 'Usuário Edit', email: 'edit@example.com' }
    }
  })
  
  const saveUser = () => {
    if (isEditing) {
      // Chamar API para atualizar usuário
      console.log('Editando usuário:', user.value)
    } else {
      // Chamar API para criar novo usuário
      console.log('Criando novo usuário:', user.value)
    }
    router.push('/users')
  }
  </script>
  
  <style scoped>
  form div {
    margin-bottom: 10px;
  }
  
  form label {
    display: block;
    font-weight: bold;
  }
  
  form input {
    width: 100%;
    padding: 8px;
    margin-top: 4px;
  }
  
  button {
    margin-right: 10px;
    padding: 8px 12px;
  }
  </style>
  