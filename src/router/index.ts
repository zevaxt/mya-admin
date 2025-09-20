import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import { authService } from '@/services/api'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: LoginView,
      meta: { requiresAuth: false }
    },
    {
      path: '/landing',
      name: 'landing',
      component: () => import('../views/LandingView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/LoginView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/migrations',
      name: 'migrations',
      component: () => import('../views/MigrationView.vue'),
      meta: { requiresAuth: true }
    },
    // Redirigir cualquier ruta no encontrada al login
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})

// Protección de rutas
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const isAuthenticated = authService.isAuthenticated()

  if (requiresAuth && !isAuthenticated) {
    // Si la ruta requiere autenticación y el usuario no está autenticado
    next('/')
  } else if (to.path === '/' && isAuthenticated) {
    // Si el usuario ya está autenticado y trata de acceder al login
    next('/landing')
  } else {
    next()
  }
})

export default router
