<template>
    <div class="login-page">
      <h1>Login</h1>
      <form @submit.prevent="doLogin">
        <input v-model="email" type="email" placeholder="Email" />
        <input v-model="password" type="password" placeholder="Senha" />
        <button type="submit">Entrar</button>
      </form>
      <p v-if="errorMessage" style="color: red;">{{ errorMessage }}</p>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useStore } from 'vuex'
  
  const email = ref('')
  const password = ref('')
  const router = useRouter()
  const store = useStore()
  const errorMessage = ref('')
  
  const doLogin = async () => {
    errorMessage.value = ''
    
    try {
      await store.dispatch('user/login', { email: email.value, password: password.value })
      // Se chegar aqui, login foi bem-sucedido
      router.push('/')
    } catch (err) {
      // Se der erro, exibir mensagem
      errorMessage.value = 'Erro ao logar.'
    }
  }
  </script>
  