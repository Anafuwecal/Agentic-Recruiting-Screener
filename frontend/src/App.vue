<template>
  <div id="app">
    <header class="app-header">
      <div class="header-content">
        <div class="brand">
          <div class="logo">
            <img src="/frontend/public/icon-r.png" alt="Recruitment AI Logo" width="40" height="40">
          </div>
          <div>
            <h1>Recruitment AI</h1>
            <p class="tagline">Intelligent Hiring Assistant</p>
          </div>
        </div>
        <nav>
          <router-link to="/" class="nav-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            </svg>
            Dashboard
          </router-link>
          <router-link to="/candidates" class="nav-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Candidates
          </router-link>
          <router-link to="/chat" class="nav-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Chat
          </router-link>
          <router-link to="/settings" class="nav-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v6m0 6v6m-6-6h6m6 0h-6m-4.5 4.5l4.5-4.5m0 0l4.5 4.5M7.5 7.5L12 12m0 0l4.5-4.5"/>
            </svg>
            Settings
          </router-link>
        </nav>
      </div>
    </header>
    
    <main class="app-main">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <footer class="app-footer">
      <p>&copy; 2025 Recruitment AI. Powered by VoltAgent & Groq</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
</script>

<style>
:root {
  --color-primary: #8B7355;
  --color-primary-dark: #6D5A45;
  --color-primary-light: #A89080;
  --color-secondary: #5C4B3A;
  --color-accent: #D4A574;
  
  --color-bg-primary: #FFFFFF;
  --color-bg-secondary: #FAF8F6;
  --color-bg-tertiary: #F5F2EE;
  --color-bg-dark: #2C2416;
  
  --color-text-primary: #2C2416;
  --color-text-secondary: #6D5A45;
  --color-text-light: #8B7965;
  --color-text-white: #FFFFFF;
  
  --color-border: #E6DFD7;
  --color-border-light: #F0EBE6;
  
  --color-success: #6B8E23;
  --color-warning: #D4A574;
  --color-danger: #A0522D;
  --color-info: #708090;
  
  --shadow-sm: 0 2px 4px rgba(44, 36, 22, 0.08);
  --shadow-md: 0 4px 12px rgba(44, 36, 22, 0.12);
  --shadow-lg: 0 8px 24px rgba(44, 36, 22, 0.16);
  
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  
  --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Header */
.app-header {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
  color: var(--color-text-white);
  box-shadow: var(--shadow-md);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

.brand {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo {
  flex-shrink: 0;
}

.brand h1 {
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.5px;
  margin-bottom: 0.25rem;
}

.tagline {
  font-size: 0.75rem;
  opacity: 0.9;
  font-weight: 400;
}

nav {
  display: flex;
  gap: 0.5rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  color: var(--color-text-white);
  text-decoration: none;
  border-radius: var(--radius-md);
  transition: var(--transition);
  font-weight: 500;
  font-size: 0.95rem;
  position: relative;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.15);
}

.nav-link.router-link-active {
  background: rgba(255, 255, 255, 0.2);
}

.nav-link.router-link-active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 1.25rem;
  right: 1.25rem;
  height: 2px;
  background: var(--color-text-white);
  border-radius: 2px;
}

/* Main Content */
.app-main {
  flex: 1;
  padding: 2rem;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
}

/* Footer */
.app-footer {
  background: var(--color-bg-tertiary);
  border-top: 1px solid var(--color-border);
  padding: 1.5rem 2rem;
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .header-content {
    padding: 1rem 1.5rem;
  }
  
  .app-main {
    padding: 1.5rem;
  }
  
  .brand h1 {
    font-size: 1.25rem;
  }
  
  nav {
    gap: 0.25rem;
  }
  
  .nav-link {
    padding: 0.65rem 1rem;
    font-size: 0.9rem;
  }
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
  
  .brand {
    width: 100%;
    justify-content: center;
  }
  
  nav {
    width: 100%;
    overflow-x: auto;
    justify-content: flex-start;
    padding: 0 0.5rem;
    -webkit-overflow-scrolling: touch;
  }
  
  .nav-link {
    white-space: nowrap;
    padding: 0.65rem 1rem;
    font-size: 0.85rem;
  }
  
  .nav-link svg {
    width: 16px;
    height: 16px;
  }
  
  .app-main {
    padding: 1rem;
  }
  
  .tagline {
    display: none;
  }
}

@media (max-width: 480px) {
  .logo svg {
    width: 32px;
    height: 32px;
  }
  
  .brand h1 {
    font-size: 1.1rem;
  }
  
  .nav-link span {
    display: none;
  }
  
  .nav-link {
    padding: 0.75rem;
  }
  
  .app-footer {
    padding: 1rem;
    font-size: 0.8rem;
  }
}

/* Scrollbar Styling */
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-track {
  background: var(--color-bg-tertiary);
}

::-webkit-scrollbar-thumb {
  background: var(--color-primary-light);
  border-radius: 5px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-primary);
}
</style>