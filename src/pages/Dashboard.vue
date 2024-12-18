<template>
    <div class="dashboard">
      <h1>Dashboard</h1>
      <p>Bem-vindo ao painel! Aqui você pode gerenciar recursos do sistema.</p>
  
      <nav>
        <router-link to="/users">Gerenciar Usuários</router-link>
      </nav>
    </div>
  </template>
  
  <script setup>
  // Aqui você pode adicionar lógica adicional, por exemplo, carregar informações do usuário ou dados iniciais.
  </script>
  
  <style scoped>
  .dashboard {
    padding: 20px;
  }
  
  .dashboard nav a {
    display: inline-block;
    margin-right: 20px;
    color: #42b983;
    text-decoration: none;
  }
  
  .dashboard nav a:hover {
    text-decoration: underline;
  }
  </style>
  