import { createRouter, createWebHistory } from 'vue-router';
import Dashboard from '../views/Dashboard.vue';
import Candidates from '../views/Candidates.vue';
import Chat from '../views/Chat.vue';
import Settings from '../views/Settings.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: Dashboard,
    },
    {
      path: '/candidates',
      name: 'candidates',
      component: Candidates,
    },
    {
      path: '/chat',
      name: 'chat',
      component: Chat,
    },
    {
      path: '/settings',
      name: 'settings',
      component: Settings,
    },
  ],
});

export default router;