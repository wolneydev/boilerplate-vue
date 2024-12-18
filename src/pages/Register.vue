<template>
    <div class="register-page">
      <h1>Registrar</h1>
      <form @submit.prevent="doRegister">
        <div>
          <label>Nome</label>
          <input v-model="name" type="text" placeholder="Nome" />
        </div>
  
        <div>
          <label>Email</label>
          <input v-model="email" type="email" placeholder="Email" />
        </div>
  
        <div>
          <label>Senha</label>
          <input v-model="password" type="password" placeholder="Senha" />
        </div>
  
        <button type="submit">Registrar</button>
      </form>
      <p v-if="errorMessage" style="color:red;">{{ errorMessage }}</p>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useStore } from 'vuex'
  
  const name = ref('')
  const email = ref('')
  const password = ref('')
  const router = useRouter()
  const store = useStore()
  const errorMessage = ref('')
  
  const doRegister = async () => {
    errorMessage.value = ''
    try {
      await store.dispatch('user/register', { name: name.value, email: email.value, password: password.value })
      // Se sucesso, redireciona para o dashboard ou outra rota
      router.push('/')
    } catch (error) {
      errorMessage.value = error.message || 'Não foi possível registrar o usuário. Verifique seus dados e tente novamente.'
    }
  }
  </script>
  
  <style scoped>
  .register-page {
    width: 300px;
    margin: 0 auto;
    padding: 20px;
    box-sizing: border-box;
  }
  
  .register-page h1 {
    text-align: center;
  }
  
  .register-page form div {
    margin-bottom: 15px;
  }
  
  .register-page label {
    display: block;
    font-weight: bold;
    margin-bottom: 5px;
  }
  
  .register-page input {
    width: 100%;
    padding: 8px;
  }
  
  button {
    padding: 8px 12px;
    cursor: pointer;
  }
  </style>
  