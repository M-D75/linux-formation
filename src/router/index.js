import { createRouter, createWebHistory } from 'vue-router'
// import HomeView from '../views/HomeView.vue'
import Navigations from '../views/Navigations.vue'
import XTerm from '../views/XTerm.vue'
import SessionAccess from '../views/SessionAccess.vue'
import AdminDashboard from '../views/AdminDashboard.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Navigations,
    },
    {
      path: '/term',
      name: 'term',
      component: XTerm,
    },
    {
      path: '/session',
      name: 'session-access',
      component: SessionAccess,
    },
    {
      path: '/admin-session',
      name: 'session-admin',
      component: AdminDashboard,
    }
  ]
})

export default router
