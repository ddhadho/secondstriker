import { route } from 'quasar/wrappers'
import { createRouter, createWebHistory } from 'vue-router'
import routes from './routes'
import { useAuthStore } from 'stores/auth'

export default route(function () {
  const Router = createRouter({
    history: createWebHistory(),
    routes
  })

  Router.beforeEach((to, from, next) => {
    const authStore = useAuthStore()
    const isAuthenticated = authStore.isAuthenticated
    const isTokenExpired = authStore.isTokenExpired

    if (to.meta.requiresAuth) {
      if (!isAuthenticated || isTokenExpired) {
        authStore.logout()
        next({ name: 'login' })
      } else {
        next()
      }
    } else if (to.meta.requiresGuest && isAuthenticated) {
      next({ name: 'matches' })
    } else {
      next()
    }
  })

  return Router
})
