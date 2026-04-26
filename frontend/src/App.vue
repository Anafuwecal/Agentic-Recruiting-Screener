<template>
  <div id="app">
    <header class="app-header">
      <h1>AI Recruitment Screener</h1>
      <nav>
        <router-link to="/">Dashboard</router-link>
        <router-link to="/candidates">Candidates</router-link>
        <router-link to="/chat">Chat with Orchestrator</router-link>
        <router-link to="/settings">Job Settings</router-link>
      </nav>
    </header>
    
    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: #f5f5f5;
  color: #333;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem 2rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.app-header h1 {
  font-size: 1.8rem;
  margin-bottom: 1rem;
}

.app-header nav {
  display: flex;
  gap: 2rem;
}

.app-header nav a {
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background 0.3s;
}

.app-header nav a:hover,
.app-header nav a.router-link-active {
  background: rgba(255, 255, 255, 0.2);
}

.app-main {
  flex: 1;
  padding: 2rem;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
}
</style>